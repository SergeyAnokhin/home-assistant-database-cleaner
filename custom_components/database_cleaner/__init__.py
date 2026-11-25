"""Database Cleaner: analyse and clean the Home Assistant recorder database.

Analytics open their own ``mode=ro`` SQLite connection. Every change to the
database (deleting statistics, VACUUM, restoring from the undo archive) goes
through the recorder's own task queue — see ``maintenance.py``.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from pathlib import Path

from homeassistant.components import frontend, panel_custom
from homeassistant.components.http import StaticPathConfig
from homeassistant.components.recorder import get_instance
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ConfigEntryError, ConfigEntryNotReady
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.typing import ConfigType

from .const import (
    CONF_CACHE_HOURS,
    DEFAULT_OPTIONS,
    DOMAIN,
    PANEL_COMPONENT,
    PANEL_ICON,
    PANEL_TITLE,
    PANEL_URL_PATH,
    STATIC_URL,
    VERSION,
)
from .coordinator import DatabaseCleanerCoordinator
from .engine import Analyzer
from .engine.db import sqlite_path_from_url
from .issues import IssuesCache
from .jobs import JobManager
from .usage import UsageCache
from .websocket_api import async_register_websocket_commands

_LOGGER = logging.getLogger(__name__)

PLATFORMS = [Platform.SENSOR]
CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)
FRONTEND_DIR = Path(__file__).parent / "frontend"
_STATIC_REGISTERED = f"{DOMAIN}_static_registered"


@dataclass(slots=True)
class DatabaseCleanerData:
    analyzer: Analyzer
    coordinator: DatabaseCleanerCoordinator
    jobs: JobManager
    usage: UsageCache = field(default_factory=UsageCache)
    issues: IssuesCache = field(default_factory=IssuesCache)


type DatabaseCleanerConfigEntry = ConfigEntry[DatabaseCleanerData]


def options_of(entry: ConfigEntry) -> dict:
    return {**DEFAULT_OPTIONS, **entry.options}


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    async_register_websocket_commands(hass)
    return True


async def async_setup_entry(hass: HomeAssistant, entry: DatabaseCleanerConfigEntry) -> bool:
    instance = get_instance(hass)
    if not instance.async_db_ready.done():
        raise ConfigEntryNotReady("Recorder database is not ready yet")
    db_path = sqlite_path_from_url(instance.db_url)
    if db_path is None:
        raise ConfigEntryError("Only the SQLite recorder database is supported")

    options = options_of(entry)
    analyzer = Analyzer(db_path, statistics_ttl_s=float(options[CONF_CACHE_HOURS]) * 3600)
    coordinator = DatabaseCleanerCoordinator(hass, entry, analyzer)
    await coordinator.async_config_entry_first_refresh()
    jobs = JobManager(hass)
    await jobs.async_load()
    entry.runtime_data = DatabaseCleanerData(analyzer=analyzer, coordinator=coordinator, jobs=jobs)

    await _async_register_panel(hass)
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    entry.async_on_unload(entry.add_update_listener(_async_options_updated))
    return True


async def async_unload_entry(hass: HomeAssistant, entry: DatabaseCleanerConfigEntry) -> bool:
    await entry.runtime_data.jobs.async_shutdown()
    unloaded = await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
    if unloaded:
        frontend.async_remove_panel(hass, PANEL_URL_PATH, warn_if_unknown=False)
    return unloaded


async def _async_options_updated(hass: HomeAssistant, entry: ConfigEntry) -> None:
    await hass.config_entries.async_reload(entry.entry_id)


async def _async_register_panel(hass: HomeAssistant) -> None:
    # Static paths cannot be unregistered, so register them once per HA run.
    if not hass.data.get(_STATIC_REGISTERED):
        await hass.http.async_register_static_paths(
            [StaticPathConfig(STATIC_URL, str(FRONTEND_DIR), cache_headers=False)]
        )
        hass.data[_STATIC_REGISTERED] = True

    mtime = await hass.async_add_executor_job(lambda: int((FRONTEND_DIR / "panel.js").stat().st_mtime))
    await panel_custom.async_register_panel(
        hass,
        frontend_url_path=PANEL_URL_PATH,
        webcomponent_name=PANEL_COMPONENT,
        sidebar_title=PANEL_TITLE,
        sidebar_icon=PANEL_ICON,
        module_url=f"{STATIC_URL}/panel.js?v={VERSION}-{mtime}",
        require_admin=True,
        config={"version": VERSION},
    )
