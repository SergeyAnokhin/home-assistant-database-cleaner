"""Problems with entities and long-term statistics: Home Assistant's own checks + ours.

Read-only. Every source is optional: if one fails (internal API moved, recorder busy) it is
reported in ``sources["errors"]`` and the others still count.

* ``validate_statistics`` is what Developer tools -> Statistics shows;
* open Repairs issues only mark the matching entries (``in_repairs``);
* our own checks (``engine/issues.py``) work on a snapshot of the sensor states, the long-term
  statistics list (with usage references) and one SQL probe for cumulative-sum dips.
"""

from __future__ import annotations

import logging
import time
from functools import partial
from typing import TYPE_CHECKING, Any

from homeassistant.components.recorder import get_instance
from homeassistant.core import HomeAssistant
from homeassistant.helpers import issue_registry as ir

from .engine import issues as engine
from .registry import async_build_context

if TYPE_CHECKING:
    from . import DatabaseCleanerData

_LOGGER = logging.getLogger(__name__)
CACHE_TTL_S = 600
REPAIR_DOMAINS = ("sensor", "recorder")


def _plain(value: Any) -> Any:
    return None if value is None else str(value)


def _rules() -> tuple[dict[str, set], dict[str, set]]:
    """device_class -> allowed units / state classes (plain strings)."""
    from homeassistant.components.sensor.const import (  # noqa: PLC0415
        DEVICE_CLASS_STATE_CLASSES,
        DEVICE_CLASS_UNITS,
    )

    units = {str(dc): {_plain(u) for u in allowed} for dc, allowed in DEVICE_CLASS_UNITS.items()}
    classes = {str(dc): {str(c) for c in allowed} for dc, allowed in DEVICE_CLASS_STATE_CLASSES.items()}
    return units, classes


def _snapshot(hass: HomeAssistant, statistic_ids: set[str]) -> dict[str, dict]:
    """Sensors (and any entity that has statistics) as plain dicts. Event loop only."""
    out: dict[str, dict] = {}

    def add(state) -> None:
        attrs = state.attributes
        out[state.entity_id] = {
            "state": state.state,
            "state_class": _plain(attrs.get("state_class")),
            "device_class": _plain(attrs.get("device_class")),
            "unit": _plain(attrs.get("unit_of_measurement")),
            "name": state.name,
            "last_changed_ts": state.last_changed.timestamp(),
        }

    for state in hass.states.async_all("sensor"):
        add(state)
    for sid in statistic_ids:
        if sid not in out and (state := hass.states.get(sid)) is not None:
            add(state)
    return out


async def async_collect_ha_issues(hass: HomeAssistant) -> tuple[list[dict], list[str]]:
    """Home Assistant's own findings (cheap; also used by the sensor)."""
    errors: list[str] = []
    found: list[dict] = []
    try:
        from homeassistant.components.recorder.statistics import validate_statistics  # noqa: PLC0415

        result = await get_instance(hass).async_add_executor_job(validate_statistics, hass)
        reg = ir.async_get(hass)
        repairs = [issue.issue_id for issue in reg.issues.values() if issue.domain in REPAIR_DOMAINS]
        found = engine.from_validation({sid: [i.as_dict() for i in lst] for sid, lst in result.items()}, repairs)
    except Exception as err:  # noqa: BLE001 - a moved internal API must not break the tab
        errors.append(f"validate_statistics: {err}")
    return found, errors


async def async_collect_issues(
    hass: HomeAssistant, data: DatabaseCleanerData, periods_days: list[int], *, refresh: bool = False
) -> dict:
    instance = get_instance(hass)
    errors: list[str] = []
    ctx = async_build_context(hass, instance.entity_filter)

    statistic_ids = await hass.async_add_executor_job(data.analyzer.statistic_ids)
    ctx.usage, ctx.usage_sources = await data.usage.async_get(hass, statistic_ids, refresh=refresh)
    stats = await hass.async_add_executor_job(
        partial(data.analyzer.statistics, ctx, periods_days, refresh=refresh)
    )
    items = stats["items"]

    ha_issues, ha_errors = await async_collect_ha_issues(hass)
    errors += ha_errors

    own: list[dict] = []
    states = _snapshot(hass, set(statistic_ids))
    try:
        unit_rules, class_rules = _rules()
        meters = [
            sid for sid, st in states.items() if st["state_class"] == "total_increasing" and sid in set(statistic_ids)
        ]
        drops = await hass.async_add_executor_job(partial(data.analyzer.sum_drops, meters, refresh=refresh))
        own = engine.evaluate(
            states,
            items,
            unit_rules=unit_rules,
            state_class_rules=class_rules,
            sum_drops=drops,
            recorded=ctx.recorded,
            now=time.time(),
        )
    except Exception as err:  # noqa: BLE001
        errors.append(f"own checks: {err}")
        _LOGGER.debug("Own statistics checks failed", exc_info=True)

    names = {eid: st["name"] for eid, st in states.items()}
    merged = engine.merge([*ha_issues, *own], items, names)
    return {
        **merged,
        "sources": {
            "usage": ctx.usage_sources,
            "sensors": len(states),
            "statistics": len(items),
            "errors": errors,
        },
        "computed_at": time.time(),
    }


class IssuesCache:
    """Computing the list reads every statistic and every sensor: do it at most every few minutes."""

    def __init__(self) -> None:
        self._value: dict | None = None
        self._at = 0.0

    def invalidate(self) -> None:
        self._value = None

    async def async_get(
        self, hass: HomeAssistant, data: DatabaseCleanerData, periods_days: list[int], *, refresh: bool = False
    ) -> dict:
        if refresh or self._value is None or time.monotonic() - self._at > CACHE_TTL_S:
            self._value = await async_collect_issues(hass, data, periods_days, refresh=refresh)
            self._at = time.monotonic()
        return {**self._value, "age_s": round(time.monotonic() - self._at, 1)}
