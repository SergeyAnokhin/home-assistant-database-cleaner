"""Live view: cursors, rows added since the last poll, who wrote them."""

from __future__ import annotations

import sqlite3

import pytest
from engine import Analyzer, Context, archive, backup

from .synthetic import NOW, build


@pytest.fixture
def db_path(tmp_path):
    return str(build(tmp_path / "home-assistant_v2.db"))


def test_live_snapshot_reports_new_rows(db_path):
    analyzer = Analyzer(db_path, clock=lambda: NOW)
    first = analyzer.live(Context(), None)
    assert first["added"] is None and first["top"] == []
    assert first["cursor"]["states"] == 159 and first["cursor"]["events"] == 30  # one id per fixture row
    assert first["size"] > 0

    conn = sqlite3.connect(db_path)
    mid = conn.execute("SELECT metadata_id FROM states_meta WHERE entity_id = 'sensor.healthy_temp'").fetchone()[0]
    conn.executemany(
        "INSERT INTO states (state, last_updated_ts, attributes_id, metadata_id) VALUES ('1', ?, 1, ?)",
        [(NOW, mid)] * 5,
    )
    conn.execute("INSERT INTO events (time_fired_ts, event_type_id) VALUES (?, 1)", (NOW,))
    conn.commit()
    conn.close()

    second = analyzer.live(Context(), first["cursor"])
    assert second["added"] == {"states": 5, "events": 1, "short_term": 0, "statistics": 0}
    assert [(t["entity_id"], t["rows"]) for t in second["top"]] == [("sensor.healthy_temp", 5)]
    assert second["top_events"] == [{"event_type": "state_changed", "rows": 1}]
    # polling again without new rows adds nothing
    third = analyzer.live(Context(), second["cursor"])
    assert third["added"]["states"] == 0 and third["top"] == []


def test_live_cursor_from_a_replaced_database_starts_over(db_path):
    analyzer = Analyzer(db_path, clock=lambda: NOW)
    res = analyzer.live(Context(), {"states": 10_000_000, "events": 5})
    assert res["added"]["states"] == 0  # a cursor ahead of the database means it was replaced


def test_archive_file_and_delete(tmp_path):
    d = tmp_path / "undo"
    d.mkdir()
    name = "undo-20260101-000000-abcd1234.jsonl.gz"
    (d / name).write_bytes(b"x")
    (d / (name + ".json")).write_text("{}")
    assert archive.archive_file(str(d), name) == d / name
    for bad in ("../x", "other.gz", "undo-x.txt"):
        with pytest.raises(archive.ArchiveError):
            archive.archive_file(str(d), bad)
        with pytest.raises(archive.ArchiveError):
            archive.delete_archive(str(d), bad)
    assert archive.delete_archive(str(d), name) is True
    assert not (d / name).exists() and not (d / (name + ".json")).exists()
    with pytest.raises(archive.ArchiveError):
        archive.delete_archive(str(d), name)  # already gone


def test_backup_file_refuses_foreign_names(tmp_path):
    dest = tmp_path / "b"
    dest.mkdir()
    (dest / "important.db").write_text("x")
    with pytest.raises(backup.BackupError):
        backup.backup_file(str(dest), "important.db")
    with pytest.raises(backup.BackupError):
        backup.backup_file(str(dest), "../home-assistant_v2-x.db")
