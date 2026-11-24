"""Build an engine Context from a copied Home Assistant ``.storage`` folder.

Dev / test helper only: inside Home Assistant the integration reads the live
registries instead (see ``custom_components/database_cleaner/registry.py``).
"""

from __future__ import annotations

import fnmatch
import json
from pathlib import Path

from engine.model import Context, EntityInfo  # noqa: I001 (path set up by caller)


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


def load_context(storage: Path, exclude_json: Path | None = None) -> Context:
    return Context(
        entities=load_entities(storage),
        is_recorded=recorder_filter(exclude_json) if exclude_json else None,
    )
