"""Phases 3-4 end to end in a real (test) Home Assistant: backup, delete, energy guard, restore, repack."""

from __future__ import annotations

import os
from datetime import timedelta

import pytest
from homeassistant.components.energy.data import async_get_manager
from homeassistant.components.recorder.models import StatisticMeanType
from homeassistant.components.recorder.statistics import async_import_statistics
from homeassistant.core import HomeAssistant
from homeassistant.setup import async_setup_component
from homeassistant.util import dt as dt_util
from pytest_homeassistant_custom_component.common import MockConfigEntry
from pytest_homeassistant_custom_component.components.recorder.common import async_wait_recording_done

from custom_components.database_cleaner.const import DEFAULT_OPTIONS, DOMAIN
from custom_components.database_cleaner.engine.db import connect

HOURS = 50


def _import(hass: HomeAssistant, statistic_id: str, *, energy: bool = False) -> None:
    start = dt_util.utcnow().replace(minute=0, second=0, microsecond=0) - timedelta(hours=HOURS + 2)
    if energy:
        meta = {"has_mean": False, "mean_type": StatisticMeanType.NONE, "has_sum": True, "name": None,
                "source": "recorder", "statistic_id": statistic_id, "unit_class": "energy",
                "unit_of_measurement": "kWh"}
        stats = [{"start": start + timedelta(hours=i), "state": float(i), "sum": float(i)} for i in range(HOURS)]
    else:
        meta = {"has_mean": True, "mean_type": StatisticMeanType.ARITHMETIC, "has_sum": False, "name": None,
                "source": "recorder", "statistic_id": statistic_id, "unit_class": None,
                "unit_of_measurement": "W"}
        stats = [{"start": start + timedelta(hours=i), "mean": i + 0.5, "min": float(i), "max": i + 1.0}
                 for i in range(HOURS)]
    async_import_statistics(hass, meta, stats)


def _rows(db_path: str, statistic_id: str) -> int:
    with connect(db_path) as conn:
        return conn.execute(
            "SELECT COUNT(s.id) FROM statistics s JOIN statistics_meta m ON m.id = s.metadata_id "
            "WHERE m.statistic_id = ?",
            (statistic_id,),
        ).fetchone()[0]


def _meta_exists(db_path: str, statistic_id: str) -> bool:
    with connect(db_path) as conn:
        return conn.execute("SELECT 1 FROM statistics_meta WHERE statistic_id = ?", (statistic_id,)).fetchone() is not None


@pytest.fixture
async def setup(recorder_mock, hass: HomeAssistant, tmp_path):
    for sid in ("sensor.junk_a", "sensor.junk_b"):
        _import(hass, sid)
    _import(hass, "sensor.energy_meter", energy=True)
    await async_wait_recording_done(hass)

    assert await async_setup_component(hass, "energy", {})
    manager = await async_get_manager(hass)
    await manager.async_update({"device_consumption": [{"stat_consumption": "sensor.energy_meter"}]})

    backup_dir = str(tmp_path / "bk")
    entry = MockConfigEntry(
        domain=DOMAIN, data={}, options={**DEFAULT_OPTIONS, "backup_dir": backup_dir, "batch_pause_s": 0}
    )
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    return entry, backup_dir


async def _job(client, n: int, **payload) -> dict:
    await client.send_json({"id": n, "type": f"{DOMAIN}/job/start", **payload})
    return await client.receive_json()


