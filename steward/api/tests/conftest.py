import os
import sys
from pathlib import Path

# Must be set before the app (and its routers) are imported: get_database_url()
# reads DATABASE_URL at import time, and internal.py reads CRON_SECRET at
# import time.
os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
os.environ.setdefault("CRON_SECRET", "test-cron-secret-0123456789abcdef")

API_DIR = Path(__file__).resolve().parents[1]
if str(API_DIR) not in sys.path:
    sys.path.insert(0, str(API_DIR))

import pytest
from fastapi import HTTPException, Request
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from index import app as fastapi_app
from app.core.db import Base
from app.core.debs import get_db
from app.core.security import clerk_guard, ClerkCredentials
from app.core.billing import PlanType

# Fake org-claims personas. `sub` values are reused as `assigned_to` targets
# in assignment tests, so ownership checks line up naturally.
PERSONAS = {
    "admin_org_a": {"sub": "user_admin_a", "o": {"id": "org_a", "rol": "admin"}},
    "member_org_a": {"sub": "user_member_a", "o": {"id": "org_a", "rol": "member"}},
    "member2_org_a": {"sub": "user_member2_a", "o": {"id": "org_a", "rol": "member"}},
    "admin_org_b": {"sub": "user_admin_b", "o": {"id": "org_b", "rol": "admin"}},
}


def auth_headers(persona: str) -> dict:
    """Selects a fake persona for the overridden clerk_guard (see below)."""
    return {"x-test-persona": persona}


def _override_clerk_guard(request: Request):
    persona = request.headers.get("x-test-persona")
    claims = PERSONAS.get(persona)
    if claims is None:
        raise HTTPException(status_code=403, detail="Not authenticated")
    return ClerkCredentials(scheme="Bearer", credentials="test-token", decoded=claims)


@pytest.fixture()
def client(monkeypatch):
    # Fresh in-memory SQLite per test — StaticPool keeps one connection alive
    # for the engine's lifetime so all sessions see the same schema/data.
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    fastapi_app.dependency_overrides[get_db] = override_get_db
    fastapi_app.dependency_overrides[clerk_guard] = _override_clerk_guard

    async def _noop(*args, **kwargs):
        return None

    async def _no_limit(*args, **kwargs):
        return True

    async def _pro_plan(*args, **kwargs):
        return PlanType.PRO

    # These call out to Clerk/Resend over the network in production; keep
    # tests hermetic by stubbing them at the point each router imported them.
    monkeypatch.setattr("app.routers.assignments.send_checkout_notification", _noop)
    monkeypatch.setattr("app.routers.assignments.send_checkin_notification", _noop)
    monkeypatch.setattr("app.routers.incidents.send_incident_notification", _noop)
    monkeypatch.setattr("app.routers.assets.check_limit", _no_limit)
    monkeypatch.setattr("app.routers.incidents.get_org_plan", _pro_plan)

    with TestClient(fastapi_app) as test_client:
        yield test_client

    fastapi_app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)
    engine.dispose()
