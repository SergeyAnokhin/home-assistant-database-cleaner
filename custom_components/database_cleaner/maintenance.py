"""Maintenance jobs: backup, delete statistics, repack (VACUUM), restore from the undo archive.

Safety rules (docs/implementation-plan.md, section 6):
- every change to the recorder database goes through the recorder's own task
  queue (async_clear_statistics, recorder.purge, async_import_statistics):
  there is never a second writer;
- small transactions (batches of at most ``batch_rows`` rows), recorder queue
  checked between batches, cancellation between batches;
- preflight checks and a fresh verified backup before anything destructive;
- statistics feeding the Energy dashboard can never be deleted;
- the rows of every deleted statistic are archived first (undo).
"""

from __future__ import annotations

import asyncio
import os
import time
from collections.abc import Iterator
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import TYPE_CHECKING, Any

from homeassistant.components.recorder import get_instance
from homeassistant.components.recorder.models import StatisticMeanType
from homeassistant.components.recorder.statistics import (
    async_add_external_statistics,
    async_import_statistics,
)
from homeassistant.const import __version__ as HA_VERSION
from homeassistant.core import CoreState, HomeAssistant
from homeassistant.helpers.recorder import async_migration_in_progress

from .const import (
    CONF_BACKLOG_LIMIT,
    CONF_BACKUP_DIR,
    CONF_BACKUP_MAX_AGE_H,
    CONF_BACKUPS_KEEP,
    CONF_BATCH_PAUSE_S,
    CONF_BATCH_ROWS,
    CONF_UNDO_DAYS,
    MAX_TESTED_SCHEMA_VERSION,
    MIN_SCHEMA_VERSION,
)
from .engine import archive, backup
from .engine.candidates import ref_kinds
from .engine.db import connect
from .engine.overview import schema_version
from .jobs import JobContext, JobError

if TYPE_CHECKING:
    from . import DatabaseCleanerData

CLEAR_TIMEOUT_S = 600
BACKLOG_WAIT_S = 600
REPACK_TIMEOUT_S = 2 * 3600
IMPORT_CHUNK = 5000
REPACK_FACTOR = 1.1  # VACUUM writes a full copy of the database next to it


@dataclass(slots=True)
class Settings:
    backup_dir: str
    archive_dir: str
    keep: int
    max_age_s: float
    batch_rows: int
    batch_pause_s: float
    backlog_limit: int
    undo_days: int


def default_backup_dir(hass: HomeAssistant) -> str:
    # /share exists on Home Assistant OS / Supervised and is not part of /config,
    # so database copies are not dragged into every regular HA backup.
    if os.path.isdir("/share"):
        return "/share/database_cleaner/backups"
    return hass.config.path("database_cleaner", "backups")


def settings_of(hass: HomeAssistant, options: dict) -> Settings:
    backup_dir = options.get(CONF_BACKUP_DIR) or default_backup_dir(hass)
    return Settings(
        backup_dir=backup_dir,
        archive_dir=os.path.join(backup_dir, "undo"),
        keep=int(options[CONF_BACKUPS_KEEP]),
        max_age_s=float(options[CONF_BACKUP_MAX_AGE_H]) * 3600,
        batch_rows=int(options[CONF_BATCH_ROWS]),
        batch_pause_s=float(options[CONF_BATCH_PAUSE_S]),
        backlog_limit=int(options[CONF_BACKLOG_LIMIT]),
        undo_days=int(options[CONF_UNDO_DAYS]),
    )


# ---------------------------------------------------------------- blocking helpers (executor)
def _db_info(db_path: str, settings: Settings) -> dict:
    size = os.path.getsize(db_path)
    wal = os.path.getsize(db_path + "-wal") if os.path.exists(db_path + "-wal") else 0
    with connect(db_path) as conn:
        version = schema_version(conn)
        page_count = conn.execute("PRAGMA page_count").fetchone()[0]
        freelist = conn.execute("PRAGMA freelist_count").fetchone()[0]
    return {
        "size": size,
        "wal_size": wal,
        "schema_version": version,
        "free_pages_ratio": freelist / page_count if page_count else 0.0,
        "free_db_dir": backup.free_space(os.path.dirname(os.path.abspath(db_path))),
        "free_backup_dir": backup.free_space(settings.backup_dir),
        "required_backup": backup.required_space(db_path),
        "required_repack": int((size + wal) * REPACK_FACTOR) + backup.SPACE_MARGIN,
    }


def _free_ratio(db_path: str) -> float:
    with connect(db_path) as conn:
        pages = conn.execute("PRAGMA page_count").fetchone()[0]
        free = conn.execute("PRAGMA freelist_count").fetchone()[0]
    return free / pages if pages else 0.0


