"""Small recorder-schema database (subset of schema 53) for engine tests."""

from __future__ import annotations

import sqlite3
from pathlib import Path

SCHEMA = """
CREATE TABLE schema_changes (change_id INTEGER PRIMARY KEY, schema_version INTEGER, changed DATETIME);
CREATE TABLE recorder_runs (run_id INTEGER PRIMARY KEY, start DATETIME, "end" DATETIME,
    closed_incorrect BOOLEAN, created DATETIME);
CREATE TABLE states_meta (metadata_id INTEGER PRIMARY KEY, entity_id VARCHAR(255));
CREATE TABLE state_attributes (attributes_id INTEGER PRIMARY KEY, hash BIGINT, shared_attrs TEXT);
CREATE TABLE states (state_id INTEGER PRIMARY KEY, state VARCHAR(255), last_updated_ts FLOAT,
    old_state_id INTEGER, attributes_id INTEGER, metadata_id INTEGER);
CREATE INDEX ix_states_last_updated_ts ON states (last_updated_ts);
CREATE INDEX ix_states_metadata_id_last_updated_ts ON states (metadata_id, last_updated_ts);
CREATE TABLE event_types (event_type_id INTEGER PRIMARY KEY, event_type VARCHAR(64));
CREATE TABLE events (event_id INTEGER PRIMARY KEY, time_fired_ts FLOAT, event_type_id INTEGER);
CREATE TABLE statistics_meta (id INTEGER PRIMARY KEY, statistic_id VARCHAR(255), source VARCHAR(32),
    unit_of_measurement VARCHAR(255), has_mean BOOLEAN, has_sum BOOLEAN, name VARCHAR(255),
    mean_type INTEGER NOT NULL DEFAULT 0, unit_class VARCHAR(255));
CREATE TABLE statistics (id INTEGER PRIMARY KEY, metadata_id INTEGER, start_ts FLOAT,
    mean FLOAT, min FLOAT, max FLOAT, state FLOAT, sum FLOAT);
CREATE UNIQUE INDEX ix_statistics_statistic_id_start_ts ON statistics (metadata_id, start_ts);
CREATE TABLE statistics_short_term (id INTEGER PRIMARY KEY, metadata_id INTEGER, start_ts FLOAT,
    mean FLOAT, min FLOAT, max FLOAT, state FLOAT, sum FLOAT);
"""

NOW = 1_800_000_000.0  # fixed "now" for deterministic tests
HOUR = 3600
DAY = 86400

# statistic_id, source, hours of LTS, hours since last row
STATISTICS = [
    ("sensor.healthy_temp", "recorder", 24 * 400, 1),
    ("sensor.gone_forever", "recorder", 24 * 100, 24 * 200),  # orphan
    ("sensor.disabled_power", "recorder", 24 * 50, 24 * 10),  # disabled
    ("sensor.yaml_mean", "recorder", 24 * 10, 1),  # has states, not registered
    ("sensor.stopped_signal", "recorder", 24 * 20, 24 * 5),  # alive but LTS stopped
    ("sensor.quiet_hum", "recorder", 24 * 3, 24 * 3),  # registered, no states, excluded
    ("sensor.no_states_power", "recorder", 24 * 2, 24 * 2),  # registered, enabled, no states
    ("ext:imported_gas", "ext", 24, 1),  # external
]

# entity_id -> list of (seconds ago) state rows
STATES = {
    "sensor.healthy_temp": [i * 60 for i in range(120)],  # 1/min for 2 h
    "sensor.yaml_mean": [i * 3600 for i in range(30)],  # 1/h for 30 h
    "sensor.stopped_signal": [10, 20, 30, 4000],
    "binary_sensor.door": [5, 6, 7, 8, 100_000],
}


def build(path: Path) -> Path:
    conn = sqlite3.connect(path)
    conn.executescript(SCHEMA)
    conn.execute("INSERT INTO schema_changes VALUES (1, 53, '2026-01-01')")
    conn.execute("INSERT INTO recorder_runs VALUES (1, '2026-01-01', '2026-01-02', 1, '2026-01-01')")
    conn.execute("INSERT INTO recorder_runs VALUES (2, '2026-01-02', NULL, 0, '2026-01-02')")

    for mid, (sid, source, hours, ago_h) in enumerate(STATISTICS, start=1):
        conn.execute(
            "INSERT INTO statistics_meta (id, statistic_id, source, unit_of_measurement, has_sum, name)"
            " VALUES (?, ?, ?, 'W', 0, NULL)",
            (mid, sid, source),
        )
        last = (NOW // HOUR) * HOUR - ago_h * HOUR
        conn.executemany(
            "INSERT INTO statistics (metadata_id, start_ts, mean) VALUES (?, ?, 1.0)",
            [(mid, last - h * HOUR) for h in range(hours)],
        )
        if ago_h <= 1:
            conn.executemany(
                "INSERT INTO statistics_short_term (metadata_id, start_ts, mean) VALUES (?, ?, 1.0)",
                [(mid, NOW - 300 * (k + 1)) for k in range(12)],
            )

    conn.execute("INSERT INTO state_attributes VALUES (1, 1, '{}')")
    for mid, (entity_id, ages) in enumerate(STATES.items(), start=1):
        conn.execute("INSERT INTO states_meta VALUES (?, ?)", (mid, entity_id))
        conn.executemany(
            "INSERT INTO states (state, last_updated_ts, attributes_id, metadata_id) VALUES (?, ?, 1, ?)",
            [("unavailable" if k == 0 and entity_id == "binary_sensor.door" else str(k % 3), NOW - a, mid)
             for k, a in enumerate(ages)],
        )

    conn.execute("INSERT INTO event_types VALUES (1, 'state_changed'), (2, 'telegram_sent')")
    conn.executemany(
        "INSERT INTO events (time_fired_ts, event_type_id) VALUES (?, ?)",
        [(NOW - 10 * k, 2 if k % 3 else 1) for k in range(30)],
    )
    conn.commit()
    conn.close()
    return path
