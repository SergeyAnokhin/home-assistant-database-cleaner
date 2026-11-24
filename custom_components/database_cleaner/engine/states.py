"""Write frequency: who writes how many rows into `states` / `events`."""

from __future__ import annotations

import sqlite3

from .db import Timer
from .model import Context, describe

HOUR = 3600


def states_range(conn: sqlite3.Connection) -> tuple[float | None, float | None]:
    lo, hi = conn.execute("SELECT MIN(last_updated_ts), MAX(last_updated_ts) FROM states").fetchone()
    return lo, hi


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
                   MAX(s.last_updated_ts)
            FROM states s
            JOIN states_meta m ON m.metadata_id = s.metadata_id
            WHERE s.last_updated_ts >= ?
            GROUP BY s.metadata_id
            """,
            (since,),
        ).fetchall()

    effective_from = max(since, data_from) if data_from is not None else since
    hours = max((now - effective_from) / HOUR, 1 / 60)
    items = []
    total = 0
    for entity_id, cnt, distinct, unavailable, attrs, last in rows:
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
    """Data for the "chattiest entities" sensors: last 24 h, last 1 h, whole window."""
    h24, h1 = now - 24 * HOUR, now - HOUR
    with Timer() as t:
        data_from, _ = states_range(conn)
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
        top = []
        for metadata_id, entity_id, c24, c1, distinct in rows[:top_n]:
            # whole retained window, cheap: covering index (metadata_id, last_updated_ts)
            c_all = conn.execute(
                "SELECT COUNT(*) FROM states WHERE metadata_id = ?", (metadata_id,)
            ).fetchone()[0]
            top.append(
                {
                    "entity_id": entity_id,
                    "count_1h": c1 or 0,
                    "count_24h": c24,
                    "count_window": c_all,
                    "per_hour_24h": round(c24 / 24, 1),
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
        "took_ms": t.ms,
    }
