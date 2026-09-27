"""
Display names for Clerk user IDs, for the permanent record.

Records store the Clerk user ID of everyone involved, and Clerk is the only
place the name lives. That is fine on screen, where the app looks names up
live, but an audit record has to say who someone was at the time, even after
they leave the team or change their name. So names are looked up when a record
is written and saved alongside the ID.

Lookups are synchronous because the routers that write records use a
synchronous session. They are cached, time out quickly, and never raise: a
record is always written, with a null name if Clerk cannot be reached, and the
export falls back to a live lookup for those.
"""

import logging
import os
import time
from typing import Dict, Iterable, Optional

import httpx

logger = logging.getLogger(__name__)

CLERK_SECRET_KEY = os.getenv("CLERK_SECRET_KEY")

_CACHE_TTL_S = 600
_TIMEOUT_S = 3.0
_cache: Dict[str, tuple[Optional[str], float]] = {}


def _name_from_user(user: dict) -> Optional[str]:
    name = f"{user.get('first_name') or ''} {user.get('last_name') or ''}".strip()
    if name:
        return name
    primary_id = user.get("primary_email_address_id")
    for email in user.get("email_addresses") or []:
        if email.get("id") == primary_id:
            return email.get("email_address")
    return None


def _fetch_names(user_ids: list[str]) -> Dict[str, Optional[str]]:
    """One Clerk call for up to 100 users. Unknown IDs come back as None."""
    if not CLERK_SECRET_KEY or not user_ids:
        return {}
    try:
        resp = httpx.get(
            "https://api.clerk.com/v1/users",
            params=[("user_id", uid) for uid in user_ids] + [("limit", "100")],
            headers={"Authorization": f"Bearer {CLERK_SECRET_KEY}"},
            timeout=_TIMEOUT_S,
        )
        if resp.status_code != 200:
            logger.warning("Clerk user lookup returned %s", resp.status_code)
            return {}
        found = {user["id"]: _name_from_user(user) for user in resp.json()}
        return {uid: found.get(uid) for uid in user_ids}
    except Exception as e:
        logger.warning("Clerk user lookup failed: %s", type(e).__name__)
        return {}


def display_names(user_ids: Iterable[Optional[str]]) -> Dict[str, Optional[str]]:
    """Names for the given IDs. Missing or unreachable ones map to None."""
    now = time.monotonic()
    wanted = {uid for uid in user_ids if uid}
    result: Dict[str, Optional[str]] = {}
    missing = []
    for uid in wanted:
        cached = _cache.get(uid)
        if cached and now - cached[1] < _CACHE_TTL_S:
            result[uid] = cached[0]
        else:
            missing.append(uid)

    for start in range(0, len(missing), 100):
        batch = missing[start:start + 100]
        fetched = _fetch_names(batch)
        for uid in batch:
            name = fetched.get(uid)
            result[uid] = name
            # Only cache real answers, so a Clerk outage is retried next time.
            if uid in fetched:
                _cache[uid] = (name, now)

    return result


def display_name(user_id: Optional[str]) -> Optional[str]:
    if not user_id:
        return None
    return display_names([user_id]).get(user_id)


def is_known_missing(user_id: str) -> bool:
    """
    True when Clerk answered and does not know this person, which in practice
    means they have left. False when they are known, or when Clerk could not
    be reached, so an outage is never reported as someone having left.
    """
    cached = _cache.get(user_id)
    return cached is not None and cached[0] is None
