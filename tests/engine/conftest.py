"""Engine tests run without Home Assistant (plain pytest, Python >= 3.12)."""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
# `engine` is imported as a top-level package so the integration's __init__
# (which needs Home Assistant) is never executed.
sys.path.insert(0, str(ROOT / "custom_components" / "database_cleaner"))
sys.path.insert(0, str(ROOT))

REAL_DIR = ROOT / "gitignore"
REAL_DB = REAL_DIR / "home-assistant_v2.db"
