import os
import html
import logging
import resend
import httpx
from typing import Optional
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

CLERK_SECRET_KEY = os.getenv("CLERK_SECRET_KEY")
_resend_api_key = os.getenv("RESEND_API_KEY")
FROM_EMAIL = os.getenv("FROM_EMAIL", "Steward <notifications@steward.app>")

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


def _email_wrapper(title: str, body_html: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f0;font-family:Inter,Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f0;padding:32px 16px;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;max-width:560px;width:100%;">
      <!-- Header -->
      <tr>
        <td style="background:#10B981;padding:24px 32px;">
          <span style="font-family:'Space Grotesk',Helvetica,Arial,sans-serif;font-size:20px;font-weight:600;color:#ffffff;letter-spacing:-0.3px;">
            Steward
          </span>
        </td>
      </tr>
      <!-- Body -->
      <tr>
        <td style="padding:32px;">
          {body_html}
        </td>
      </tr>
      <!-- Footer -->
      <tr>
        <td style="padding:16px 32px 24px;border-top:1px solid #f0f0ec;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">
            You're receiving this because you're an admin of your Steward organization.
            Manage your settings at <a href="https://steward.app/organization" style="color:#10B981;">steward.app</a>.
          </p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>"""


# ---------------------------------------------------------------------------
# Notification senders
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

    # Escape all user-controlled values before interpolating into HTML.
    e_asset = html.escape(asset_name)
    e_member = html.escape(member_name)
    e_due = html.escape(due_str)

    body = f"""
      <h2 style="margin:0 0 8px;font-size:20px;font-weight:600;color:#06140E;">Asset Checked Out</h2>
      <p style="margin:0 0 24px;font-size:14px;color:#6b7280;">A piece of equipment just left your inventory.</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:12px;padding:20px;">
        <tr><td style="padding:6px 0;">
          <span style="font-size:12px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;">Asset</span><br>
          <span style="font-size:16px;font-weight:600;color:#06140E;">{e_asset}</span>
        </td></tr>
        <tr><td style="padding:6px 0;">
          <span style="font-size:12px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;">Checked Out By</span><br>
          <span style="font-size:15px;color:#374151;">{e_member}</span>
        </td></tr>
        <tr><td style="padding:6px 0;">
          <span style="font-size:12px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;">Due Back</span><br>
          <span style="font-size:15px;color:#374151;">{e_due}</span>
        </td></tr>
      </table>
    """
    _send_email(
        to=emails,
        subject=f"[Steward] Asset Checked Out: {asset_name}",
        html=_email_wrapper(f"Asset Checked Out: {e_asset}", body),
    )


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

    # Escape all user-controlled values before interpolating into HTML.
    e_asset = html.escape(asset_name)
    e_member = html.escape(member_name)

    body = f"""
      <h2 style="margin:0 0 8px;font-size:20px;font-weight:600;color:#06140E;">Asset Returned</h2>
      <p style="margin:0 0 24px;font-size:14px;color:#6b7280;">Equipment has been checked back into your inventory.</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border-radius:12px;padding:20px;">
        <tr><td style="padding:6px 0;">
          <span style="font-size:12px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;">Asset</span><br>
          <span style="font-size:16px;font-weight:600;color:#06140E;">{e_asset}</span>
        </td></tr>
        <tr><td style="padding:6px 0;">
          <span style="font-size:12px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;">Returned By</span><br>
          <span style="font-size:15px;color:#374151;">{e_member}</span>
        </td></tr>
        <tr><td style="padding:6px 0;">
          <span style="font-size:12px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;">Returned At</span><br>
          <span style="font-size:15px;color:#374151;">{returned_at}</span>
        </td></tr>
      </table>
    """
    _send_email(
        to=emails,
        subject=f"[Steward] Asset Returned: {asset_name}",
        html=_email_wrapper(f"Asset Returned: {e_asset}", body),
    )


_SEVERITY_COLOR = {
    "Low": "#3b82f6",
    "Medium": "#f59e0b",
    "High": "#f97316",
    "Critical": "#ef4444",
}


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
    sev_color = _SEVERITY_COLOR.get(severity, "#6b7280")

    # Escape all user-controlled values before interpolating into HTML.
    e_severity = html.escape(severity)
    e_title = html.escape(title)
    e_asset = html.escape(asset_name)
    e_reporter = html.escape(reporter_name)

    body = f"""
      <h2 style="margin:0 0 8px;font-size:20px;font-weight:600;color:#06140E;">New Incident Reported</h2>
      <p style="margin:0 0 24px;font-size:14px;color:#6b7280;">An incident has been logged on one of your assets.</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef9f9;border-radius:12px;padding:20px;border-left:4px solid {sev_color};">
        <tr><td style="padding:6px 0;">
          <span style="font-size:12px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;">Severity</span><br>
          <span style="font-size:15px;font-weight:600;color:{sev_color};">{e_severity}</span>
        </td></tr>
        <tr><td style="padding:6px 0;">
          <span style="font-size:12px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;">Title</span><br>
          <span style="font-size:16px;font-weight:600;color:#06140E;">{e_title}</span>
        </td></tr>
        <tr><td style="padding:6px 0;">
          <span style="font-size:12px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;">Asset</span><br>
          <span style="font-size:15px;color:#374151;">{e_asset}</span>
        </td></tr>
        <tr><td style="padding:6px 0;">
          <span style="font-size:12px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;">Reported By</span><br>
          <span style="font-size:15px;color:#374151;">{e_reporter}</span>
        </td></tr>
      </table>
      <p style="margin:24px 0 0;font-size:13px;color:#6b7280;">
        Review this incident in the
        <a href="https://steward.app/incidents" style="color:#10B981;text-decoration:none;">Steward dashboard →</a>
      </p>
    """
    subject_prefix = f"[Steward] {severity} Incident" if severity in ("High", "Critical") else "[Steward] New Incident"
    _send_email(
        to=emails,
        subject=f"{subject_prefix}: {title}",
        html=_email_wrapper(f"New Incident: {e_title}", body),
    )


async def send_overdue_notification(
    org_id: str,
    assignments: list[dict],
) -> None:
    if not await _is_notifications_enabled(org_id):
        return
    emails = await get_admin_emails(org_id)
    count = len(assignments)

    rows = ""
    for a in assignments:
        due = a.get("expected_return_at")
        due_str = due.strftime("%b %d, %Y") if isinstance(due, datetime) else str(due or "—")
        # Escape user-controlled values before interpolating into HTML.
        e_asset = html.escape(str(a.get("asset_name", "—")))
        e_due = html.escape(due_str)
        rows += f"""
          <tr>
            <td style="padding:10px 12px;border-bottom:1px solid #f0f0ec;font-size:14px;color:#06140E;font-weight:500;">
              {e_asset}
            </td>
            <td style="padding:10px 12px;border-bottom:1px solid #f0f0ec;font-size:14px;color:#ef4444;">
              {e_due}
            </td>
          </tr>
        """

    body = f"""
      <h2 style="margin:0 0 8px;font-size:20px;font-weight:600;color:#06140E;">Overdue Equipment Alert</h2>
      <p style="margin:0 0 24px;font-size:14px;color:#6b7280;">
        {count} item{"s are" if count != 1 else " is"} past their expected return date.
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:12px;overflow:hidden;border:1px solid #f0f0ec;">
        <thead>
          <tr style="background:#f9fafb;">
            <th style="padding:10px 12px;text-align:left;font-size:12px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;">Asset</th>
            <th style="padding:10px 12px;text-align:left;font-size:12px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;">Was Due</th>
          </tr>
        </thead>
        <tbody>
          {rows}
        </tbody>
      </table>
      <p style="margin:24px 0 0;font-size:13px;color:#6b7280;">
        Follow up in the
        <a href="https://steward.app/assignments" style="color:#10B981;text-decoration:none;">Assignments page →</a>
      </p>
    """
    _send_email(
        to=emails,
        subject=f"[Steward] {count} Overdue Item{'s' if count != 1 else ''} Need Attention",
        html=_email_wrapper("Overdue Equipment Alert", body),
    )
