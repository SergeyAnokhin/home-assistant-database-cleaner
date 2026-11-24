"""Read-only SQLite access.

Every connection is opened with ``mode=ro`` and ``PRAGMA query_only``, so the
engine physically cannot write to the recorder database. In WAL mode readers
never block the recorder (the single writer).

Use the stdlib ``sqlite3`` module only — never a separately bundled SQLite
(apsw, pysqlite3-binary, ...). POSIX file locks are per process: SQLite only
keeps them consistent between connections that share the *same* library
instance, which is what the recorder (SQLAlchemy + stdlib sqlite3) uses.
Two SQLite copies in one process is a documented way to corrupt a database.
"""

from __future__ import annotations

import sqlite3
import time
from collections.abc import Iterator
from contextlib import contextmanager
from pathlib import Path


def sqlite_path_from_url(db_url: str | None) -> str | None:
    """Return the file path for a ``sqlite:///…`` recorder URL, else None."""
    if not db_url or not db_url.startswith("sqlite:///"):
        return None
    path = db_url[len("sqlite:///") :].split("?", 1)[0]
    if not path or path == ":memory:":
        return None
    return path


def open_ro(path: str, *, immutable: bool = False, timeout: float = 10.0) -> sqlite3.Connection:
    """Open the database read-only.

    ``immutable`` is only for offline copies (tests / dev server): it tells
    SQLite the file cannot change, so no -shm file is needed. Never use it on
    the live database.
    """
    uri = Path(path).resolve().as_uri() + ("?mode=ro&immutable=1" if immutable else "?mode=ro")
    conn = sqlite3.connect(uri, uri=True, timeout=timeout, check_same_thread=False)
    conn.execute("PRAGMA query_only = ON")
    return conn


@contextmanager
def connect(path: str, *, immutable: bool = False) -> Iterator[sqlite3.Connection]:
    conn = open_ro(path, immutable=immutable)
    try:
        yield conn
    finally:
        conn.close()


def table_names(conn: sqlite3.Connection) -> set[str]:
    return {r[0] for r in conn.execute("SELECT name FROM sqlite_master WHERE type = 'table'")}


def columns(conn: sqlite3.Connection, table: str) -> set[str]:
    return {r[1] for r in conn.execute(f"PRAGMA table_info({table})")}


class Timer:
    """Tiny helper: ``with Timer() as t: ...; t.ms``."""

    def __enter__(self) -> Timer:
        self._start = time.perf_counter()
        self.ms = 0.0
        return self

    def __exit__(self, *exc: object) -> None:
        self.ms = round((time.perf_counter() - self._start) * 1000, 2)
