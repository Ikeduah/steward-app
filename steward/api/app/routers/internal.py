import os
import hmac
import logging
from fastapi import APIRouter, BackgroundTasks, Depends, Header, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta
from collections import defaultdict

from app.core.debs import get_db
from app.models.assignment import Assignment
from app.core.notifications import send_overdue_notification

logger = logging.getLogger(__name__)
router = APIRouter()

_CRON_SECRET = os.getenv("CRON_SECRET")
_RENOTIFY_AFTER_HOURS = 24


def _verify_cron_secret(x_cron_secret: str = Header(None, alias="x-cron-secret")):
    if not _CRON_SECRET or not x_cron_secret or not hmac.compare_digest(x_cron_secret, _CRON_SECRET):
        raise HTTPException(status_code=401, detail="Unauthorized")


@router.post("/overdue-check")
async def check_overdue(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    _: None = Depends(_verify_cron_secret),
):
    now = datetime.now(timezone.utc)
    renotify_cutoff = now - timedelta(hours=_RENOTIFY_AFTER_HOURS)

    overdue = db.query(Assignment).filter(
        Assignment.status == "Active",
        Assignment.expected_return_at.isnot(None),
        Assignment.expected_return_at < now,
        (
            Assignment.overdue_notified_at.is_(None)
            | (Assignment.overdue_notified_at < renotify_cutoff)
        ),
    ).all()

    if not overdue:
        return {"processed": 0}

    # Group by org so each org gets one digest email
    by_org: dict[str, list[Assignment]] = defaultdict(list)
    for a in overdue:
        by_org[a.org_id].append(a)

    total = 0
    for org_id, assignments in by_org.items():
        payload = [
            {
                "asset_name": a.asset.name if a.asset else f"Asset #{a.asset_id}",
                "expected_return_at": a.expected_return_at,
            }
            for a in assignments
        ]
        background_tasks.add_task(send_overdue_notification, org_id, payload)

        # Mark as notified before returning so re-runs within 24h are skipped
        for a in assignments:
            a.overdue_notified_at = now
        total += len(assignments)

    db.commit()
    logger.info("Overdue check: queued notifications for %d assignment(s) across %d org(s)", total, len(by_org))
    return {"processed": total, "orgs": len(by_org)}
