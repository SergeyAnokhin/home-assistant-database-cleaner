"""Cleanup verdicts and reasons."""

from __future__ import annotations

import pytest
from engine import Analyzer, Context, EntityInfo
from engine.candidates import assess, entity_tokens

from .synthetic import NOW, build


def _item(**kw):
    base = {"statistic_id": "sensor.x", "category": "healthy", "rows": 1000, "unit": "W",
            "integration": "zha", "diagnostic": False}
    return {**base, **kw}


def test_entity_tokens_nested():
    obj = {"a": ["{{ states('sensor.one') }}", {"b": "sensor.two"}], "c": ("light.k", 3), "d": "no tokens"}
    assert entity_tokens(obj) == {"sensor.one", "sensor.two", "light.k"}


@pytest.mark.parametrize(
    ("item", "refs", "verdict"),
    [
        (_item(category="orphan"), ["energy"], "protected"),  # energy always wins
        (_item(), ["dashboard:Home"], "used"),
        (_item(category="disabled"), ["helper:utility_meter:Daily"], "used"),
        (_item(category="orphan"), [], "safe"),
        (_item(category="excluded"), [], "safe"),
        (_item(category="no_states"), [], "safe"),
        (_item(category="stopped"), [], "review"),
        (_item(category="no_registry"), [], "review"),
        (_item(category="external"), [], "review"),
        (_item(), [], "unused"),
        (_item(), ["automation:automation.lights"], "used"),
    ],
)
def test_verdicts(item, refs, verdict):
    assert assess(item, refs)[0] == verdict


def test_reasons():
    _, reasons = assess(
        _item(statistic_id="sensor.input_number_test", integration="utility_meter", unit="dBm",
              diagnostic=True, rows=10, category="stopped"),
        [],
    )
    assert reasons == ["stopped", "diagnostic", "derived", "low_value_unit", "test_name", "tiny"]
    assert "cloud_weather" in assess(_item(integration="openweathermap"), [])[1]
    assert assess(_item(), [])[1] == []


def test_statistics_with_usage(tmp_path):
    db = str(build(tmp_path / "db.sqlite"))
    ctx = Context(
        entities={
            "sensor.healthy_temp": EntityInfo("sensor.healthy_temp", integration="zha"),
            "sensor.no_states_power": EntityInfo("sensor.no_states_power", integration="zha"),
            "sensor.stopped_signal": EntityInfo("sensor.stopped_signal", integration="esphome"),
            "sensor.disabled_power": EntityInfo("sensor.disabled_power", disabled=True),
            "sensor.quiet_hum": EntityInfo("sensor.quiet_hum"),
        },
        usage={"sensor.no_states_power": ["energy"], "sensor.stopped_signal": ["dashboard:Home"]},
        usage_sources={"energy": 1},
    )
    res = Analyzer(db, clock=lambda: NOW).statistics(ctx, [30])
    by_id = {i["statistic_id"]: i for i in res["items"]}
    assert by_id["sensor.no_states_power"]["verdict"] == "protected"
    assert by_id["sensor.stopped_signal"]["verdict"] == "used"
    assert by_id["sensor.stopped_signal"]["refs"] == ["dashboard:Home"]
    assert by_id["sensor.gone_forever"]["verdict"] == "safe"
    assert by_id["sensor.healthy_temp"]["verdict"] == "unused"
    assert by_id["sensor.yaml_mean"]["verdict"] == "review"
    verdicts = {v["key"]: v["count"] for v in res["cleanup"]["verdicts"]}
    assert verdicts == {"safe": 3, "unused": 1, "review": 2, "used": 1, "protected": 1}
    assert res["cleanup"]["sources"] == {"energy": 1}


def test_no_usage_means_no_verdicts(tmp_path):
    db = str(build(tmp_path / "db.sqlite"))
    res = Analyzer(db, clock=lambda: NOW).statistics(Context(), [30])
    assert res["cleanup"] is None
    assert "verdict" not in res["items"][0]
