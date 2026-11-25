"""Periodic refresh for the sensors: chattiest entities + database health."""

from __future__ import annotations

import logging
import sqlite3
from datetime import timedelta
from typing import TYPE_CHECKING, Any

from homeassistant.components.recorder import get_instance
from homeassistant.core import HomeAssistant
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator, UpdateFailed

from .const import CONF_SENSOR_TOP_N, CONF_UPDATE_MINUTES, DEFAULT_OPTIONS, DOMAIN
from .engine import issues as engine_issues
from .issues import async_collect_ha_issues
from .registry import async_build_context

if TYPE_CHECKING:
    from homeassistant.config_entries import ConfigEntry

    from .engine import Analyzer

_LOGGER = logging.getLogger(__name__)


class DatabaseCleanerCoordinator(DataUpdateCoordinator[dict[str, Any]]):
    """Runs the cheap queries every few minutes (never the full LTS scan)."""

    def __init__(self, hass: HomeAssistant, entry: ConfigEntry, analyzer: Analyzer) -> None:
        options = {**DEFAULT_OPTIONS, **entry.options}
        super().__init__(
            hass,
            _LOGGER,
            config_entry=entry,
            name=DOMAIN,
            update_interval=timedelta(minutes=float(options[CONF_UPDATE_MINUTES])),
        )
        self.analyzer = analyzer
        self.top_n = int(options[CONF_SENSOR_TOP_N])

    async def _async_update_data(self) -> dict[str, Any]:
        instance = get_instance(self.hass)
        ctx = async_build_context(self.hass, instance.entity_filter)
        try:
            chatty = await self.hass.async_add_executor_job(self.analyzer.chatty, ctx, self.top_n)
            health = await self.hass.async_add_executor_job(self.analyzer.health)
        except sqlite3.Error as err:
            raise UpdateFailed(f"Database query failed: {err}") from err

        # Home Assistant's own findings only: ours need the full statistics scan.
        ha_issues, _errors = await async_collect_ha_issues(self.hass)
        issues = engine_issues.merge(ha_issues, [])

        lts_rows = self.analyzer.statistics_rows_by_id()
        return {
            "issues": {
                "problems": issues["problems"],
                "total": issues["total"],
                "codes": {c["key"]: c["count"] for c in issues["codes"]},
            },
            "chatty": chatty,
            "probe": health["current"],
            "file": health["file"],
            "free_pages_pct": health["free_pages_pct"],
            "backlog": instance.backlog,
            "lts_rows": None if lts_rows is None else sum(lts_rows.values()),
        }
