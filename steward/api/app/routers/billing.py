from fastapi import APIRouter, Depends
from app.core.security import clerk_guard
from app.routers.assets import get_org_id
from app.core.billing import get_org_plan, PlanLimits
from pydantic import BaseModel

router = APIRouter()

class PlanResponse(BaseModel):
    plan: str
    max_assets: int | float
    max_people: int | float
    history_days: int | float
    has_photos: bool
    has_advanced_reporting: bool

@router.get("/plan", response_model=PlanResponse)
async def get_plan(org_id: str = Depends(get_org_id)):
    plan_type = await get_org_plan(org_id)
    limits = PlanLimits(plan_type)
    
    return PlanResponse(
        plan=plan_type.value,
        max_assets=limits.max_assets,
        max_people=limits.max_people,
        history_days=limits.history_days,
        has_photos=limits.has_photos,
        has_advanced_reporting=limits.has_advanced_reporting
    )
