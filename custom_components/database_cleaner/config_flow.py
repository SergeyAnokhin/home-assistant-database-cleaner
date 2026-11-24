"""Config flow (one entry per system) and options flow."""

from __future__ import annotations

from typing import Any

import voluptuous as vol

from homeassistant.components.recorder import get_instance
from homeassistant.config_entries import ConfigEntry, ConfigFlow, ConfigFlowResult, OptionsFlow
from homeassistant.core import callback
from homeassistant.helpers.selector import (
    NumberSelector,
    NumberSelectorConfig,
    NumberSelectorMode,
    SelectSelector,
    SelectSelectorConfig,
    SelectSelectorMode,
    TextSelector,
)

from .const import (
    CONF_BACKLOG_LIMIT,
    CONF_BACKUP_DIR,
    CONF_BACKUP_MAX_AGE_H,
    CONF_BACKUPS_KEEP,
    CONF_BATCH_PAUSE_S,
    CONF_BATCH_ROWS,
    CONF_CACHE_HOURS,
    CONF_UNDO_DAYS,
    CONF_LTS_PERIODS,
    CONF_SENSOR_TOP_N,
    CONF_STATE_WINDOWS,
    CONF_TOP_N,
    CONF_UPDATE_MINUTES,
    DEFAULT_OPTIONS,
    DOMAIN,
    LTS_PERIOD_CHOICES,
    STATE_WINDOW_CHOICES,
)
from .engine.db import sqlite_path_from_url


class DatabaseCleanerConfigFlow(ConfigFlow, domain=DOMAIN):
    VERSION = 1

    async def async_step_user(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        if sqlite_path_from_url(get_instance(self.hass).db_url) is None:
            return self.async_abort(reason="unsupported_db")
        if user_input is not None:
            return self.async_create_entry(title="Database Cleaner", data={}, options=dict(DEFAULT_OPTIONS))
        return self.async_show_form(step_id="user")

    @staticmethod
    @callback
    def async_get_options_flow(config_entry: ConfigEntry) -> OptionsFlow:
        return DatabaseCleanerOptionsFlow()


def _number(minimum: int, maximum: int, step: int = 1) -> NumberSelector:
    return NumberSelector(
        NumberSelectorConfig(min=minimum, max=maximum, step=step, mode=NumberSelectorMode.BOX)
    )


def _multi(options: list[str], key: str) -> SelectSelector:
    return SelectSelector(
        SelectSelectorConfig(
            options=options, multiple=True, mode=SelectSelectorMode.LIST, translation_key=key
        )
    )


class DatabaseCleanerOptionsFlow(OptionsFlow):
    async def async_step_init(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        errors: dict[str, str] = {}
        if user_input is not None:
            backup_dir = (user_input.get(CONF_BACKUP_DIR) or "").strip()
            if backup_dir and not backup_dir.startswith(("/", "\\")) and ":" not in backup_dir[:3]:
                errors[CONF_BACKUP_DIR] = "absolute_path"
        if user_input is not None and not errors:
            cleaned = {
                CONF_BACKUP_DIR: (user_input.get(CONF_BACKUP_DIR) or "").strip(),
                CONF_BACKUPS_KEEP: int(user_input[CONF_BACKUPS_KEEP]),
                CONF_BACKUP_MAX_AGE_H: int(user_input[CONF_BACKUP_MAX_AGE_H]),
                CONF_BATCH_ROWS: int(user_input[CONF_BATCH_ROWS]),
                CONF_BATCH_PAUSE_S: float(user_input[CONF_BATCH_PAUSE_S]),
                CONF_BACKLOG_LIMIT: int(user_input[CONF_BACKLOG_LIMIT]),
                CONF_UNDO_DAYS: int(user_input[CONF_UNDO_DAYS]),
                CONF_STATE_WINDOWS: sorted(user_input[CONF_STATE_WINDOWS] or DEFAULT_OPTIONS[CONF_STATE_WINDOWS], key=float),
                CONF_LTS_PERIODS: sorted(user_input[CONF_LTS_PERIODS] or DEFAULT_OPTIONS[CONF_LTS_PERIODS], key=int),
                CONF_TOP_N: int(user_input[CONF_TOP_N]),
                CONF_SENSOR_TOP_N: int(user_input[CONF_SENSOR_TOP_N]),
                CONF_UPDATE_MINUTES: int(user_input[CONF_UPDATE_MINUTES]),
                CONF_CACHE_HOURS: int(user_input[CONF_CACHE_HOURS]),
            }
            return self.async_create_entry(data=cleaned)

        current = {**DEFAULT_OPTIONS, **self.config_entry.options}
        schema = vol.Schema(
            {
                vol.Required(CONF_STATE_WINDOWS, default=current[CONF_STATE_WINDOWS]): _multi(
                    STATE_WINDOW_CHOICES, CONF_STATE_WINDOWS
                ),
                vol.Required(CONF_LTS_PERIODS, default=current[CONF_LTS_PERIODS]): _multi(
                    LTS_PERIOD_CHOICES, CONF_LTS_PERIODS
                ),
                vol.Required(CONF_TOP_N, default=current[CONF_TOP_N]): _number(5, 100, 5),
                vol.Required(CONF_SENSOR_TOP_N, default=current[CONF_SENSOR_TOP_N]): _number(1, 20),
                vol.Required(CONF_UPDATE_MINUTES, default=current[CONF_UPDATE_MINUTES]): _number(1, 120),
                vol.Required(CONF_CACHE_HOURS, default=current[CONF_CACHE_HOURS]): _number(1, 48),
                vol.Optional(CONF_BACKUP_DIR, default=current[CONF_BACKUP_DIR]): TextSelector(),
                vol.Required(CONF_BACKUPS_KEEP, default=current[CONF_BACKUPS_KEEP]): _number(1, 10),
                vol.Required(CONF_BACKUP_MAX_AGE_H, default=current[CONF_BACKUP_MAX_AGE_H]): _number(1, 168),
                vol.Required(CONF_BATCH_ROWS, default=current[CONF_BATCH_ROWS]): _number(1000, 500_000, 1000),
                vol.Required(CONF_BATCH_PAUSE_S, default=current[CONF_BATCH_PAUSE_S]): _number(0, 30),
                vol.Required(CONF_BACKLOG_LIMIT, default=current[CONF_BACKLOG_LIMIT]): _number(100, 50_000, 100),
                vol.Required(CONF_UNDO_DAYS, default=current[CONF_UNDO_DAYS]): _number(1, 365),
            }
        )
        return self.async_show_form(step_id="init", data_schema=schema, errors=errors)
