"""
Audit report exports. Step 4 of #17.

POST /api/audit/export     download a custody or activity report, CSV or PDF
GET  /api/audit/usage      runs used and left this month
GET  /api/audit/exports    the record of past exports

Every plan can export. Starter gets a set number of runs per calendar month
(UTC); Pro is unlimited. A run is one report type over one period, for all
items or one item. Downloading the same run again within 24 hours, in either
format, is free, so a lost file or wanting the other format never costs a run.
"""

import hashlib
from datetime import date, datetime, timedelta, timezone
from typing import List, Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel, ConfigDict, model_validator
from sqlalchemy.orm import Session

from app.core import people
from app.core.audit_pdf import ReportContext, render_pdf
from app.core.audit_reports import build_report
from app.core.billing import PlanLimits, get_org_plan
from app.core.debs import get_db
from app.models.asset import Asset
from app.models.audit_export import AuditExport
from app.routers.assets import get_org_id, get_user_id, require_admin

router = APIRouter()

FREE_REDOWNLOAD_WINDOW = timedelta(hours=24)
EARLIEST_DATE = date(2000, 1, 1)


class ExportRequest(BaseModel):
    report_type: Literal["custody", "activity"]
    format: Literal["csv", "pdf"]
    start: date
    end: date
    asset_id: Optional[int] = None

    @model_validator(mode="after")
    def _check_period(self):
        if self.start > self.end:
            raise ValueError("start must be on or before end")
        if self.start < EARLIEST_DATE:
            raise ValueError("start is too early")
        return self


class UsageResponse(BaseModel):
    plan: str
    limit: Optional[int]  # None means unlimited
    used: int
    remaining: Optional[int]
    resets_on: date


class ExportRecord(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    report_type: str
    format: str
    range_start: date
    range_end: date
    asset_id: Optional[int]
    row_count: int
    sha256: str
    counts_toward_limit: bool
    requested_by: str
    requested_by_name: Optional[str]
    created_at: Optional[datetime]


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _month_bounds(now: datetime) -> tuple[datetime, date]:
    start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    next_month = (start + timedelta(days=32)).replace(day=1)
    return start, next_month.date()


def _db_time(db: Session, value: datetime) -> datetime:
    # SQLite stores naive UTC; compare like with like.
    return value.replace(tzinfo=None) if db.get_bind().dialect.name == "sqlite" else value


async def _usage(db: Session, org_id: str, now: datetime) -> UsageResponse:
    plan = await get_org_plan(org_id)
    limit = PlanLimits(plan).audit_reports_per_month
    month_start, resets_on = _month_bounds(now)
    used = (
        db.query(AuditExport)
        .filter(
            AuditExport.org_id == org_id,
            AuditExport.counts_toward_limit.is_(True),
            AuditExport.created_at >= _db_time(db, month_start),
        )
        .count()
    )
    unlimited = limit == float("inf")
    return UsageResponse(
        plan=plan.value,
        limit=None if unlimited else int(limit),
        used=used,
        remaining=None if unlimited else max(int(limit) - used, 0),
        resets_on=resets_on,
    )


def _is_free_redownload(db: Session, org_id: str, request: ExportRequest, now: datetime) -> bool:
    return (
        db.query(AuditExport)
        .filter(
            AuditExport.org_id == org_id,
            AuditExport.report_type == request.report_type,
            AuditExport.range_start == request.start,
            AuditExport.range_end == request.end,
            AuditExport.asset_id.is_(None) if request.asset_id is None else AuditExport.asset_id == request.asset_id,
            AuditExport.counts_toward_limit.is_(True),
            AuditExport.created_at >= _db_time(db, now - FREE_REDOWNLOAD_WINDOW),
        )
        .first()
        is not None
    )


@router.get("/usage", response_model=UsageResponse)
async def get_usage(
    db: Session = Depends(get_db),
    org_id: str = Depends(get_org_id),
    _: bool = Depends(require_admin),
):
    return await _usage(db, org_id, _now())


@router.get("/exports", response_model=List[ExportRecord])
def list_exports(
    db: Session = Depends(get_db),
    org_id: str = Depends(get_org_id),
    _: bool = Depends(require_admin),
    limit: int = 50,
):
    return (
        db.query(AuditExport)
        .filter(AuditExport.org_id == org_id)
        .order_by(AuditExport.created_at.desc(), AuditExport.id.desc())
        .limit(min(max(limit, 1), 200))
        .all()
    )


@router.post("/export")
async def export_report(
    request: ExportRequest,
    db: Session = Depends(get_db),
    org_id: str = Depends(get_org_id),
    user_id: str = Depends(get_user_id),
    _: bool = Depends(require_admin),
):
    now = _now()

    item_name = None
    if request.asset_id is not None:
        asset = db.query(Asset).filter(Asset.id == request.asset_id, Asset.org_id == org_id).first()
        if not asset:
            raise HTTPException(status_code=404, detail="Asset not found")
        item_name = asset.name

    free = _is_free_redownload(db, org_id, request, now)
    usage = await _usage(db, org_id, now)
    if not free and usage.remaining == 0:
        raise HTTPException(
            status_code=403,
            detail=(
                f"Your {usage.plan} plan includes {usage.limit} audit reports a month, and this "
                f"month's are used. More become available on {usage.resets_on.isoformat()}, "
                "or upgrade to Pro for unlimited reports."
            ),
        )

    report = build_report(db, request.report_type, org_id, request.start, request.end, request.asset_id)
    requested_by_name = people.display_name(user_id)

    if request.format == "csv":
        content = report.csv_bytes()
        media_type = "text/csv; charset=utf-8"
    else:
        context = ReportContext(
            org_name=people.organization_name(org_id) or org_id,
            generated_by=requested_by_name or user_id,
            item_name=item_name,
        )
        content = render_pdf(report, context)
        media_type = "application/pdf"

    sha256 = hashlib.sha256(content).hexdigest()
    db.add(AuditExport(
        org_id=org_id,
        requested_by=user_id,
        requested_by_name=requested_by_name,
        report_type=request.report_type,
        format=request.format,
        range_start=request.start,
        range_end=request.end,
        asset_id=request.asset_id,
        row_count=len(report.rows),
        sha256=sha256,
        counts_toward_limit=not free,
    ))
    db.commit()

    remaining = usage.remaining
    if remaining is not None and not free:
        remaining -= 1

    filename = f"steward-{request.report_type}-{request.start.isoformat()}-to-{request.end.isoformat()}"
    if request.asset_id is not None:
        filename += f"-item-{request.asset_id}"
    headers = {
        "Content-Disposition": f'attachment; filename="{filename}.{request.format}"',
        "X-Steward-File-SHA256": sha256,
        "X-Steward-Data-Fingerprint": report.data_fingerprint,
        "X-Steward-Counted": "false" if free else "true",
        "Access-Control-Expose-Headers": "Content-Disposition, X-Steward-File-SHA256, X-Steward-Data-Fingerprint, X-Steward-Counted, X-Steward-Runs-Remaining",
    }
    if remaining is not None:
        headers["X-Steward-Runs-Remaining"] = str(remaining)
    return Response(content=content, media_type=media_type, headers=headers)
