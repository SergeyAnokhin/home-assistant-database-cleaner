"""Backups, undo archives and batching (engine level, no Home Assistant)."""

from __future__ import annotations

import gzip
import sqlite3

import pytest
from engine import archive, backup
from engine.db import connect

from .synthetic import NOW, build


@pytest.fixture
def db(tmp_path):
    return str(build(tmp_path / "home-assistant_v2.db"))


def test_backup_create_verify_manifest(db, tmp_path):
    dest = tmp_path / "backups"
    m = backup.create(db, str(dest), keep=2, ha_version="2026.10.4", now=NOW)
    f = dest / m["name"]
    assert f.exists() and not (dest / (m["name"] + ".partial")).exists()
    assert m["verified"] is True and m["integrity"] == ["ok"]
    assert m["counts"]["statistics"] == 24 * (400 + 100 + 50 + 10 + 20 + 3 + 2 + 1)
    assert m["schema_version"] == 53 and m["ha_version"] == "2026.10.4"
    assert len(m["sha256"]) == 64
    # self-contained: rollback-journal mode, no -wal next to it
    conn = sqlite3.connect(f)
    assert conn.execute("PRAGMA journal_mode").fetchone()[0] == "delete"
    conn.close()
    assert backup.verify(f)["ok"] is True
    assert [b["name"] for b in backup.list_backups(str(dest))] == [m["name"]]


def test_backup_retention_and_freshness(db, tmp_path):
    dest = str(tmp_path / "b")
    names = [backup.create(db, dest, keep=2, now=NOW + i * 60)["name"] for i in range(3)]
    listed = [b["name"] for b in backup.list_backups(dest)]
    assert listed == [names[2], names[1]]  # oldest removed, newest first
    assert backup.latest_verified(dest, 3600, now=NOW + 180)["name"] == names[2]
    assert backup.latest_verified(dest, 30, now=NOW + 3600) is None


def test_backup_delete_refuses_foreign_files(db, tmp_path):
    dest = tmp_path / "b"
    dest.mkdir()
    (dest / "important.db").write_text("x")
    with pytest.raises(backup.BackupError):
        backup.delete_backup(str(dest), "important.db")
    with pytest.raises(backup.BackupError):
        backup.delete_backup(str(dest), "../home-assistant_v2-x.db")
    assert (dest / "important.db").exists()


def test_backup_refuses_when_disk_full(db, tmp_path, monkeypatch):
    monkeypatch.setattr(backup, "free_space", lambda _p: 10)
    with pytest.raises(backup.BackupError, match="not enough free space"):
        backup.create(db, str(tmp_path / "b"))


def test_archive_roundtrip_and_index(db, tmp_path):
    ids = ["sensor.gone_forever", "sensor.disabled_power", "sensor.not_there"]
    with connect(db) as conn:
        records = list(archive.export_statistics(conn, ids))
    assert [r["meta"]["statistic_id"] for r in records] == ids[:2]
    w = archive.ArchiveWriter(str(tmp_path / "undo"), job_id="abcdef123456", now=NOW)
    assert w.add(records[:1]) == ["sensor.gone_forever"]
    w.add(records[1:])
    idx = w.close()
    assert idx["complete"] is True and idx["rows"] == 2400 + 1200
    listed = archive.list_archives(str(tmp_path / "undo"))
    assert listed[0]["name"] == w.name
    back = list(archive.read_archive(str(tmp_path / "undo"), w.name, {"sensor.disabled_power"}))
    assert len(back) == 1 and len(back[0]["rows"]) == 1200
    assert back[0]["columns"][0] == "start_ts"
    assert back[0]["rows"] == records[1]["rows"]


def test_archive_survives_torn_last_line(tmp_path):
    d = tmp_path / "undo"
    w = archive.ArchiveWriter(str(d), job_id="j1", now=NOW)
    w.add([{"meta": {"statistic_id": "sensor.a"}, "columns": ["start_ts"], "rows": [[1.0]]}])
    w.close(complete=False)
    with gzip.open(w.path, "at", encoding="utf-8") as fh:
        fh.write('{"meta": {"statistic_id": "sensor.b"}, "colu')  # crash mid-write
    assert [r["meta"]["statistic_id"] for r in archive.read_archive(str(d), w.name)] == ["sensor.a"]


def test_archive_expiry(tmp_path):
    d = str(tmp_path / "undo")
    old = archive.ArchiveWriter(d, job_id="old", now=NOW - 40 * 86400)
    old.close()
    new = archive.ArchiveWriter(d, job_id="new", now=NOW)
    new.close()
    assert archive.expire_archives(d, 30 * 86400, now=NOW) == [old.name]
    assert [a["name"] for a in archive.list_archives(d)] == [new.name]


def test_plan_batches():
    items = [("a", 30_000), ("b", 30_000), ("c", 10_000), ("d", 5_000), ("e", 80_000), ("f", 1)]
    assert archive.plan_batches(items, 50_000) == [["a"], ["b", "c", "d"], ["e"], ["f"]]
    assert archive.plan_batches([], 10) == []
