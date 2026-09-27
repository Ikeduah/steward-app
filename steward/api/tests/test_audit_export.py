"""Step 4 of #17: the export endpoint, its monthly limit and its record."""

import hashlib
from datetime import date, datetime, timedelta, timezone

import pytest

from conftest import auth_headers
from app.core import people
from app.core.billing import PlanType
from app.models.audit_export import AuditExport
from app.routers import audit


def _plan(monkeypatch, plan):
    async def fixed(*args, **kwargs):
        return plan

    monkeypatch.setattr("app.routers.audit.get_org_plan", fixed)


@pytest.fixture()
def starter(monkeypatch):
    _plan(monkeypatch, PlanType.STARTER)


@pytest.fixture()
def pro(monkeypatch):
    _plan(monkeypatch, PlanType.PRO)


def _export(client, persona="admin_org_a", **overrides):
    body = {"report_type": "custody", "format": "csv", "start": "2026-03-01", "end": "2026-03-31"}
    body.update(overrides)
    return client.post("/api/audit/export", json=body, headers=auth_headers(persona))


def _usage(client, persona="admin_org_a"):
    resp = client.get("/api/audit/usage", headers=auth_headers(persona))
    assert resp.status_code == 200
    return resp.json()


def _checked_out_camera(client):
    asset = client.post("/api/assets", json={"name": "Camera"}, headers=auth_headers("admin_org_a")).json()
    client.post(
        "/api/assignments/checkout",
        json={"asset_id": asset["id"], "assigned_to": "user_member_a"},
        headers=auth_headers("admin_org_a"),
    )
    return asset


# ---- downloading -------------------------------------------------------------------


def test_csv_download(client, pro):
    _checked_out_camera(client)
    today = date.today().isoformat()
    resp = _export(client, start=today, end=today)

    assert resp.status_code == 200
    assert resp.headers["content-type"].startswith("text/csv")
    assert resp.headers["content-disposition"] == (
        f'attachment; filename="steward-custody-{today}-to-{today}.csv"'
    )
    body = resp.content.decode("utf-8-sig")
    assert body.splitlines()[1].startswith("Camera,,")
    assert "Mo Member" in body


def test_pdf_download_names_the_team(client, pro, monkeypatch):
    monkeypatch.setattr(people, "organization_name", lambda org_id: "Kingdom Test Org")
    resp = _export(client, format="pdf", report_type="activity")

    assert resp.status_code == 200
    assert resp.headers["content-type"] == "application/pdf"
    assert resp.content.startswith(b"%PDF")


def test_every_export_is_recorded_with_its_fingerprint(client, pro):
    resp = _export(client)
    records = client.get("/api/audit/exports", headers=auth_headers("admin_org_a")).json()

    assert len(records) == 1
    record = records[0]
    assert record["sha256"] == hashlib.sha256(resp.content).hexdigest()
    assert record["sha256"] == resp.headers["x-steward-file-sha256"]
    assert record["requested_by"] == "user_admin_a"
    assert record["requested_by_name"] == "Ada Admin"
    assert (record["report_type"], record["format"]) == ("custody", "csv")
    assert (record["range_start"], record["range_end"]) == ("2026-03-01", "2026-03-31")
    assert record["counts_toward_limit"] is True


def test_csv_and_pdf_of_the_same_run_share_a_data_fingerprint(client, pro):
    csv_resp = _export(client, format="csv")
    pdf_resp = _export(client, format="pdf")
    assert csv_resp.headers["x-steward-data-fingerprint"] == pdf_resp.headers["x-steward-data-fingerprint"]
    assert csv_resp.headers["x-steward-file-sha256"] != pdf_resp.headers["x-steward-file-sha256"]


def test_one_item_reports(client, pro):
    asset = _checked_out_camera(client)
    today = date.today().isoformat()
    resp = _export(client, asset_id=asset["id"], start=today, end=today)
    assert resp.status_code == 200
    assert f"-item-{asset['id']}.csv" in resp.headers["content-disposition"]


# ---- who can export, and what ------------------------------------------------------


def test_members_cannot_export_or_see_usage(client, pro):
    assert _export(client, persona="member_org_a").status_code == 403
    assert client.get("/api/audit/usage", headers=auth_headers("member_org_a")).status_code == 403
    assert client.get("/api/audit/exports", headers=auth_headers("member_org_a")).status_code == 403


def test_another_teams_item_cannot_be_exported(client, pro):
    asset = _checked_out_camera(client)
    assert _export(client, persona="admin_org_b", asset_id=asset["id"]).status_code == 404


def test_another_teams_exports_are_not_listed(client, pro):
    _export(client)
    assert client.get("/api/audit/exports", headers=auth_headers("admin_org_b")).json() == []


