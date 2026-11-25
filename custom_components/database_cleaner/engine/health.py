"""Database health: write load, probe-query latency, freshness, integrity."""

from __future__ import annotations

import sqlite3

from .db import Timer
from .overview import file_info, pragmas

MINUTE = 60


def probe(conn: sqlite3.Connection, *, now: float) -> dict:
    """Cheap, repeatable measurements. Run every few minutes and keep a history."""
    out: dict = {"ts": now}

    with Timer() as t:
        conn.execute(
            """
            SELECT state FROM states
            WHERE metadata_id = (SELECT MAX(metadata_id) FROM states_meta)
            ORDER BY last_updated_ts DESC LIMIT 1
            """
        ).fetchall()
    out["point_ms"] = t.ms

    with Timer() as t:
        c1, c5, c60 = conn.execute(
            """
            SELECT SUM(last_updated_ts >= ?), SUM(last_updated_ts >= ?), COUNT(*)
            FROM states WHERE last_updated_ts >= ?
            """,
            (now - MINUTE, now - 5 * MINUTE, now - 60 * MINUTE),
        ).fetchone()
    out["range_ms"] = t.ms
    out["states_1m"] = c1 or 0
    out["states_5m"] = c5 or 0
    out["states_60m"] = c60 or 0

    with Timer() as t:
        out["events_60m"] = conn.execute(
            "SELECT COUNT(*) FROM events WHERE time_fired_ts >= ?", (now - 60 * MINUTE,)
        ).fetchone()[0]
        lts_last = conn.execute("SELECT MAX(start_ts) FROM statistics").fetchone()[0]
        short_last = conn.execute("SELECT MAX(start_ts) FROM statistics_short_term").fetchone()[0]
        state_last = conn.execute("SELECT MAX(last_updated_ts) FROM states").fetchone()[0]
    out["fresh_ms"] = t.ms
    # Age of the newest row. LTS rows start at the top of the previous hour,
    # so a healthy LTS age is 1-2 h; short-term 5-10 min; states seconds.
    out["lts_age_s"] = None if lts_last is None else round(now - lts_last)
    out["short_term_age_s"] = None if short_last is None else round(now - short_last)
    out["states_age_s"] = None if state_last is None else round(now - state_last)
    out["total_ms"] = round(out["point_ms"] + out["range_ms"] + out["fresh_ms"], 2)
    return out


def recorder_runs(conn: sqlite3.Connection, limit: int = 5) -> dict:
    try:
        closed_incorrect = conn.execute(
            "SELECT COUNT(*) FROM recorder_runs WHERE closed_incorrect"
        ).fetchone()[0]
        runs = [
            {"start": s, "end": e, "closed_incorrect": bool(ci)}
            for s, e, ci in conn.execute(
                'SELECT start, "end", closed_incorrect FROM recorder_runs ORDER BY run_id DESC LIMIT ?',
                (limit,),
            )
        ]
    except sqlite3.Error:
        return {"closed_incorrect": None, "runs": []}
    return {"closed_incorrect": closed_incorrect, "runs": runs}


def snapshot(conn: sqlite3.Connection, db_path: str) -> dict:
    p = pragmas(conn)
    page_count = p.get("page_count") or 0
    free = p.get("freelist_count") or 0
    return {
        "file": file_info(db_path),
        "sqlite": p,
        "free_pages_pct": round(100 * free / page_count, 2) if page_count else None,
        "reclaimable_bytes": free * (p.get("page_size") or 0),
        "recorder_runs": recorder_runs(conn),
    }


def quick_check(conn: sqlite3.Connection) -> dict:
    with Timer() as t:
        result = [r[0] for r in conn.execute("PRAGMA quick_check(20)")]
        fk = conn.execute("PRAGMA foreign_key_check").fetchmany(20)
    return {
        "ok": result == ["ok"] and not fk,
        "quick_check": result,
        "foreign_key_violations": [list(r) for r in fk],
        "took_ms": t.ms,
    }
