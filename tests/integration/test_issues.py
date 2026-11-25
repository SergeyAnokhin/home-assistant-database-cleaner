"""Problems tab: Home Assistant's validate_statistics + our checks in a real (test) Home Assistant."""

from __future__ import annotations

from homeassistant.core import HomeAssistant
from homeassistant.helpers import entity_registry as er
from pytest_homeassistant_custom_component.common import MockConfigEntry
from pytest_homeassistant_custom_component.components.recorder.common import async_wait_recording_done

from custom_components.database_cleaner.const import DEFAULT_OPTIONS, DOMAIN


async def _setup(hass: HomeAssistant) -> MockConfigEntry:
    entry = MockConfigEntry(domain=DOMAIN, title="Database Cleaner", data={}, options=dict(DEFAULT_OPTIONS))
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    return entry


async def test_issues_ws_and_sensor(recorder_mock, hass: HomeAssistant, hass_ws_client) -> None:
    # watts reported as an energy sensor: wrong unit and wrong state class for the device class
    hass.states.async_set(
        "sensor.bad_energy",
        "3",
        {"unit_of_measurement": "W", "device_class": "energy", "state_class": "measurement"},
    )
    # a measurable sensor that is not recorded as statistics at all
    hass.states.async_set(
        "sensor.no_class", "21", {"unit_of_measurement": "°C", "device_class": "temperature"}
    )
    # state_class present but nothing in statistics_meta yet
    hass.states.async_set("sensor.fresh", "5", {"unit_of_measurement": "W", "state_class": "measurement"})
    await async_wait_recording_done(hass)

    entry = await _setup(hass)
    client = await hass_ws_client(hass)

    await client.send_json({"id": 1, "type": f"{DOMAIN}/issues", "refresh": True})
    msg = await client.receive_json()
    assert msg["success"], msg
    result = msg["result"]
    by_code = {(i["code"], i["statistic_id"]): i for i in result["issues"]}

    assert ("unit_not_allowed", "sensor.bad_energy") in by_code
    assert ("state_class_not_allowed", "sensor.bad_energy") in by_code
    assert ("missing_state_class", "sensor.no_class") in by_code
    assert ("no_statistics", "sensor.fresh") in by_code
    assert by_code[("unit_not_allowed", "sensor.bad_energy")]["source"] == "own"
    assert result["sources"]["errors"] == []
    assert result["total"] == len(result["issues"])
    assert {c["key"] for c in result["codes"]} >= {"unit_not_allowed", "no_statistics"}

    # the sensor counts only Home Assistant's own findings and never gets a state_class
    coordinator = entry.runtime_data.coordinator
    await coordinator.async_refresh()
    await hass.async_block_till_done()
    ent_reg = er.async_get(hass)
    entity_id = ent_reg.async_get_entity_id("sensor", DOMAIN, f"{entry.entry_id}_statistics_issues")
    assert entity_id is not None
    state = hass.states.get(entity_id)
    assert int(state.state) >= 0
    assert "state_class" not in state.attributes


async def test_issues_ws_requires_admin(
    recorder_mock, hass: HomeAssistant, hass_ws_client, hass_read_only_access_token
) -> None:
    await _setup(hass)
    client = await hass_ws_client(hass, hass_read_only_access_token)
    await client.send_json({"id": 1, "type": f"{DOMAIN}/issues"})
    msg = await client.receive_json()
    assert not msg["success"]
