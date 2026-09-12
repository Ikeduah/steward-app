import pytest

import app.routers.public as public

VALID = {
    "name": "Dana Okoye",
    "email": "dana@example.org",
    "organization": "Riverside Media",
    "team_size": "11–25",
    "notes": "Cameras and radios across two campuses.",
}


@pytest.fixture()
def sent(monkeypatch):
    """Capture outbound access requests instead of mailing them.

    conftest stubs the notification senders at the routers that import them;
    this router is newer than that fixture, so it is stubbed here.
    """
    calls: list[dict] = []

    def _capture(**kwargs):
        calls.append(kwargs)
        return True

    monkeypatch.setattr(public, "send_access_request", _capture)
    # Each test gets a clean burst window; the limiter is module-level state.
    monkeypatch.setattr(public, "_recent_requests", {})
    return calls


def test_valid_request_sends_once(client, sent):
    resp = client.post("/api/public/request-access", json=VALID)
    assert resp.status_code == 200
    assert resp.json() == {"ok": True}
    assert len(sent) == 1
    assert sent[0]["email"] == "dana@example.org"
    assert sent[0]["organization"] == "Riverside Media"


def test_plan_is_carried_through(client, sent):
    resp = client.post("/api/public/request-access", json={**VALID, "plan": "Pro"})
    assert resp.status_code == 200
    assert sent[0]["plan"] == "Pro"


def test_honeypot_succeeds_without_sending(client, sent):
    resp = client.post(
        "/api/public/request-access",
        json={**VALID, "company_website": "http://spam.example"},
    )
    # Same response a real success gets, so a bot learns nothing from it.
    assert resp.status_code == 200
    assert resp.json() == {"ok": True}
    assert sent == []


def test_bad_email_is_rejected(client, sent):
    resp = client.post(
        "/api/public/request-access",
        json={**VALID, "email": "dana-at-example.org"},
    )
    assert resp.status_code == 422
    assert sent == []


def test_blank_name_is_rejected(client, sent):
    resp = client.post("/api/public/request-access", json={**VALID, "name": "   "})
    assert resp.status_code == 422
    assert sent == []


def test_over_long_field_is_rejected(client, sent):
    resp = client.post(
        "/api/public/request-access",
        json={**VALID, "notes": "x" * 2001},
    )
    assert resp.status_code == 422
    assert sent == []


def test_undeliverable_request_surfaces_as_502(client, monkeypatch):
    monkeypatch.setattr(public, "_recent_requests", {})
    monkeypatch.setattr(public, "send_access_request", lambda **kwargs: False)

    resp = client.post("/api/public/request-access", json=VALID)
    assert resp.status_code == 502
    # The prospect has to be told where else to send it.
    assert "@" in resp.json()["detail"]


def test_burst_is_rate_limited(client, sent):
    for _ in range(public._RATE_LIMIT_MAX_REQUESTS):
        assert client.post("/api/public/request-access", json=VALID).status_code == 200

    resp = client.post("/api/public/request-access", json=VALID)
    assert resp.status_code == 429
    assert len(sent) == public._RATE_LIMIT_MAX_REQUESTS
