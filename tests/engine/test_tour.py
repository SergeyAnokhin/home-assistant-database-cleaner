"""Keep the guided tour (frontend/tour.js) in sync with the panel markup (frontend/panel.js).

The tour highlights elements marked ``data-tour="…"``. If someone renames or removes such an
element, or adds a step without both languages, this test fails and says what to fix.
"""

from __future__ import annotations

import re
from pathlib import Path

FRONTEND = Path(__file__).resolve().parents[2] / "custom_components" / "database_cleaner" / "frontend"
TOUR = (FRONTEND / "tour.js").read_text(encoding="utf-8")
PANEL = (FRONTEND / "panel.js").read_text(encoding="utf-8")

TABS = {"overview", "candidates", "issues", "statistics", "states", "health", "maintenance"}


def _steps() -> list[str]:
    """Source text of every step object inside TOUR_STEPS."""
    block = TOUR.split("export const TOUR_STEPS = [", 1)[1].split("\n];", 1)[0]
    return re.split(r"\n  \{\n    id:", block)[1:]


def test_every_step_has_both_languages() -> None:
    steps = _steps()
    assert len(steps) >= 20
    for step in steps:
        name = re.match(r'\s*"([^"]+)"', step).group(1)
        assert re.search(r"\n    ru: \{\n      title:", step), f"step {name}: missing Russian text"
        assert re.search(r"\n    en: \{\n      title:", step), f"step {name}: missing English text"


def test_step_ids_are_unique() -> None:
    ids = re.findall(r'\n    id: "([^"]+)"', TOUR)
    assert len(ids) == len(set(ids)), "duplicate step id in tour.js"


def test_tour_targets_exist_in_panel_markup() -> None:
    marked = set(re.findall(r'data-tour="([a-z0-9-]+)"', PANEL))
    targets = set(re.findall(r'\n    target: "([^"]+)"', TOUR))
    missing = sorted(targets - marked)
    assert not missing, f'tour.js targets without data-tour="…" in panel.js: {missing}'


def test_tour_tabs_are_real_tabs() -> None:
    used = set(re.findall(r'\n    tab: "([^"]+)"', TOUR))
    assert used <= TABS, f"unknown tab in tour.js: {sorted(used - TABS)}"
    ui_sections = set(re.findall(r"\n      (\w+): \"[^\"]+\",", TOUR.split("const UI = {", 1)[1].split("};\n\n// ──", 1)[0]))
    assert TABS <= ui_sections, "tour.js UI.sections is missing a tab label"


def test_tour_prepare_keys_are_handled_by_panel() -> None:
    keys = set(re.findall(r'\n    prepare: "([^"]+)"', TOUR))
    for key in keys:
        assert f'key === "{key}"' in PANEL, f"panel.js tourPrepare() does not handle {key!r}"
