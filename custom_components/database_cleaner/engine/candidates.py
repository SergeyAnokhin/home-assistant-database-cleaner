"""Cleanup verdicts for long-term statistics: category + where the statistic is used.

Verdicts (first match wins):
  protected  referenced by the Energy dashboard -> never offered for deletion
  used       referenced by a dashboard, automation, script, scene, group, person or helper
  safe       entity gone / disabled / excluded / without states, and referenced nowhere
  review     LTS stopped, entity without registry entry, or external statistic
  unused     entity alive and recorded, but referenced nowhere we can see

Reasons are extra hints shown next to the verdict (diagnostic, derived, ...).
"""

from __future__ import annotations

import re
from collections.abc import Iterable, Mapping

VERDICTS = ["safe", "unused", "review", "used", "protected"]
USE_KINDS = {"dashboard", "automation", "script", "scene", "group", "person", "helper"}
SAFE_CATEGORIES = {"orphan", "excluded", "disabled", "no_states"}
REVIEW_CATEGORIES = {"stopped", "no_registry", "external"}

# Helpers whose statistics duplicate information already kept for their source.
DERIVED_INTEGRATIONS = {
    "utility_meter",
    "derivative",
    "integration",
    "statistics",
    "min_max",
    "filter",
    "history_stats",
    "trend",
    "threshold",
}
# Cloud weather / forecast services: years of hourly history rarely matter.
CLOUD_WEATHER = {
    "accuweather",
    "aemet",
    "buienradar",
    "environment_canada",
    "google_weather",
    "ipma",
    "met",
    "met_eireann",
    "meteo_france",
    "nws",
    "openuv",
    "openweathermap",
    "pirateweather",
    "smhi",
    "tomorrowio",
    "weatherflow_cloud",
}
# Units of service metrics (signal, link quality, storage, throughput, uptime).
LOW_VALUE_UNITS = {
    "dB",
    "dBm",
    "lqi",
    "B",
    "kB",
    "KiB",
    "MB",
    "MiB",
    "GB",
    "GiB",
    "TB",
    "TiB",
    "kB/s",
    "KiB/s",
    "MB/s",
    "MiB/s",
    "kbit/s",
    "Mbit/s",
}
TEST_NAME = re.compile(r"(^|[._])(test|tmp|debug|dummy|demo)([._]|$)")
TINY_ROWS = 48  # fewer than two days of hourly rows

ENTITY_ID = re.compile(r"\b([a-z0-9_]+\.[a-z0-9_]+)\b")


def entity_tokens(obj: object) -> set[str]:
    """All entity-id-looking tokens in any nested str/dict/list structure."""
    found: set[str] = set()
    stack = [obj]
    while stack:
        cur = stack.pop()
        if isinstance(cur, str):
            found.update(ENTITY_ID.findall(cur))
        elif isinstance(cur, Mapping):
            stack.extend(cur.values())
        elif isinstance(cur, (list, tuple, set)):
            stack.extend(cur)
    return found


def ref_kinds(refs: Iterable[str]) -> set[str]:
    return {r.split(":", 1)[0] for r in refs}


def assess(item: Mapping, refs: Iterable[str]) -> tuple[str, list[str]]:
    kinds = ref_kinds(refs)
    category = item["category"]
    if "energy" in kinds:
        verdict = "protected"
    elif kinds & USE_KINDS:
        verdict = "used"
    elif category in SAFE_CATEGORIES:
        verdict = "safe"
    elif category in REVIEW_CATEGORIES:
        verdict = "review"
    else:
        verdict = "unused"

    reasons: list[str] = []
    if category != "healthy":
        reasons.append(category)
    if item.get("diagnostic"):
        reasons.append("diagnostic")
    integration = item.get("integration") or ""
    if integration in DERIVED_INTEGRATIONS:
        reasons.append("derived")
    if integration in CLOUD_WEATHER:
        reasons.append("cloud_weather")
    if item.get("unit") in LOW_VALUE_UNITS:
        reasons.append("low_value_unit")
    if TEST_NAME.search(item["statistic_id"]):
        reasons.append("test_name")
    if item.get("rows", 0) < TINY_ROWS:
        reasons.append("tiny")
    return verdict, reasons


def summarize(items: list[dict], row_bytes: float) -> dict:
    verdicts = {v: {"key": v, "count": 0, "rows": 0} for v in VERDICTS}
    reasons: dict[str, dict] = {}
    for item in items:
        v = verdicts[item["verdict"]]
        v["count"] += 1
        v["rows"] += item["rows"]
        if item["verdict"] in ("protected", "used"):
            continue
        for r in item["reasons"]:
            agg = reasons.setdefault(r, {"key": r, "count": 0, "rows": 0})
            agg["count"] += 1
            agg["rows"] += item["rows"]
    for agg in (*verdicts.values(), *reasons.values()):
        agg["bytes"] = round(agg["rows"] * row_bytes)
    return {
        "verdicts": list(verdicts.values()),
        "reasons": sorted(reasons.values(), key=lambda r: -r["rows"]),
    }
