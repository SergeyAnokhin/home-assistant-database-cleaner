"""Test-environment shims shared by all test folders (no effect on the integration)."""

from __future__ import annotations

import sys

if sys.platform == "win32":
    # Local Windows runs only: asyncio's Windows event loop needs a loopback
    # socketpair, which the HA test plugin blocks. CI/Linux keeps the guard.
    try:
        import pytest_socket
    except ImportError:  # plain environment without the HA test plugin
        pass
    else:
        pytest_socket.disable_socket = lambda *args, **kwargs: None

if sys.version_info >= (3, 14):
    # The recorder test fixture autospecs functions whose annotations name
    # TYPE_CHECKING-only types; with PEP 649 that raises NameError. Let mock
    # build signatures with forward references instead.
    import annotationlib
    import inspect
    import types
    import unittest.mock

    _inspect_proxy = types.SimpleNamespace(**{k: getattr(inspect, k) for k in dir(inspect) if not k.startswith("__")})
    _inspect_proxy.signature = lambda obj, *a, **kw: inspect.signature(
        obj, *a, annotation_format=annotationlib.Format.FORWARDREF, **kw
    )
    unittest.mock.inspect = _inspect_proxy
