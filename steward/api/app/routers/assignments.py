from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone
from fastapi_clerk_auth import HTTPAuthorizationCredentials

from app.core.debs import get_db
from app.core.security import clerk_guard
from app.core.cache import invalidate_dashboard_cache
from app.models.assignment import Assignment
from app.models.asset import Asset
from app.models.activity import ActivityLog
from app.schemas.assignment import AssignmentCreate, AssignmentResponse, AssignmentUpdate
from app.routers.assets import get_org_id, get_user_id, require_admin

router = APIRouter()

@router.post("/checkout", response_model=AssignmentResponse)
def checkout_asset(
    assignment: AssignmentCreate,
    db: Session = Depends(get_db),
    org_id: str = Depends(get_org_id),
    admin_id: str = Depends(get_user_id)
):
    # 1. Check if asset exists and belongs to org
    asset = db.query(Asset).filter(Asset.id == assignment.asset_id, Asset.org_id == org_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    # 2. Check if asset is available
    if asset.status != "Available":
        raise HTTPException(status_code=400, detail=f"Asset is not available for checkout. Current status: {asset.status}")
    
    # 3. Create assignment
    db_assignment = Assignment(
        **assignment.model_dump(),
        org_id=org_id,
        assigned_by=admin_id,
        checked_out_at=datetime.now(timezone.utc),
        status="Active"
    )
    
    # 4. Update asset status
    asset.status = "Checked Out"
    
    db.add(db_assignment)
    db.flush() # Get IDs
    
    # 5. Log activity
    log = ActivityLog(
        org_id=org_id,
        asset_id=asset.id,
        asset_name=asset.name,
        actor_id=admin_id,
        event_type="checked_out",
        details={
            "assigned_to": assignment.assigned_to,
            "expected_return_at": assignment.expected_return_at.isoformat() if assignment.expected_return_at else None
        }
    )
    db.add(log)
    
    db.commit()
    db.refresh(db_assignment)
    
    # Invalidate dashboard cache since assignment data changed
    invalidate_dashboard_cache(org_id)
    
    return db_assignment

@router.post("/checkin/{asset_id}", response_model=AssignmentResponse)
def checkin_asset(
    asset_id: int,
    db: Session = Depends(get_db),
    org_id: str = Depends(get_org_id),
    user_id: str = Depends(get_user_id)
):
    # 1. Find active assignment
    assignment = db.query(Assignment).filter(
        Assignment.asset_id == asset_id,
        Assignment.org_id == org_id,
        Assignment.status == "Active"
    ).first()
    
    if not assignment:
        raise HTTPException(status_code=404, detail="No active assignment found for this asset")
    
    # 2. Update assignment status
    assignment.status = "Returned"
    assignment.actual_return_at = datetime.now(timezone.utc)
    
    # 3. Update asset status
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if asset:
        asset.status = "Available"
        
        # 4. Log activity
        log = ActivityLog(
            org_id=org_id,
            asset_id=asset.id,
            asset_name=asset.name,
            actor_id=user_id,
            event_type="checked_in",
            details={
                "returned_at": assignment.actual_return_at.isoformat()
            }
        )
        db.add(log)
    
    db.commit()
    db.refresh(assignment)
    
    # Invalidate dashboard cache
    invalidate_dashboard_cache(org_id)
    
    return assignment

@router.get("/active", response_model=List[AssignmentResponse])
def get_active_assignments(
    db: Session = Depends(get_db),
    org_id: str = Depends(get_org_id),
    creds: HTTPAuthorizationCredentials = Depends(clerk_guard)
):
    user_id = creds.decoded.get("sub")
    claims = creds.decoded
    role = claims.get("org_role") or (claims.get("o") or {}).get("r")
    
    query = db.query(Assignment).filter(Assignment.org_id == org_id, Assignment.status == "Active")
    
    if role != "org:admin":
        query = query.filter(Assignment.assigned_to == user_id)
        
    return query.all()

@router.get("/history", response_model=List[AssignmentResponse])
def get_all_assignment_history(
    db: Session = Depends(get_db),
    org_id: str = Depends(get_org_id),
    creds: HTTPAuthorizationCredentials = Depends(clerk_guard)
):
    user_id = creds.decoded.get("sub")
    claims = creds.decoded
    role = claims.get("org_role") or (claims.get("o") or {}).get("r")

    query = db.query(Assignment).filter(
        Assignment.org_id == org_id,
        Assignment.status == "Returned"
    )

    if role != "org:admin":
        query = query.filter(Assignment.assigned_to == user_id)

    return query.order_by(Assignment.actual_return_at.desc()).all()

@router.get("/history/{asset_id}", response_model=List[AssignmentResponse])
def get_assignment_history(
    asset_id: int,
    db: Session = Depends(get_db),
    org_id: str = Depends(get_org_id),
    _: bool = Depends(require_admin)
):
    return db.query(Assignment).filter(
        Assignment.asset_id == asset_id, 
        Assignment.org_id == org_id
    ).order_by(Assignment.checked_out_at.desc()).all()
