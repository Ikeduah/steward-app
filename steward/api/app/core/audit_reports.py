"""
Audit reports: who had what, and everything that happened, over a date range.

Two reports, each a plain table that the export endpoint (step 4 of #17)
renders as CSV or PDF:

- custody: one row per check-out that overlapped the range. Overlap rather
  than "started in the range", because an auditor asking about March needs
  the laptop that went out in February and came back in April.
- activity: one row per log entry in the range.

Reports cover full history on every plan. They deliberately do not reuse the
Activity page's query, which trims Starter teams to 30 days.

All times are UTC: Steward does not store a team time zone.
"""

import csv
import hashlib
import io
import math
from dataclasses import dataclass, field
from datetime import date, datetime, time, timedelta, timezone
from typing import Any, Dict, Iterable, List, Optional

from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core import people
from app.models.activity import ActivityLog
from app.models.asset import Asset
from app.models.assignment import Assignment

REPORT_TYPES = ("custody", "activity")


@dataclass
class Column:
    key: str
    title: str
    # Shown in the PDF. ID columns stay in the CSV, where they are useful for
    # matching against other systems, but would crowd the printed table.
    in_pdf: bool = True


@dataclass
class Report:
    report_type: str
    title: str
    org_id: str
    start: date
    end: date
    asset_id: Optional[int]
    columns: List[Column]
    rows: List[Dict[str, str]] = field(default_factory=list)
    generated_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    def csv_bytes(self) -> bytes:
        """UTF-8 with a byte order mark, so Excel opens names correctly."""
        buffer = io.StringIO()
        writer = csv.writer(buffer, lineterminator="\r\n")
        writer.writerow([column.title for column in self.columns])
        for row in self.rows:
            writer.writerow([row.get(column.key, "") for column in self.columns])
        return ("﻿" + buffer.getvalue()).encode("utf-8")

    @property
    def data_fingerprint(self) -> str:
        """
        SHA-256 of the report's CSV form.

        Printed on the PDF's summary page, so a PDF and a CSV of the same run
        can be shown to hold the same data. The file hash stored for each
        download is separate, since a PDF cannot contain its own hash.
        """
        return hashlib.sha256(self.csv_bytes()).hexdigest()


# ---- formatting ------------------------------------------------------------------


def _utc(value: Optional[datetime]) -> Optional[datetime]:
    if value is None:
        return None
    # SQLite hands back naive datetimes; everything is stored as UTC.
    return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value.astimezone(timezone.utc)


def _fmt_time(value: Optional[datetime]) -> str:
    value = _utc(value)
    return value.strftime("%Y-%m-%d %H:%M") if value else ""


def _range_bounds(start: date, end: date) -> tuple[datetime, datetime]:
    """Start of the first day to the start of the day after the last, UTC."""
    return (
        datetime.combine(start, time.min, tzinfo=timezone.utc),
        datetime.combine(end + timedelta(days=1), time.min, tzinfo=timezone.utc),
    )


def _naive_for_db(db: Session, value: datetime) -> datetime:
    # SQLite compares stored naive values as text; strip the zone to match.
    return value.replace(tzinfo=None) if db.get_bind().dialect.name == "sqlite" else value


class _Names:
    """
    Turns a user ID into the name to print.

    Prefers the name saved on the record at the time. Records from before
    names were saved fall back to a live Clerk lookup, done once per report.
    Someone Clerk no longer knows is shown as a former member; if Clerk cannot
    be reached, the raw ID is shown rather than nothing.
    """

    def __init__(self, user_ids: Iterable[Optional[str]]):
        self._live = people.display_names(user_ids)

    def __call__(self, user_id: Optional[str], saved_name: Optional[str] = None) -> str:
        if not user_id:
            return ""
        if saved_name:
            return saved_name
        name = self._live.get(user_id)
        if name:
            return name
        return "Former member" if people.is_known_missing(user_id) else user_id


# ---- custody ---------------------------------------------------------------------

CUSTODY_COLUMNS = [
    Column("item", "Item"),
    Column("tag", "Tag"),
    Column("item_id", "Item ID", in_pdf=False),
    Column("held_by", "Held by"),
    Column("held_by_id", "Held by ID", in_pdf=False),
    Column("handed_out_by", "Handed out by"),
    Column("handed_out_by_id", "Handed out by ID", in_pdf=False),
    Column("checked_out", "Checked out (UTC)"),
    Column("due", "Due (UTC)"),
    Column("returned", "Returned (UTC)"),
    Column("received_by", "Received by"),
    Column("received_by_id", "Received by ID", in_pdf=False),
    Column("days_overdue", "Days overdue"),
    Column("notes", "Notes"),
]


def _days_overdue(due: Optional[datetime], returned: Optional[datetime], now: datetime) -> str:
    due = _utc(due)
    if due is None:
        return ""
    late = (_utc(returned) or now) - due
    return str(math.ceil(late.total_seconds() / 86400)) if late.total_seconds() > 0 else "0"


