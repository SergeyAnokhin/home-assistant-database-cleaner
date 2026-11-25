"""The "how to fix" guides of the Problems tab (frontend/guides.js) cover every problem code."""

from __future__ import annotations

import json
import re
import shutil
import subprocess
from pathlib import Path

import pytest
from engine import issues

FRONTEND = Path(__file__).resolve().parents[2] / "custom_components" / "database_cleaner" / "frontend"
GUIDES = (FRONTEND / "guides.js").read_text(encoding="utf-8")
PANEL = (FRONTEND / "panel.js").read_text(encoding="utf-8")


def test_every_problem_code_has_a_guide() -> None:
    block = GUIDES.split("const BUILDERS = {", 1)[1].split("\n};", 1)[0]
    codes = set(re.findall(r"^  (\w+)\(c\) \{", block, flags=re.M))
    assert codes == set(issues.ALL_CODES), f"guides.js and engine/issues.py disagree: {codes ^ set(issues.ALL_CODES)}"


def test_guide_icons_exist_in_the_panel_dictionary() -> None:
    mdi = PANEL.split("const MDI = {", 1)[1].split("\n};", 1)[0]
    keys = set(re.findall(r"^  (\w+):", mdi, flags=re.M))
    used = set(re.findall(r'icon: "([a-z_]+)"', GUIDES))
    assert used and used <= keys, f"icons missing in panel.js: {sorted(used - keys)}"


@pytest.mark.skipif(shutil.which("node") is None, reason="node is not installed")
def test_guides_render_for_every_code_in_both_languages() -> None:
    script = f"""
    import {{ buildGuide, GUIDE_CODES }} from {json.dumps((FRONTEND / "guides.js").as_uri())};
    const out = [];
    for (const lang of ["ru", "en"]) for (const code of GUIDE_CODES) {{
      const issue = {{ code, statistic_id: "sensor.demo_energy", name: "Demo", integration: "template", registered: true,
        refs: ["dashboard:Home"], rows: 10, entity: {{ device_class: "energy", unit: "J", state_class: null }},
        data: {{ unit: "J", device_class: "energy", allowed: ["Wh", "kWh"], state_class: "measurement", state: "abc",
                 numeric: false, reason: "not_numeric", count: 2, biggest: 1.5, first_ts: 1, last_ts: 2, fields: ["has_sum"],
                 state_unit: "kWh", metadata_unit: "Wh" }} }};
      const g = buildGuide(issue, lang);
      if (!g.intro || !g.options.length) throw new Error(`empty guide ${{lang}}/${{code}}`);
      out.push(JSON.stringify(g));
    }}
    const text = out.join(" ");
    if (!text.includes("sensor.demo_energy")) throw new Error("entity id is not filled in");
    if (!text.includes('unit_of_measurement: kWh') && !text.includes('unit_of_measurement: Wh')) throw new Error("unit is not filled in");
    if (text.includes("undefined")) throw new Error("undefined leaked into a guide");
    console.log("ok", out.length);
    """
    res = subprocess.run(["node", "--input-type=module", "-e", script], capture_output=True, text=True, timeout=60)
    assert res.returncode == 0, res.stderr
    assert res.stdout.startswith("ok 28")
