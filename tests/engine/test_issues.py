"""Problem detection: own checks, Home Assistant's validate_statistics, SQL dip probe."""

from __future__ import annotations

import sqlite3

from engine import issues

NOW = 1_800_000_000.0
HOUR = 3600

UNIT_RULES = {"energy": {"Wh", "kWh", "MWh"}, "temperature": {"°C", "°F", "K"}}
CLASS_RULES = {"energy": {"total", "total_increasing"}, "temperature": {"measurement"}}


def st(state="1", state_class=None, device_class=None, unit=None, name=None, changed=NOW - 60):
    return {
        "state": state,
        "state_class": state_class,
        "device_class": device_class,
        "unit": unit,
        "name": name,
        "last_changed_ts": changed,
    }


def item(sid, **kw):
    base = {
        "statistic_id": sid,
        "source": "recorder",
        "category": "healthy",
        "has_sum": False,
        "mean_type": 1,
        "refs": [],
        "rows": 10,
        "last_ts": NOW,
        "name": None,
    }
    return {**base, **kw}


def run(states, items, **kw):
    return issues.evaluate(
        states, items, unit_rules=UNIT_RULES, state_class_rules=CLASS_RULES, now=NOW, **kw
    )


def codes(result):
    return sorted((i["code"], i["statistic_id"]) for i in result)


def test_healthy_sensor_has_no_issues() -> None:
    states = {"sensor.t": st("20", "measurement", "temperature", "°C")}
    assert run(states, [item("sensor.t")]) == []


def test_no_statistics_respects_recorder_filter() -> None:
    states = {
        "sensor.new": st("5", "measurement"),
        "sensor.excluded": st("5", "measurement"),
        "sensor.plain": st("5"),
    }
    result = run(states, [], recorded=lambda eid: eid != "sensor.excluded")
    assert codes(result) == [("no_statistics", "sensor.new")]


def test_lts_stalled_reports_reason() -> None:
    states = {
        "sensor.a": st("unavailable", "measurement"),
        "sensor.b": st("7", "measurement"),
        "sensor.c": st("7", None),  # no state_class: HA's state_class_removed covers it
    }
    items = [item(f"sensor.{x}", category="stopped") for x in "abc"]
    result = {i["statistic_id"]: i for i in run(states, items) if i["code"] == "lts_stalled"}
    assert set(result) == {"sensor.a", "sensor.b"}
    assert result["sensor.a"]["data"]["reason"] == "unavailable"
    assert result["sensor.b"]["data"]["reason"] == "ok"


def test_unit_and_state_class_must_fit_device_class() -> None:
    states = {
        "sensor.power": st("3", "measurement", "energy", "W"),
        "sensor.ok": st("3", "total_increasing", "energy", "kWh"),
        "sensor.text": st("on", "measurement", "energy", "W"),  # non numeric: unit not judged
    }
    result = run(states, [item("sensor.power", has_sum=True), item("sensor.ok", has_sum=True)])
    assert ("unit_not_allowed", "sensor.power") in codes(result)
    assert ("state_class_not_allowed", "sensor.power") in codes(result)
    assert not [i for i in result if i["statistic_id"] == "sensor.ok"]
    assert ("unit_not_allowed", "sensor.text") not in codes(result)


def test_meta_mismatch_between_state_class_and_metadata() -> None:
    states = {
        "sensor.meter": st("5", "total_increasing", None, "kWh"),
        "sensor.temp": st("5", "measurement", None, "°C"),
        "sensor.angle": st("5", "measurement", None, "°"),
    }
    items = [
        item("sensor.meter", has_sum=False),  # state_class says "sum", metadata has no sum
        item("sensor.temp", has_sum=True),  # measurement but metadata keeps a sum
        item("sensor.angle", mean_type=0),  # mean expected, metadata says none
    ]
    result = {i["statistic_id"]: i for i in run(states, items) if i["code"] == "meta_mismatch"}
    assert result["sensor.meter"]["data"]["fields"] == ["has_sum"]
    assert result["sensor.temp"]["data"]["fields"] == ["has_sum"]
    assert result["sensor.angle"]["data"]["fields"] == ["mean_type"]


def test_missing_state_class_is_info_for_measurable_numeric_sensors() -> None:
    states = {
        "sensor.temp": st("21", None, "temperature", "°C"),
        "sensor.status": st("ok", None, None, None),
        "sensor.nodevice": st("3", None, None, "pcs"),
    }
    result = run(states, [])
    assert codes(result) == [("missing_state_class", "sensor.temp")]
    assert result[0]["severity"] == "info"


def test_unavailable_important_only_for_referenced_entities_after_an_hour() -> None:
    states = {
        "sensor.used": st("unavailable", None, changed=NOW - 2 * HOUR),
        "sensor.recent": st("unavailable", None, changed=NOW - 60),
        "sensor.unused": st("unavailable", None, changed=NOW - 5 * HOUR),
    }
    items = [
        item("sensor.used", refs=["dashboard:Home"]),
        item("sensor.recent", refs=["dashboard:Home"]),
        item("sensor.unused"),
    ]
    assert codes(run(states, items)) == [("unavailable_important", "sensor.used")]


