"""Sensors: chattiest entities (top N, last 24 h) and database health.

None of them sets ``state_class``: they must not create new long-term
statistics in the very database we are trying to keep small.
"""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import TYPE_CHECKING, Any

from homeassistant.components.sensor import SensorDeviceClass, SensorEntity, SensorEntityDescription
from homeassistant.const import EntityCategory, UnitOfInformation, UnitOfTime
from homeassistant.core import HomeAssistant
from homeassistant.helpers.device_registry import DeviceEntryType, DeviceInfo
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .const import DOMAIN, VERSION
from .coordinator import DatabaseCleanerCoordinator
from .engine import issues as engine_issues

if TYPE_CHECKING:
    from . import DatabaseCleanerConfigEntry

ROWS = "rows"
MIB = 1024 * 1024


def _mib(value: int | None) -> float | None:
    return None if value is None else round(value / MIB, 1)


def _iso(ts: float | None) -> str | None:
    return None if ts is None else datetime.fromtimestamp(ts, UTC).isoformat()


@dataclass(frozen=True, kw_only=True)
class DbSensorDescription(SensorEntityDescription):
    value_fn: Callable[[dict[str, Any]], Any]
    attrs_fn: Callable[[dict[str, Any]], dict[str, Any]] | None = None


DB_SENSORS: tuple[DbSensorDescription, ...] = (
    DbSensorDescription(
        key="states_last_hour",
        translation_key="states_last_hour",
        native_unit_of_measurement=ROWS,
        icon="mdi:database-arrow-down",
        value_fn=lambda d: d["chatty"]["total_1h"],
    ),
    DbSensorDescription(
        key="states_last_24h",
        translation_key="states_last_24h",
        native_unit_of_measurement=ROWS,
        icon="mdi:database-arrow-down-outline",
        value_fn=lambda d: d["chatty"]["total_24h"],
    ),
    DbSensorDescription(
        key="database_size",
        translation_key="database_size",
        device_class=SensorDeviceClass.DATA_SIZE,
        native_unit_of_measurement=UnitOfInformation.MEBIBYTES,
        suggested_display_precision=1,
        value_fn=lambda d: _mib(d["file"]["size"]),
    ),
    DbSensorDescription(
        key="wal_size",
        translation_key="wal_size",
        device_class=SensorDeviceClass.DATA_SIZE,
        native_unit_of_measurement=UnitOfInformation.MEBIBYTES,
        suggested_display_precision=1,
        entity_category=EntityCategory.DIAGNOSTIC,
        value_fn=lambda d: _mib(d["file"]["wal_size"]),
    ),
    DbSensorDescription(
        key="disk_free",
        translation_key="disk_free",
        device_class=SensorDeviceClass.DATA_SIZE,
        native_unit_of_measurement=UnitOfInformation.MEBIBYTES,
        suggested_unit_of_measurement=UnitOfInformation.GIBIBYTES,
        suggested_display_precision=1,
        value_fn=lambda d: _mib((d["file"].get("disk") or {}).get("free")),
    ),
    DbSensorDescription(
        key="lts_rows",
        translation_key="lts_rows",
        native_unit_of_measurement=ROWS,
        icon="mdi:chart-timeline-variant",
        value_fn=lambda d: d["lts_rows"],
    ),
    DbSensorDescription(
        key="statistics_issues",
        translation_key="statistics_issues",
        native_unit_of_measurement="issues",
        icon="mdi:alert-circle-outline",
        value_fn=lambda d: d["issues"]["problems"],
        attrs_fn=lambda d: {"total": d["issues"]["total"], **d["issues"]["codes"]},
    ),
    DbSensorDescription(
        key="recorder_backlog",
        translation_key="recorder_backlog",
        icon="mdi:tray-full",
        native_unit_of_measurement="tasks",
        entity_category=EntityCategory.DIAGNOSTIC,
        value_fn=lambda d: d["backlog"],
    ),
    DbSensorDescription(
        key="probe_latency",
        translation_key="probe_latency",
        device_class=SensorDeviceClass.DURATION,
        native_unit_of_measurement=UnitOfTime.MILLISECONDS,
        suggested_display_precision=1,
        entity_category=EntityCategory.DIAGNOSTIC,
        value_fn=lambda d: (d["probe"] or {}).get("total_ms"),
    ),
)


