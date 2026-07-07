import os
import time
import logging
import httpx
from enum import Enum
from typing import Dict, Tuple
from fastapi import HTTPException

logger = logging.getLogger(__name__)

CLERK_SECRET_KEY = os.getenv("CLERK_SECRET_KEY")

class PlanType(str, Enum):
    STARTER = "starter"
    PRO = "pro"

# Plan IDs — set these in your environment:
#   CLERK_PLAN_STARTER_ID=cplan_xxx
#   CLERK_PLAN_PRO_ID=cplan_yyy
PLAN_IDS: Dict[str, PlanType] = {}
_starter_id = os.getenv("CLERK_PLAN_STARTER_ID")
_pro_id = os.getenv("CLERK_PLAN_PRO_ID")
if _starter_id:
    PLAN_IDS[_starter_id] = PlanType.STARTER
if _pro_id:
    PLAN_IDS[_pro_id] = PlanType.PRO

class PlanLimits:
    def __init__(self, plan: PlanType):
        self.plan = plan
        if plan == PlanType.PRO:
            self.max_assets = float('inf')
            self.max_people = float('inf')
            self.history_days = float('inf')
            self.has_photos = True
            self.has_advanced_reporting = True
        else:
            self.max_assets = 100
            self.max_people = 25
            self.history_days = 30
            self.has_photos = False
            self.has_advanced_reporting = False

# --- Simple in-memory TTL cache for plan lookups ---
# Avoids hitting the Clerk API on every single request.
_PLAN_CACHE_TTL = 60  # seconds
_plan_cache: Dict[str, Tuple[PlanType, float]] = {}

def _get_cached_plan(org_id: str):
    entry = _plan_cache.get(org_id)
    if entry and (time.monotonic() - entry[1]) < _PLAN_CACHE_TTL:
        return entry[0]
    return None

def _set_cached_plan(org_id: str, plan: PlanType):
    _plan_cache[org_id] = (plan, time.monotonic())

async def get_org_plan(org_id: str) -> PlanType:
    """
    Fetches the organization's subscription plan from Clerk.
    Results are cached for 60 seconds per org to avoid redundant API calls.
    """
    if not org_id:
        return PlanType.STARTER

    cached = _get_cached_plan(org_id)
    if cached is not None:
        return cached

    if not CLERK_SECRET_KEY:
        logger.warning("CLERK_SECRET_KEY not set — defaulting to Starter plan.")
        return PlanType.STARTER

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"https://api.clerk.com/v1/organizations/{org_id}",
                headers={"Authorization": f"Bearer {CLERK_SECRET_KEY}"}
            )
            if resp.status_code == 200:
                org_data = resp.json()
                public_metadata = org_data.get("public_metadata", {})
                plan_id = public_metadata.get("plan_id")
                plan = PLAN_IDS.get(plan_id, PlanType.STARTER)
                _set_cached_plan(org_id, plan)
                return plan

        _set_cached_plan(org_id, PlanType.STARTER)
        return PlanType.STARTER
    except Exception as e:
        logger.error("Error fetching plan for org: %s", type(e).__name__)
        return PlanType.STARTER

async def get_org_member_count(org_id: str) -> int:
    """Fetches total member count for an organization from Clerk."""
    if not CLERK_SECRET_KEY:
        return 0
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"https://api.clerk.com/v1/organizations/{org_id}/memberships",
                headers={"Authorization": f"Bearer {CLERK_SECRET_KEY}"}
            )
            if resp.status_code == 200:
                data = resp.json()
                return data.get("total_count", 0)
        return 0
    except Exception as e:
        logger.error("Error fetching member count for org: %s", type(e).__name__)
        return 0

async def check_limit(org_id: str, current_count: int, limit_attr: str):
    plan_type = await get_org_plan(org_id)
    limits = PlanLimits(plan_type)
    limit_value = getattr(limits, limit_attr)

    if current_count >= limit_value:
        raise HTTPException(
            status_code=403,
            detail=f"Limit reached for your {plan_type} plan ({limit_value}). Please upgrade to Pro for unlimited access."
        )
    return True
