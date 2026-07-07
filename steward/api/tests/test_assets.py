from conftest import auth_headers


def test_no_auth_header_returns_403(client):
    resp = client.get("/api/assets")
    assert resp.status_code == 403


def test_member_cannot_create_asset(client):
    resp = client.post(
        "/api/assets",
        json={"name": "Camera A"},
        headers=auth_headers("member_org_a"),
    )
    assert resp.status_code == 403


def test_admin_can_create_asset(client):
    resp = client.post(
        "/api/assets",
        json={"name": "Camera A"},
        headers=auth_headers("admin_org_a"),
    )
    assert resp.status_code == 200
    assert resp.json()["org_id"] == "org_a"


def test_org_isolation_on_list_and_get(client):
    created = client.post(
        "/api/assets",
        json={"name": "Org A Camera"},
        headers=auth_headers("admin_org_a"),
    ).json()

    # A different org can't see it in the list
    resp = client.get("/api/assets", headers=auth_headers("admin_org_b"))
    assert resp.status_code == 200
    assert all(a["id"] != created["id"] for a in resp.json())

    # A different org gets 404 fetching it directly
    resp = client.get(f"/api/assets/{created['id']}", headers=auth_headers("admin_org_b"))
    assert resp.status_code == 404


def test_member_cannot_update_or_delete_asset(client):
    created = client.post(
        "/api/assets",
        json={"name": "Org A Camera"},
        headers=auth_headers("admin_org_a"),
    ).json()

    resp = client.put(
        f"/api/assets/{created['id']}",
        json={"name": "Renamed"},
        headers=auth_headers("member_org_a"),
    )
    assert resp.status_code == 403

    resp = client.delete(
        f"/api/assets/{created['id']}",
        headers=auth_headers("member_org_a"),
    )
    assert resp.status_code == 403
