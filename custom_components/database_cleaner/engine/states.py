"""Write frequency: who writes how many rows into `states` / `events`."""

from __future__ import annotations

import sqlite3

from .db import Timer
from .model import Context, describe

HOUR = 3600
DAY = 24 * HOUR
HOURLY_TOP = 300  # entities that get a 24-hour mini chart in the States tab


def states_range(conn: sqlite3.Connection) -> tuple[float | None, float | None]:
    lo, hi = conn.execute("SELECT MIN(last_updated_ts), MAX(last_updated_ts) FROM states").fetchone()
    return lo, hi


def hourly_counts(
    conn: sqlite3.Connection, metadata_ids: list[int], *, now: float, hours: int = 24
) -> dict[int, list[int]]:
    """Rows per hour for the last ``hours`` hours, oldest hour first (the last bucket is "now").

    Buckets are counted back from ``now``, so the newest one is always the most recent full hour
    of activity. Used for the tiny "is it regular?" charts.
    """
    out: dict[int, list[int]] = {}
    since = now - hours * HOUR
    for i in range(0, len(metadata_ids), 500):
        chunk = metadata_ids[i : i + 500]
        marks = ",".join("?" * len(chunk))
        for mid, bucket, cnt in conn.execute(
            f"""
            SELECT metadata_id AS m, CAST((? - last_updated_ts) / {HOUR} AS INTEGER) AS b, COUNT(*)
            FROM states
            WHERE metadata_id IN ({marks}) AND last_updated_ts >= ?
            GROUP BY m, b
            """,
            (now, *chunk, since),
        ):
            series = out.setdefault(mid, [0] * hours)
            series[hours - 1 - min(max(bucket, 0), hours - 1)] += cnt
    return out


def entity_activity(conn: sqlite3.Connection, ctx: Context, *, now: float, window_s: int) -> dict:
    """Per-entity row counts in `states` for the last ``window_s`` seconds."""
    since = now - window_s
    with Timer() as t:
        data_from, data_to = states_range(conn)
        rows = conn.execute(
            """
            SELECT m.entity_id,
                   COUNT(*),
                   COUNT(DISTINCT s.state),
                   SUM(s.state IN ('unavailable', 'unknown')),
                   COUNT(DISTINCT s.attributes_id),
                   MAX(s.last_updated_ts),
                   s.metadata_id
            FROM states s
            JOIN states_meta m ON m.metadata_id = s.metadata_id
            WHERE s.last_updated_ts >= ?
            GROUP BY s.metadata_id
            """,
            (since,),
        ).fetchall()

        # 24-hour mini charts for the busiest entities (the ones people look at first)
        busiest = sorted(rows, key=lambda r: -r[1])[:HOURLY_TOP]
        hourly = hourly_counts(conn, [r[6] for r in busiest], now=now)

    effective_from = max(since, data_from) if data_from is not None else since
    hours = max((now - effective_from) / HOUR, 1 / 60)
    items = []
    total = 0
    for entity_id, cnt, distinct, unavailable, attrs, last, metadata_id in rows:
        total += cnt
        items.append(
            {
                "entity_id": entity_id,
                "rows": cnt,
                "per_hour": round(cnt / hours, 2),
                "distinct_states": distinct,
                "unavailable": unavailable or 0,
                "distinct_attributes": attrs,
                "last_ts": last,
                "hourly": hourly.get(metadata_id),
                **describe(entity_id, ctx),
            }
        )
    items.sort(key=lambda i: -i["rows"])
    return {
        "items": items,
        "total_rows": total,
        "window_s": window_s,
        "since": since,
        "effective_from": effective_from,
        "effective_hours": round(hours, 2),
        "data_from": data_from,
        "data_to": data_to,
        "truncated": data_from is not None and data_from > since,
        "took_ms": t.ms,
    }


def event_activity(conn: sqlite3.Connection, *, now: float, window_s: int) -> dict:
    since = now - window_s
    with Timer() as t:
        rows = conn.execute(
            """
            SELECT COALESCE(t.event_type, '?'), COUNT(*)
            FROM events e
            LEFT JOIN event_types t ON t.event_type_id = e.event_type_id
            WHERE e.time_fired_ts >= ?
            GROUP BY e.event_type_id
            ORDER BY 2 DESC
            """,
            (since,),
        ).fetchall()
    return {
        "items": [{"event_type": et, "rows": n} for et, n in rows],
        "total_rows": sum(n for _, n in rows),
        "window_s": window_s,
        "took_ms": t.ms,
    }


def chatty(conn: sqlite3.Connection, ctx: Context, *, now: float, top_n: int) -> dict:
    """Data for the "chattiest entities" sensors: last 24 h, 7 d and 30 d, plus a 24-hour profile.

    Rates are rows per hour averaged over the part of the window the database actually covers
    (with a 10-day recorder retention the "30 d" rate is really the 10-day rate).
    """
    h24, h1, d7, d30 = now - DAY, now - HOUR, now - 7 * DAY, now - 30 * DAY
    with Timer() as t:
        data_from, _ = states_range(conn)
        span_h = max((now - data_from) / HOUR, 1 / 60) if data_from is not None else 0.0
        rows = conn.execute(
            """
            SELECT s.metadata_id, m.entity_id,
                   COUNT(*),
                   SUM(s.last_updated_ts >= ?),
                   COUNT(DISTINCT s.state)
            FROM states s
            JOIN states_meta m ON m.metadata_id = s.metadata_id
            WHERE s.last_updated_ts >= ?
            GROUP BY s.metadata_id
            ORDER BY 3 DESC
            """,
            (h1, h24),
        ).fetchall()
        total_24h = sum(r[2] for r in rows)
        total_1h = sum(r[3] or 0 for r in rows)
        hourly = hourly_counts(conn, [r[0] for r in rows[:top_n]], now=now)
        top = []
        for metadata_id, entity_id, c24, c1, distinct in rows[:top_n]:
            # 7 and 30 days in one pass over the covering index (metadata_id, last_updated_ts)
            c30, c7 = conn.execute(
                "SELECT COUNT(*), COALESCE(SUM(last_updated_ts >= ?), 0) FROM states "
                "WHERE metadata_id = ? AND last_updated_ts >= ?",
                (d7, metadata_id, d30),
            ).fetchone()
            if data_from is not None and data_from >= d30:
                c_all = c30  # the whole retained window fits into 30 days
            else:
                c_all = conn.execute("SELECT COUNT(*) FROM states WHERE metadata_id = ?", (metadata_id,)).fetchone()[0]
            top.append(
                {
                    "entity_id": entity_id,
                    "count_1h": c1 or 0,
                    "count_24h": c24,
                    "count_7d": c7,
                    "count_30d": c30,
                    "count_window": c_all,
                    "per_hour_24h": round(c24 / 24, 1),
                    "per_hour_7d": round(c7 / min(7 * 24, span_h), 1) if span_h else 0.0,
                    "per_hour_30d": round(c30 / min(30 * 24, span_h), 1) if span_h else 0.0,
                    "hourly_24h": hourly.get(metadata_id, [0] * 24),
                    "distinct_states_24h": distinct,
                    "share_of_all_24h": round(100 * c24 / total_24h, 1) if total_24h else 0.0,
                    **describe(entity_id, ctx),
                }
            )
    return {
        "top": top,
        "total_1h": total_1h,
        "total_24h": total_24h,
        "window_start": data_from,
        "data_hours": round(span_h, 1),
        "took_ms": t.ms,
    }
