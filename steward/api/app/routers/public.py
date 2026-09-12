"""Unauthenticated endpoints served to the public marketing site.

Everything else in this API sits behind ``clerk_guard``. This router does not,
because the people using it do not have accounts yet — that is the entire point
of an access request. Keep it that way deliberately: only add a route here if
an anonymous stranger on the internet is supposed to be able to call it.
"""

import logging
import time
from collections import deque

from fastapi import APIRouter, HTTPException, Request

from app.core.notifications import REQUEST_ACCESS_TO, send_access_request
from app.schemas.request_access import AccessRequest

logger = logging.getLogger(__name__)
router = APIRouter()

# Crude per-IP burst check. Best-effort only: on Vercel each serverless instance
# has its own memory, so a determined flood spread across instances slips past.
# It exists to stop one bored person with a loop, and the honeypot handles the
# bots; anything more needs a shared store or the platform's own rate limiting.
_RATE_LIMIT_WINDOW_SECONDS = 600
_RATE_LIMIT_MAX_REQUESTS = 5
_recent_requests: dict[str, deque[float]] = {}


def _rate_limited(ip: str) -> bool:
    now = time.monotonic()
    hits = _recent_requests.setdefault(ip, deque())
    while hits and now - hits[0] > _RATE_LIMIT_WINDOW_SECONDS:
        hits.popleft()
    if len(hits) >= _RATE_LIMIT_MAX_REQUESTS:
        return True
    hits.append(now)
    # Drop the tracking for anyone who has aged out, so a long-lived instance
    # doesn't accumulate an entry per IP forever.
    if len(_recent_requests) > 1000:
        for key in [k for k, v in _recent_requests.items() if not v]:
            del _recent_requests[key]
    return False


@router.post("/request-access")
def request_access(payload: AccessRequest, request: Request):
    """Take an invitation request from the marketing site and mail it to us."""
    if payload.company_website:
        # Honeypot filled: a bot. Answer exactly as a success would, so it has
        # nothing to learn from the difference, and send nothing.
        logger.info("Access request rejected by honeypot")
        return {"ok": True}

    client_ip = request.client.host if request.client else "unknown"
    if _rate_limited(client_ip):
        raise HTTPException(status_code=429, detail="Too many requests. Try again later.")

    sent = send_access_request(
        name=payload.name,
        email=payload.email,
        organization=payload.organization,
        team_size=payload.team_size,
        plan=payload.plan,
        notes=payload.notes,
    )
    if not sent:
        # The request is lost unless the prospect is told, so surface it rather
        # than returning ok and quietly dropping a lead on the floor.
        logger.error("Access request from %s could not be delivered", payload.organization)
        raise HTTPException(
            status_code=502,
            detail=f"Could not send the request. Email {REQUEST_ACCESS_TO} instead.",
        )

    logger.info("Access request received from %s", payload.organization)
    return {"ok": True}
