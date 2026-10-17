"""Settings for pytest: the real settings plus a throwaway key, so tests never need server/.env."""
import os

os.environ.setdefault("DJANGO_SECRET_KEY", "test-only-not-secret")

from .settings import *  # noqa: E402,F401,F403
