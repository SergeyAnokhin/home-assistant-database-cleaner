"""Problems with entities and their long-term statistics (read-only, no Home Assistant imports).

Two families, merged into one list by ``merge``:

* ``ha``  - what Home Assistant itself reports (``validate_statistics``: units_changed,
  state_class_removed, mean_type_changed, entity_no_longer_recorded, entity_not_recorded, no_state);
* ``own`` - checks of this integration (``evaluate``), made from a snapshot of the sensor
  states, the long-term statistics summary and a few SQL probes.

Every issue is ``{id, statistic_id, code, severity, source, important, refs, data, ...}``.
``important`` means the entity is referenced somewhere (Energy, dashboard, automation, YAML...):
a problem there deserves attention first.
"""

from __future__ import annotations

import sqlite3
from collections.abc import Callable, Iterable, Mapping, Sequence
from typing import Any

HOUR = 3600
YEAR = 365 * 86400
# A sum that goes down by less than this is float noise, not a real dip.
SUM_DROP_TOLERANCE = 1e-3
UNAVAILABLE_AFTER_S = HOUR
UNAVAILABLE_STATES = ("unavailable", "unknown")
NOT_NUMERIC = (*UNAVAILABLE_STATES, "none", "")

SEVERITY_ORDER = {"error": 0, "warning": 1, "info": 2}
# Codes reported by Home Assistant (value: severity).
HA_CODES = {
    "units_changed": "warning",
    "state_class_removed": "warning",
    "mean_type_changed": "warning",
    "entity_no_longer_recorded": "warning",
    "entity_not_recorded": "info",
    "no_state": "info",
}
OWN_CODES = (
    "no_statistics",
    "lts_stalled",
    "unit_not_allowed",
    "state_class_not_allowed",
    "meta_mismatch",
    "sum_decrease",
    "missing_state_class",
    "unavailable_important",
)
ALL_CODES = (*HA_CODES, *OWN_CODES)
SUM_CLASSES = {"total", "total_increasing"}
MEAN_CLASSES = {"measurement", "measurement_angle"}


def is_numeric(value: Any) -> bool:
    if value is None or str(value).strip().lower() in NOT_NUMERIC:
        return False
    try:
        float(value)
    except (TypeError, ValueError):
        return False
    return True


def sum_decreases(conn: sqlite3.Connection, metadata_ids: Sequence[int], *, since_ts: float) -> dict[int, dict]:
    """Per metadata_id: how often the cumulative ``sum`` went *down* since ``since_ts``.

    For ``total_increasing`` meters a drop is a data error (Energy then shows a negative
    consumption for that hour). Needs SQLite >= 3.25 (window functions).
    """
    out: dict[int, dict] = {}
    ids = sorted(set(metadata_ids))
    for i in range(0, len(ids), 400):
        chunk = ids[i : i + 400]
        marks = ",".join("?" * len(chunk))
        rows = conn.execute(
            "SELECT metadata_id, COUNT(*), MIN(start_ts), MAX(start_ts), MAX(dip) FROM ("
            " SELECT metadata_id, start_ts,"
            "  LAG(sum) OVER (PARTITION BY metadata_id ORDER BY start_ts) - sum AS dip"
            f" FROM statistics WHERE metadata_id IN ({marks}) AND start_ts >= ? AND sum IS NOT NULL"
            ") WHERE dip > ? GROUP BY metadata_id",
            [*chunk, since_ts, SUM_DROP_TOLERANCE],
        ).fetchall()
        for mid, count, first, last, biggest in rows:
            out[mid] = {"count": count, "first_ts": first, "last_ts": last, "biggest": biggest}
    return out


def _issue(code: str, sid: str, severity: str, data: dict, item: Mapping | None, state: Mapping | None) -> dict:
    refs = list(item.get("refs") or []) if item else []
    name = (state or {}).get("name") or (item or {}).get("name")
    return {
        "id": f"own:{code}:{sid}",
        "statistic_id": sid,
        "code": code,
        "severity": severity,
        "source": "own",
        "name": name,
        "important": bool(refs),
        "refs": refs,
        "data": data,
    }


