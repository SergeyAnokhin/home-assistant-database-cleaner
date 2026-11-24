"""Where is each statistic used? Energy, dashboards, automations, scripts, scenes, groups, persons, helpers.

Read-only. Every source is optional: if one fails (integration not loaded,
internal API changed) it is reported in ``sources["errors"]`` and the others
still count. A statistic referenced nowhere we can see is "unused", never
"safe": templates in YAML, Node-RED, AppDaemon or Grafana are invisible here.
"""

from __future__ import annotations

import logging
import time
from collections.abc import Callable, Iterable
from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.helpers import entity_registry as er

from .const import DOMAIN
from .engine.candidates import entity_tokens

_LOGGER = logging.getLogger(__name__)
CACHE_TTL_S = 300


def _finders() -> list[tuple[str, Callable[[HomeAssistant, str], list[str]]]]:
    finders: list[tuple[str, Callable[[HomeAssistant, str], list[str]]]] = []
    try:
        from homeassistant.components.automation import automations_with_entity  # noqa: PLC0415

        finders.append(("automation", automations_with_entity))
    except ImportError:
        pass
    try:
        from homeassistant.components.script import scripts_with_entity  # noqa: PLC0415

        finders.append(("script", scripts_with_entity))
    except ImportError:
        pass
    try:
        from homeassistant.components.homeassistant.scene import scenes_with_entity  # noqa: PLC0415

        finders.append(("scene", scenes_with_entity))
    except ImportError:
        pass
    try:
        from homeassistant.components.group import groups_with_entity  # noqa: PLC0415

        finders.append(("group", groups_with_entity))
    except ImportError:
        pass
    try:
        from homeassistant.components.person import persons_with_entity  # noqa: PLC0415

        finders.append(("person", persons_with_entity))
    except ImportError:
        pass
    return finders


def _raw_config_refs(hass: HomeAssistant, domain: str) -> list[tuple[str, set[str]]]:
    """(entity_id, tokens) from automations/scripts raw configs.

    ``automations_with_entity`` only knows entities from triggers/conditions/
    targets; entities mentioned inside templates are found here.
    """
    component = hass.data.get(domain)
    out = []
    for entity in getattr(component, "entities", ()):
        raw = getattr(entity, "raw_config", None)
        if raw:
            out.append((entity.entity_id, entity_tokens(raw)))
    return out


async def _energy_ids(hass: HomeAssistant) -> set[str]:
    if "energy" not in hass.config.components:
        return set()
    from homeassistant.components.energy.data import async_get_manager  # noqa: PLC0415

    manager = await async_get_manager(hass)
    return entity_tokens(manager.data or {})


async def _dashboards(hass: HomeAssistant) -> list[tuple[str, set[str]]]:
    from homeassistant.components.lovelace.const import LOVELACE_DATA  # noqa: PLC0415
    from homeassistant.components.lovelace.dashboard import ConfigNotFound  # noqa: PLC0415

    data = hass.data.get(LOVELACE_DATA)
    if data is None:
        return []
    out = []
    for url, dashboard in list(data.dashboards.items()):
        try:
            config = await dashboard.async_load(False)
        except ConfigNotFound:
            continue
        meta = getattr(dashboard, "config", None) or {}
        title = meta.get("title") or url or "Overview"
        out.append((str(title), entity_tokens(config)))
    return out


async def async_collect_usage(
    hass: HomeAssistant, statistic_ids: Iterable[str]
) -> tuple[dict[str, list[str]], dict[str, Any]]:
    wanted = {sid for sid in statistic_ids if "." in sid and ":" not in sid}
    refs: dict[str, set[str]] = {}
    errors: list[str] = []
    sources: dict[str, Any] = {}

    def add(ids: Iterable[str], ref: str) -> None:
        for eid in ids:
            if eid in wanted:
                refs.setdefault(eid, set()).add(ref)

    try:
        energy = await _energy_ids(hass)
        add(energy, "energy")
        sources["energy"] = len(energy & wanted)
    except Exception as err:  # noqa: BLE001 - one broken source must not hide the others
        errors.append(f"energy: {err}")
        sources["energy"] = None

    try:
        dashboards = await _dashboards(hass)
        for title, ids in dashboards:
            add(ids, f"dashboard:{title}")
        sources["dashboards"] = len(dashboards)
    except Exception as err:  # noqa: BLE001
        errors.append(f"dashboards: {err}")
        sources["dashboards"] = None

    for kind, finder in _finders():
        try:
            for eid in wanted:
                for ref in finder(hass, eid):
                    refs.setdefault(eid, set()).add(f"{kind}:{ref}")
            if kind in ("automation", "script"):
                for owner, ids in _raw_config_refs(hass, kind):
                    add(ids - {owner}, f"{kind}:{owner}")
            sources[f"{kind}s"] = len(hass.states.async_entity_ids(kind))
        except Exception as err:  # noqa: BLE001
            errors.append(f"{kind}: {err}")
            sources[f"{kind}s"] = None

    try:
        ent_reg = er.async_get(hass)
        helpers = 0
        for entry in hass.config_entries.async_entries():
            if entry.domain == DOMAIN:
                continue
            ids = entity_tokens({"o": dict(entry.options), "d": dict(entry.data)}) & wanted
            # an entry mentioning its own entities is not a "use"
            ids = {
                eid
                for eid in ids
                if not ((reg := ent_reg.async_get(eid)) and reg.config_entry_id == entry.entry_id)
            }
            if ids:
                helpers += 1
                add(ids, f"helper:{entry.domain}:{entry.title}")
        sources["helpers"] = helpers
    except Exception as err:  # noqa: BLE001
        errors.append(f"helpers: {err}")
        sources["helpers"] = None

    if errors:
        _LOGGER.debug("Usage scan incomplete: %s", errors)
    sources["errors"] = errors
    return {k: sorted(v) for k, v in refs.items()}, sources


class UsageCache:
    """Avoid rescanning dashboards/automations on every panel request."""

    def __init__(self) -> None:
        self._value: tuple[dict[str, list[str]], dict[str, Any]] | None = None
        self._at = 0.0

    async def async_get(
        self, hass: HomeAssistant, statistic_ids: Iterable[str], *, refresh: bool = False
    ) -> tuple[dict[str, list[str]], dict[str, Any]]:
        if refresh or self._value is None or time.monotonic() - self._at > CACHE_TTL_S:
            self._value = await async_collect_usage(hass, statistic_ids)
            self._at = time.monotonic()
        return self._value
