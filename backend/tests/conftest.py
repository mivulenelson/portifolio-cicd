"""Test setup: configure the app through environment variables BEFORE it is imported."""
import os
import tempfile

os.environ["ADMIN_USERNAME"] = "admin"
os.environ["ADMIN_PASSWORD"] = "test-password-123"
os.environ["JWT_SECRET"] = "test-secret-for-ci-only-0123456789abcdef"
os.environ["APP_VERSION"] = "test-build"
os.environ["DATABASE_URL"] = f"sqlite:///{tempfile.mkdtemp()}/test.db"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402


@pytest.fixture(scope="session")
def client():
    # Using TestClient as a context manager runs the startup code (create tables + seed data).
    with TestClient(app) as test_client:
        yield test_client