def test_sum_decrease_is_an_error_in_energy_only() -> None:
    drops = {"count": 2, "first_ts": 1.0, "last_ts": 2.0, "biggest": 5.0}
    items = [item("sensor.e", has_sum=True, refs=["energy"]), item("sensor.g", has_sum=True)]
    result = {i["statistic_id"]: i for i in run({}, items, sum_drops={"sensor.e": drops, "sensor.g": drops})}
    assert result["sensor.e"]["severity"] == "error"
    assert result["sensor.g"]["severity"] == "warning"
    assert result["sensor.e"]["important"] and not result["sensor.g"]["important"]


def test_sum_decreases_query() -> None:
    conn = sqlite3.connect(":memory:")
    conn.execute("CREATE TABLE statistics (id INTEGER PRIMARY KEY, metadata_id INTEGER, start_ts FLOAT, sum FLOAT)")
    series = {
        1: [10, 11, 12, 11.5, 13, 14],  # one dip of 0.5
        2: [1, 2, 3, 4, 5, 6],  # clean
        3: [5, 5.0000001, 5.0000002, 5.0000001, 6, 7],  # float noise only
        4: [100, 101, 3, 4, 100, 5],  # two dips, the biggest is 98
    }
    for mid, values in series.items():
        conn.executemany(
            "INSERT INTO statistics (metadata_id, start_ts, sum) VALUES (?, ?, ?)",
            [(mid, NOW - (len(values) - k) * HOUR, v) for k, v in enumerate(values)],
        )
    # a dip older than the window must not count
    conn.executemany(
        "INSERT INTO statistics (metadata_id, start_ts, sum) VALUES (2, ?, ?)",
        [(NOW - 800 * 86400, 50), (NOW - 799 * 86400, 1)],
    )

    drops = issues.sum_decreases(conn, [1, 2, 3, 4], since_ts=NOW - issues.YEAR)

    assert set(drops) == {1, 4}
    assert drops[1]["count"] == 1 and round(drops[1]["biggest"], 3) == 0.5
    assert drops[4]["count"] == 2 and drops[4]["biggest"] == 98


def test_from_validation_marks_open_repairs_and_merge_sorts_important_first() -> None:
    validation = {
        "sensor.lqi": [{"type": "units_changed", "data": {"statistic_id": "sensor.lqi", "state_unit": "lqi"}}],
        "sensor.gone": [{"type": "no_state", "data": {"statistic_id": "sensor.gone"}}],
    }
    ha = issues.from_validation(validation, repairs=["units_changed_sensor.lqi"])
    assert {i["id"]: i["in_repairs"] for i in ha} == {
        "ha:units_changed:sensor.lqi": True,
        "ha:no_state:sensor.gone": False,
    }

    items = [item("sensor.lqi"), item("sensor.gone", refs=["energy"], name="Gone")]
    merged = issues.merge(ha, items)
    assert [i["statistic_id"] for i in merged["issues"]] == ["sensor.gone", "sensor.lqi"]
    assert merged["issues"][0]["name"] == "Gone"
    assert merged["important"] == 1
    assert merged["problems"] == 1  # no_state is info, units_changed is a warning
    assert {c["key"] for c in merged["codes"]} == {"units_changed", "no_state"}


def test_issue_data_carries_what_the_fix_guides_need() -> None:
    states = {
        "sensor.e": st("5", "measurement", "energy", "J"),  # unit not allowed, state class not allowed
        "sensor.t": st("20", None, "temperature", "°C"),  # missing state_class
    }
    res = {(i["code"], i["statistic_id"]): i for i in run(states, [item("sensor.e"), item("sensor.t")])}
    assert res[("unit_not_allowed", "sensor.e")]["data"]["allowed"] == ["MWh", "Wh", "kWh"]
    assert res[("state_class_not_allowed", "sensor.e")]["data"]["allowed"] == ["total", "total_increasing"]
    assert res[("missing_state_class", "sensor.t")]["data"]["allowed"] == ["measurement"]


def test_merge_attaches_size_inputs_and_current_attributes() -> None:
    found = [{"id": "own:x:sensor.e", "statistic_id": "sensor.e", "code": "x", "severity": "warning",
              "source": "own", "name": None, "important": False, "refs": [], "data": {}}]
    items = [item("sensor.e", verdict="review", integration="template", registered=True, unit="kWh", rows=480, first_ts=1.0)]
    attrs = {"sensor.e": {"state_class": None, "device_class": "energy", "unit": "kWh"}}
    out = issues.merge(found, items, None, attrs)["issues"][0]
    assert out["rows"] == 480 and out["verdict"] == "review" and out["integration"] == "template"
    assert out["registered"] is True and out["stat_source"] == "recorder" and out["source"] == "own"
    assert out["entity"] == {"state_class": None, "device_class": "energy", "unit": "kWh"}
    assert out["first_ts"] == 1.0 and out["unit"] == "kWh"
