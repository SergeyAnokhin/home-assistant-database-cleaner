"""Build an engine Context from a copied Home Assistant ``.storage`` folder.

Dev / test helper only: inside Home Assistant the integration reads the live
registries instead (see ``custom_components/database_cleaner/registry.py``).
"""

from __future__ import annotations

import fnmatch
import json
from pathlib import Path

from engine.candidates import entity_tokens  # noqa: I001 (path set up by caller)
from engine.model import Context, EntityInfo


def _load(storage: Path, name: str) -> dict:
    path = storage / name
    if not path.exists():
        return {}
    return json.loads(path.read_text(encoding="utf-8")).get("data", {})


def load_entities(storage: Path) -> dict[str, EntityInfo]:
    areas = {a["id"]: a.get("name") for a in _load(storage, "core.area_registry").get("areas", [])}
    devices = {d["id"]: d for d in _load(storage, "core.device_registry").get("devices", [])}
    out: dict[str, EntityInfo] = {}
    for e in _load(storage, "core.entity_registry").get("entities", []):
        dev = devices.get(e.get("device_id") or "")
        area_id = e.get("area_id") or (dev or {}).get("area_id")
        out[e["entity_id"]] = EntityInfo(
            entity_id=e["entity_id"],
            name=e.get("name") or e.get("original_name"),
            integration=e.get("platform"),
            device_id=e.get("device_id"),
            device_name=(dev.get("name_by_user") or dev.get("name")) if dev else None,
            area=areas.get(area_id) if area_id else None,
            disabled=e.get("disabled_by") is not None,
            entity_category=e.get("entity_category"),
            registered=True,
        )
    return out


def recorder_filter(path: Path):
    """Exclude-only recorder filter from a JSON file shaped like ``recorder: exclude:``."""
    if not path.exists():
        return None
    cfg = json.loads(path.read_text(encoding="utf-8"))
    domains = set(cfg.get("domains", []))
    entities = set(cfg.get("entities", []))
    globs = list(cfg.get("entity_globs", []))

    def is_recorded(entity_id: str) -> bool:
        if entity_id in entities or entity_id.split(".", 1)[0] in domains:
            return False
        return not any(fnmatch.fnmatchcase(entity_id, g) for g in globs)

    return is_recorded


def load_usage(storage: Path) -> tuple[dict[str, list[str]], dict]:
    """References from what a .storage copy contains: energy, UI dashboards, helper config entries.

    Automations/scripts/scenes live in YAML and are not part of .storage, so
    they are reported as not scanned (inside HA the integration scans them).
    """
    refs: dict[str, set[str]] = {}

    def add(ids: set[str], ref: str) -> None:
        for eid in ids:
            refs.setdefault(eid, set()).add(ref)

    energy = _load(storage, "energy")
    energy_ids = entity_tokens(energy)
    add(energy_ids, "energy")

    titles = {d.get("url_path"): d.get("title") for d in _load(storage, "lovelace_dashboards").get("items", [])}
    dashboards = 0
    for path in sorted(storage.glob("lovelace*")):
        if path.name in ("lovelace_dashboards", "lovelace_resources"):
            continue
        url = path.name.split(".", 1)[1] if "." in path.name else None
        title = titles.get(url) or url or "Overview"
        add(entity_tokens(_load(storage, path.name)), f"dashboard:{title}")
        dashboards += 1

    helpers = 0
    for entry in _load(storage, "core.config_entries").get("entries", []):
        ids = entity_tokens({"o": entry.get("options"), "d": entry.get("data")})
        if ids:
            helpers += 1
            add(ids, f"helper:{entry['domain']}:{entry.get('title') or entry['domain']}")

    sources = {
        "energy": len(energy_ids),
        "dashboards": dashboards,
        "helpers": helpers,
        "automations": None,
        "scripts": None,
        "scenes": None,
        "groups": None,
        "persons": None,
        "errors": [],
    }
    return {k: sorted(v) for k, v in refs.items()}, sources


def load_context(storage: Path, exclude_json: Path | None = None, *, usage: bool = False) -> Context:
    ctx = Context(
        entities=load_entities(storage),
        is_recorded=recorder_filter(exclude_json) if exclude_json else None,
    )
    if usage:
        ctx.usage, ctx.usage_sources = load_usage(storage)
    return ctx
