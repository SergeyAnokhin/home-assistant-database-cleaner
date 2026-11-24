"""Plain data types shared by the engine, the integration and the dev server."""

from __future__ import annotations

from collections.abc import Callable, Mapping
from dataclasses import dataclass, field


@dataclass(frozen=True, slots=True)
class EntityInfo:
    """What the registries know about one entity_id."""

    entity_id: str
    name: str | None = None
    integration: str | None = None
    device_id: str | None = None
    device_name: str | None = None
    area: str | None = None
    disabled: bool = False
    entity_category: str | None = None  # "diagnostic" | "config" | None
    registered: bool = True  # False: known only from the state machine (YAML, no unique_id)


@dataclass(slots=True)
class Context:
    """Registry snapshot + recorder filter, built on the event loop."""

    entities: Mapping[str, EntityInfo] = field(default_factory=dict)
    # recorder entity filter: True -> entity is recorded. None -> no filter configured.
    is_recorded: Callable[[str], bool] | None = None
    # statistic_id -> references like "energy", "dashboard:Home", "automation:automation.x".
    # None -> usage was not collected (no verdicts are produced).
    usage: Mapping[str, list[str]] | None = None
    # What was scanned to build `usage` (shown in the UI as coverage).
    usage_sources: dict | None = None

    def info(self, entity_id: str) -> EntityInfo | None:
        return self.entities.get(entity_id)

    def recorded(self, entity_id: str) -> bool:
        if self.is_recorded is None:
            return True
        try:
            return bool(self.is_recorded(entity_id))
        except Exception:  # noqa: BLE001 - a broken filter must not break analytics
            return True


def describe(entity_id: str, ctx: Context) -> dict:
    """Registry fields attached to every analytics row."""
    info = ctx.info(entity_id)
    domain = entity_id.split(".", 1)[0] if "." in entity_id else ""
    if info is None:
        return {
            "name": None,
            "domain": domain,
            "integration": None,
            "device_id": None,
            "device": None,
            "area": None,
            "disabled": False,
            "diagnostic": False,
            "registered": False,
        }
    return {
        "name": info.name,
        "domain": domain,
        "integration": info.integration,
        "device_id": info.device_id,
        "device": info.device_name,
        "area": info.area,
        "disabled": info.disabled,
        "diagnostic": info.entity_category == "diagnostic",
        "registered": info.registered,
    }
