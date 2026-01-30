import os
import httpx
from enum import Enum
from typing import Optional, Dict
from fastapi import HTTPException

CLERK_SECRET_KEY = os.getenv("CLERK_SECRET_KEY")

class PlanType(str, Enum):
    STARTER = "starter"
    PRO = "pro"

# Plan IDs provided by the user
PLAN_IDS = {
    "cplan_38aqHgyzV4VLU75NSZM0rYO3yo5": PlanType.STARTER,
    "cplan_38aqeaPaWPeptXtTSkM7espqMZ6": PlanType.PRO
}

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

async def get_org_plan(org_id: str) -> PlanType:
    """
    Fetches the organization's subscription plan from Clerk.
    In a real-world scenario, this might check Clerk's billing state 
    or custom metadata. For this implementation, we'll try to fetch 
    the subscription via Clerk API or check public_metadata.
    """
    if not org_id:
        return PlanType.STARTER  # Default to starter if no org
    
    if not CLERK_SECRET_KEY:
        print("WARNING: CLERK_SECRET_KEY not set, defaulting to Starter plan.")
        return PlanType.STARTER

    # Note: Clerk's Billing API is often tied to 'subscriptions'
    # We'll check for the subscription plan ID in the org metadata or via the billing endpoint
    # For now, we'll implement a fallback to Starter if not explicitly Pro.
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"https://api.clerk.com/v1/organizations/{org_id}",
                headers={"Authorization": f"Bearer {CLERK_SECRET_KEY}"}
            )
            if resp.status_code == 200:
                org_data = resp.json()
                # Check clerk's billing/subscription field if available, 
                # or check public_metadata for a plan_id
                public_metadata = org_data.get("public_metadata", {})
                plan_id = public_metadata.get("plan_id")
                
                # If Clerk Billing is enabled, we might find it in 'subscription' object
                # But typically developers store the active plan in metadata for easy access
                if plan_id in PLAN_IDS:
                    return PLAN_IDS[plan_id]
        
        return PlanType.STARTER
    except Exception as e:
        print(f"Error fetching plan for org {org_id}: {e}")
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
        print(f"Error fetching member count for org {org_id}: {e}")
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
