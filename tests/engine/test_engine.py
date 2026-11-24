"""Engine tests on a small synthetic recorder database."""

from __future__ import annotations

import sqlite3

import pytest
from engine import Analyzer, Context, EntityInfo
from engine.db import open_ro, sqlite_path_from_url

from .synthetic import NOW, build


@pytest.fixture
def db(tmp_path):
    return str(build(tmp_path / "home-assistant_v2.db"))


@pytest.fixture
def ctx():
    ents = {
        "sensor.healthy_temp": EntityInfo("sensor.healthy_temp", "Temp", "zha", "d1", "Kitchen sensor", "Kitchen"),
        "sensor.disabled_power": EntityInfo("sensor.disabled_power", integration="tasmota", disabled=True),
        "sensor.stopped_signal": EntityInfo(
            "sensor.stopped_signal", integration="esphome", device_id="d2", device_name="ESP", entity_category="diagnostic"
        ),
        "sensor.quiet_hum": EntityInfo("sensor.quiet_hum", integration="ble_monitor"),
        "sensor.no_states_power": EntityInfo("sensor.no_states_power", integration="zha", device_id="d1",
                                             device_name="Kitchen sensor"),
        "sensor.yaml_mean": EntityInfo("sensor.yaml_mean", "Mean", registered=False),
    }
    return Context(entities=ents, is_recorded=lambda e: not e.endswith("_hum"))


@pytest.fixture
def analyzer(db):
    return Analyzer(db, clock=lambda: NOW)


def test_sqlite_path_from_url():
    assert sqlite_path_from_url("sqlite:////config/home-assistant_v2.db") == "/config/home-assistant_v2.db"
    assert sqlite_path_from_url("sqlite:////config/x.db?timeout=5") == "/config/x.db"
    assert sqlite_path_from_url("mysql://u:p@host/db") is None
    assert sqlite_path_from_url("sqlite://") is None
    assert sqlite_path_from_url(None) is None


def test_connection_is_read_only(db):
    conn = open_ro(db)
    with pytest.raises(sqlite3.OperationalError):
        conn.execute("DELETE FROM states")
    conn.close()


def test_overview(analyzer):
    ov = analyzer.overview()
    keys = [g["key"] for g in ov["groups"]]
    assert keys[:4] == ["lts", "states", "short_term", "events"]
    lts = next(g for g in ov["groups"] if g["key"] == "lts")
    assert lts["rows"] == 24 * (400 + 100 + 50 + 10 + 20 + 3 + 2 + 1)
    assert ov["schema_version"] == 53
    assert ov["file"]["size"] > 0
    assert ov["cached"] is False
    assert analyzer.overview()["cached"] is True
    if ov["dbstat"]:
        assert lts["bytes"] > 0


def test_statistics_categories(analyzer, ctx):
    res = analyzer.statistics(ctx, [30, 365])
    by_id = {i["statistic_id"]: i for i in res["items"]}
    assert {sid: i["category"] for sid, i in by_id.items()} == {
        "sensor.healthy_temp": "healthy",
        "sensor.gone_forever": "orphan",
        "sensor.disabled_power": "disabled",
        "sensor.yaml_mean": "no_registry",
        "sensor.stopped_signal": "stopped",
        "sensor.quiet_hum": "excluded",
        "sensor.no_states_power": "no_states",
        "ext:imported_gas": "external",
    }
    healthy = by_id["sensor.healthy_temp"]
    assert healthy["rows"] == 24 * 400
    assert healthy["rows_by_period"] == {"30": 720, "365": 365 * 24}
    assert healthy["short_term_rows"] == 12
    assert healthy["device"] == "Kitchen sensor" and healthy["area"] == "Kitchen"
    assert by_id["sensor.gone_forever"]["rows_by_period"]["30"] == 0
    assert by_id["sensor.stopped_signal"]["diagnostic"] is True
    cats = {c["key"]: c for c in res["categories"]}
    assert cats["orphan"]["count"] == 1 and cats["orphan"]["rows"] == 2400
    assert cats["orphan"]["bytes"] == round(2400 * res["row_bytes"])
    assert res["diagnostic"] == {"count": 1, "rows": 480, "bytes": round(480 * res["row_bytes"])}
    assert res["items"][0]["statistic_id"] == "sensor.healthy_temp"  # sorted by rows


def test_statistics_cache_and_refresh(analyzer, ctx):
    assert analyzer.statistics(ctx, [30])["cached"] is False
    assert analyzer.statistics(ctx, [30])["cached"] is True
    assert analyzer.statistics(ctx, [90])["cached"] is False  # other periods -> new scan
    assert analyzer.statistics(ctx, [90], refresh=True)["cached"] is False
    assert analyzer.statistics_rows_by_id()["sensor.healthy_temp"] == 9600


def test_states_window(analyzer, ctx):
    res = analyzer.states(ctx, 24 * 3600)
    rows = {i["entity_id"]: i for i in res["items"]}
    assert rows["sensor.healthy_temp"]["rows"] == 120
    assert rows["sensor.yaml_mean"]["rows"] == 25
    assert rows["binary_sensor.door"]["rows"] == 4
    assert rows["binary_sensor.door"]["unavailable"] == 1
    assert res["total_rows"] == 120 + 25 + 4 + 4
    assert res["truncated"] is False
    assert rows["sensor.healthy_temp"]["per_hour"] == 5.0  # 120 rows / 24 h
    assert res["items"][0]["entity_id"] == "sensor.healthy_temp"


def test_states_window_longer_than_data(analyzer, ctx):
    res = analyzer.states(ctx, 7 * 86400)
    assert res["truncated"] is True
    assert res["effective_hours"] == 29.0
    assert res["total_rows"] == 120 + 30 + 4 + 5


def test_events(analyzer):
    res = analyzer.events(3600)
    assert res["items"] == [{"event_type": "telegram_sent", "rows": 20}, {"event_type": "state_changed", "rows": 10}]


def test_chatty(analyzer, ctx):
    res = analyzer.chatty(ctx, 2)
    assert [t["entity_id"] for t in res["top"]] == ["sensor.healthy_temp", "sensor.yaml_mean"]
    first, second = res["top"]
    assert (first["count_1h"], first["count_24h"], first["count_window"]) == (61, 120, 120)
    assert (second["count_1h"], second["count_24h"], second["count_window"]) == (2, 25, 30)
    assert first["share_of_all_24h"] == round(100 * 120 / 153, 1)
    assert first["per_hour_24h"] == 5.0
    assert first["lts_rows"] is None  # statistics not computed yet -> never forced
    analyzer.statistics(ctx, [30])
    assert analyzer.chatty(ctx, 1)["top"][0]["lts_rows"] == 9600


def test_health(analyzer):
    h = analyzer.health()
    cur = h["current"]
    assert (cur["states_1m"], cur["states_5m"], cur["states_60m"]) == (10, 14, 70)
    assert cur["events_60m"] == 30
    assert cur["lts_age_s"] == 3600
    assert cur["short_term_age_s"] == 300
    assert h["recorder_runs"]["closed_incorrect"] == 1
    assert len(analyzer.health()["history"]) == 2
    assert len(analyzer.health(run_probe=False)["history"]) == 2


def test_quick_check(analyzer):
    res = analyzer.quick_check()
    assert res["ok"] is True
    assert res["quick_check"] == ["ok"]
