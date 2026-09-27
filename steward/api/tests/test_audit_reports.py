"""Step 3 of #17: the custody and activity reports, as CSV and PDF."""

from datetime import date, datetime, timedelta, timezone

import pytest

from app.core.audit_pdf import ReportContext, render_pdf
from app.core.audit_reports import build_report
from app.models.activity import ActivityLog
from app.models.asset import Asset
from app.models.assignment import Assignment


def _at(day, hour=9):
    return datetime(2026, 3, day, hour, 0, tzinfo=timezone.utc)


@pytest.fixture()
def db(client):
    with client.session_factory() as session:
        yield session


@pytest.fixture()
def seeded(db):
    """
    March 2026, team A:
      camera   out Feb 20 to Mar 2    (overlaps the start of March)
      laptop   out Mar 10, due Mar 12, returned Mar 15 by an admin (3 days late)
      drill    out Mar 28, not returned, due Mar 30
      tripod   out and back in February (outside March)
      radio    out Apr 2 (outside March)
    Team B has a projector out in March, which team A must never see.
    """
    items = {}
    for org, name, tag in [
        ("org_a", "Camera", "STW-0142"),
        ("org_a", "Laptop", "STW-0318"),
        ("org_a", "Drill", "STW-0521"),
        ("org_a", "Tripod", None),
        ("org_a", "Radio", None),
        ("org_b", "Projector", None),
    ]:
        asset = Asset(org_id=org, name=name, qr_code=tag, status="Available")
        db.add(asset)
        db.flush()
        items[name] = asset

    def out(item, holder, start, returned=None, due=None, receiver=None, org="org_a", **names):
        db.add(Assignment(
            org_id=org, asset_id=items[item].id, assigned_to=holder, assigned_by="user_admin_a",
            checked_out_at=start, expected_return_at=due, actual_return_at=returned,
            received_by=receiver, status="Returned" if returned else "Active", **names,
        ))

    feb = lambda day: datetime(2026, 2, day, 9, tzinfo=timezone.utc)
    # Saved names on the camera only; the rest predate saved names.
    out("Camera", "user_member_a", feb(20), returned=_at(2), receiver="user_member_a",
        assigned_to_name="Mo (as then)", assigned_by_name="Ada (as then)", received_by_name="Mo (as then)")
    out("Laptop", "user_gone_a", _at(10), returned=_at(15), due=_at(12), receiver="user_admin_a",
        notes="Charger missing")
    out("Drill", "user_member2_a", _at(28), due=_at(30))
    out("Tripod", "user_member_a", feb(3), returned=feb(5))
    out("Radio", "user_member_a", datetime(2026, 4, 2, tzinfo=timezone.utc))
    out("Projector", "user_admin_b", _at(5), org="org_b")

    for org, item, actor, event, when, details in [
        ("org_a", "Laptop", "user_admin_a", "checked_out", _at(10), {"assigned_to": "user_gone_a", "expected_return_at": _at(12).isoformat()}),
        ("org_a", "Laptop", "user_admin_a", "checked_in", _at(15), {"returned_at": _at(15).isoformat()}),
        ("org_a", "Drill", "user_admin_a", "updated", _at(31, 23), {"previous_status": "Available", "new_status": "Maintenance", "updates": ["status"]}),
        ("org_a", "Drill", "user_admin_a", "checked_out", datetime(2026, 4, 1, 0, 0, tzinfo=timezone.utc), {}),
        ("org_a", "Tripod", "user_admin_a", "retired", datetime(2025, 1, 1, tzinfo=timezone.utc), {"previous_status": "Available"}),
        ("org_b", "Projector", "user_admin_b", "checked_out", _at(5), {}),
    ]:
        db.add(ActivityLog(org_id=org, asset_id=items[item].id, asset_name=item,
                           actor_id=actor, event_type=event, created_at=when, details=details))
    db.commit()
    return items


def _march(db, report_type, **kwargs):
    return build_report(db, report_type, "org_a", date(2026, 3, 1), date(2026, 3, 31), **kwargs)


# ---- custody ---------------------------------------------------------------------


def test_custody_covers_every_checkout_that_overlapped_the_period(db, seeded):
    report = _march(db, "custody")
    assert [row["item"] for row in report.rows] == ["Camera", "Laptop", "Drill"]


def test_custody_never_includes_another_teams_items(db, seeded):
    report = build_report(db, "custody", "org_b", date(2026, 3, 1), date(2026, 3, 31))
    assert [row["item"] for row in report.rows] == ["Projector"]


def test_custody_can_be_limited_to_one_item(db, seeded):
    report = _march(db, "custody", asset_id=seeded["Laptop"].id)
    assert [row["item"] for row in report.rows] == ["Laptop"]


def test_custody_row_says_who_had_it_and_when(db, seeded):
    laptop = _march(db, "custody").rows[1]
    assert laptop["tag"] == "STW-0318"
    assert laptop["checked_out"] == "2026-03-10 09:00"
    assert laptop["due"] == "2026-03-12 09:00"
    assert laptop["returned"] == "2026-03-15 09:00"
    assert laptop["days_overdue"] == "3"
    assert laptop["received_by"] == "Ada Admin"
    assert laptop["notes"] == "Charger missing"


