"""Preview the panel locally against a copy of the database (no Home Assistant needed).

    python dev/devserver.py [--db gitignore/home-assistant_v2.db] [--port 8765]

Serves only dev/harness.html and the panel module, binds to 127.0.0.1, and
answers the panel's WebSocket commands over a tiny JSON POST endpoint using
the same engine as the integration (read-only, immutable mode).
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "custom_components" / "database_cleaner"))
sys.path.insert(0, str(ROOT))

import threading  # noqa: E402
import time  # noqa: E402
import uuid  # noqa: E402

from engine import Analyzer  # noqa: E402
from engine import backup as engine_backup  # noqa: E402
from engine import issues as engine_issues  # noqa: E402
from engine.db import connect  # noqa: E402

from dev.storage_context import load_context  # noqa: E402

PANEL_JS = ROOT / "custom_components" / "database_cleaner" / "frontend" / "panel.js"
HARNESS = ROOT / "dev" / "harness.html"
OPTIONS = {"state_windows": [1, 24, 168], "lts_periods": [30, 90, 365], "top_n": 10}


class FakeJobs:
    """UI preview only: jobs advance on a timer and never touch the database."""

    STEPS = {
        "backup": [("preflight", None), ("backup", None)],
        "delete": [("preflight", None), ("backup", None), ("delete", 12), ("repack", None)],
        "repack": [("preflight", None), ("repack", None)],
        "restore": [("preflight", None), ("restore", 6)],
    }

    def __init__(self) -> None:
        self.current: dict | None = None
        self.history: list[dict] = []
        self._cancel = False
        self._lock = threading.Lock()

    def snapshot(self) -> dict:
        with self._lock:
            return {"current": dict(self.current) if self.current else None, "history": list(self.history[:20])}

    def start(self, kind: str, params: dict) -> str:
        with self._lock:
            if self.current:
                raise ValueError(f"another job is running: {self.current['kind']}")
            self._cancel = False
            self.current = {"id": uuid.uuid4().hex, "kind": kind, "params": params, "status": "running",
                            "step": None, "done": 0, "total": None, "created": time.time(), "started": time.time(),
                            "finished": None, "result": None, "error": None, "log": []}
        threading.Thread(target=self._run, args=(kind, params), daemon=True).start()
        return self.current["id"]

    def cancel(self) -> bool:
        self._cancel = bool(self.current)
        return self._cancel

    def _run(self, kind: str, params: dict) -> None:
        job = self.current
        status = "done"
        for step, total in self.STEPS[kind]:
            if kind == "delete" and step == "repack" and not params.get("repack"):
                continue
            job.update(step=step, done=0, total=total)
            job["log"].append(time.strftime("%H:%M:%S ") + step)
            for _ in range(total or 3):
                if self._cancel and step in ("delete", "restore"):
                    status = "cancelled"
                    break
                time.sleep(0.6)
                if total:
                    job["done"] += 1
            if status != "done":
                break
        n = params.get("count") or 0
        job.update(status=status, step=None, finished=time.time())
        if status == "done":
            job["result"] = {
                "backup": {"deleted": n, "deleted_rows": n * 30000, "size_before": 1166639104,
                           "size_after": 1166639104 - n * 30000 * 78, "archive": "undo-dev.jsonl.gz"},
                "delete": {"deleted": n, "deleted_rows": n * 30000, "size_before": 1166639104,
                           "size_after": 1166639104 - n * 30000 * 78, "archive": "undo-dev.jsonl.gz"},
                "repack": {"size_before": 1166639104, "size_after": 1100000000},
                "restore": {"restored": 6, "rows": 6 * 30000},
            }[kind] if kind != "backup" else {"backup": "home-assistant_v2-dev.db", "size": 1166639104, "removed": []}
        with self._lock:
            self.history.insert(0, job)
            self.current = None


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

    jobs = FakeJobs()
    size = db.stat().st_size

    def dev_issues(refresh: bool) -> dict:
        """Preview of the Problems tab: no live states here, so only what the copy can tell.

        Home Assistant's findings come from the repairs registry plus ``no_state`` (statistics of
        sensors without any state); our own checks are limited to cumulative-sum dips.
        """
        stats = analyzer.statistics(ctx, OPTIONS["lts_periods"], refresh=refresh)
        items = stats["items"]
        validation: dict[str, list[dict]] = {}
        repairs: list[str] = []
        try:
            registry = json.loads((storage / "repairs.issue_registry").read_text(encoding="utf-8"))
            for issue in registry["data"]["issues"]:
                m = re.match(r"^(units_changed|state_class_removed|mean_type_changed)_(.+)$", issue["issue_id"])
                if issue["domain"] == "sensor" and m:
                    repairs.append(issue["issue_id"])
                    validation.setdefault(m[2], []).append({"type": m[1], "data": {"statistic_id": m[2]}})
        except (OSError, ValueError, KeyError):
            pass
        for i in items:
            if i["source"] == "recorder" and i["statistic_id"].startswith("sensor.") and not i["has_states"]:
                validation.setdefault(i["statistic_id"], []).append(
                    {"type": "no_state", "data": {"statistic_id": i["statistic_id"]}}
                )
        meters = [i["statistic_id"] for i in items if i["source"] == "recorder" and i["has_sum"]]
        drops = analyzer.sum_drops(meters, refresh=refresh)
        own = engine_issues.evaluate(
            {}, items, unit_rules={}, state_class_rules={}, sum_drops=drops, recorded=ctx.recorded, now=analyzer.now()
        )
        merged = engine_issues.merge([*engine_issues.from_validation(validation, repairs), *own], items)
        return {**merged, "sources": {"sensors": 0, "statistics": len(items), "errors": [
            "dev preview: no live sensor states, so only part of the checks runs"]}, "age_s": 0}

    def preflight(kind: str, repack: bool) -> dict:
        free = engine_backup.free_space(str(db.parent))
        checks = [
            {"key": "ha_running", "ok": True, "value": None},
            {"key": "no_migration", "ok": True, "value": None},
            {"key": "schema", "ok": True, "value": 53},
            {"key": "backlog", "ok": True, "value": 0},
        ]
        if kind in ("backup", "delete", "repack"):
            need = engine_backup.required_space(str(db))
            checks.append({"key": "backup_space", "ok": free >= need, "value": {"free": free, "required": need}})
        if kind == "repack" or (kind == "delete" and repack):
            need = int(size * 1.1)
            checks.append({"key": "repack_space", "ok": free >= need, "value": {"free": free, "required": need}})
        if kind in ("delete", "repack"):
            checks.append({"key": "integrity", "ok": True, "value": ["ok"]})
        return {"ok": all(c["ok"] for c in checks), "checks": checks, "fresh_backup": None}

    def handle(msg: dict):
        kind = msg.get("type", "").split("/", 1)[-1]
        if kind == "maintenance":
            return {
                "settings": {"backup_dir": "/share/database_cleaner/backups (dev simulation)",
                             "archive_dir": "/share/database_cleaner/backups/undo", "keep": 2,
                             "max_age_hours": 24, "batch_rows": 50000, "undo_days": 30},
                "db": {"size": size, "wal_size": 0, "free_pages_ratio": 0.0,
                       "free_db_dir": engine_backup.free_space(str(db.parent))},
                "backups": [], "archives": [], "fresh_backup": None, "jobs": jobs.snapshot(),
            }
        if kind == "preflight":
            time.sleep(0.8)
            return preflight(msg["kind"], bool(msg.get("repack")))
        if kind == "job/status":
            return jobs.snapshot()
        if kind == "job/cancel":
            return {"cancelling": jobs.cancel()}
        if kind == "job/start":
            if msg.get("kind") != "backup" and not msg.get("confirm"):
                raise ValueError("Destructive jobs need confirm: true")
            ids = msg.get("statistic_ids") or []
            return {"job_id": jobs.start(msg["kind"], {"count": len(ids), "repack": msg.get("repack")})}
        if kind == "info":
            return {"version": "dev", "db_path": str(db), "options": OPTIONS, "recorder": recorder}
        if kind == "overview":
            return analyzer.overview(refresh=bool(msg.get("refresh")))
        if kind == "statistics":
            return analyzer.statistics(ctx, OPTIONS["lts_periods"], refresh=bool(msg.get("refresh")))
        if kind == "issues":
            return dev_issues(bool(msg.get("refresh")))
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
