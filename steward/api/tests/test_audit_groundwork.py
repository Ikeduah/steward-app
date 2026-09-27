"""
Pins down how the record behaves today, before the audit export (#17) builds
on it.

Each test states current behaviour, including the gaps #17 fixes. When a later
step changes that behaviour on purpose, update the test in the same PR so the
change is visible in the diff rather than silent.
"""

from datetime import datetime, timedelta, timezone

import pytest
from sqlalchemy.exc import IntegrityError

from conftest import auth_headers
from app.core.billing import PlanType
from app.models.activity import ActivityLog
from app.models.asset import Asset
from app.models.assignment import Assignment


def _create_asset(client, name="Camera"):
    resp = client.post("/api/assets", json={"name": name}, headers=auth_headers("admin_org_a"))
    assert resp.status_code == 200
    return resp.json()


def _checkout(client, asset_id, assigned_to="user_member_a", **extra):
    resp = client.post(
        "/api/assignments/checkout",
        json={"asset_id": asset_id, "assigned_to": assigned_to, **extra},
        headers=auth_headers("admin_org_a"),
    )
    assert resp.status_code == 200
    return resp.json()


def _checkin(client, asset_id, persona):
    resp = client.post(f"/api/assignments/checkin/{asset_id}", headers=auth_headers(persona))
    assert resp.status_code == 200
    return resp.json()


def _logs(client, **params):
    resp = client.get("/api/activity", params=params, headers=auth_headers("admin_org_a"))
    assert resp.status_code == 200
    return resp.json()


def _pro_plan(monkeypatch):
    async def pro(*args, **kwargs):
        return PlanType.PRO

    monkeypatch.setattr("app.routers.activity.get_org_plan", pro)


# ---- what a check-out and a return record -----------------------------------


def test_checkout_records_who_handed_it_out_and_to_whom(client, monkeypatch):
    _pro_plan(monkeypatch)
    asset = _create_asset(client)
    due = datetime(2030, 1, 15, 17, 0, tzinfo=timezone.utc)
    assignment = _checkout(client, asset["id"], expected_return_at=due.isoformat())

    assert assignment["assigned_by"] == "user_admin_a"
    assert assignment["assigned_to"] == "user_member_a"
    assert assignment["status"] == "Active"

    log = _logs(client, event_type="checked_out")[0]
    assert log["actor_id"] == "user_admin_a"
    assert log["asset_name"] == "Camera"
    assert log["details"]["assigned_to"] == "user_member_a"
    assert log["details"]["expected_return_at"].startswith("2030-01-15T17:00")


def test_records_store_login_ids_not_names(client, monkeypatch):
    # Gap: an export has to turn these into names, and a person who has left
    # the team can no longer be looked up.
    _pro_plan(monkeypatch)
    asset = _create_asset(client)
    _checkout(client, asset["id"])

    log = _logs(client, event_type="checked_out")[0]
    assert log["actor_id"].startswith("user_")
    assert log["details"]["assigned_to"].startswith("user_")
    assert "actor_name" not in log


def test_return_by_the_holder_is_logged_as_the_holder(client, monkeypatch):
    _pro_plan(monkeypatch)
    asset = _create_asset(client)
    _checkout(client, asset["id"])
    returned = _checkin(client, asset["id"], "member_org_a")

    assert returned["status"] == "Returned"
    assert returned["actual_return_at"] is not None
    log = _logs(client, event_type="checked_in")[0]
    assert log["actor_id"] == "user_member_a"


def test_return_by_an_admin_is_logged_as_the_admin_but_not_on_the_checkout(client, monkeypatch):
    # Gap: the check-out row has no "received by". The only trace of who took
    # the item back is the checked_in log entry, which is what #17 backfills
    # received_by from.
    _pro_plan(monkeypatch)
    asset = _create_asset(client)
    _checkout(client, asset["id"])
    returned = _checkin(client, asset["id"], "admin_org_a")

    assert "received_by" not in returned
    log = _logs(client, event_type="checked_in")[0]
    assert log["actor_id"] == "user_admin_a"


# ---- deleting an item ----------------------------------------------------------


def test_deleting_an_item_with_no_history_removes_it_and_logs_it(client, monkeypatch):
    _pro_plan(monkeypatch)
    asset = _create_asset(client)

    resp = client.delete(f"/api/assets/{asset['id']}", headers=auth_headers("admin_org_a"))
    assert resp.status_code == 200

    assert client.get(f"/api/assets/{asset['id']}", headers=auth_headers("admin_org_a")).status_code == 404
    log = _logs(client, event_type="deleted")[0]
    assert log["asset_name"] == "Camera"


def test_deleting_an_item_that_was_ever_checked_out_fails(client):
    # Gap: on delete, SQLAlchemy detaches the item's check-outs by clearing
    # their asset_id, which is NOT NULL, so the database refuses and the whole
    # request errors (Postgres rejects it the same way). Nothing is lost, but
    # nothing is logged either, and the admin sees a server error. #17
    # replaces delete with retire.
    asset = _create_asset(client)
    _checkout(client, asset["id"])
    _checkin(client, asset["id"], "admin_org_a")

    with pytest.raises(IntegrityError):
        client.delete(f"/api/assets/{asset['id']}", headers=auth_headers("admin_org_a"))

    with client.session_factory() as db:
        assert db.query(Asset).filter(Asset.id == asset["id"]).count() == 1
        assert db.query(Assignment).filter(Assignment.asset_id == asset["id"]).count() == 1
        assert db.query(ActivityLog).filter(ActivityLog.event_type == "deleted").count() == 0


# ---- who can see history, and how far back ------------------------------------


def _seed_old_log(client, days_ago):
    with client.session_factory() as db:
        db.add(
            ActivityLog(
                org_id="org_a",
                asset_id=999,
                asset_name="Old projector",
                actor_id="user_admin_a",
                event_type="checked_out",
                created_at=datetime.now() - timedelta(days=days_ago),
            )
        )
        db.commit()


def test_starter_activity_page_hides_history_older_than_30_days(client, monkeypatch):
    # The on-screen limit stays. #17 decided exports ignore it, so the export
    # must not reuse this query as is.
    async def starter(*args, **kwargs):
        return PlanType.STARTER

    monkeypatch.setattr("app.routers.activity.get_org_plan", starter)
    _seed_old_log(client, days_ago=45)

    assert [log["asset_name"] for log in _logs(client)] == []


def test_pro_activity_page_shows_all_history(client, monkeypatch):
    _pro_plan(monkeypatch)
    _seed_old_log(client, days_ago=400)

    assert [log["asset_name"] for log in _logs(client)] == ["Old projector"]


def test_activity_history_is_admin_only(client):
    resp = client.get("/api/activity", headers=auth_headers("member_org_a"))
    assert resp.status_code == 403


def test_activity_history_never_shows_another_teams_records(client, monkeypatch):
    _pro_plan(monkeypatch)
    asset = _create_asset(client)
    _checkout(client, asset["id"])

    resp = client.get("/api/activity", headers=auth_headers("admin_org_b"))
    assert resp.status_code == 200
    assert resp.json() == []


# ---- the log itself --------------------------------------------------------------


def test_no_endpoint_edits_or_deletes_log_entries(client):
    # Today the log is only ever added to, but only by convention: nothing in
    # the database stops an update or delete. #17 enforces it.
    from index import app

    log_routes = [
        route
        for route in app.routes
        if getattr(route, "path", "").startswith("/api/activity")
    ]
    assert log_routes
    for route in log_routes:
        assert route.methods <= {"GET", "HEAD"}
