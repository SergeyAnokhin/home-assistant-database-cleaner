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
)

from .const import (
    CONF_CACHE_HOURS,
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
        if user_input is not None:
            cleaned = {
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
            }
        )
        return self.async_show_form(step_id="init", data_schema=schema)