async def test_delete_restore_repack_cycle(setup, hass: HomeAssistant, hass_ws_client) -> None:
    entry, backup_dir = setup
    data = entry.runtime_data
    db = data.analyzer.db_path
    assert _rows(db, "sensor.junk_a") == HOURS
    client = await hass_ws_client(hass)

    # destructive jobs need an explicit confirmation
    msg = await _job(client, 1, kind="delete", statistic_ids=["sensor.junk_a"])
    assert msg["error"]["code"] == "not_confirmed"

    # preflight is all green on a healthy database
    await client.send_json({"id": 2, "type": f"{DOMAIN}/preflight", "kind": "delete", "repack": True})
    pre = (await client.receive_json())["result"]
    assert pre["ok"], pre["checks"]
    assert {c["key"] for c in pre["checks"]} >= {"ha_running", "schema", "backlog", "backup_space", "integrity"}

    # --- delete two junk statistics
    msg = await _job(client, 3, kind="delete", statistic_ids=["sensor.junk_a", "sensor.junk_b"], confirm=True)
    assert msg["success"], msg
    await data.jobs.async_wait()
    job = data.jobs.snapshot()["history"][0]
    assert job["status"] == "done", job
    res = job["result"]
    assert (res["deleted"], res["deleted_rows"], res["remaining_rows"]) == (2, 2 * HOURS, 0)
    assert not _meta_exists(db, "sensor.junk_a") and _rows(db, "sensor.junk_b") == 0  # cascade removed the rows
    assert _rows(db, "sensor.energy_meter") == HOURS  # untouched
    assert os.path.exists(os.path.join(backup_dir, res["backup"]))
    assert os.path.exists(os.path.join(backup_dir, "undo", res["archive"]))

    # --- energy statistics are refused, even if the browser asks
    msg = await _job(client, 4, kind="delete", statistic_ids=["sensor.energy_meter"], confirm=True)
    assert msg["success"]
    await data.jobs.async_wait()
    job = data.jobs.snapshot()["history"][0]
    assert job["status"] == "failed" and "Energy" in job["error"]
    assert _rows(db, "sensor.energy_meter") == HOURS

    # --- undo: restore one statistic from the archive, on the fly
    msg = await _job(client, 5, kind="restore", archive=res["archive"], statistic_ids=["sensor.junk_a"], confirm=True)
    assert msg["success"], msg
    await data.jobs.async_wait()
    job = data.jobs.snapshot()["history"][0]
    assert job["status"] == "done", job
    assert job["result"]["restored"] == 1 and job["result"]["rows"] == HOURS
    # committed by the job itself: no extra recorder wait here
    assert _rows(db, "sensor.junk_a") == HOURS
    assert not _meta_exists(db, "sensor.junk_b")
    with connect(db) as conn:
        means = [r[0] for r in conn.execute(
            "SELECT s.mean FROM statistics s JOIN statistics_meta m ON m.id = s.metadata_id "
            "WHERE m.statistic_id = 'sensor.junk_a' ORDER BY s.start_ts LIMIT 3")]
        mean_type = conn.execute(
            "SELECT mean_type FROM statistics_meta WHERE statistic_id = 'sensor.junk_a'").fetchone()[0]
    assert means == [0.5, 1.5, 2.5]
    assert mean_type == StatisticMeanType.ARITHMETIC.value

    # --- repack (VACUUM through recorder.purge) uses the fresh backup
    msg = await _job(client, 6, kind="repack", confirm=True)
    assert msg["success"], msg
    await data.jobs.async_wait()
    job = data.jobs.snapshot()["history"][0]
    assert job["status"] == "done", job
    assert job["result"]["backup"] == res["backup"]
    with connect(db) as conn:
        assert conn.execute("PRAGMA freelist_count").fetchone()[0] == 0

    # --- maintenance state lists the backup and the archive
    await client.send_json({"id": 7, "type": f"{DOMAIN}/maintenance"})
    state = (await client.receive_json())["result"]
    assert [b["name"] for b in state["backups"]] == [res["backup"]]
    assert state["archives"][0]["name"] == res["archive"]
    assert state["fresh_backup"] == res["backup"]
    assert [j["kind"] for j in state["jobs"]["history"][:4]] == ["repack", "restore", "delete", "delete"]

    # --- delete the backup (needs confirmation, refuses foreign names)
    await client.send_json({"id": 8, "type": f"{DOMAIN}/backup/delete", "name": "../secrets.db", "confirm": True})
    assert (await client.receive_json())["error"]["code"] == "invalid"
    await client.send_json({"id": 9, "type": f"{DOMAIN}/backup/delete", "name": res["backup"], "confirm": True})
    assert (await client.receive_json())["success"]
    assert not os.path.exists(os.path.join(backup_dir, res["backup"]))


async def test_one_job_at_a_time_and_cancel(setup, hass: HomeAssistant, hass_ws_client) -> None:
    entry, _ = setup
    data = entry.runtime_data
    client = await hass_ws_client(hass)
    first = await _job(client, 1, kind="backup")
    second = await _job(client, 2, kind="backup")
    assert first["success"]
    assert second["error"]["code"] == "busy"
    await data.jobs.async_wait()
    assert data.jobs.snapshot()["history"][0]["status"] == "done"

    # cancellation is honoured between steps
    msg = await _job(client, 3, kind="delete", statistic_ids=["sensor.junk_a"], confirm=True)
    assert msg["success"]
    await client.send_json({"id": 4, "type": f"{DOMAIN}/job/cancel"})
    assert (await client.receive_json())["result"]["cancelling"] is True
    await data.jobs.async_wait()
    assert data.jobs.snapshot()["history"][0]["status"] == "cancelled"
    assert _rows(data.analyzer.db_path, "sensor.junk_a") == HOURS


async def test_interrupted_job_is_marked_on_restart(setup, hass: HomeAssistant) -> None:
    entry, _ = setup
    jobs = entry.runtime_data.jobs
    jobs.history.insert(0, {"id": "x", "kind": "delete", "status": "running"})
    await jobs._async_save()  # noqa: SLF001
    await jobs.async_load()
    assert jobs.history[0]["status"] == "interrupted"
