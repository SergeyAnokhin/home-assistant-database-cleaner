"""Database-only backups: SQLite Online Backup API from a read-only connection.

The copy is a consistent snapshot taken while the recorder keeps writing (WAL
readers never block the writer). Every backup is verified (integrity_check,
row counts, SHA-256) and described by a JSON manifest next to it; only
verified backups count as "fresh" for destructive jobs.
"""

from __future__ import annotations

import hashlib
import json
import os
import shutil
import sqlite3
import time
from datetime import UTC, datetime
from pathlib import Path

from .db import Timer, open_ro
from .overview import schema_version

PREFIX = "home-assistant_v2-"
SUFFIX = ".db"
KEY_TABLES = ("statistics", "statistics_meta", "statistics_short_term", "states", "states_meta", "events")
SPACE_MARGIN = 64 * 1024 * 1024


class BackupError(Exception):
    """Backup could not be created or verified."""


def required_space(db_path: str, factor: float = 1.05) -> int:
    size = os.path.getsize(db_path) + _size(db_path + "-wal")
    return int(size * factor) + SPACE_MARGIN


def free_space(path: str) -> int:
    probe = Path(path)
    while not probe.exists() and probe != probe.parent:
        probe = probe.parent
    return shutil.disk_usage(probe).free


def _size(path: str) -> int:
    try:
        return os.path.getsize(path)
    except OSError:
        return 0


def _sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(4 * 1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def _counts(conn: sqlite3.Connection) -> dict[str, int]:
    tables = {r[0] for r in conn.execute("SELECT name FROM sqlite_master WHERE type='table'")}
    return {t: conn.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0] for t in KEY_TABLES if t in tables}


def verify(path: Path, *, full: bool = True) -> dict:
    """Integrity of a backup file (opened read-only; the file is not modified)."""
    with Timer() as t:
        conn = sqlite3.connect(path.resolve().as_uri() + "?mode=ro", uri=True)
        try:
            check = [r[0] for r in conn.execute(f"PRAGMA {'integrity_check' if full else 'quick_check'}(20)")]
            counts = _counts(conn)
            version = schema_version(conn)
        finally:
            conn.close()
    return {"ok": check == ["ok"], "check": check, "counts": counts, "schema_version": version, "took_ms": t.ms}


def create(
    db_path: str,
    dest_dir: str,
    *,
    keep: int = 2,
    ha_version: str | None = None,
    immutable_source: bool = False,
    now: float | None = None,
) -> dict:
    """Create, verify and register a backup; then apply retention. Returns the manifest."""
    dest = Path(dest_dir)
    dest.mkdir(parents=True, exist_ok=True)
    need = required_space(db_path)
    have = free_space(str(dest))
    if have < need:
        raise BackupError(f"not enough free space in {dest}: need {need} bytes, have {have}")

    created = now or time.time()
    stamp = datetime.fromtimestamp(created, UTC).strftime("%Y%m%d-%H%M%S")
    name = f"{PREFIX}{stamp}{SUFFIX}"
    final = dest / name
    partial = dest / (name + ".partial")
    if final.exists():
        raise BackupError(f"{final} already exists")

    with Timer() as total:
        src = open_ro(db_path, immutable=immutable_source)
        try:
            dst = sqlite3.connect(partial)
            try:
                # pages=-1: one step, one consistent snapshot. Page-by-page copying
                # would restart every time the recorder commits.
                src.backup(dst, pages=-1)
                # Self-contained file: no -wal/-shm needed to restore it. The
                # recorder switches the database back to WAL when it opens it.
                dst.execute("PRAGMA journal_mode=DELETE")
                dst.commit()
            finally:
                dst.close()
        finally:
            src.close()

        check = verify(partial)
        if not check["ok"]:
            partial.unlink(missing_ok=True)
            raise BackupError(f"backup failed verification: {check['check']}")
        os.replace(partial, final)
        manifest = {
            "name": name,
            "file": str(final),
            "created": datetime.fromtimestamp(created, UTC).isoformat(),
            "created_ts": created,
            "size": final.stat().st_size,
            "sha256": _sha256(final),
            "method": "online_backup",
            "verified": True,
            "integrity": check["check"],
            "counts": check["counts"],
            "schema_version": check["schema_version"],
            "sqlite_version": sqlite3.sqlite_version,
            "ha_version": ha_version,
            "source": db_path,
        }
    manifest["took_ms"] = total.ms
    _write_manifest(final, manifest)
    manifest["removed"] = apply_retention(dest_dir, keep)
    return manifest


def _manifest_path(db_file: Path) -> Path:
    return db_file.with_suffix(db_file.suffix + ".json")


def _write_manifest(db_file: Path, manifest: dict) -> None:
    tmp = _manifest_path(db_file).with_suffix(".tmp")
    tmp.write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")
    os.replace(tmp, _manifest_path(db_file))


def list_backups(dest_dir: str) -> list[dict]:
    """Our backups (files with a manifest), newest first. Unknown files are ignored."""
    dest = Path(dest_dir)
    if not dest.is_dir():
        return []
    out = []
    for f in dest.glob(f"{PREFIX}*{SUFFIX}"):
        mpath = _manifest_path(f)
        if not mpath.exists():
            continue
        try:
            manifest = json.loads(mpath.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            continue
        manifest["present_size"] = _size(str(f))
        out.append(manifest)
    out.sort(key=lambda m: m.get("created_ts", 0), reverse=True)
    return out


def latest_verified(dest_dir: str, max_age_s: float, now: float | None = None) -> dict | None:
    now = now or time.time()
    for m in list_backups(dest_dir):
        if m.get("verified") and m.get("present_size") == m.get("size") and now - m["created_ts"] <= max_age_s:
            return m
    return None


def delete_backup(dest_dir: str, name: str) -> bool:
    """Delete one of *our* backups by name (and its manifest). Refuses anything else."""
    if "/" in name or "\\" in name or not (name.startswith(PREFIX) and name.endswith(SUFFIX)):
        raise BackupError(f"not a Database Cleaner backup: {name}")
    f = Path(dest_dir) / name
    if not _manifest_path(f).exists():
        raise BackupError(f"no manifest for {name}")
    f.unlink(missing_ok=True)
    _manifest_path(f).unlink(missing_ok=True)
    return True


def apply_retention(dest_dir: str, keep: int) -> list[str]:
    removed = []
    for m in list_backups(dest_dir)[max(keep, 1) :]:
        delete_backup(dest_dir, m["name"])
        removed.append(m["name"])
    return removed
