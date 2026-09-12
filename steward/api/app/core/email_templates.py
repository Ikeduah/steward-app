"""Branded transactional email design system for Steward.

Presentation only. This module owns the brand tokens, a set of reusable
table-based building blocks, and the composed transactional templates.

Every builder that emits a user-controlled value **escapes it internally**
(`data_row`, `status_badge`, `list_table`). Senders in
``app.core.notifications`` therefore pass *raw* values and never need to
remember to escape — the security property lives here.

All markup is table-based with inline styles, which is required for broad
email-client compatibility (Gmail, Outlook, Apple Mail, etc.). Webfonts are
declared as stacks but degrade to system fonts, since most clients strip
``<link>``/``@font-face``.
"""

import html
import os

# ---------------------------------------------------------------------------
# Brand tokens (from the Steward Brand Kit)
# ---------------------------------------------------------------------------

# Emerald ramp
EMERALD_500 = "#10B981"
EMERALD_600 = "#059669"
EMERALD_700 = "#047857"
EMERALD_50 = "#ECFDF5"

# Semantic status
AVAILABLE = "#22C55E"
WARNING = "#F59E0B"
DANGER = "#EF4444"
INFO = "#3B82F6"

# Neutrals
INK = "#06140E"
NEUTRAL_700 = "#2F3A35"
NEUTRAL_500 = "#5B6862"
NEUTRAL_400 = "#8A958F"
PAPER = "#FBFBF9"
PAGE_BG = "#F3F5F2"
HAIRLINE = "#EDF0EE"

# Email-safe font stacks (webfonts rarely load in mail clients)
DISPLAY = "'Space Grotesk',Helvetica,Arial,sans-serif"
BODY = "Inter,Helvetica,Arial,sans-serif"
MONO = "'JetBrains Mono',Menlo,Consolas,monospace"

# Incident severity → brand hex. Centralized here so senders stay data-only.
_SEVERITY_COLOR = {
    "Low": INFO,          # #3B82F6
    "Medium": WARNING,    # #F59E0B
    "High": "#F97316",    # orange
    "Critical": DANGER,   # #EF4444
}

# Origin that serves the hosted email logo (and any other static email assets).
# Overridable so preview/dev deployments can point at their own origin.
EMAIL_ASSET_BASE_URL = os.getenv("EMAIL_ASSET_BASE_URL", "https://stward.app").rstrip("/")


# ---------------------------------------------------------------------------
# Reusable building blocks
# ---------------------------------------------------------------------------