def _rows_for(db_path: str, statistic_ids: list[str]) -> dict[str, int]:
    out: dict[str, int] = {}
    with connect(db_path) as conn:
        for i in range(0, len(statistic_ids), 500):
            chunk = statistic_ids[i : i + 500]
            marks = ",".join("?" * len(chunk))
            out.update(
                conn.execute(
                    "SELECT m.statistic_id, COUNT(s.id) FROM statistics_meta m "
                    "LEFT JOIN statistics s ON s.metadata_id = m.id "
                    f"WHERE m.statistic_id IN ({marks}) GROUP BY m.id",
                    chunk,
                ).fetchall()
            )
    return out


def _archive_batch(db_path: str, writer: archive.ArchiveWriter, batch: list[str]) -> list[str]:
    with connect(db_path) as conn:
        return writer.add(archive.export_statistics(conn, batch))


def maintenance_state(db_path: str, settings: Settings) -> dict:
    """Everything the Maintenance tab shows except the job journal."""
    return {
        "settings": {
            "backup_dir": settings.backup_dir,
            "archive_dir": settings.archive_dir,
            "keep": settings.keep,
            "max_age_hours": settings.max_age_s / 3600,
            "batch_rows": settings.batch_rows,
            "undo_days": settings.undo_days,
        },
        "db": _db_info(db_path, settings),
        "backups": backup.list_backups(settings.backup_dir),
        "archives": archive.list_archives(settings.archive_dir),
        "fresh_backup": (backup.latest_verified(settings.backup_dir, settings.max_age_s) or {}).get("name"),
    }


# ---------------------------------------------------------------- preflight
async def async_preflight(
    hass: HomeAssistant, data: DatabaseCleanerData, settings: Settings, kind: str, *, repack: bool = False
) -> dict:
    instance = get_instance(hass)
    checks: list[dict] = []

    def add(key: str, ok: bool, value: Any = None) -> None:
        checks.append({"key": key, "ok": bool(ok), "value": value})

    add("ha_running", hass.state is CoreState.running)
    add("no_migration", not async_migration_in_progress(hass))
    info = await hass.async_add_executor_job(_db_info, data.analyzer.db_path, settings)
    version = info["schema_version"]
    add("schema", version is not None and MIN_SCHEMA_VERSION <= version <= MAX_TESTED_SCHEMA_VERSION, version)
    add("backlog", instance.backlog < settings.backlog_limit, instance.backlog)

    fresh = await hass.async_add_executor_job(backup.latest_verified, settings.backup_dir, settings.max_age_s)
    if kind == "backup" or (kind in ("delete", "repack") and fresh is None):
        add(
            "backup_space",
            info["free_backup_dir"] >= info["required_backup"],
            {"free": info["free_backup_dir"], "required": info["required_backup"]},
        )
    if kind == "repack" or (kind == "delete" and repack):
        add(
            "repack_space",
            info["free_db_dir"] >= info["required_repack"],
            {"free": info["free_db_dir"], "required": info["required_repack"]},
        )
    if kind in ("delete", "repack"):
        check = await hass.async_add_executor_job(data.analyzer.quick_check)
        add("integrity", check["ok"], check["quick_check"][:3])
    return {
        "ok": all(c["ok"] for c in checks),
        "checks": checks,
        "fresh_backup": fresh["name"] if fresh else None,
        "db": info,
    }


def _raise_if_failed(result: dict) -> None:
    failed = [c["key"] for c in result["checks"] if not c["ok"]]
    if failed:
        raise JobError("preflight failed: " + ", ".join(failed))


# ---------------------------------------------------------------- steps
async def _ensure_backup(hass: HomeAssistant, data: DatabaseCleanerData, settings: Settings, ctx: JobContext) -> str:
    fresh = await hass.async_add_executor_job(backup.latest_verified, settings.backup_dir, settings.max_age_s)
    if fresh is not None:
        ctx.log(f"fresh verified backup: {fresh['name']}")
        return fresh["name"]
    ctx.step("backup")
    try:
        manifest = await hass.async_add_executor_job(
            lambda: backup.create(data.analyzer.db_path, settings.backup_dir, keep=settings.keep, ha_version=HA_VERSION)
        )
    except backup.BackupError as err:
        raise JobError(f"backup failed: {err}") from err
    ctx.log(f"backup {manifest['name']} verified ({manifest['size']} bytes)")
    return manifest["name"]


async def _wait_backlog(hass: HomeAssistant, limit: int, ctx: JobContext) -> None:
    instance = get_instance(hass)
    deadline = time.monotonic() + BACKLOG_WAIT_S
    while instance.backlog >= limit:
        ctx.check_cancel()
        if time.monotonic() > deadline:
            raise JobError(f"recorder queue stays at {instance.backlog} (limit {limit})")
        await asyncio.sleep(1)


