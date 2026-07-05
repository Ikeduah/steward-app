import os


def test_overdue_check_requires_cron_secret(client):
    resp = client.post("/api/internal/overdue-check")
    assert resp.status_code == 401


def test_overdue_check_rejects_wrong_secret(client):
    resp = client.post(
        "/api/internal/overdue-check",
        headers={"x-cron-secret": "wrong-secret"},
    )
    assert resp.status_code == 401


def test_overdue_check_accepts_correct_secret(client):
    resp = client.post(
        "/api/internal/overdue-check",
        headers={"x-cron-secret": os.environ["CRON_SECRET"]},
    )
    assert resp.status_code == 200
