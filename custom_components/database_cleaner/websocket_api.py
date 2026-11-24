"""WebSocket commands used by the panel. All of them are admin-only and read-only."""

from __future__ import annotations

import sqlite3
from collections.abc import Callable
from functools import partial
from typing import TYPE_CHECKING, Any

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.components.recorder import get_instance
from homeassistant.core import HomeAssistant, callback

from .const import CONF_LTS_PERIODS, CONF_STATE_WINDOWS, CONF_TOP_N, DEFAULT_OPTIONS, DOMAIN, VERSION
from .registry import async_build_context

if TYPE_CHECKING:
    from . import DatabaseCleanerData


@callback
def async_register_websocket_commands(hass: HomeAssistant) -> None:
    for handler in (ws_info, ws_overview, ws_statistics, ws_states, ws_events, ws_health, ws_quick_check):
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