async def _clear(hass: HomeAssistant, batch: list[str]) -> None:
    done = asyncio.Event()
    get_instance(hass).async_clear_statistics(batch, on_done=lambda: hass.loop.call_soon_threadsafe(done.set))
    try:
        async with asyncio.timeout(CLEAR_TIMEOUT_S):
            await done.wait()
    except TimeoutError as err:
        raise JobError(f"recorder did not finish deleting {len(batch)} statistics in {CLEAR_TIMEOUT_S} s") from err


async def _commit_and_wait(hass: HomeAssistant) -> None:
    """Wait until queued recorder work is processed *and committed*.

    Imports land in the recorder's event session, which is only committed every
    ``commit_interval`` seconds; ``async_block_till_done`` alone does not wait
    for that. Queue an explicit commit so "done" really means "on disk".
    """
    instance = get_instance(hass)
    try:
        from homeassistant.components.recorder.tasks import CommitTask  # noqa: PLC0415
    except ImportError:  # internal API moved: fall back to waiting one commit interval
        await instance.async_block_till_done()
        await asyncio.sleep((instance.commit_interval or 0) + 2)
        return
    instance.queue_task(CommitTask())
    await instance.async_block_till_done()


async def _repack(hass: HomeAssistant, data: DatabaseCleanerData, ctx: JobContext) -> dict:
    db_path = data.analyzer.db_path
    size_before = await hass.async_add_executor_job(os.path.getsize, db_path)
    ctx.step("repack")
    # recorder.purge also removes states older than purge_keep_days — exactly what
    # the nightly purge does anyway. VACUUM runs inside the recorder thread.
    await hass.services.async_call("recorder", "purge", {"repack": True}, blocking=True)
    instance = get_instance(hass)
    deadline = time.monotonic() + REPACK_TIMEOUT_S
    while True:
        await instance.async_block_till_done()
        if await hass.async_add_executor_job(_free_ratio, db_path) < 0.01:
            break
        if time.monotonic() > deadline:
            raise JobError("VACUUM did not finish in time")
        await asyncio.sleep(2)
    size_after = await hass.async_add_executor_job(os.path.getsize, db_path)
    ctx.log(f"repack: {size_before} -> {size_after} bytes")
    return {"size_before": size_before, "size_after": size_after}


# ---------------------------------------------------------------- jobs
async def run_backup(hass: HomeAssistant, data: DatabaseCleanerData, settings: Settings, ctx: JobContext) -> dict:
    ctx.step("preflight")
    _raise_if_failed(await async_preflight(hass, data, settings, "backup"))
    ctx.step("backup")
    try:
        manifest = await hass.async_add_executor_job(
            lambda: backup.create(data.analyzer.db_path, settings.backup_dir, keep=settings.keep, ha_version=HA_VERSION)
        )
    except backup.BackupError as err:
        raise JobError(str(err)) from err
    ctx.log(f"backup {manifest['name']} verified")
    return {"backup": manifest["name"], "size": manifest["size"], "removed": manifest["removed"]}


async def run_delete(
    hass: HomeAssistant,
    data: DatabaseCleanerData,
    settings: Settings,
    ctx: JobContext,
    statistic_ids: list[str],
    *,
    repack: bool,
) -> dict:
    db_path = data.analyzer.db_path
    ctx.step("preflight")
    _raise_if_failed(await async_preflight(hass, data, settings, "delete", repack=repack))

    # Energy guard, recomputed now (never trust what the browser sent).
    all_ids = await hass.async_add_executor_job(data.analyzer.statistic_ids)
    usage, _ = await data.usage.async_get(hass, all_ids, refresh=True)
    protected = sorted(sid for sid in statistic_ids if "energy" in ref_kinds(usage.get(sid, ())))
    if protected:
        raise JobError("used by the Energy dashboard, refusing to delete: " + ", ".join(protected))

    rows = await hass.async_add_executor_job(_rows_for, db_path, sorted(set(statistic_ids)))
    skipped = sorted(set(statistic_ids) - rows.keys())
    if skipped:
        ctx.log(f"not in the database any more, skipped: {len(skipped)}")
    items = sorted(rows.items(), key=lambda kv: -kv[1])
    if not items:
        raise JobError("nothing to delete")
    size_before = await hass.async_add_executor_job(os.path.getsize, db_path)

    backup_name = await _ensure_backup(hass, data, settings, ctx)

    writer = await hass.async_add_executor_job(
        lambda: archive.ArchiveWriter(settings.archive_dir, job_id=ctx.job.id)
    )
    batches = archive.plan_batches(items, settings.batch_rows)
    ctx.step("delete", total=len(items))
    deleted_ids: list[str] = []
    deleted_rows = 0
    complete = False
    try:
        for batch in batches:
            ctx.check_cancel()
            await _wait_backlog(hass, settings.backlog_limit, ctx)
            # 1) archive (fsync'd) 2) delete through the recorder
            archived = await hass.async_add_executor_job(_archive_batch, db_path, writer, batch)
            await _clear(hass, archived)
            deleted_ids += archived
            deleted_rows += sum(rows[s] for s in archived)
            ctx.advance(len(batch))
            ctx.log(f"deleted {len(archived)} statistics, {deleted_rows} rows so far")
            if settings.batch_pause_s:
                await asyncio.sleep(settings.batch_pause_s)
        complete = True
    finally:
        index = await hass.async_add_executor_job(lambda: writer.close(complete=complete))
        data.analyzer.invalidate()
        data.usage.invalidate()

    remaining = await hass.async_add_executor_job(_rows_for, db_path, deleted_ids)
    result: dict[str, Any] = {
        "deleted": len(deleted_ids),
        "deleted_rows": deleted_rows,
        "skipped": skipped,
        "remaining_rows": sum(remaining.values()),
        "backup": backup_name,
        "archive": index["name"],
        "size_before": size_before,
    }
    if repack:
        ctx.check_cancel()
        result.update(await _repack(hass, data, ctx))
    else:
        result["size_after"] = await hass.async_add_executor_job(os.path.getsize, db_path)
    await hass.async_add_executor_job(
        archive.expire_archives, settings.archive_dir, settings.undo_days * 86400
    )
    return result


