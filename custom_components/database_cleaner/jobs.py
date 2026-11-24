"""One maintenance job at a time, with progress, cancellation and a persistent journal."""

from __future__ import annotations

import asyncio
import logging
import time
import uuid
from collections.abc import Awaitable, Callable
from dataclasses import asdict, dataclass, field
from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.helpers.storage import Store

from .const import DOMAIN

_LOGGER = logging.getLogger(__name__)
STORAGE_VERSION = 1
HISTORY_SIZE = 50


class JobError(Exception):
    """A job cannot start or had to stop (message is shown to the user)."""


class JobCancelled(Exception):
    """The user cancelled the job between two steps."""


@dataclass
class Job:
    id: str
    kind: str
    params: dict[str, Any]
    status: str = "pending"  # pending | running | done | failed | cancelled | interrupted
    step: str | None = None
    done: int = 0
    total: int | None = None
    created: float = field(default_factory=time.time)
    started: float | None = None
    finished: float | None = None
    result: dict[str, Any] | None = None
    error: str | None = None
    log: list[str] = field(default_factory=list)


class JobContext:
    """Handle passed to a running job."""

    def __init__(self, manager: JobManager, job: Job) -> None:
        self._manager = manager
        self.job = job

    def step(self, name: str, total: int | None = None) -> None:
        self.job.step = name
        self.job.done = 0
        self.job.total = total
        self.log(name)
        self._manager.async_schedule_save()

    def advance(self, n: int = 1) -> None:
        self.job.done += n

    def log(self, message: str) -> None:
        stamp = time.strftime("%H:%M:%S")
        self.job.log.append(f"{stamp} {message}")
        del self.job.log[:-200]
        _LOGGER.info("[%s %s] %s", self.job.kind, self.job.id[:8], message)

    def check_cancel(self) -> None:
        if self._manager.cancel_requested:
            raise JobCancelled


class JobManager:
    def __init__(self, hass: HomeAssistant) -> None:
        self.hass = hass
        self._store: Store[dict] = Store(hass, STORAGE_VERSION, f"{DOMAIN}.jobs")
        self.current: Job | None = None
        self.history: list[dict] = []
        self._task: asyncio.Task | None = None
        self.cancel_requested = False

    async def async_load(self) -> None:
        data = await self._store.async_load() or {}
        self.history = data.get("history", [])
        changed = False
        for job in self.history:
            if job.get("status") in ("pending", "running"):
                # HA stopped mid-job. Every step is its own transaction, so the
                # database is consistent; the job simply did not finish.
                job["status"] = "interrupted"
                job["error"] = "Home Assistant stopped while the job was running"
                changed = True
        if changed:
            await self._async_save()

    def _data(self) -> dict:
        history = self.history
        if self.current is not None:
            history = [asdict(self.current), *history]
        return {"history": history[:HISTORY_SIZE]}

    async def _async_save(self) -> None:
        await self._store.async_save(self._data())

    def async_schedule_save(self) -> None:
        self._store.async_delay_save(self._data, 2)

    @property
    def busy(self) -> bool:
        return self.current is not None

    def snapshot(self) -> dict:
        return {
            "current": asdict(self.current) if self.current else None,
            "history": self.history[:20],
        }

    def start(self, kind: str, params: dict[str, Any], runner: Callable[[JobContext], Awaitable[dict]]) -> Job:
        if self.busy:
            raise JobError(f"another job is running: {self.current.kind}")
        job = Job(id=uuid.uuid4().hex, kind=kind, params=params)
        self.current = job
        self.cancel_requested = False
        self._task = self.hass.async_create_background_task(
            self._run(job, runner), f"{DOMAIN} {kind} job", eager_start=False
        )
        return job

    async def _run(self, job: Job, runner: Callable[[JobContext], Awaitable[dict]]) -> None:
        ctx = JobContext(self, job)
        job.status = "running"
        job.started = time.time()
        await self._async_save()
        try:
            job.result = await runner(ctx)
            job.status = "done"
        except JobCancelled:
            job.status = "cancelled"
            ctx.log("cancelled")
        except JobError as err:
            job.status = "failed"
            job.error = str(err)
            ctx.log(f"failed: {err}")
        except Exception as err:  # noqa: BLE001 - report every failure in the journal
            _LOGGER.exception("Database Cleaner job %s failed", job.kind)
            job.status = "failed"
            job.error = f"{type(err).__name__}: {err}"
        finally:
            job.finished = time.time()
            job.step = None
            self.history.insert(0, asdict(job))
            del self.history[HISTORY_SIZE:]
            self.current = None
            await self._async_save()

    def cancel(self) -> bool:
        if not self.busy:
            return False
        self.cancel_requested = True
        return True

    async def async_wait(self) -> None:
        """Wait for the running job to finish (tests, unload)."""
        if self._task is not None:
            await asyncio.shield(self._task)

    async def async_shutdown(self) -> None:
        if self._task is not None and not self._task.done():
            self.cancel()
            try:
                await asyncio.wait_for(asyncio.shield(self._task), timeout=30)
            except TimeoutError:
                _LOGGER.warning("Database Cleaner job still running at unload")
