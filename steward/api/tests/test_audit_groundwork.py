"""
Pins down how the record behaves, for the audit export (#17) to build on.

Step 1 wrote these against the old behaviour, gaps included. Step 2 fixed the
gaps and updated the tests that described them; each says what it used to be.
When a later step changes behaviour on purpose, update the test in the same PR
so the change is visible in the diff rather than silent.
"""

from datetime import datetime, timedelta, timezone


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


def test_records_keep_the_names_people_had_at_the_time(client, monkeypatch):
    # Was a gap in step 1: records held only Clerk IDs.
    _pro_plan(monkeypatch)
    asset = _create_asset(client)
    assignment = _checkout(client, asset["id"])

    assert assignment["assigned_to_name"] == "Mo Member"
    assert assignment["assigned_by_name"] == "Ada Admin"
    log = _logs(client, event_type="checked_out")[0]
    assert log["actor_id"] == "user_admin_a"
    assert log["actor_name"] == "Ada Admin"
    assert log["details"]["assigned_to_name"] == "Mo Member"


def test_return_by_the_holder_is_logged_as_the_holder(client, monkeypatch):
    _pro_plan(monkeypatch)
    asset = _create_asset(client)
    _checkout(client, asset["id"])
    returned = _checkin(client, asset["id"], "member_org_a")

    assert returned["status"] == "Returned"
    assert returned["actual_return_at"] is not None
    assert returned["received_by"] == "user_member_a"
    log = _logs(client, event_type="checked_in")[0]
    assert log["actor_id"] == "user_member_a"


def test_return_by_an_admin_records_the_admin_as_receiver(client, monkeypatch):
    # Was a gap in step 1: the check-out row did not say who took it back.
    _pro_plan(monkeypatch)
    asset = _create_asset(client)
    _checkout(client, asset["id"])
    returned = _checkin(client, asset["id"], "admin_org_a")

    assert returned["received_by"] == "user_admin_a"
    assert returned["received_by_name"] == "Ada Admin"
    log = _logs(client, event_type="checked_in")[0]
    assert log["actor_id"] == "user_admin_a"


# ---- retiring, not deleting ------------------------------------------------------


def test_items_can_no_longer_be_deleted(client):
    # Was: delete worked for unused items and errored for used ones.
    asset = _create_asset(client)

    resp = client.delete(f"/api/assets/{asset['id']}", headers=auth_headers("admin_org_a"))
    assert resp.status_code == 405
    assert client.get(f"/api/assets/{asset['id']}", headers=auth_headers("admin_org_a")).status_code == 200


def test_retiring_an_item_keeps_it_and_its_history(client, monkeypatch):
    _pro_plan(monkeypatch)
    asset = _create_asset(client)
    _checkout(client, asset["id"])
    _checkin(client, asset["id"], "admin_org_a")

    resp = client.post(f"/api/assets/{asset['id']}/retire", headers=auth_headers("admin_org_a"))
    assert resp.status_code == 200
    assert resp.json()["status"] == "Retired"

    with client.session_factory() as db:
        assert db.query(Asset).filter(Asset.id == asset["id"]).count() == 1
        assert db.query(Assignment).filter(Assignment.asset_id == asset["id"]).count() == 1
    log = _logs(client, event_type="retired")[0]
    assert log["asset_name"] == "Camera"
    assert log["details"] == {"previous_status": "Available"}


def test_a_checked_out_item_cannot_be_retired(client):
    asset = _create_asset(client)
    _checkout(client, asset["id"])

    resp = client.post(f"/api/assets/{asset['id']}/retire", headers=auth_headers("admin_org_a"))
    assert resp.status_code == 409


def test_retiring_twice_is_harmless_and_logged_once(client, monkeypatch):
    _pro_plan(monkeypatch)
    asset = _create_asset(client)
    for _ in range(2):
        resp = client.post(f"/api/assets/{asset['id']}/retire", headers=auth_headers("admin_org_a"))
        assert resp.status_code == 200

    assert len(_logs(client, event_type="retired")) == 1


def test_other_teams_cannot_retire_an_item(client):
    asset = _create_asset(client)
    resp = client.post(f"/api/assets/{asset['id']}/retire", headers=auth_headers("admin_org_b"))
    assert resp.status_code == 404


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
    # The API offers no way to change the log. test_audit_record.py covers the
    # rule underneath that, for code that bypasses the API.
    from index import app

    log_routes = [
        route
        for route in app.routes
        if getattr(route, "path", "").startswith("/api/activity")
    ]
    assert log_routes
    for route in log_routes:
        assert route.methods <= {"GET", "HEAD"}
