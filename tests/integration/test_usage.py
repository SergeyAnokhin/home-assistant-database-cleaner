"""Usage scan inside a real (test) Home Assistant."""

from __future__ import annotations

from pathlib import Path

from homeassistant.components.energy.data import async_get_manager
from homeassistant.components.lovelace.const import LOVELACE_DATA
from homeassistant.core import HomeAssistant
from homeassistant.setup import async_setup_component
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.database_cleaner.usage import async_collect_usage


async def test_collect_usage_all_sources(recorder_mock, hass: HomeAssistant) -> None:
    for eid in ("sensor.power", "sensor.fridge_energy", "sensor.lux", "sensor.source", "sensor.lonely"):
        hass.states.async_set(eid, "1")

    assert await async_setup_component(
        hass,
        "automation",
        {
            "automation": {
                "alias": "Lights",
                "triggers": {"trigger": "state", "entity_id": "sensor.power"},
                "actions": [],
            }
        },
    )
    # entity only inside a template: the core search helpers miss it, raw_config scan finds it
    assert await async_setup_component(
        hass, "script", {"script": {"notify_lux": {"sequence": [{"wait_template": "{{ is_state('sensor.lux', '1') }}"}]}}}
    )

    assert await async_setup_component(hass, "energy", {})
    manager = await async_get_manager(hass)
    await manager.async_update({"device_consumption": [{"stat_consumption": "sensor.fridge_energy"}]})

    assert await async_setup_component(hass, "lovelace", {})
    await hass.data[LOVELACE_DATA].dashboards[None].async_save(
        {"views": [{"cards": [{"type": "history-graph", "entities": ["sensor.lux"]}]}]}
    )

    MockConfigEntry(domain="utility_meter", title="Daily", options={"source": "sensor.source"}).add_to_hass(hass)
    await hass.async_block_till_done()

    refs, sources = await async_collect_usage(
        hass, ["sensor.power", "sensor.fridge_energy", "sensor.lux", "sensor.source", "sensor.lonely", "ext:gas"]
    )

    assert refs["sensor.power"] == ["automation:automation.lights"]
    assert refs["sensor.fridge_energy"] == ["energy"]
    assert refs["sensor.lux"] == ["dashboard:Overview", "script:script.notify_lux"]
    assert refs["sensor.source"] == ["helper:utility_meter:Daily"]
    assert "sensor.lonely" not in refs
    assert sources["errors"] == []
    assert sources["energy"] == 1
    assert sources["dashboards"] == 1
    assert sources["automations"] == 1


async def test_collect_usage_yaml_files(recorder_mock, hass: HomeAssistant, tmp_path: Path) -> None:
    hass.config.config_dir = str(tmp_path)  # the shared testing_config folder has files of its own
    config_dir = tmp_path
    (config_dir / "packages").mkdir()
    (config_dir / "packages" / "a.yaml").write_text(
        "template:\n  - sensor:\n      - name: x\n        state: \"{{ states('sensor.a') }}\"\n"
        "# sensor.commented_line\n"
        "other: 1  # sensor.trailing_comment\n",
        encoding="utf-8",
    )
    (config_dir / "secrets.yaml").write_text("token: sensor.secret_one\n", encoding="utf-8")
    (config_dir / "custom_components").mkdir()
    (config_dir / "custom_components" / "skip.yaml").write_text("x: sensor.skipped\n", encoding="utf-8")

    refs, sources = await async_collect_usage(
        hass, ["sensor.a", "sensor.commented_line", "sensor.trailing_comment", "sensor.secret_one", "sensor.skipped"]
    )

    assert refs == {"sensor.a": ["yaml:packages/a.yaml:4"]}
    assert sources["yaml_files"] == 1
    assert sources["errors"] == []