def wrapper(title: str, body_html: str, preheader: str = "") -> str:
    """Full HTML document: preheader + emerald PNG-logo header + card + footer.

    ``title`` and ``preheader`` are escaped; ``body_html`` is trusted markup
    assembled from the other builders.
    """
    e_title = html.escape(title)
    preheader_html = ""
    if preheader:
        preheader_html = (
            f'<div style="display:none;max-height:0;overflow:hidden;'
            f'mso-hide:all;font-size:1px;line-height:1px;color:{PAGE_BG};'
            f'opacity:0;">{html.escape(preheader)}</div>'
        )
    logo_src = f"{EMAIL_ASSET_BASE_URL}/email/steward-logo@2x.png"
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="light">
<title>{e_title}</title>
</head>
<body style="margin:0;padding:0;background:{PAGE_BG};font-family:{BODY};">
{preheader_html}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:{PAGE_BG};padding:32px 16px;">
  <tr><td align="center">
    <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;max-width:560px;width:100%;box-shadow:0 18px 40px -28px rgba(6,20,14,0.25);">
      <!-- Header -->
      <tr>
        <td style="background:{EMERALD_500};padding:22px 32px;">
          <img src="{logo_src}" width="140" height="40" alt="Steward" style="display:block;border:0;outline:none;text-decoration:none;height:40px;width:140px;">
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
        <td style="padding:20px 32px 28px;border-top:1px solid {HAIRLINE};">
          {footer([("Manage settings", f"{EMAIL_ASSET_BASE_URL}/organization")])}
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>"""


def heading(text: str) -> str:
    """Primary H2 — Space Grotesk, ink."""
    return (
        f'<h2 style="margin:0 0 6px;font-family:{DISPLAY};font-size:22px;'
        f'font-weight:600;color:{INK};letter-spacing:-0.4px;">{html.escape(text)}</h2>'
    )


def lead(text: str) -> str:
    """Subtitle beneath the heading — neutral, calm."""
    return (
        f'<p style="margin:0 0 24px;font-family:{BODY};font-size:14px;'
        f'line-height:1.5;color:{NEUTRAL_500};">{html.escape(text)}</p>'
    )


def data_table(rows_html: str, bg: str = PAPER, accent: str | None = None) -> str:
    """Rounded panel wrapping a set of ``data_row`` cells.

    ``accent`` adds a 4px left border (used for incident severity).
    """
    accent_css = f"border-left:4px solid {accent};" if accent else ""
    return f"""<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:{bg};border-radius:12px;{accent_css}">
        <tr><td style="padding:8px 20px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">{rows_html}</table>
        </td></tr>
      </table>"""


def data_row(label: str, value: str, value_color: str = INK, mono: bool = False) -> str:
    """One label/value pair. Escapes ``value``; ``mono`` renders it in JetBrains Mono."""
    value_font = MONO if mono else BODY
    return f"""<tr><td style="padding:8px 0;">
          <span style="font-family:{BODY};font-size:11px;font-weight:600;color:{NEUTRAL_400};text-transform:uppercase;letter-spacing:0.6px;">{html.escape(label)}</span><br>
          <span style="font-family:{value_font};font-size:15px;font-weight:500;color:{value_color};">{html.escape(value)}</span>
        </td></tr>"""


def status_badge(text: str, color: str) -> str:
    """Pill badge (tinted background) for severity/status. Escapes ``text``."""
    return (
        f'<span style="display:inline-block;font-family:{BODY};font-size:12px;'
        f'font-weight:600;color:{color};background:{_tint(color)};'
        f'padding:4px 12px;border-radius:9999px;letter-spacing:0.2px;">'
        f'{html.escape(text)}</span>'
    )


def button(label: str, url: str, color: str = EMERALD_500) -> str:
    """Bulletproof table-cell CTA (renders in Outlook). Escapes ``label``/``url``."""
    return f"""<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 4px;">
        <tr><td style="border-radius:10px;background:{color};">
          <a href="{html.escape(url)}" style="display:inline-block;font-family:{BODY};font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:10px;">{html.escape(label)}</a>
        </td></tr>
      </table>"""


def list_table(headers: list[str], rows: list[list[str]]) -> str:
    """Header + body table for the overdue digest.

    ``rows`` is a list of ``[cell_html, cell_html]`` where each cell is already
    built (e.g. via ``data_row``-style spans). Header text is escaped here.
    """
    head_cells = "".join(
        f'<th style="padding:10px 14px;text-align:left;font-family:{BODY};font-size:11px;'
        f'font-weight:600;color:{NEUTRAL_400};text-transform:uppercase;letter-spacing:0.6px;">{html.escape(h)}</th>'
        for h in headers
    )
    body_rows = ""
    for row in rows:
        cells = "".join(
            f'<td style="padding:12px 14px;border-top:1px solid {HAIRLINE};">{c}</td>'
            for c in row
        )
        body_rows += f"<tr>{cells}</tr>"
    return f"""<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-radius:12px;overflow:hidden;border:1px solid {HAIRLINE};">
        <thead><tr style="background:{PAPER};">{head_cells}</tr></thead>
        <tbody>{body_rows}</tbody>
      </table>"""


def footer(links: list[tuple[str, str]]) -> str:
    """Hairline footer with emerald links + admin-recipient explainer.

    ``links`` is a list of ``(label, url)`` tuples. Escapes both.
    """
    link_html = " · ".join(
        f'<a href="{html.escape(url)}" style="color:{EMERALD_600};text-decoration:none;">{html.escape(label)}</a>'
        for label, url in links
    )
    return (
        f'<p style="margin:0;font-family:{BODY};font-size:12px;line-height:1.6;color:{NEUTRAL_400};">'
        f"You're receiving this because you're an admin of your Steward organization.<br>"
        f"{link_html}</p>"
    )


def _tint(color: str) -> str:
    """Light background tint for a status color (used by ``status_badge``)."""
    return {
        AVAILABLE: "#EAFBF0",
        WARNING: "#FEF6E7",
        DANGER: "#FDECEC",
        INFO: "#EBF3FE",
        "#F97316": "#FEF0E7",
        EMERALD_500: EMERALD_50,
    }.get(color, EMERALD_50)


# ---------------------------------------------------------------------------
# Composed templates — each returns (subject, html) and escapes internally
# ---------------------------------------------------------------------------

def checkout_email(asset_name: str, member_name: str, due_str: str) -> tuple[str, str]:
    body = (
        heading("Asset checked out")
        + lead(f"{asset_name} just left your inventory.")
        + data_table(
            data_row("Asset", asset_name)
            + data_row("Checked out to", member_name)
            + data_row("Due back", due_str, mono=True)
        )
        + button("View assignments", f"{EMAIL_ASSET_BASE_URL}/assignments")
    )
    html_doc = wrapper(
        f"Asset checked out: {asset_name}",
        body,
        preheader=f"{asset_name} · checked out to {member_name} · due {due_str}",
    )
    return f"[Steward] Asset Checked Out: {asset_name}", html_doc


def checkin_email(asset_name: str, member_name: str, returned_at: str) -> tuple[str, str]:
    body = (
        heading("Asset returned")
        + lead(f"{asset_name} is back in your inventory.")
        + data_table(
            data_row("Asset", asset_name)
            + data_row("Returned by", member_name)
            + data_row("Returned at", returned_at, mono=True),
            bg=EMERALD_50,
        )
        + button("View assignments", f"{EMAIL_ASSET_BASE_URL}/assignments")
    )
    html_doc = wrapper(
        f"Asset returned: {asset_name}",
        body,
        preheader=f"{asset_name} · returned by {member_name}",
    )
    return f"[Steward] Asset Returned: {asset_name}", html_doc


def incident_email(
    asset_name: str,
    reporter_name: str,
    severity: str,
    title: str,
    dashboard_url: str,
) -> tuple[str, str]:
    sev_color = _SEVERITY_COLOR.get(severity, NEUTRAL_500)
    body = (
        heading("New incident reported")
        + lead("An incident has been logged on one of your assets.")
        + data_table(
            f'<tr><td style="padding:8px 0;">'
            f'<span style="font-family:{BODY};font-size:11px;font-weight:600;color:{NEUTRAL_400};text-transform:uppercase;letter-spacing:0.6px;">Severity</span><br>'
            f'<span style="display:inline-block;margin-top:4px;">{status_badge(severity, sev_color)}</span>'
            f'</td></tr>'
            + data_row("Title", title)
            + data_row("Asset", asset_name)
            + data_row("Reported by", reporter_name),
            accent=sev_color,
        )
        + button("Review incident", dashboard_url, color=sev_color)
    )
    subject_prefix = (
        f"[Steward] {severity} Incident"
        if severity in ("High", "Critical")
        else "[Steward] New Incident"
    )
    html_doc = wrapper(
        f"New incident: {title}",
        body,
        preheader=f"{severity} · {title} · {asset_name}",
    )
    return f"{subject_prefix}: {title}", html_doc


def overdue_email(items: list[dict]) -> tuple[str, str]:
    """``items`` is a list of dicts with ``asset_name`` and ``due_str`` keys."""
    count = len(items)
    noun = "item" if count == 1 else "items"
    verb = "is" if count == 1 else "are"

    rows = [
        [
            f'<span style="font-family:{BODY};font-size:14px;font-weight:500;color:{INK};">{html.escape(str(it.get("asset_name", "—")))}</span>',
            f'<span style="font-family:{MONO};font-size:13px;color:{DANGER};">{html.escape(str(it.get("due_str", "—")))}</span>',
        ]
        for it in items
    ]

    body = (
        heading("Overdue equipment")
        + lead(f"{count} {noun} {verb} past the expected return date.")
        + list_table(["Asset", "Was due"], rows)
        + button("Follow up", f"{EMAIL_ASSET_BASE_URL}/assignments", color=WARNING)
    )
    html_doc = wrapper(
        "Overdue equipment",
        body,
        preheader=f"{count} overdue {noun} need attention",
    )
    subject = f"[Steward] {count} Overdue {noun.capitalize()} Need Attention"
    return subject, html_doc


def access_request_email(
    name: str,
    email: str,
    organization: str,
    team_size: str,
    plan: str,
    notes: str,
) -> tuple[str, str]:
    """Inbound access request from the public marketing site.

    Unlike the four templates above this one is addressed to the Steward team,
    not to a customer's admins, so it carries no CTA button — the action is to
    hit reply, and the sender sets Reply-To to the prospect for exactly that.
    """
    rows = (
        data_row("Name", name)
        + data_row("Email", email, mono=True)
        + data_row("Organization", organization)
    )
    if team_size:
        rows += data_row("Team size", team_size, mono=True)
    if plan:
        rows += data_row("Plan of interest", plan)
    if notes:
        rows += data_row("What they'd track", notes)

    body = (
        heading("New access request")
        + lead(f"{name} at {organization} asked for an invitation.")
        + data_table(rows)
    )
    html_doc = wrapper(
        f"Access request: {organization}",
        body,
        preheader=f"{name} · {organization} · {email}",
    )
    return f"[Steward] Access Request: {organization}", html_doc
