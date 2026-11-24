"""Facade with caching. All methods are blocking: call them from an executor."""

from __future__ import annotations

import threading
import time
from collections import deque
from collections.abc import Callable, Iterator, Sequence
from contextlib import contextmanager
from dataclasses import dataclass, field
from typing import Any

from . import health, lts, overview, states
from .db import connect
from .model import Context


@dataclass(slots=True)
class _Cached:
    lock: threading.Lock = field(default_factory=threading.Lock)
    value: Any = None
    key: Any = None
    at: float = 0.0


class Analyzer:
    """Read-only analytics over one recorder SQLite database."""

    def __init__(
        self,
        db_path: str,
        *,
        immutable: bool = False,
        clock: Callable[[], float] = time.time,
        overview_ttl_s: float = 600,
        statistics_ttl_s: float = 6 * 3600,
        probe_history: int = 288,
    ) -> None:
        self.db_path = db_path
        self._immutable = immutable
        self._clock = clock
        self.overview_ttl_s = overview_ttl_s
        self.statistics_ttl_s = statistics_ttl_s
        self._overview = _Cached()
        self._stats = _Cached()
        self._probes: deque[dict] = deque(maxlen=probe_history)
        self._probes_lock = threading.Lock()

    # ------------------------------------------------------------ helpers
    def now(self) -> float:
        return self._clock()

    @contextmanager
    def _conn(self) -> Iterator:
        with connect(self.db_path, immutable=self._immutable) as conn:
            yield conn

    def _fresh(self, cached: _Cached, ttl: float, key: Any = None) -> bool:
        return cached.value is not None and cached.key == key and time.monotonic() - cached.at < ttl

    @staticmethod
    def _stamp(value: dict, cached: _Cached, hit: bool) -> dict:
        return {**value, "cached": hit, "age_s": round(time.monotonic() - cached.at, 1)}

    def invalidate(self) -> None:
        for c in (self._overview, self._stats):
            with c.lock:
                c.value = None

    # ------------------------------------------------------------ overview
    def overview(self, *, refresh: bool = False) -> dict:
        c = self._overview
        with c.lock:
            if not refresh and self._fresh(c, self.overview_ttl_s):
                return self._stamp(c.value, c, True)
            with self._conn() as conn:
                c.value = overview.overview(conn, self.db_path)
            c.at = time.monotonic()
            return self._stamp(c.value, c, False)

    def _row_bytes(self) -> float | None:
        ov = self._overview.value
        if not ov or not ov.get("dbstat"):
            return None
        for t in ov["tables"]:
            if t["name"] == "statistics" and t["rows"]:
                return ((t["bytes"] or 0) + (t["index_bytes"] or 0)) / t["rows"]
        return None

    # ------------------------------------------------------------ long-term statistics
    def statistics(self, ctx: Context, periods_days: Sequence[int], *, refresh: bool = False) -> dict:
        key = tuple(sorted(int(p) for p in periods_days))
        c = self._stats
        with c.lock:
            hit = not refresh and self._fresh(c, self.statistics_ttl_s, key)
            if not hit:
                with self._conn() as conn:
                    c.value = lts.raw_summary(conn, now=self.now(), periods_days=key)
                c.key = key
                c.at = time.monotonic()
            raw = c.value
        return self._stamp(lts.enrich(raw, ctx, row_bytes=self._row_bytes()), c, hit)

    def statistics_rows_by_id(self) -> dict[str, int] | None:
        """LTS rows per statistic_id from the cache only (never triggers the scan)."""
        raw = self._stats.value
        if raw is None:
            return None
        return {i["statistic_id"]: i["rows"] for i in raw["items"]}

    # ------------------------------------------------------------ states / events
    def states(self, ctx: Context, window_s: int) -> dict:
        with self._conn() as conn:
            return states.entity_activity(conn, ctx, now=self.now(), window_s=window_s)

    def events(self, window_s: int) -> dict:
        with self._conn() as conn:
            return states.event_activity(conn, now=self.now(), window_s=window_s)

    def chatty(self, ctx: Context, top_n: int) -> dict:
        with self._conn() as conn:
            result = states.chatty(conn, ctx, now=self.now(), top_n=top_n)
        lts_rows = self.statistics_rows_by_id()
        for item in result["top"]:
            item["lts_rows"] = None if lts_rows is None else lts_rows.get(item["entity_id"], 0)
        return result

    # ------------------------------------------------------------ health
    def health(self, *, run_probe: bool = True) -> dict:
        with self._conn() as conn:
            current = health.probe(conn, now=self.now()) if run_probe else None
            snap = health.snapshot(conn, self.db_path)
        with self._probes_lock:
            if current is not None:
                current["file_size"] = snap["file"]["size"]
                current["wal_size"] = snap["file"]["wal_size"]
                self._probes.append(current)
            history = list(self._probes)
        return {
            **snap,
            "current": history[-1] if history else None,
            "history": history,
        }

    def quick_check(self) -> dict:
        with self._conn() as conn:
            return health.quick_check(conn)
