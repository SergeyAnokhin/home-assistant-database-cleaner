"""Long-term statistics (LTS): volume per statistic and garbage categories."""

from __future__ import annotations

import sqlite3
from collections.abc import Sequence

from .db import Timer, columns
from .model import Context, describe

DAY = 86400
# A statistic whose newest hourly row is older than this (relative to the
# newest row in the whole table) is considered "stopped".
STOPPED_AFTER_S = 3 * 3600
# Bytes per LTS row incl. both indexes, measured on a real 1.1 GiB database.
DEFAULT_ROW_BYTES = 78.0

# Order matters: the first matching rule wins.
CATEGORIES = [
    "external",  # source != recorder (imported by an integration)
    "excluded",  # matches recorder `exclude` -> no longer recorded at all
    "orphan",  # not in entity registry and no states
    "no_registry",  # has states but no registry entry (YAML without unique_id)
    "disabled",  # entity disabled in the registry
    "no_states",  # registered & enabled but nothing in `states`
    "stopped",  # entity alive but LTS no longer written
    "healthy",
]


def raw_summary(conn: sqlite3.Connection, *, now: float, periods_days: Sequence[int]) -> dict:
    """Expensive part (one pass over the covering index). Cache the result."""
    with Timer() as t:
        meta_cols = columns(conn, "statistics_meta")
        optional = [c for c in ("mean_type", "unit_class", "has_mean") if c in meta_cols]
        meta_sql = (
            "SELECT id, statistic_id, source, unit_of_measurement, has_sum, name"
            + "".join(f", {c}" for c in optional)
            + " FROM statistics_meta"
        )
        meta = {}
        for row in conn.execute(meta_sql):
            mid, sid, source, unit, has_sum, name, *rest = row
            extra = dict(zip(optional, rest, strict=True))
            meta[mid] = {
                "statistic_id": sid,
                "source": source,
                "unit": unit,
                "has_sum": bool(has_sum),
                "stat_name": name,
                "mean_type": extra.get("mean_type"),
                "unit_class": extra.get("unit_class"),
            }

        periods = sorted({int(p) for p in periods_days if int(p) > 0})
        period_cols = "".join(f", SUM(start_ts >= {now - p * DAY:.0f})" for p in periods)
        counts = {}
        for mid, rows, first, last, *per in conn.execute(
            "SELECT metadata_id, COUNT(*), MIN(start_ts), MAX(start_ts)"
            + period_cols
            + " FROM statistics GROUP BY metadata_id"
        ):
            counts[mid] = (rows, first, last, per)

        short = dict(
            conn.execute("SELECT metadata_id, COUNT(*) FROM statistics_short_term GROUP BY metadata_id")
        )
        with_states = {r[0] for r in conn.execute("SELECT entity_id FROM states_meta")}

        items = []
        for mid, m in meta.items():
            rows, first, last, per = counts.get(mid, (0, None, None, [0] * len(periods)))
            items.append(
                {
                    **m,
                    "metadata_id": mid,
                    "rows": rows,
                    "rows_by_period": {str(p): int(n or 0) for p, n in zip(periods, per, strict=True)},
                    "first_ts": first,
                    "last_ts": last,
                    "short_term_rows": short.get(mid, 0),
                    "has_states": m["statistic_id"] in with_states,
                }
            )
        max_ts = max((i["last_ts"] for i in items if i["last_ts"] is not None), default=None)

    return {
        "items": items,
        "periods": [str(p) for p in periods],
        "max_ts": max_ts,
        "computed_at": now,
        "took_ms": t.ms,
    }


def categorize(item: dict, ctx: Context, max_ts: float | None) -> str:
    sid = item["statistic_id"]
    if item["source"] != "recorder":
        return "external"
    if not ctx.recorded(sid):
        return "excluded"
    info = ctx.info(sid)
    registered = info is not None and info.registered
    if not registered and not item["has_states"]:
        return "orphan"
    if not registered:
        return "no_registry"
    if info.disabled:
        return "disabled"
    if not item["has_states"]:
        return "no_states"
    if max_ts is not None and item["last_ts"] is not None and item["last_ts"] < max_ts - STOPPED_AFTER_S:
        return "stopped"
    return "healthy"


def enrich(raw: dict, ctx: Context, *, row_bytes: float | None = None) -> dict:
    """Cheap part: attach registry info and categories (re-run on every request)."""
    row_bytes = row_bytes or DEFAULT_ROW_BYTES
    max_ts = raw["max_ts"]
    items = []
    cats: dict[str, dict] = {c: {"key": c, "count": 0, "rows": 0} for c in CATEGORIES}
    diagnostic = {"count": 0, "rows": 0}
    total_rows = 0
    for item in raw["items"]:
        out = {**item, **describe(item["statistic_id"], ctx)}
        if item["source"] != "recorder":
            out["domain"] = ""
        out["category"] = categorize(item, ctx, max_ts)
        if not out["name"]:
            out["name"] = item["stat_name"]
        items.append(out)
        cats[out["category"]]["count"] += 1
        cats[out["category"]]["rows"] += item["rows"]
        if out["diagnostic"]:
            diagnostic["count"] += 1
            diagnostic["rows"] += item["rows"]
        total_rows += item["rows"]

    for c in cats.values():
        c["bytes"] = round(c["rows"] * row_bytes)
    diagnostic["bytes"] = round(diagnostic["rows"] * row_bytes)
    items.sort(key=lambda i: -i["rows"])
    return {
        "items": items,
        "categories": list(cats.values()),
        "diagnostic": diagnostic,
        "total_rows": total_rows,
        "row_bytes": row_bytes,
        "periods": raw["periods"],
        "max_ts": max_ts,
        "computed_at": raw["computed_at"],
        "took_ms": raw["took_ms"],
    }
