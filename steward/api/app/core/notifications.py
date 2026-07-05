import os
import logging
import resend
import httpx
from typing import Optional
from datetime import datetime, timezone

from app.core import email_templates as et

logger = logging.getLogger(__name__)

CLERK_SECRET_KEY = os.getenv("CLERK_SECRET_KEY")
_resend_api_key = os.getenv("RESEND_API_KEY")
FROM_EMAIL = os.getenv("FROM_EMAIL", "Steward <notifications@stward.app>")

if _resend_api_key:
    resend.api_key = _resend_api_key


# ---------------------------------------------------------------------------
# Clerk helpers
# ---------------------------------------------------------------------------

async def get_user_display_name(user_id: str) -> str:
    if not CLERK_SECRET_KEY or not user_id:
        return user_id
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"https://api.clerk.com/v1/users/{user_id}",
                headers={"Authorization": f"Bearer {CLERK_SECRET_KEY}"},
                timeout=5.0,
            )
            if resp.status_code == 200:
                data = resp.json()
                first = data.get("first_name") or ""
                last = data.get("last_name") or ""
                name = f"{first} {last}".strip()
                return name or user_id
    except Exception as e:
        logger.warning("Could not fetch display name for %s: %s", user_id, type(e).__name__)
    return user_id


async def get_admin_emails(org_id: str) -> list[str]:
    if not CLERK_SECRET_KEY or not org_id:
        return []
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"https://api.clerk.com/v1/organizations/{org_id}/memberships",
                headers={"Authorization": f"Bearer {CLERK_SECRET_KEY}"},
                params={"limit": 100},
                timeout=5.0,
            )
            if resp.status_code != 200:
                return []
            data = resp.json()
            emails: list[str] = []
            for member in data.get("data", []):
                role = member.get("role", "")
                if role not in ("org:admin", "admin"):
                    continue
                identifier = (member.get("public_user_data") or {}).get("identifier", "")
                if "@" in identifier:
                    emails.append(identifier)
            return emails
    except Exception as e:
        logger.error("Could not fetch admin emails for org %s: %s", org_id, type(e).__name__)
        return []


async def _is_notifications_enabled(org_id: str) -> bool:
    from app.core.billing import get_org_plan, PlanType
    plan = await get_org_plan(org_id)
    return plan == PlanType.PRO


# ---------------------------------------------------------------------------
# Email sending
# ---------------------------------------------------------------------------

def _send_email(to: list[str], subject: str, html: str) -> None:
    if not _resend_api_key:
        logger.warning("RESEND_API_KEY not set — skipping email notification")
        return
    if not to:
        logger.info("No admin emails found — skipping notification")
        return
    try:
        resend.Emails.send({
            "from": FROM_EMAIL,
            "to": to,
            "subject": subject,
            "html": html,
        })
    except Exception as e:
        logger.error("Failed to send email notification: %s", type(e).__name__)


# ---------------------------------------------------------------------------
# Notification senders — gather data, then delegate to email_templates.
# Escaping lives inside the templates, so raw values are passed here.
# ---------------------------------------------------------------------------

async def send_checkout_notification(
    org_id: str,
    asset_name: str,
    checked_out_by_id: str,
    expected_return_at: Optional[datetime],
) -> None:
    if not await _is_notifications_enabled(org_id):
        return
    emails = await get_admin_emails(org_id)
    member_name = await get_user_display_name(checked_out_by_id)
    due_str = (
        expected_return_at.strftime("%b %d, %Y") if expected_return_at else "No due date set"
    )

    subject, html = et.checkout_email(asset_name, member_name, due_str)
    _send_email(to=emails, subject=subject, html=html)


async def send_checkin_notification(
    org_id: str,
    asset_name: str,
    returned_by_id: str,
) -> None:
    if not await _is_notifications_enabled(org_id):
        return
    emails = await get_admin_emails(org_id)
    member_name = await get_user_display_name(returned_by_id)
    returned_at = datetime.now(timezone.utc).strftime("%b %d, %Y at %I:%M %p UTC")

    subject, html = et.checkin_email(asset_name, member_name, returned_at)
    _send_email(to=emails, subject=subject, html=html)


async def send_incident_notification(
    org_id: str,
    asset_name: str,
    reported_by_id: str,
    severity: str,
    title: str,
) -> None:
    if not await _is_notifications_enabled(org_id):
        return
    emails = await get_admin_emails(org_id)
    reporter_name = await get_user_display_name(reported_by_id)
    dashboard_url = f"{et.EMAIL_ASSET_BASE_URL}/incidents"

    subject, html = et.incident_email(
        asset_name, reporter_name, severity, title, dashboard_url
    )
    _send_email(to=emails, subject=subject, html=html)


async def send_overdue_notification(
    org_id: str,
    assignments: list[dict],
) -> None:
    if not await _is_notifications_enabled(org_id):
        return
    emails = await get_admin_emails(org_id)

    items = []
    for a in assignments:
        due = a.get("expected_return_at")
        due_str = due.strftime("%b %d, %Y") if isinstance(due, datetime) else str(due or "—")
        items.append({"asset_name": str(a.get("asset_name", "—")), "due_str": due_str})

    subject, html = et.overdue_email(items)
    _send_email(to=emails, subject=subject, html=html)
