"""WebSocket commands used by the panel. All of them are admin-only; only the maintenance ones change anything."""

from __future__ import annotations

import sqlite3
from collections.abc import Callable
from datetime import timedelta
from functools import partial
from typing import TYPE_CHECKING, Any

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.components.http.auth import async_sign_path
from homeassistant.components.recorder import get_instance
from homeassistant.core import HomeAssistant, callback

from . import maintenance
from .download import DOWNLOAD_PATH, KINDS, find_file
from .const import CONF_LTS_PERIODS, CONF_STATE_WINDOWS, CONF_TOP_N, DEFAULT_OPTIONS, DOMAIN, VERSION
from .engine import archive, backup
from .engine.live import CURSORS
from .jobs import JobError
from .registry import async_build_context

if TYPE_CHECKING:
    from . import DatabaseCleanerData


@callback
def async_register_websocket_commands(hass: HomeAssistant) -> None:
    for handler in (
        ws_info,
        ws_overview,
        ws_statistics,
        ws_states,
        ws_events,
        ws_health,
        ws_quick_check,
        ws_issues,
        ws_maintenance,
        ws_preflight,
        ws_job_start,
        ws_job_cancel,
        ws_job_status,
        ws_backup_delete,
        ws_archive_delete,
        ws_download_sign,
        ws_live,
    ):
        websocket_api.async_register_command(hass, handler)


def _loaded(hass: HomeAssistant) -> tuple[DatabaseCleanerData, dict] | None:
    entries = hass.config_entries.async_loaded_entries(DOMAIN)
    if not entries:
        return None
    entry = entries[0]
    return entry.runtime_data, {**DEFAULT_OPTIONS, **entry.options}


async def _run(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
    job: Callable[[DatabaseCleanerData, dict], Callable[[], Any]],
) -> None:
    loaded = _loaded(hass)
    if loaded is None:
        connection.send_error(msg["id"], "not_loaded", "Database Cleaner is not set up")
        return
    data, options = loaded
    try:
        result = await hass.async_add_executor_job(job(data, options))
    except sqlite3.Error as err:
        connection.send_error(msg["id"], "db_error", str(err))
        return
    connection.send_result(msg["id"], result)


def _recorder_info(hass: HomeAssistant) -> dict[str, Any]:
    instance = get_instance(hass)
    return {
        "keep_days": instance.keep_days,
        "commit_interval": instance.commit_interval,
        "auto_purge": instance.auto_purge,
        "auto_repack": instance.auto_repack,
        "backlog": instance.backlog,
        "recording": instance.recording,
        "filter_active": instance.entity_filter is not None,
        "dialect": str(instance.dialect_name) if instance.dialect_name else None,
    }