async def async_setup_entry(
    hass: HomeAssistant,
    entry: DatabaseCleanerConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    coordinator = entry.runtime_data.coordinator
    entities: list[SensorEntity] = [DbSensor(coordinator, d) for d in DB_SENSORS]
    entities += [ChattySensor(coordinator, rank) for rank in range(1, coordinator.top_n + 1)]
    async_add_entities(entities)


class _Base(CoordinatorEntity[DatabaseCleanerCoordinator], SensorEntity):
    _attr_has_entity_name = True

    def __init__(self, coordinator: DatabaseCleanerCoordinator, key: str) -> None:
        super().__init__(coordinator)
        entry_id = coordinator.config_entry.entry_id
        self._attr_unique_id = f"{entry_id}_{key}"
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, entry_id)},
            name="Database Cleaner",
            entry_type=DeviceEntryType.SERVICE,
            sw_version=VERSION,
        )


class DbSensor(_Base):
    entity_description: DbSensorDescription
    # Counters per problem code change often and are not worth keeping in history.
    _unrecorded_attributes = frozenset(engine_issues.ALL_CODES) | {"total"}

    def __init__(self, coordinator: DatabaseCleanerCoordinator, description: DbSensorDescription) -> None:
        super().__init__(coordinator, description.key)
        self.entity_description = description

    @property
    def native_value(self) -> Any:
        return self.entity_description.value_fn(self.coordinator.data)

    @property
    def extra_state_attributes(self) -> dict[str, Any] | None:
        attrs_fn = self.entity_description.attrs_fn
        return attrs_fn(self.coordinator.data) if attrs_fn else None


class ChattySensor(_Base):
    """Rank N of the entities that wrote the most `states` rows in the last 24 h.

    The state is the entity's name (so "who is the loudest?" is readable on a dashboard); the
    attributes say how loud: rows in the last 24 h / 7 d / 30 d and the average per hour for each.
    """

    _attr_translation_key = "chatty"
    _attr_icon = "mdi:account-voice"
    # Keep the leader's entity_id in history, but not the counters that change every update.
    _unrecorded_attributes = frozenset(
        {
            "top_entity_name",
            "updates_1h",
            "updates_24h",
            "updates_7d",
            "updates_30d",
            "updates_in_database",
            "per_hour_24h",
            "per_hour_7d",
            "per_hour_30d",
            "hourly_24h",
            "data_hours",
            "window_start",
            "distinct_states_24h",
            "share_of_all_24h",
            "lts_rows",
            "device",
            "integration",
            "area",
        }
    )

    def __init__(self, coordinator: DatabaseCleanerCoordinator, rank: int) -> None:
        super().__init__(coordinator, f"chatty_{rank}")
        self._rank = rank
        self._attr_translation_placeholders = {"rank": str(rank)}

    def _item(self) -> dict | None:
        top = self.coordinator.data["chatty"]["top"]
        return top[self._rank - 1] if len(top) >= self._rank else None

    @property
    def native_value(self) -> str | None:
        item = self._item()
        if item is None:
            return None
        return (item["name"] or item["entity_id"])[:255]  # a state is at most 255 characters

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        item = self._item()
        if item is None:
            return {}
        chatty = self.coordinator.data["chatty"]
        return {
            # not "entity_id": the frontend treats that attribute as group members
            "top_entity_id": item["entity_id"],
            "top_entity_name": item["name"],
            "updates_1h": item["count_1h"],
            "updates_24h": item["count_24h"],
            "updates_7d": item["count_7d"],
            "updates_30d": item["count_30d"],
            "updates_in_database": item["count_window"],
            "per_hour_24h": item["per_hour_24h"],
            "per_hour_7d": item["per_hour_7d"],
            "per_hour_30d": item["per_hour_30d"],
            # rows per hour, oldest first, last value = the latest hour: shows regular vs bursty
            "hourly_24h": item["hourly_24h"],
            # the database may hold less than 7 / 30 days: the rates above cover this span
            "data_hours": chatty["data_hours"],
            "window_start": _iso(chatty["window_start"]),
            "distinct_states_24h": item["distinct_states_24h"],
            "share_of_all_24h": item["share_of_all_24h"],
            "lts_rows": item["lts_rows"],
            "device": item["device"],
            "integration": item["integration"],
            "area": item["area"],
        }