def test_custody_shows_unreturned_items_as_not_returned(db, seeded):
    drill = _march(db, "custody").rows[2]
    assert drill["returned"] == "Not returned"
    assert drill["received_by"] == ""
    assert int(drill["days_overdue"]) > 0


def test_names_saved_at_the_time_win_over_current_names(db, seeded):
    camera = _march(db, "custody").rows[0]
    assert camera["held_by"] == "Mo (as then)"
    assert camera["handed_out_by"] == "Ada (as then)"
    assert camera["held_by_id"] == "user_member_a"


def test_older_records_fall_back_to_a_live_name_lookup(db, seeded):
    drill = _march(db, "custody").rows[2]
    assert drill["held_by"] == "Mia Member"


def test_someone_who_has_left_is_shown_as_a_former_member(db, seeded):
    laptop = _march(db, "custody").rows[1]
    assert laptop["held_by"] == "Former member"
    assert laptop["held_by_id"] == "user_gone_a"


def test_if_clerk_is_unreachable_the_id_is_shown_not_former_member(db, seeded, monkeypatch):
    from app.core import people

    monkeypatch.setattr(people, "_fetch_names", lambda ids: {})
    people._cache.clear()
    laptop = _march(db, "custody").rows[1]
    assert laptop["held_by"] == "user_gone_a"


# ---- activity --------------------------------------------------------------------


def test_activity_covers_the_period_inclusive_of_its_last_day(db, seeded):
    report = _march(db, "activity")
    # The 23:00 entry on March 31 is in; the midnight April 1 entry is not.
    assert [(row["item"], row["event"]) for row in report.rows] == [
        ("Laptop", "Checked out"),
        ("Laptop", "Returned"),
        ("Drill", "Edited"),
    ]


def test_activity_describes_each_entry_in_words(db, seeded):
    rows = _march(db, "activity").rows
    assert rows[0]["details"] == "To Former member, due 2026-03-12 09:00"
    assert rows[0]["by"] == "Ada Admin"
    assert rows[2]["details"] == "status Available to Maintenance; changed status"


def test_activity_includes_full_history_regardless_of_plan(db, seeded):
    # The Activity page trims Starter teams to 30 days. Reports never do.
    report = build_report(db, "activity", "org_a", date(2024, 1, 1), date(2025, 12, 31))
    assert [(row["item"], row["event"]) for row in report.rows] == [("Tripod", "Retired")]


def test_unknown_report_types_are_refused(db):
    with pytest.raises(ValueError):
        build_report(db, "payroll", "org_a", date(2026, 3, 1), date(2026, 3, 31))


# ---- output ------------------------------------------------------------------------


def test_csv_opens_cleanly_in_excel_and_keeps_id_columns(db, seeded):
    csv_bytes = _march(db, "custody").csv_bytes()
    assert csv_bytes.startswith("﻿".encode("utf-8"))
    lines = csv_bytes.decode("utf-8-sig").splitlines()
    assert lines[0].startswith("Item,Tag,Item ID,Held by,Held by ID,")
    assert len(lines) == 1 + 3


def test_the_fingerprint_depends_only_on_the_data(db, seeded):
    first = _march(db, "custody")
    second = _march(db, "custody")
    assert first.data_fingerprint == second.data_fingerprint
    assert len(first.data_fingerprint) == 64
    assert _march(db, "activity").data_fingerprint != first.data_fingerprint


@pytest.mark.parametrize("report_type", ["custody", "activity"])
def test_pdf_renders_with_a_summary_page_and_the_table(db, seeded, report_type):
    report = _march(db, report_type)
    pdf = render_pdf(report, ReportContext(org_name="Kingdom Test Org", generated_by="Ada Admin"))
    assert pdf.startswith(b"%PDF")
    assert pdf.count(b"/Type /Page\n") + pdf.count(b"/Type /Page ") >= 2


def test_pdf_renders_an_empty_period(db, seeded):
    report = build_report(db, "custody", "org_a", date(2020, 1, 1), date(2020, 1, 31))
    pdf = render_pdf(report, ReportContext(org_name="Org", generated_by="Ada Admin"))
    assert pdf.startswith(b"%PDF")


def test_pdf_handles_hundreds_of_rows(db):
    asset = Asset(org_id="org_a", name="Camera & <Lens>", status="Available")
    db.add(asset)
    db.flush()
    start = datetime(2026, 3, 1, tzinfo=timezone.utc)
    for i in range(400):
        db.add(ActivityLog(org_id="org_a", asset_id=asset.id, asset_name=asset.name,
                           actor_id="user_admin_a", event_type="updated",
                           created_at=start + timedelta(minutes=i), details={"updates": ["notes"]}))
    db.commit()

    report = _march(db, "activity")
    assert len(report.rows) == 400
    pdf = render_pdf(report, ReportContext(org_name="Org", generated_by="Ada Admin"))
    assert pdf.startswith(b"%PDF")