def build_custody_report(
    db: Session, org_id: str, start: date, end: date, asset_id: Optional[int] = None
) -> Report:
    range_start, range_end = _range_bounds(start, end)
    query = (
        db.query(Assignment, Asset)
        .join(Asset, Asset.id == Assignment.asset_id)
        .filter(
            Assignment.org_id == org_id,
            Assignment.checked_out_at < _naive_for_db(db, range_end),
            or_(
                Assignment.actual_return_at.is_(None),
                Assignment.actual_return_at >= _naive_for_db(db, range_start),
            ),
        )
    )
    if asset_id is not None:
        query = query.filter(Assignment.asset_id == asset_id)
    records = query.order_by(Assignment.checked_out_at.asc(), Assignment.id.asc()).all()

    names = _Names(
        uid
        for assignment, _ in records
        for uid in (assignment.assigned_to, assignment.assigned_by, assignment.received_by)
    )
    report = Report(
        report_type="custody",
        title="Custody report",
        org_id=org_id,
        start=start,
        end=end,
        asset_id=asset_id,
        columns=CUSTODY_COLUMNS,
    )
    for assignment, asset in records:
        report.rows.append({
            "item": asset.name,
            "tag": asset.qr_code or "",
            "item_id": str(asset.id),
            "held_by": names(assignment.assigned_to, assignment.assigned_to_name),
            "held_by_id": assignment.assigned_to,
            "handed_out_by": names(assignment.assigned_by, assignment.assigned_by_name),
            "handed_out_by_id": assignment.assigned_by,
            "checked_out": _fmt_time(assignment.checked_out_at),
            "due": _fmt_time(assignment.expected_return_at),
            "returned": _fmt_time(assignment.actual_return_at) or "Not returned",
            "received_by": names(assignment.received_by, assignment.received_by_name),
            "received_by_id": assignment.received_by or "",
            "days_overdue": _days_overdue(
                assignment.expected_return_at, assignment.actual_return_at, report.generated_at
            ),
            "notes": assignment.notes or "",
        })
    return report


# ---- activity --------------------------------------------------------------------

ACTIVITY_COLUMNS = [
    Column("time", "Time (UTC)"),
    Column("item", "Item"),
    Column("item_id", "Item ID", in_pdf=False),
    Column("event", "Event"),
    Column("by", "By"),
    Column("by_id", "By ID", in_pdf=False),
    Column("details", "Details"),
]

EVENT_LABELS = {
    "created": "Added",
    "updated": "Edited",
    "checked_out": "Checked out",
    "checked_in": "Returned",
    "retired": "Retired",
    "deleted": "Deleted",
    "incident_reported": "Incident reported",
    "incident_updated": "Incident updated",
}


def _describe(event_type: str, details: Optional[Dict[str, Any]], names: _Names) -> str:
    """A one-line, human-readable version of the log entry's details."""
    details = details or {}
    if event_type == "checked_out":
        parts = ["To " + names(details.get("assigned_to"), details.get("assigned_to_name"))]
        due = details.get("expected_return_at")
        if due:
            parts.append("due " + _fmt_time(datetime.fromisoformat(due)))
        return ", ".join(parts)
    if event_type == "updated":
        before, after = details.get("previous_status"), details.get("new_status")
        changed = ", ".join(details.get("updates") or [])
        status = f"status {before} to {after}" if before and after and before != after else ""
        reason = details.get("reason") or ""
        return "; ".join(part for part in (status, f"changed {changed}" if changed else "", reason) if part)
    if event_type == "retired":
        previous = details.get("previous_status")
        return f"was {previous}" if previous else ""
    # Everything else: the raw fields, in a stable order.
    return "; ".join(f"{key}: {details[key]}" for key in sorted(details) if details[key] not in (None, ""))


def build_activity_report(
    db: Session, org_id: str, start: date, end: date, asset_id: Optional[int] = None
) -> Report:
    range_start, range_end = _range_bounds(start, end)
    query = db.query(ActivityLog).filter(
        ActivityLog.org_id == org_id,
        ActivityLog.created_at >= _naive_for_db(db, range_start),
        ActivityLog.created_at < _naive_for_db(db, range_end),
    )
    if asset_id is not None:
        query = query.filter(ActivityLog.asset_id == asset_id)
    logs = query.order_by(ActivityLog.created_at.asc(), ActivityLog.id.asc()).all()

    names = _Names(
        [log.actor_id for log in logs]
        + [(log.details or {}).get("assigned_to") for log in logs]
    )
    report = Report(
        report_type="activity",
        title="Activity report",
        org_id=org_id,
        start=start,
        end=end,
        asset_id=asset_id,
        columns=ACTIVITY_COLUMNS,
    )
    for log in logs:
        report.rows.append({
            "time": _fmt_time(log.created_at),
            "item": log.asset_name or "",
            "item_id": str(log.asset_id),
            "event": EVENT_LABELS.get(log.event_type, log.event_type.replace("_", " ").capitalize()),
            "by": names(log.actor_id, log.actor_name),
            "by_id": log.actor_id,
            "details": _describe(log.event_type, log.details, names),
        })
    return report


def build_report(
    db: Session, report_type: str, org_id: str, start: date, end: date, asset_id: Optional[int] = None
) -> Report:
    if report_type == "custody":
        return build_custody_report(db, org_id, start, end, asset_id)
    if report_type == "activity":
        return build_activity_report(db, org_id, start, end, asset_id)
    raise ValueError(f"unknown report type: {report_type}")
