"""Preview the panel locally against a copy of the database (no Home Assistant needed).

    python dev/devserver.py [--db gitignore/home-assistant_v2.db] [--port 8765]

Serves only dev/harness.html and the panel module, binds to 127.0.0.1, and
answers the panel's WebSocket commands over a tiny JSON POST endpoint using
the same engine as the integration (read-only, immutable mode).
"""

from __future__ import annotations

import argparse
import json
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "custom_components" / "database_cleaner"))
sys.path.insert(0, str(ROOT))

from engine import Analyzer  # noqa: E402
from engine.db import connect  # noqa: E402

from dev.storage_context import load_context  # noqa: E402

PANEL_JS = ROOT / "custom_components" / "database_cleaner" / "frontend" / "panel.js"
HARNESS = ROOT / "dev" / "harness.html"
OPTIONS = {"state_windows": [1, 24, 168], "lts_periods": [30, 90, 365], "top_n": 10}


def build_app(db: Path, storage: Path, exclude: Path):
    with connect(str(db), immutable=True) as conn:
        newest = conn.execute("SELECT MAX(last_updated_ts) FROM states").fetchone()[0] or 0
    # The copy is frozen in time: "now" = newest state + 1 min, so windows are meaningful.
    analyzer = Analyzer(str(db), immutable=True, clock=lambda: newest + 60)
    ctx = load_context(storage, exclude if exclude.exists() else None, usage=True)
    recorder = {
        "keep_days": 7,
        "commit_interval": 30,
        "auto_purge": True,
        "auto_repack": True,
        "backlog": 0,
        "recording": True,
        "filter_active": ctx.is_recorded is not None,
        "dialect": "sqlite",
    }

    def handle(msg: dict):
        kind = msg.get("type", "").split("/", 1)[-1]
        if kind == "info":
            return {"version": "dev", "db_path": str(db), "options": OPTIONS, "recorder": recorder}
        if kind == "overview":
            return analyzer.overview(refresh=bool(msg.get("refresh")))
        if kind == "statistics":
            return analyzer.statistics(ctx, OPTIONS["lts_periods"], refresh=bool(msg.get("refresh")))
        if kind == "states":
            return analyzer.states(ctx, int(float(msg["window_hours"]) * 3600))
        if kind == "events":
            return analyzer.events(int(float(msg["window_hours"]) * 3600))
        if kind == "health":
            return {**analyzer.health(run_probe=msg.get("probe", True)), "recorder": recorder}
        if kind == "quick_check":
            return analyzer.quick_check()
        raise ValueError(f"unknown command {msg.get('type')}")

    return handle


def make_handler(app):
    class Handler(BaseHTTPRequestHandler):
        def _send(self, code: int, body: bytes, ctype: str) -> None:
            self.send_response(code)
            self.send_header("Content-Type", ctype)
            self.send_header("Cache-Control", "no-store")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def do_GET(self) -> None:  # noqa: N802
            path = self.path.split("?", 1)[0]
            if path in ("/", "/harness.html"):
                self._send(200, HARNESS.read_bytes(), "text/html; charset=utf-8")
            elif path == "/panel.js":
                self._send(200, PANEL_JS.read_bytes(), "text/javascript; charset=utf-8")
            else:
                self._send(404, b"not found", "text/plain")

        def do_POST(self) -> None:  # noqa: N802
            if self.path != "/ws":
                self._send(404, b"not found", "text/plain")
                return
            msg = json.loads(self.rfile.read(int(self.headers.get("Content-Length", 0))) or b"{}")
            try:
                body = {"success": True, "result": app(msg)}
            except Exception as err:  # noqa: BLE001 - surfaced to the panel like a WS error
                body = {"success": False, "error": {"code": "dev_error", "message": str(err)}}
            self._send(200, json.dumps(body).encode(), "application/json")

        def log_message(self, fmt: str, *args) -> None:
            sys.stderr.write("dev: " + fmt % args + "\n")

    return Handler


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--db", default=str(ROOT / "gitignore" / "home-assistant_v2.db"))
    p.add_argument("--storage", default=str(ROOT / "gitignore" / ".storage"))
    p.add_argument("--exclude", default=str(ROOT / "gitignore" / "recorder_exclude.json"))
    p.add_argument("--port", type=int, default=8765)
    a = p.parse_args()
    app = build_app(Path(a.db), Path(a.storage), Path(a.exclude))
    server = ThreadingHTTPServer(("127.0.0.1", a.port), make_handler(app))
    print(f"Database Cleaner dev panel: http://127.0.0.1:{a.port}/", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
