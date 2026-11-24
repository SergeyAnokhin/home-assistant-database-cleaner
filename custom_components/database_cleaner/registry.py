"""Snapshot of HA registries for the engine (must run on the event loop)."""

from __future__ import annotations

from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers import area_registry as ar
from homeassistant.helpers import device_registry as dr
from homeassistant.helpers import entity_registry as er

from .engine import Context, EntityInfo


@callback
def async_build_context(hass: HomeAssistant, entity_filter=None) -> Context:
    ent_reg = er.async_get(hass)
    dev_reg = dr.async_get(hass)
    area_reg = ar.async_get(hass)

    def area_name(area_id: str | None) -> str | None:
        if not area_id:
            return None
        area = area_reg.async_get_area(area_id)
        return area.name if area else None

    entities: dict[str, EntityInfo] = {}
    for entry in ent_reg.entities.values():
        device = dev_reg.async_get(entry.device_id) if entry.device_id else None
        state = hass.states.get(entry.entity_id)
        name = state.name if state else (entry.name or entry.original_name)
        category = entry.entity_category
        entities[entry.entity_id] = EntityInfo(
            entity_id=entry.entity_id,
            name=name,
            integration=entry.platform,
            device_id=entry.device_id,
            device_name=(device.name_by_user or device.name) if device else None,
            area=area_name(entry.area_id or (device.area_id if device else None)),
            disabled=entry.disabled_by is not None,
            entity_category=getattr(category, "value", category),
            registered=True,
        )

    # Entities without a registry entry (YAML without unique_id): state machine only.
    for state in hass.states.async_all():
        if state.entity_id not in entities:
            entities[state.entity_id] = EntityInfo(
                entity_id=state.entity_id, name=state.name, registered=False
            )

    return Context(entities=entities, is_recorded=entity_filter)
