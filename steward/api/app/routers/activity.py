from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.debs import get_db
from app.core.security import clerk_guard
from app.models.activity import ActivityLog
from app.schemas.activity import ActivityLogResponse
from app.routers.assets import get_org_id, require_admin

router = APIRouter()

from datetime import datetime, timedelta
from app.core.billing import get_org_plan, PlanLimits

@router.get("", response_model=List[ActivityLogResponse])
async def get_activity_logs(
    db: Session = Depends(get_db),
    org_id: str = Depends(get_org_id),
    skip: int = 0,
    limit: int = 50,
    asset_id: Optional[int] = None,
    event_type: Optional[str] = None,
    _: bool = Depends(require_admin)
):
    query = db.query(ActivityLog).filter(ActivityLog.org_id == org_id)
    
    # Enforce history limits
    plan = await get_org_plan(org_id)
    limits = PlanLimits(plan)
    if limits.history_days != float('inf'):
        cutoff = datetime.now() - timedelta(days=limits.history_days)
        query = query.filter(ActivityLog.created_at >= cutoff)
    
    if asset_id:
        query = query.filter(ActivityLog.asset_id == asset_id)
    
    if event_type:
        query = query.filter(ActivityLog.event_type == event_type)
        
    return query.order_by(ActivityLog.created_at.desc()).offset(skip).limit(limit).all()
