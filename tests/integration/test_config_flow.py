"""Config flow and options flow."""

from __future__ import annotations

from homeassistant import config_entries
from homeassistant.core import HomeAssistant
from homeassistant.data_entry_flow import FlowResultType

from custom_components.database_cleaner.const import DEFAULT_OPTIONS, DOMAIN


async def test_user_flow_and_single_instance(recorder_mock, hass: HomeAssistant) -> None:
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": config_entries.SOURCE_USER})
    assert result["type"] is FlowResultType.FORM
    result = await hass.config_entries.flow.async_configure(result["flow_id"], {})
    assert result["type"] is FlowResultType.CREATE_ENTRY
    assert result["options"] == DEFAULT_OPTIONS
    await hass.async_block_till_done()

    again = await hass.config_entries.flow.async_init(DOMAIN, context={"source": config_entries.SOURCE_USER})
    assert again["type"] is FlowResultType.ABORT
    assert again["reason"] == "single_instance_allowed"


async def test_options_flow(recorder_mock, hass: HomeAssistant) -> None:
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": config_entries.SOURCE_USER})
    result = await hass.config_entries.flow.async_configure(result["flow_id"], {})
    await hass.async_block_till_done()
    entry = hass.config_entries.async_entries(DOMAIN)[0]

    form = await hass.config_entries.options.async_init(entry.entry_id)
    assert form["type"] is FlowResultType.FORM
    done = await hass.config_entries.options.async_configure(
        form["flow_id"],
        {
            "state_windows": ["168", "1"],
            "lts_periods": ["365", "30"],
            "top_n": 25.0,
            "sensor_top_n": 3.0,
            "update_minutes": 5.0,
            "cache_hours": 12.0,
        },
    )
    assert done["type"] is FlowResultType.CREATE_ENTRY
    await hass.async_block_till_done()
    assert entry.options == {
        "state_windows": ["1", "168"],
        "lts_periods": ["30", "365"],
        "top_n": 25,
        "sensor_top_n": 3,
        "update_minutes": 5,
        "cache_hours": 12,
    }
    # reload happened with the new options -> 3 chatty sensors
    assert entry.runtime_data.coordinator.top_n == 3
