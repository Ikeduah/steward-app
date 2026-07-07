from conftest import auth_headers


def _create_asset(client, persona="admin_org_a", name="Camera"):
    resp = client.post("/api/assets", json={"name": name}, headers=auth_headers(persona))
    assert resp.status_code == 200
    return resp.json()


def _checkout(client, asset_id, assigned_to, persona="admin_org_a"):
    resp = client.post(
        "/api/assignments/checkout",
        json={"asset_id": asset_id, "assigned_to": assigned_to},
        headers=auth_headers(persona),
    )
    assert resp.status_code == 200
    return resp.json()


def test_checkin_ownership_enforced(client):
    asset = _create_asset(client)
    _checkout(client, asset["id"], assigned_to="user_member_a")

    # A different member cannot check in someone else's assignment
    resp = client.post(
        f"/api/assignments/checkin/{asset['id']}",
        headers=auth_headers("member2_org_a"),
    )
    assert resp.status_code == 403

    # The assignee can check it in
    resp = client.post(
        f"/api/assignments/checkin/{asset['id']}",
        headers=auth_headers("member_org_a"),
    )
    assert resp.status_code == 200


def test_admin_can_checkin_any_asset(client):
    asset = _create_asset(client, name="Camera 2")
    _checkout(client, asset["id"], assigned_to="user_member_a")

    resp = client.post(
        f"/api/assignments/checkin/{asset['id']}",
        headers=auth_headers("admin_org_a"),
    )
    assert resp.status_code == 200


def test_member_sees_only_own_active_assignments(client):
    asset1 = _create_asset(client, name="Camera 3")
    asset2 = _create_asset(client, name="Camera 4")
    _checkout(client, asset1["id"], assigned_to="user_member_a")
    _checkout(client, asset2["id"], assigned_to="user_admin_a")

    resp = client.get("/api/assignments/active", headers=auth_headers("member_org_a"))
    assert resp.status_code == 200
    ids = [a["asset_id"] for a in resp.json()]
    assert ids == [asset1["id"]]

    resp = client.get("/api/assignments/active", headers=auth_headers("admin_org_a"))
    assert resp.status_code == 200
    ids = sorted(a["asset_id"] for a in resp.json())
    assert ids == sorted([asset1["id"], asset2["id"]])
