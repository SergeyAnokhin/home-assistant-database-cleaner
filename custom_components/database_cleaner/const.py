"""Constants for Database Cleaner."""

from __future__ import annotations

from typing import Final

DOMAIN: Final = "database_cleaner"
VERSION: Final = "0.3.0"

PANEL_URL_PATH: Final = "database-cleaner"
PANEL_COMPONENT: Final = "database-cleaner-panel"
PANEL_ICON: Final = "mdi:database-cog"
PANEL_TITLE: Final = "Database Cleaner"
STATIC_URL: Final = "/database_cleaner_static"

# Options
CONF_STATE_WINDOWS: Final = "state_windows"  # hours, as strings (selector values)
CONF_LTS_PERIODS: Final = "lts_periods"  # days, as strings
CONF_TOP_N: Final = "top_n"
CONF_SENSOR_TOP_N: Final = "sensor_top_n"
CONF_UPDATE_MINUTES: Final = "update_minutes"
CONF_CACHE_HOURS: Final = "cache_hours"

# Maintenance options
CONF_BACKUP_DIR: Final = "backup_dir"  # "" -> automatic (/share/database_cleaner or <config>/database_cleaner)
CONF_BACKUPS_KEEP: Final = "backups_keep"
CONF_BACKUP_MAX_AGE_H: Final = "backup_max_age_hours"
CONF_BATCH_ROWS: Final = "batch_rows"
CONF_BATCH_PAUSE_S: Final = "batch_pause_s"
CONF_BACKLOG_LIMIT: Final = "backlog_limit"
CONF_UNDO_DAYS: Final = "undo_days"

# Destructive jobs are allowed only on recorder schemas this version was tested with.
MIN_SCHEMA_VERSION: Final = 48
MAX_TESTED_SCHEMA_VERSION: Final = 53

STATE_WINDOW_CHOICES: Final = ["1", "6", "24", "72", "168"]
LTS_PERIOD_CHOICES: Final = ["7", "30", "90", "180", "365", "730"]

DEFAULT_OPTIONS: Final = {
    CONF_STATE_WINDOWS: ["1", "24", "168"],
    CONF_LTS_PERIODS: ["30", "90", "365"],
    CONF_TOP_N: 10,
    CONF_SENSOR_TOP_N: 5,
    CONF_UPDATE_MINUTES: 10,
    CONF_CACHE_HOURS: 6,
    CONF_BACKUP_DIR: "",
    CONF_BACKUPS_KEEP: 2,
    CONF_BACKUP_MAX_AGE_H: 24,
    CONF_BATCH_ROWS: 50_000,
    CONF_BATCH_PAUSE_S: 1,
    CONF_BACKLOG_LIMIT: 1000,
    CONF_UNDO_DAYS: 30,
}
