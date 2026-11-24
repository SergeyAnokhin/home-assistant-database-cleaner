"""Home Assistant integration tests (need the .venv with pytest-homeassistant-custom-component)."""

from __future__ import annotations

import pytest

# pytest_homeassistant_custom_component registers itself as a pytest plugin
# (entry point), so no `pytest_plugins` declaration is needed here.


@pytest.fixture
def recorder_db_url(tmp_path) -> str:
    # The integration only supports file-based SQLite, never the in-memory default.
    return f"sqlite:///{tmp_path / 'home-assistant_v2.db'}"


@pytest.fixture(autouse=True)
def auto_enable_custom_integrations(enable_custom_integrations):
    yield
