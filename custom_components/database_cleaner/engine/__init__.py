"""Read-only analytics engine for the Home Assistant recorder database.

This package has no Home Assistant imports on purpose: it is used by the
integration (through the executor) and by the local dev server / tests
directly against a copy of the database.
"""

from .analyzer import Analyzer
from .model import Context, EntityInfo

__all__ = ["Analyzer", "Context", "EntityInfo"]
