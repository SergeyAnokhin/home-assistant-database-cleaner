"""Reference numbers from docs/implementation-plan.md, checked on the private DB copy.

Skipped automatically when ``gitignore/home-assistant_v2.db`` is absent.
"""

from __future__ import annotations

import pytest
from engine import Analyzer
from engine.db import connect

from dev.storage_context import load_context

from .conftest import REAL_DB, REAL_DIR

pytestmark = pytest.mark.skipif(not REAL_DB.exists(), reason="private database copy not present")


@pytest.fixture(scope="module")
def setup():
    with connect(str(REAL_DB), immutable=True) as conn:
        max_ts = conn.execute("SELECT MAX(last_updated_ts) FROM states").fetchone()[0]
    analyzer = Analyzer(str(REAL_DB), immutable=True, clock=lambda: max_ts + 1)
    return analyzer


def test_statistics_matches_plan(setup):
    ctx = load_context(REAL_DIR / ".storage")
    res = setup.statistics(ctx, [30, 365])
    cats = {c["key"]: (c["count"], c["rows"]) for c in res["categories"]}
    assert res["total_rows"] == 13_516_103
    assert cats == {
        "external": (6, 6_228),
        "excluded": (0, 0),
        "orphan": (587, 1_497_836),
        "no_registry": (41, 910_469),
        "disabled": (219, 696_091),
        "no_states": (65, 49_910),
        "stopped": (162, 610_183),
        "healthy": (659, 9_745_386),
    }
    assert (res["diagnostic"]["count"], res["diagnostic"]["rows"]) == (316, 2_620_330)


def test_recorder_exclude_matches_plan(setup):
    ctx = load_context(REAL_DIR / ".storage", REAL_DIR / "recorder_exclude.json")
    if ctx.is_recorded is None:
        pytest.skip("recorder_exclude.json not present")
    res = setup.statistics(ctx, [30, 365])
    excluded = next(c for c in res["categories"] if c["key"] == "excluded")
    assert (excluded["count"], excluded["rows"]) == (169, 139_676)


def test_states_top_24h(setup):
    ctx = load_context(REAL_DIR / ".storage")
    res = setup.states(ctx, 86400)
    assert res["items"][0]["entity_id"] == "sensor.tasmota_pve1_power"
    assert res["items"][0]["rows"] == 16_379
    top = setup.chatty(ctx, 5)["top"]
    assert top[0]["entity_id"] == "sensor.tasmota_pve1_power"
    assert top[0]["count_window"] == 21_830