async def run_repack(hass: HomeAssistant, data: DatabaseCleanerData, settings: Settings, ctx: JobContext) -> dict:
    ctx.step("preflight")
    _raise_if_failed(await async_preflight(hass, data, settings, "repack"))
    backup_name = await _ensure_backup(hass, data, settings, ctx)
    result = await _repack(hass, data, ctx)
    data.analyzer.invalidate()
    return {**result, "backup": backup_name}


def _to_import(rec: dict) -> tuple[dict, list[dict]]:
    m = rec["meta"]
    mean_type = StatisticMeanType(int(m.get("mean_type") or 0))
    metadata = {
        "has_mean": mean_type is not StatisticMeanType.NONE,
        "mean_type": mean_type,
        "has_sum": bool(m.get("has_sum")),
        "name": m.get("name"),
        "source": m.get("source") or "recorder",
        "statistic_id": m["statistic_id"],
        "unit_class": m.get("unit_class"),
        "unit_of_measurement": m.get("unit_of_measurement"),
    }
    stats = []
    for row in rec["rows"]:
        r = dict(zip(rec["columns"], row, strict=True))
        item: dict[str, Any] = {"start": datetime.fromtimestamp(r["start_ts"], UTC)}
        for key in ("mean", "min", "max", "state", "sum", "mean_weight"):
            if r.get(key) is not None:
                item[key] = r[key]
        if r.get("last_reset_ts") is not None:
            item["last_reset"] = datetime.fromtimestamp(r["last_reset_ts"], UTC)
        stats.append(item)
    return metadata, stats


async def run_restore(
    hass: HomeAssistant,
    data: DatabaseCleanerData,
    settings: Settings,
    ctx: JobContext,
    archive_name: str,
    statistic_ids: list[str] | None,
) -> dict:
    ctx.step("preflight")
    _raise_if_failed(await async_preflight(hass, data, settings, "restore"))
    wanted = set(statistic_ids) if statistic_ids else None
    indexes = await hass.async_add_executor_job(archive.list_archives, settings.archive_dir)
    index = next((a for a in indexes if a["name"] == archive_name), None)
    if index is None:
        raise JobError(f"archive not found: {archive_name}")
    total = sum(1 for s in index["statistics"] if wanted is None or s["statistic_id"] in wanted)

    try:
        records: Iterator[dict] = archive.read_archive(settings.archive_dir, archive_name, wanted)
    except archive.ArchiveError as err:
        raise JobError(str(err)) from err
    ctx.step("restore", total=total)
    restored = rows = 0
    try:
        while True:
            ctx.check_cancel()
            rec = await hass.async_add_executor_job(next, records, None)
            if rec is None:
                break
            metadata, stats = _to_import(rec)
            importer = async_add_external_statistics if ":" in metadata["statistic_id"] else async_import_statistics
            for i in range(0, len(stats), IMPORT_CHUNK):
                importer(hass, metadata, stats[i : i + IMPORT_CHUNK])
            await _commit_and_wait(hass)
            restored += 1
            rows += len(stats)
            ctx.advance()
    finally:
        await hass.async_add_executor_job(records.close)
        data.analyzer.invalidate()
        data.usage.invalidate()
    ctx.log(f"restored {restored} statistics, {rows} rows")
    return {"restored": restored, "rows": rows, "archive": archive_name}
