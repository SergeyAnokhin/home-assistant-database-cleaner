"""Live view: what the recorder has written since the last poll.

Everything is derived from the auto-increment ids of the history tables (``MAX(id)`` is a b-tree
lookup, so polling every couple of seconds is cheap). The panel keeps the previous cursor and asks
for "everything above it"; nothing is stored on the server.
"""

from __future__ import annotations

import os
import sqlite3

from .model import Context, describe

# cursor key -> (table, id column)
CURSORS = {
    "states": ("states", "state_id"),
    "events": ("events", "event_id"),
    "short_term": ("statistics_short_term", "id"),
    "statistics": ("statistics", "id"),
}
# Above this many new rows the "who wrote them" query is skipped (the panel was paused for long).
TOP_LIMIT_ROWS = 200_000


def _max_id(conn: sqlite3.Connection, table: str, column: str) -> int:
    try:
        return conn.execute(f"SELECT COALESCE(MAX({column}), 0) FROM {table}").fetchone()[0]
    except sqlite3.Error:  # table missing on an unusual schema
        return 0


def _size(path: str) -> int | None:
    try:
        return os.path.getsize(path)
    except OSError:
        return None


def snapshot(
    conn: sqlite3.Connection,
    ctx: Context,
    db_path: str,
    *,
    now: float,
    cursor: dict[str, int] | None = None,
    top: int = 12,
) -> dict:
    """New cursor, rows added since ``cursor`` per table, and who wrote the new states / events."""
    new_cursor = {key: _max_id(conn, table, col) for key, (table, col) in CURSORS.items()}
    result: dict = {
        "ts": now,
        "cursor": new_cursor,
        "added": None,
        "top": [],
        "top_events": [],
        "size": _size(db_path),
        "wal_size": _size(db_path + "-wal"),
    }
    if not cursor:
        return result

    added = {}
    for key, value in new_cursor.items():
        prev = cursor.get(key)
        # a lower id than before: the database was replaced (restore) -> start over
        added[key] = max(0, value - prev) if prev is not None and value >= prev else 0
    result["added"] = added

    if 0 < added["states"] <= TOP_LIMIT_ROWS:
        result["top"] = [
            {"entity_id": entity_id, "rows": n, **describe(entity_id, ctx)}
            for entity_id, n in conn.execute(
                """
                SELECT m.entity_id, COUNT(*)
                FROM states s JOIN states_meta m ON m.metadata_id = s.metadata_id
                WHERE s.state_id > ? AND s.state_id <= ?
                GROUP BY s.metadata_id ORDER BY 2 DESC LIMIT ?
                """,
                (cursor["states"], new_cursor["states"], top),
            )
        ]
    if 0 < added["events"] <= TOP_LIMIT_ROWS:
        result["top_events"] = [
            {"event_type": event_type, "rows": n}
            for event_type, n in conn.execute(
                """
                SELECT COALESCE(t.event_type, '?'), COUNT(*)
                FROM events e LEFT JOIN event_types t ON t.event_type_id = e.event_type_id
                WHERE e.event_id > ? AND e.event_id <= ?
                GROUP BY e.event_type_id ORDER BY 2 DESC LIMIT 5
                """,
                (cursor["events"], new_cursor["events"]),
            )
        ]
    return result