def test_another_teams_records_never_appear_in_an_export(client, pro):
    _checked_out_camera(client)
    today = date.today().isoformat()
    body = _export(client, persona="admin_org_b", start=today, end=today).content.decode("utf-8-sig")
    assert body.splitlines()[1:] == []


@pytest.mark.parametrize(
    "overrides",
    [
        {"start": "2026-04-01", "end": "2026-03-01"},
        {"start": "1999-12-31"},
        {"report_type": "payroll"},
        {"format": "xlsx"},
        {"start": "not-a-date"},
    ],
)
def test_bad_requests_are_refused_without_using_a_run(client, starter, overrides):
    assert _export(client, **overrides).status_code == 422
    assert _usage(client)["used"] == 0


# ---- the monthly limit -----------------------------------------------------------------


def test_starter_gets_three_runs_a_month(client, starter):
    usage = _usage(client)
    assert (usage["plan"], usage["limit"], usage["used"], usage["remaining"]) == ("starter", 3, 0, 3)

    remaining = []
    for month in ("01", "02", "03"):
        resp = _export(client, start=f"2026-{month}-01", end=f"2026-{month}-28")
        assert resp.status_code == 200
        remaining.append(resp.headers["x-steward-runs-remaining"])
    assert remaining == ["2", "1", "0"]

    refused = _export(client, start="2026-04-01", end="2026-04-30")
    assert refused.status_code == 403
    assert "3 audit reports a month" in refused.json()["detail"]
    assert _usage(client)["remaining"] == 0


def test_starter_exports_are_not_trimmed_to_30_days(client, starter):
    resp = _export(client, report_type="activity", start="2020-01-01", end="2026-12-31")
    assert resp.status_code == 200


def test_pro_is_unlimited(client, pro):
    for month in range(1, 6):
        assert _export(client, start=f"2026-0{month}-01", end=f"2026-0{month}-28").status_code == 200
    usage = _usage(client)
    assert (usage["limit"], usage["remaining"], usage["used"]) == (None, None, 5)


def test_the_other_format_of_the_same_run_is_free(client, starter):
    assert _export(client, format="csv").headers["x-steward-counted"] == "true"
    pdf = _export(client, format="pdf")
    assert pdf.headers["x-steward-counted"] == "false"
    assert pdf.headers["x-steward-runs-remaining"] == "2"
    assert _usage(client)["used"] == 1


def test_downloading_the_same_run_again_is_free(client, starter):
    _export(client)
    assert _export(client).headers["x-steward-counted"] == "false"
    assert _usage(client)["used"] == 1


def test_a_free_redownload_works_even_at_the_limit(client, starter):
    for month in ("01", "02", "03"):
        _export(client, start=f"2026-{month}-01", end=f"2026-{month}-28")
    again = _export(client, format="pdf", start="2026-03-01", end="2026-03-28")
    assert again.status_code == 200


def test_a_different_period_type_or_item_is_a_new_run(client, starter):
    asset = _checked_out_camera(client)
    _export(client)
    _export(client, report_type="activity")
    _export(client, asset_id=asset["id"])
    assert _usage(client)["used"] == 3


def _backdate_all_exports(client, delta):
    # audit_exports is not the add-only log; moving created_at here only
    # simulates time passing.
    with client.session_factory() as db:
        for record in db.query(AuditExport).all():
            record.created_at = record.created_at - delta
        db.commit()


def test_redownloads_stop_being_free_after_24_hours(client, pro):
    _export(client)
    _backdate_all_exports(client, timedelta(hours=25))
    assert _export(client).headers["x-steward-counted"] == "true"


def test_runs_reset_on_the_first_of_the_month(client, starter, monkeypatch):
    march = datetime(2026, 3, 20, 12, tzinfo=timezone.utc)
    monkeypatch.setattr(audit, "_now", lambda: march)
    for month in ("01", "02", "03"):
        _export(client, start=f"2025-{month}-01", end=f"2025-{month}-28")
    # The rows were stamped with the real clock; place them in March 2026.
    with client.session_factory() as db:
        for record in db.query(AuditExport).all():
            record.created_at = march.replace(tzinfo=None)
        db.commit()
    assert _usage(client)["remaining"] == 0
    assert _usage(client)["resets_on"] == "2026-04-01"

    monkeypatch.setattr(audit, "_now", lambda: datetime(2026, 4, 1, 0, 1, tzinfo=timezone.utc))
    assert _usage(client)["remaining"] == 3


def test_billing_plan_reports_the_audit_limit(client, monkeypatch):
    async def starter_plan(*args, **kwargs):
        return PlanType.STARTER

    monkeypatch.setattr("app.routers.billing.get_org_plan", starter_plan)
    resp = client.get("/api/billing/plan", headers=auth_headers("admin_org_a"))
    assert resp.json()["audit_reports_per_month"] == 3
