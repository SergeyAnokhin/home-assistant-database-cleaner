"""Database overview: file sizes, space per table group, row counts, ranges."""

from __future__ import annotations

import os
import shutil
import sqlite3

from .db import Timer, table_names

# Table -> logical group shown in the UI.
TABLE_GROUPS: dict[str, str] = {
    "statistics": "lts",
    "statistics_short_term": "short_term",
    "states": "states",
    "state_attributes": "states",
    "states_meta": "states",
    "events": "events",
    "event_data": "events",
    "event_types": "events",
    "statistics_meta": "meta",
    "statistics_runs": "meta",
    "recorder_runs": "meta",
    "schema_changes": "meta",
    "migration_changes": "meta",
}
GROUP_ORDER = ["lts", "states", "short_term", "events", "meta", "other"]

# (table, timestamp column) used for the date ranges.
RANGE_COLUMNS = {
    "states": "last_updated_ts",
    "statistics": "start_ts",
    "statistics_short_term": "start_ts",
    "events": "time_fired_ts",
}


def _file_size(path: str) -> int | None:
    try:
        return os.path.getsize(path)
    except OSError:
        return None


def file_info(db_path: str) -> dict:
    disk: dict | None
    try:
        usage = shutil.disk_usage(os.path.dirname(os.path.abspath(db_path)))
        disk = {"total": usage.total, "used": usage.used, "free": usage.free}
    except OSError:
        disk = None
    return {
        "path": db_path,
        "size": _file_size(db_path),
        "wal_size": _file_size(db_path + "-wal"),
        "shm_size": _file_size(db_path + "-shm"),
        "disk": disk,
    }


def pragmas(conn: sqlite3.Connection) -> dict:
    out = {"version": sqlite3.sqlite_version}
    for name in ("page_size", "page_count", "freelist_count", "journal_mode", "auto_vacuum"):
        try:
            out[name] = conn.execute(f"PRAGMA {name}").fetchone()[0]
        except sqlite3.Error:
            out[name] = None
    return out


def schema_version(conn: sqlite3.Connection) -> int | None:
    try:
        row = conn.execute(
            "SELECT schema_version FROM schema_changes ORDER BY change_id DESC LIMIT 1"
        ).fetchone()
    except sqlite3.Error:
        return None
    return row[0] if row else None


def object_sizes(conn: sqlite3.Connection) -> dict[str, int] | None:
    """Bytes per b-tree (table or index) via the dbstat virtual table, if compiled in."""
    for sql in (
        "SELECT name, pgsize FROM dbstat WHERE aggregate = TRUE",
        "SELECT name, SUM(pgsize) FROM dbstat GROUP BY name",
    ):
        try:
            return {name: int(size or 0) for name, size in conn.execute(sql)}
        except sqlite3.Error:
            continue
    return None


def overview(conn: sqlite3.Connection, db_path: str) -> dict:
    with Timer() as total:
        tables = sorted(table_names(conn))
        owner = {
            name: tbl
            for name, tbl in conn.execute(
                "SELECT name, tbl_name FROM sqlite_master WHERE type IN ('table', 'index')"
            )
        }
        sizes = object_sizes(conn)

        table_rows = []
        for tbl in tables:
            try:
                rows = conn.execute(f'SELECT COUNT(*) FROM "{tbl}"').fetchone()[0]
            except sqlite3.Error:
                rows = None
            data_bytes = index_bytes = None
            if sizes is not None:
                data_bytes = sizes.get(tbl, 0)
                index_bytes = sum(
                    size for name, size in sizes.items() if name != tbl and owner.get(name) == tbl
                )
            table_rows.append(
                {
                    "name": tbl,
                    "group": TABLE_GROUPS.get(tbl, "other"),
                    "rows": rows,
                    "bytes": data_bytes,
                    "index_bytes": index_bytes,
                }
            )

        groups = []
        for key in GROUP_ORDER:
            members = [t for t in table_rows if t["group"] == key]
            if not members and key != "other":
                continue
            group_bytes = None
            if sizes is not None:
                group_bytes = sum((t["bytes"] or 0) + (t["index_bytes"] or 0) for t in members)
            groups.append(
                {
                    "key": key,
                    "rows": sum(t["rows"] or 0 for t in members),
                    "bytes": group_bytes,
                }
            )
        if sizes is not None:
            # sqlite_schema, sqlite_stat1, autoindexes… not owned by a known table
            accounted = sum(g["bytes"] or 0 for g in groups)
            other = next(g for g in groups if g["key"] == "other")
            other["bytes"] += max(0, sum(sizes.values()) - accounted)

        ranges = {}
        for tbl, col in RANGE_COLUMNS.items():
            if tbl not in tables:
                continue
            try:
                lo, hi = conn.execute(f"SELECT MIN({col}), MAX({col}) FROM {tbl}").fetchone()
            except sqlite3.Error:
                continue
            ranges[tbl] = {"min": lo, "max": hi}

    return {
        "file": file_info(db_path),
        "sqlite": pragmas(conn),
        "schema_version": schema_version(conn),
        "dbstat": sizes is not None,
        "tables": sorted(table_rows, key=lambda t: -((t["bytes"] or 0) + (t["index_bytes"] or 0))),
        "groups": groups,
        "ranges": ranges,
        "took_ms": total.ms,
    }
