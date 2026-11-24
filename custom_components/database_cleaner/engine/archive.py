"""Undo archive: hourly statistics of the statistics we are about to delete.

Format: gzip'd JSON lines, one statistic per line:
    {"meta": {...statistics_meta...}, "columns": [...], "rows": [[...], ...]}
plus a sidecar ``<name>.json`` index (updated after every batch, so even an
interrupted job leaves a usable archive). Restoring goes through the
recorder's official import, never through direct SQL.
"""

from __future__ import annotations

import gzip
import json
import os
import sqlite3
import time
from collections.abc import Iterable, Iterator
from datetime import UTC, datetime
from pathlib import Path

from .db import columns

PREFIX = "undo-"
SUFFIX = ".jsonl.gz"
ROW_COLUMNS = ("start_ts", "mean", "min", "max", "state", "sum", "last_reset_ts", "mean_weight")
META_COLUMNS = ("statistic_id", "source", "unit_of_measurement", "unit_class", "has_mean", "has_sum", "name", "mean_type")


class ArchiveError(Exception):
    """Archive is missing or unreadable."""


def export_statistics(conn: sqlite3.Connection, statistic_ids: Iterable[str]) -> Iterator[dict]:
    """Yield archive records for the given statistic_ids (read-only)."""
    meta_cols = [c for c in META_COLUMNS if c in columns(conn, "statistics_meta")]
    row_cols = [c for c in ROW_COLUMNS if c in columns(conn, "statistics")]
    for sid in statistic_ids:
        row = conn.execute(
            f"SELECT id, {', '.join(meta_cols)} FROM statistics_meta WHERE statistic_id = ?", (sid,)
        ).fetchone()
        if row is None:
            continue
        mid, *values = row
        meta = dict(zip(meta_cols, values, strict=True))
        rows = conn.execute(
            f"SELECT {', '.join(row_cols)} FROM statistics WHERE metadata_id = ? ORDER BY start_ts", (mid,)
        ).fetchall()
        yield {"meta": meta, "columns": row_cols, "rows": [list(r) for r in rows]}


class ArchiveWriter:
    """Append-only writer; call ``add`` per batch, ``close`` at the end."""

    def __init__(self, directory: str, *, job_id: str, now: float | None = None) -> None:
        created = now or time.time()
        stamp = datetime.fromtimestamp(created, UTC).strftime("%Y%m%d-%H%M%S")
        Path(directory).mkdir(parents=True, exist_ok=True)
        self.name = f"{PREFIX}{stamp}-{job_id[:8]}{SUFFIX}"
        self.path = Path(directory) / self.name
        self._fh = gzip.open(self.path, "at", encoding="utf-8")
        self.index = {
            "name": self.name,
            "file": str(self.path),
            "job_id": job_id,
            "created": datetime.fromtimestamp(created, UTC).isoformat(),
            "created_ts": created,
            "statistics": [],
            "rows": 0,
            "complete": False,
        }
        self._save_index()

    def add(self, records: Iterable[dict]) -> list[str]:
        added = []
        for rec in records:
            self._fh.write(json.dumps(rec, separators=(",", ":")) + "\n")
            n = len(rec["rows"])
            self.index["statistics"].append({"statistic_id": rec["meta"]["statistic_id"], "rows": n})
            self.index["rows"] += n
            added.append(rec["meta"]["statistic_id"])
        # flush to disk *before* the caller deletes anything
        self._fh.flush()
        os.fsync(self._fh.fileno())
        self._save_index()
        return added

    def close(self, *, complete: bool = True) -> dict:
        self._fh.close()
        self.index["complete"] = complete
        self.index["size"] = self.path.stat().st_size
        self._save_index()
        return self.index

    def _save_index(self) -> None:
        idx = self.path.with_name(self.name + ".json")
        tmp = idx.with_suffix(".tmp")
        tmp.write_text(json.dumps(self.index, ensure_ascii=False), encoding="utf-8")
        os.replace(tmp, idx)


def list_archives(directory: str) -> list[dict]:
    d = Path(directory)
    if not d.is_dir():
        return []
    out = []
    for idx in d.glob(f"{PREFIX}*{SUFFIX}.json"):
        try:
            out.append(json.loads(idx.read_text(encoding="utf-8")))
        except (OSError, ValueError):
            continue
    out.sort(key=lambda a: a.get("created_ts", 0), reverse=True)
    return out


def read_archive(directory: str, name: str, statistic_ids: set[str] | None = None) -> Iterator[dict]:
    if "/" in name or "\\" in name or not (name.startswith(PREFIX) and name.endswith(SUFFIX)):
        raise ArchiveError(f"not an undo archive: {name}")
    path = Path(directory) / name
    if not path.exists():
        raise ArchiveError(f"archive not found: {name}")
    with gzip.open(path, "rt", encoding="utf-8") as fh:
        for line in fh:
            try:
                rec = json.loads(line)
            except ValueError:
                break  # torn last line of an interrupted job: everything before it is valid
            if statistic_ids is None or rec["meta"]["statistic_id"] in statistic_ids:
                yield rec


def expire_archives(directory: str, max_age_s: float, now: float | None = None) -> list[str]:
    now = now or time.time()
    removed = []
    for a in list_archives(directory):
        if now - a.get("created_ts", now) > max_age_s:
            path = Path(directory) / a["name"]
            path.unlink(missing_ok=True)
            path.with_name(a["name"] + ".json").unlink(missing_ok=True)
            removed.append(a["name"])
    return removed


def plan_batches(items: Iterable[tuple[str, int]], max_rows: int) -> list[list[str]]:
    """Group statistic_ids so each batch deletes at most ``max_rows`` rows.

    A single statistic bigger than ``max_rows`` gets a batch of its own (the
    recorder deletes one statistic in one statement).
    """
    batches: list[list[str]] = []
    cur: list[str] = []
    cur_rows = 0
    for sid, rows in items:
        if cur and cur_rows + rows > max_rows:
            batches.append(cur)
            cur, cur_rows = [], 0
        cur.append(sid)
        cur_rows += rows
    if cur:
        batches.append(cur)
    return batches
