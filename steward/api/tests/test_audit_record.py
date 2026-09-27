"""
The rules step 2 of #17 adds underneath the API: the log is add-only, names
are saved even when Clerk is unreachable, and retired items stop counting
toward the plan limit.

The Postgres trigger that backs the add-only rule is exercised by running
migration 0003 against Postgres; see the PR for that check.
"""

import pytest

from conftest import auth_headers
from app.core import people
from app.models.activity import ActivityLog, ActivityLogIsAppendOnly


def _seed_log(client, actor_id="user_admin_a"):
    with client.session_factory() as db:
        log = ActivityLog(
            org_id="org_a",
            asset_id=1,
            asset_name="Camera",
            actor_id=actor_id,
            event_type="checked_out",
        )
        db.add(log)
        db.commit()
        return log.id


def test_a_log_entry_cannot_be_changed(client):
    log_id = _seed_log(client)
    with client.session_factory() as db:
        log = db.get(ActivityLog, log_id)
        log.event_type = "checked_in"
        with pytest.raises(ActivityLogIsAppendOnly):
            db.commit()


def test_a_log_entry_cannot_be_removed(client):
    log_id = _seed_log(client)
    with client.session_factory() as db:
        db.delete(db.get(ActivityLog, log_id))
        with pytest.raises(ActivityLogIsAppendOnly):
            db.commit()


def test_bulk_changes_to_the_log_are_refused(client):
    _seed_log(client)
    with client.session_factory() as db:
        with pytest.raises(ActivityLogIsAppendOnly):
            db.query(ActivityLog).update({"event_type": "checked_in"})
        with pytest.raises(ActivityLogIsAppendOnly):
            db.query(ActivityLog).delete()


def test_log_entries_can_still_be_added(client):
    _seed_log(client)
    _seed_log(client)
    with client.session_factory() as db:
        assert db.query(ActivityLog).count() == 2


def test_the_actor_name_is_saved_on_every_log_entry(client):
    log_id = _seed_log(client)
    with client.session_factory() as db:
        assert db.get(ActivityLog, log_id).actor_name == "Ada Admin"


def test_someone_clerk_does_not_know_is_saved_without_a_name(client):
    log_id = _seed_log(client, actor_id="user_gone_a")
    with client.session_factory() as db:
        assert db.get(ActivityLog, log_id).actor_name is None


def test_records_are_still_written_when_clerk_is_unreachable(client, monkeypatch):
    monkeypatch.setattr(people, "_fetch_names", lambda ids: {})
    people._cache.clear()

    asset = client.post("/api/assets", json={"name": "Drill"}, headers=auth_headers("admin_org_a")).json()
    resp = client.post(
        "/api/assignments/checkout",
        json={"asset_id": asset["id"], "assigned_to": "user_member_a"},
        headers=auth_headers("admin_org_a"),
    )
    assert resp.status_code == 200
    assert resp.json()["assigned_to_name"] is None


def test_a_clerk_outage_is_not_cached(client, monkeypatch):
    monkeypatch.setattr(people, "_fetch_names", lambda ids: {})
    people._cache.clear()
    assert people.display_name("user_admin_a") is None

    monkeypatch.setattr(people, "_fetch_names", lambda ids: {uid: "Ada Admin" for uid in ids})
    assert people.display_name("user_admin_a") == "Ada Admin"


def test_retired_items_do_not_count_toward_the_asset_limit(client, monkeypatch):
    counts = []

    async def record_count(org_id, current_count, limit_attr):
        counts.append(current_count)
        return True

    monkeypatch.setattr("app.routers.assets.check_limit", record_count)
    first = client.post("/api/assets", json={"name": "Old laptop"}, headers=auth_headers("admin_org_a")).json()
    client.post(f"/api/assets/{first['id']}/retire", headers=auth_headers("admin_org_a"))
    client.post("/api/assets", json={"name": "New laptop"}, headers=auth_headers("admin_org_a"))

    assert counts == [0, 0]
