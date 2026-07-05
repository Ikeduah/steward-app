from conftest import auth_headers


def _create_asset(client, persona="admin_org_a", name="Camera"):
    resp = client.post("/api/assets", json={"name": name}, headers=auth_headers(persona))
    assert resp.status_code == 200
    return resp.json()


def test_member_can_report_incident_but_not_list(client):
    asset = _create_asset(client)

    resp = client.post(
        "/api/incidents",
        json={
            "asset_id": asset["id"],
            "title": "Broken lens",
            "description": "Lens cracked during shoot",
            "severity": "High",
        },
        headers=auth_headers("member_org_a"),
    )
    assert resp.status_code == 200

    resp = client.get("/api/incidents", headers=auth_headers("member_org_a"))
    assert resp.status_code == 403

    resp = client.get("/api/incidents", headers=auth_headers("admin_org_a"))
    assert resp.status_code == 200
    assert len(resp.json()) == 1