def evaluate(
    states: Mapping[str, Mapping],
    items: Iterable[Mapping],
    *,
    unit_rules: Mapping[str, set],
    state_class_rules: Mapping[str, set],
    sum_drops: Mapping[str, Mapping] | None = None,
    recorded: Callable[[str], bool] | None = None,
    now: float,
) -> list[dict]:
    """Our own checks.

    ``states``: entity_id -> {state, state_class, device_class, unit, name, last_changed_ts}
    ``items``:  enriched long-term statistics rows (``lts.enrich``), with ``refs`` when usage is known
    ``sum_drops``: statistic_id -> result of ``sum_decreases``
    ``unit_rules`` / ``state_class_rules``: device_class -> allowed units / state classes
    """
    by_id = {i["statistic_id"]: i for i in items}
    out: list[dict] = []
    is_recorded = recorded or (lambda _eid: True)

    for eid, st in states.items():
        item = by_id.get(eid)
        state_class = st.get("state_class")
        device_class = st.get("device_class")
        unit = st.get("unit")
        raw_state = st.get("state")
        numeric = is_numeric(raw_state)
        unavailable = str(raw_state).strip().lower() in UNAVAILABLE_STATES

        if state_class and item is None and is_recorded(eid):
            out.append(
                _issue(
                    "no_statistics",
                    eid,
                    "warning",
                    {"state": raw_state, "state_class": state_class, "numeric": numeric},
                    None,
                    st,
                )
            )

        if state_class and item is not None and item.get("category") == "stopped":
            reason = "ok" if numeric else ("unavailable" if unavailable else "not_numeric")
            out.append(
                _issue(
                    "lts_stalled",
                    eid,
                    "warning",
                    {"last_ts": item.get("last_ts"), "state": raw_state, "reason": reason},
                    item,
                    st,
                )
            )

        allowed_units = unit_rules.get(device_class) if device_class else None
        if allowed_units is not None and unit is not None and numeric and unit not in allowed_units:
            out.append(
                _issue(
                    "unit_not_allowed",
                    eid,
                    "warning",
                    {"unit": unit, "device_class": device_class, "allowed": sorted((str(u) for u in allowed_units if u), key=str)},
                    item,
                    st,
                )
            )

        allowed_classes = state_class_rules.get(device_class) if device_class else None
        if allowed_classes is not None and state_class and state_class not in allowed_classes:
            out.append(
                _issue(
                    "state_class_not_allowed",
                    eid,
                    "warning",
                    {"state_class": state_class, "device_class": device_class, "allowed": sorted(allowed_classes)},
                    item,
                    st,
                )
            )

        if state_class and item is not None and item.get("source") == "recorder":
            wants_sum = state_class in SUM_CLASSES
            mean_type = item.get("mean_type")
            fields = []
            if bool(item.get("has_sum")) != wants_sum:
                fields.append("has_sum")
            if mean_type is not None and state_class in MEAN_CLASSES and int(mean_type) == 0:
                fields.append("mean_type")
            if fields:
                out.append(
                    _issue(
                        "meta_mismatch",
                        eid,
                        "warning",
                        {
                            "state_class": state_class,
                            "has_sum": bool(item.get("has_sum")),
                            "mean_type": mean_type,
                            "fields": fields,
                        },
                        item,
                        st,
                    )
                )

        if (
            not state_class
            and numeric
            and unit
            and device_class
            and device_class in state_class_rules
            and is_recorded(eid)
        ):
            out.append(
                _issue(
                    "missing_state_class",
                    eid,
                    "info",
                    {"unit": unit, "device_class": device_class, "allowed": sorted(state_class_rules[device_class])},
                    item,
                    st,
                )
            )

        if item is not None and item.get("refs") and unavailable:
            since = st.get("last_changed_ts")
            if since is not None and now - since >= UNAVAILABLE_AFTER_S:
                out.append(_issue("unavailable_important", eid, "warning", {"state": raw_state, "since_ts": since}, item, st))

    for sid, drops in (sum_drops or {}).items():
        item = by_id.get(sid)
        if item is None:
            continue
        in_energy = any(r == "energy" or r.startswith("energy:") for r in item.get("refs") or [])
        out.append(_issue("sum_decrease", sid, "error" if in_energy else "warning", dict(drops), item, states.get(sid)))
    return out


def from_validation(validation: Mapping[str, Iterable[Mapping]], repairs: Iterable[str] = ()) -> list[dict]:
    """Home Assistant's own ``validate_statistics`` result -> issue dicts.

    ``repairs`` are the ids of open Repairs issues (``<type>_<statistic_id>``): a matching
    issue is marked ``in_repairs`` instead of being listed twice.
    """
    open_repairs = set(repairs)
    out = []
    for sid, issues in validation.items():
        for raw in issues:
            code = raw.get("type")
            out.append(
                {
                    "id": f"ha:{code}:{sid}",
                    "statistic_id": sid,
                    "code": code,
                    "severity": HA_CODES.get(code, "warning"),
                    "source": "ha",
                    "name": None,
                    "important": False,
                    "refs": [],
                    "data": dict(raw.get("data") or {}),
                    "in_repairs": f"{code}_{sid}" in open_repairs,
                }
            )
    return out


def merge(
    issues: Iterable[dict],
    items: Iterable[Mapping],
    names: Mapping[str, str | None] | None = None,
    attrs: Mapping[str, Mapping] | None = None,
) -> dict:
    """Attach refs/names/size from the statistics list, sort (important first) and count.

    ``attrs``: entity_id -> {state_class, device_class, unit} as the sensor reports them now; the panel
    uses it to write a concrete "how to fix" example for the entity.
    """
    by_id = {i["statistic_id"]: i for i in items}
    result = []
    for issue in issues:
        item = by_id.get(issue["statistic_id"])
        if item is not None:
            refs = list(item.get("refs") or [])
            issue["refs"] = refs
            issue["important"] = bool(refs)
            issue["category"] = item.get("category")
            issue["rows"] = item.get("rows")
            issue["verdict"] = item.get("verdict")
            issue["stat_source"] = item.get("source")  # "recorder" or an external source (not "ha"/"own")
            issue["integration"] = item.get("integration")
            issue["registered"] = item.get("registered")
            issue["first_ts"] = item.get("first_ts")
            issue["last_ts"] = item.get("last_ts")
            issue["unit"] = item.get("unit")
            issue["name"] = issue.get("name") or item.get("name")
        if attrs and issue["statistic_id"] in attrs:
            issue["entity"] = dict(attrs[issue["statistic_id"]])
        issue["name"] = issue.get("name") or (names or {}).get(issue["statistic_id"])
        result.append(issue)
    result.sort(key=lambda i: (not i["important"], SEVERITY_ORDER.get(i["severity"], 9), i["statistic_id"], i["code"]))
    codes: dict[str, dict] = {}
    for i in result:
        agg = codes.setdefault(i["code"], {"key": i["code"], "count": 0, "important": 0})
        agg["count"] += 1
        agg["important"] += int(i["important"])
    return {
        "issues": result,
        "codes": sorted(codes.values(), key=lambda c: (-c["important"], -c["count"])),
        "total": len(result),
        "important": sum(1 for i in result if i["important"]),
        "problems": sum(1 for i in result if i["severity"] in ("error", "warning")),
    }