@websocket_api.require_admin
@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/info"})
@callback
def ws_info(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    loaded = _loaded(hass)
    if loaded is None:
        connection.send_error(msg["id"], "not_loaded", "Database Cleaner is not set up")
        return
    data, options = loaded
    connection.send_result(
        msg["id"],
        {
            "version": VERSION,
            "db_path": data.analyzer.db_path,
            "options": {
                "state_windows": [float(h) for h in options[CONF_STATE_WINDOWS]],
                "lts_periods": [int(d) for d in options[CONF_LTS_PERIODS]],
                "top_n": int(options[CONF_TOP_N]),
            },
            "recorder": _recorder_info(hass),
        },
    )


@websocket_api.require_admin
@websocket_api.websocket_command(
    {vol.Required("type"): f"{DOMAIN}/overview", vol.Optional("refresh", default=False): bool}
)
@websocket_api.async_response
async def ws_overview(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    await _run(hass, connection, msg, lambda d, _: partial(d.analyzer.overview, refresh=msg["refresh"]))


@websocket_api.require_admin
@websocket_api.websocket_command(
    {vol.Required("type"): f"{DOMAIN}/statistics", vol.Optional("refresh", default=False): bool}
)
@websocket_api.async_response
async def ws_statistics(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    ctx = async_build_context(hass, get_instance(hass).entity_filter)
    loaded = _loaded(hass)
    if loaded is not None:
        data = loaded[0]
        try:
            ids = await hass.async_add_executor_job(data.analyzer.statistic_ids)
        except sqlite3.Error as err:
            connection.send_error(msg["id"], "db_error", str(err))
            return
        ctx.usage, ctx.usage_sources = await data.usage.async_get(hass, ids, refresh=msg["refresh"])
    await _run(
        hass,
        connection,
        msg,
        lambda d, o: partial(
            d.analyzer.statistics, ctx, [int(p) for p in o[CONF_LTS_PERIODS]], refresh=msg["refresh"]
        ),
    )


_WINDOW = vol.All(vol.Coerce(float), vol.Range(min=0.05, max=24 * 3650))


@websocket_api.require_admin
@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/states", vol.Required("window_hours"): _WINDOW})
@websocket_api.async_response
async def ws_states(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    ctx = async_build_context(hass, get_instance(hass).entity_filter)
    window_s = int(msg["window_hours"] * 3600)
    await _run(hass, connection, msg, lambda d, _: partial(d.analyzer.states, ctx, window_s))


@websocket_api.require_admin
@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/events", vol.Required("window_hours"): _WINDOW})
@websocket_api.async_response
async def ws_events(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    window_s = int(msg["window_hours"] * 3600)
    await _run(hass, connection, msg, lambda d, _: partial(d.analyzer.events, window_s))


@websocket_api.require_admin
@websocket_api.websocket_command(
    {vol.Required("type"): f"{DOMAIN}/health", vol.Optional("probe", default=True): bool}
)
@websocket_api.async_response
async def ws_health(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    recorder = _recorder_info(hass)

    def job(d: DatabaseCleanerData, _: dict) -> Callable[[], Any]:
        def run() -> dict:
            return {**d.analyzer.health(run_probe=msg["probe"]), "recorder": recorder}

        return run

    await _run(hass, connection, msg, job)


@websocket_api.require_admin
@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/quick_check"})
@websocket_api.async_response
async def ws_quick_check(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    await _run(hass, connection, msg, lambda d, _: d.analyzer.quick_check)


@websocket_api.require_admin
@websocket_api.websocket_command(
    {vol.Required("type"): f"{DOMAIN}/issues", vol.Optional("refresh", default=False): bool}
)
@websocket_api.async_response
async def ws_issues(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    loaded = _loaded(hass)
    if loaded is None:
        connection.send_error(msg["id"], "not_loaded", "Database Cleaner is not set up")
        return
    data, options = loaded
    try:
        result = await data.issues.async_get(
            hass, data, [int(p) for p in options[CONF_LTS_PERIODS]], refresh=msg["refresh"]
        )
    except sqlite3.Error as err:
        connection.send_error(msg["id"], "db_error", str(err))
        return
    connection.send_result(msg["id"], result)


# ---------------------------------------------------------------- maintenance (phases 3-4)
def _require(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]):
    loaded = _loaded(hass)
    if loaded is None:
        connection.send_error(msg["id"], "not_loaded", "Database Cleaner is not set up")
        return None
    data, options = loaded
    return data, maintenance.settings_of(hass, options)


@websocket_api.require_admin
@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/maintenance"})
@websocket_api.async_response
async def ws_maintenance(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    if (req := _require(hass, connection, msg)) is None:
        return
    data, settings = req
    state = await hass.async_add_executor_job(maintenance.maintenance_state, data.analyzer.db_path, settings)
    connection.send_result(msg["id"], {**state, "jobs": data.jobs.snapshot()})


_KINDS = vol.In(["backup", "delete", "repack", "restore"])


@websocket_api.require_admin
@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/preflight",
        vol.Required("kind"): _KINDS,
        vol.Optional("repack", default=False): bool,
        vol.Optional("backup", default=True): bool,
    }
)
@websocket_api.async_response
async def ws_preflight(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    if (req := _require(hass, connection, msg)) is None:
        return
    data, settings = req
    try:
        result = await maintenance.async_preflight(
            hass, data, settings, msg["kind"], repack=msg["repack"], backup_first=msg["backup"]
        )
    except sqlite3.Error as err:
        connection.send_error(msg["id"], "db_error", str(err))
        return
    connection.send_result(msg["id"], result)


@websocket_api.require_admin
@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/job/start",
        vol.Required("kind"): _KINDS,
        vol.Optional("statistic_ids", default=list): [str],
        vol.Optional("repack", default=False): bool,
        vol.Optional("backup", default=True): bool,
        vol.Optional("archive"): str,
        vol.Optional("confirm", default=False): bool,
    }
)
@callback
def ws_job_start(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    if (req := _require(hass, connection, msg)) is None:
        return
    data, settings = req
    kind = msg["kind"]
    ids = sorted(set(msg["statistic_ids"]))
    if kind != "backup" and not msg["confirm"]:
        connection.send_error(msg["id"], "not_confirmed", "Destructive jobs need confirm: true")
        return
    if kind == "delete" and not ids:
        connection.send_error(msg["id"], "invalid", "statistic_ids is empty")
        return
    if kind == "restore" and not msg.get("archive"):
        connection.send_error(msg["id"], "invalid", "archive is required")
        return

    if kind == "backup":
        runner = lambda ctx: maintenance.run_backup(hass, data, settings, ctx)  # noqa: E731
        params: dict[str, Any] = {}
    elif kind == "delete":
        runner = lambda ctx: maintenance.run_delete(  # noqa: E731
            hass, data, settings, ctx, ids, repack=msg["repack"], make_backup=msg["backup"]
        )
        params = {"count": len(ids), "statistic_ids": ids[:100], "repack": msg["repack"], "backup": msg["backup"]}
    elif kind == "repack":
        runner = lambda ctx: maintenance.run_repack(hass, data, settings, ctx, make_backup=msg["backup"])  # noqa: E731
        params = {"backup": msg["backup"]}
    else:
        runner = lambda ctx: maintenance.run_restore(hass, data, settings, ctx, msg["archive"], ids or None)  # noqa: E731
        params = {"archive": msg["archive"], "count": len(ids) or None}
    try:
        job = data.jobs.start(kind, params, runner)
    except JobError as err:
        connection.send_error(msg["id"], "busy", str(err))
        return
    connection.send_result(msg["id"], {"job_id": job.id})


@websocket_api.require_admin
@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/job/cancel"})
@callback
def ws_job_cancel(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    if (req := _require(hass, connection, msg)) is None:
        return
    connection.send_result(msg["id"], {"cancelling": req[0].jobs.cancel()})


@websocket_api.require_admin
@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/job/status"})
@callback
def ws_job_status(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    if (req := _require(hass, connection, msg)) is None:
        return
    connection.send_result(msg["id"], req[0].jobs.snapshot())


@websocket_api.require_admin
@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/backup/delete",
        vol.Required("name"): str,
        vol.Optional("confirm", default=False): bool,
    }
)
@websocket_api.async_response
async def ws_backup_delete(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    if (req := _require(hass, connection, msg)) is None:
        return
    data, settings = req
    if not msg["confirm"]:
        connection.send_error(msg["id"], "not_confirmed", "confirm: true is required")
        return
    if data.jobs.busy:
        connection.send_error(msg["id"], "busy", "a job is running")
        return
    try:
        await hass.async_add_executor_job(backup.delete_backup, settings.backup_dir, msg["name"])
    except backup.BackupError as err:
        connection.send_error(msg["id"], "invalid", str(err))
        return
    connection.send_result(msg["id"], {"deleted": msg["name"]})


@websocket_api.require_admin
@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/archive/delete",
        vol.Required("name"): str,
        vol.Optional("confirm", default=False): bool,
    }
)
@websocket_api.async_response
async def ws_archive_delete(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    if (req := _require(hass, connection, msg)) is None:
        return
    data, settings = req
    if not msg["confirm"]:
        connection.send_error(msg["id"], "not_confirmed", "confirm: true is required")
        return
    if data.jobs.busy:
        connection.send_error(msg["id"], "busy", "a job is running")
        return
    try:
        await hass.async_add_executor_job(archive.delete_archive, settings.archive_dir, msg["name"])
    except archive.ArchiveError as err:
        connection.send_error(msg["id"], "invalid", str(err))
        return
    connection.send_result(msg["id"], {"deleted": msg["name"]})


@websocket_api.require_admin
@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/download/sign",
        vol.Required("kind"): vol.In(list(KINDS)),
        vol.Required("name"): str,
    }
)
@websocket_api.async_response
async def ws_download_sign(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """A short-lived signed link: a plain browser download cannot carry the WebSocket token."""
    try:
        await hass.async_add_executor_job(find_file, hass, msg["kind"], msg["name"])
    except (backup.BackupError, archive.ArchiveError) as err:
        connection.send_error(msg["id"], "invalid", str(err))
        return
    url = async_sign_path(
        hass,
        f"{DOWNLOAD_PATH}/{msg['kind']}/{msg['name']}",
        timedelta(minutes=10),
        refresh_token_id=connection.refresh_token_id,
    )
    connection.send_result(msg["id"], {"url": url})


_CURSOR = vol.Schema({vol.Optional(key): vol.All(int, vol.Range(min=0)) for key in CURSORS})


@websocket_api.require_admin
@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/live", vol.Optional("cursor"): _CURSOR})
@websocket_api.async_response
async def ws_live(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """One poll of the live view: rows written since the cursor + the recorder queue."""
    loaded = _loaded(hass)
    if loaded is None:
        connection.send_error(msg["id"], "not_loaded", "Database Cleaner is not set up")
        return
    data, _ = loaded
    instance = get_instance(hass)
    ctx = async_build_context(hass, instance.entity_filter)
    cursor = msg.get("cursor")
    try:
        result = await hass.async_add_executor_job(data.analyzer.live, ctx, cursor)
    except sqlite3.Error as err:
        connection.send_error(msg["id"], "db_error", str(err))
        return
    connection.send_result(
        msg["id"],
        {
            **result,
            "backlog": instance.backlog,
            "recording": instance.recording,
            "commit_interval": instance.commit_interval,
        },
    )
