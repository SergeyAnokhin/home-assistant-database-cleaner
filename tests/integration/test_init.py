"""Set up the integration in a real (test) Home Assistant with a file recorder DB."""

from __future__ import annotations

from homeassistant.config_entries import ConfigEntryState
from homeassistant.core import HomeAssistant
from homeassistant.helpers import entity_registry as er
from pytest_homeassistant_custom_component.common import MockConfigEntry
from pytest_homeassistant_custom_component.components.recorder.common import async_wait_recording_done

from custom_components.database_cleaner.const import DEFAULT_OPTIONS, DOMAIN, PANEL_URL_PATH


async def _setup(hass: HomeAssistant) -> MockConfigEntry:
    entry = MockConfigEntry(domain=DOMAIN, title="Database Cleaner", data={}, options=dict(DEFAULT_OPTIONS))
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    return entry


async def test_setup_panel_sensors_and_ws(recorder_mock, hass: HomeAssistant, hass_ws_client) -> None:
    for i in range(5):
        hass.states.async_set("sensor.chatty_power", str(i), {"unit_of_measurement": "W"})
    hass.states.async_set("sensor.quiet", "1")
    await async_wait_recording_done(hass)

    entry = await _setup(hass)
    assert entry.state is ConfigEntryState.LOADED
    assert PANEL_URL_PATH in hass.data["frontend_panels"]

    # sensors exist, and the chattiest one points at our noisy entity
    coordinator = entry.runtime_data.coordinator
    await coordinator.async_refresh()
    await hass.async_block_till_done()
    ent_reg = er.async_get(hass)
    chatty_1 = ent_reg.async_get_entity_id("sensor", DOMAIN, f"{entry.entry_id}_chatty_1")
    assert chatty_1 is not None
    state = hass.states.get(chatty_1)
    assert state.attributes["top_entity_id"] == "sensor.chatty_power"
    assert int(state.state) == 5
    assert "state_class" not in state.attributes
    size = hass.states.get(ent_reg.async_get_entity_id("sensor", DOMAIN, f"{entry.entry_id}_database_size"))
    assert float(size.state) >= 0

    client = await hass_ws_client(hass)
    for n, (cmd, extra) in enumerate(
        [
            ("info", {}),
            ("overview", {}),
            ("statistics", {}),
            ("states", {"window_hours": 24}),
            ("events", {"window_hours": 1}),
            ("health", {}),
            ("quick_check", {}),
        ],
        start=1,
    ):
        await client.send_json({"id": n, "type": f"{DOMAIN}/{cmd}", **extra})
        msg = await client.receive_json()
        assert msg["success"], (cmd, msg)
        if cmd == "states":
            assert msg["result"]["items"][0]["entity_id"] == "sensor.chatty_power"
        if cmd == "quick_check":
            assert msg["result"]["ok"] is True
        if cmd == "info":
            assert msg["result"]["recorder"]["dialect"] == "sqlite"

    # unload removes the panel
    assert await hass.config_entries.async_unload(entry.entry_id)
    await hass.async_block_till_done()
    assert PANEL_URL_PATH not in hass.data["frontend_panels"]


async def test_ws_requires_admin(recorder_mock, hass: HomeAssistant, hass_ws_client, hass_read_only_access_token) -> None:
    await _setup(hass)
    client = await hass_ws_client(hass, hass_read_only_access_token)
    await client.send_json({"id": 1, "type": f"{DOMAIN}/overview"})
    msg = await client.receive_json()
    assert not msg["success"]
    assert msg["error"]["code"] == "unauthorized"
