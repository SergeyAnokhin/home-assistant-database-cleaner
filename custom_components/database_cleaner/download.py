"""Download of a backup or an undo archive ("Save to this computer").

A browser cannot send the WebSocket token with a plain link, so the panel first asks for a signed
URL (``database_cleaner/download/sign``, admin only, valid a few minutes) and then opens it. The
view itself is authenticated too and checks that the user is an administrator.
"""

from __future__ import annotations

from aiohttp import web

from homeassistant.core import HomeAssistant
from homeassistant.exceptions import Unauthorized

try:  # newer Home Assistant
    from homeassistant.helpers.http import KEY_HASS, HomeAssistantView
except ImportError:  # pragma: no cover - older Home Assistant
    from homeassistant.components.http import KEY_HASS, HomeAssistantView

from . import maintenance
from .const import DEFAULT_OPTIONS, DOMAIN
from .engine import archive, backup

DOWNLOAD_PATH = "/api/database_cleaner/download"
KINDS = ("backup", "archive")


def find_file(hass: HomeAssistant, kind: str, name: str):
    """Blocking: the path of the requested file, or raise BackupError / ArchiveError."""
    entries = hass.config_entries.async_loaded_entries(DOMAIN)
    if not entries:
        raise backup.BackupError("Database Cleaner is not set up")
    settings = maintenance.settings_of(hass, {**DEFAULT_OPTIONS, **entries[0].options})
    if kind == "backup":
        return backup.backup_file(settings.backup_dir, name)
    return archive.archive_file(settings.archive_dir, name)


class DownloadView(HomeAssistantView):
    url = DOWNLOAD_PATH + "/{kind}/{name}"
    name = "api:database_cleaner:download"
    requires_auth = True

    async def get(self, request: web.Request, kind: str, name: str) -> web.StreamResponse:
        user = request.get("hass_user")
        if user is None or not user.is_admin:
            raise Unauthorized
        hass = request.app[KEY_HASS]
        if kind not in KINDS:
            return web.Response(status=404, text="unknown kind")
        try:
            path = await hass.async_add_executor_job(find_file, hass, kind, name)
        except (backup.BackupError, archive.ArchiveError):
            return web.Response(status=404, text="not found")
        return web.FileResponse(
            path,
            headers={
                "Content-Type": "application/octet-stream",
                "Content-Disposition": f'attachment; filename="{name}"',
                "Cache-Control": "no-store",
            },
        )
