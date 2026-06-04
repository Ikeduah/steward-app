# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException, status
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session
from typing import List, Optional


from app.core.debs import get_db
from app.core.security import clerk_guard, ClerkCredentials
from app.models.asset import Asset
from app.models.activity import ActivityLog
from app.schemas.asset import AssetCreate, AssetUpdate, AssetResponse
from app.core.billing import check_limit

router = APIRouter()

def get_org_id(creds: ClerkCredentials = Depends(clerk_guard)) -> str:
    claims = creds.decoded
    
    # Handle standard and minified Clerk claims
    org_data = claims.get("org") or claims.get("o")
    org_id = None
    
    if isinstance(org_data, dict):
        org_id = org_data.get("id")
    else:
        org_id = claims.get("org_id")
        
    if not org_id:
        raise HTTPException(status_code=400, detail="Missing org_id in token. Please select an organization.")
    
    return org_id

def get_user_id(creds: ClerkCredentials = Depends(clerk_guard)) -> str:
    claims = creds.decoded
    user_id = claims.get("sub")
    
    if not user_id:
        raise HTTPException(status_code=400, detail="Missing user_id in token.")
    
    return user_id

def require_admin(creds: ClerkCredentials = Depends(clerk_guard)):
    claims = creds.decoded
    org_data = claims.get("o") or claims.get("org") or {}
    role = claims.get("org_role") or org_data.get("rol") or org_data.get("role") or org_data.get("r")

    # Clerk JWT stores "admin" in raw token; SDK normalizes to "org:admin" on frontend
    if role not in ("admin", "org:admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required for this action"
        )
    return True

@router.get("", response_model=List[AssetResponse])
def get_assets(
    status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    org_id: str = Depends(get_org_id)
):
    query = db.query(Asset).filter(Asset.org_id == org_id)
    
    if status:
        query = query.filter(Asset.status == status)
    
    if search:
        query = query.filter(Asset.name.ilike(f"%{search}%"))
        
    return query.all()

@router.post("", response_model=AssetResponse)
async def create_asset(
    asset: AssetCreate,
    db: Session = Depends(get_db),
    org_id: str = Depends(get_org_id),
    user_id: str = Depends(get_user_id),
    _: bool = Depends(require_admin)
):
    # Enforce asset limit for organization
    asset_count = db.query(Asset).filter(Asset.org_id == org_id).count()
    await check_limit(org_id, asset_count, "max_assets")
    
    if asset.qr_code:
        existing = db.query(Asset).filter(Asset.org_id == org_id, Asset.qr_code == asset.qr_code).first()
        if existing:
            raise HTTPException(status_code=400, detail="This identifier (QR code) is already in use by another asset.")
    
    db_asset = Asset(**asset.model_dump(), org_id=org_id, created_by=user_id)
    db.add(db_asset)
    db.flush() # Get ID
    
    # Log activity
    log = ActivityLog(
        org_id=org_id,
        asset_id=db_asset.id,
        asset_name=db_asset.name,
        actor_id=user_id,
        event_type="created",
        details={"status": db_asset.status}
    )
    db.add(log)
    
    db.commit()
    db.refresh(db_asset)
    return db_asset

@router.get("/{asset_id}", response_model=AssetResponse)
def get_asset(
    asset_id: int,
    db: Session = Depends(get_db),
    org_id: str = Depends(get_org_id)
):
    asset = db.query(Asset).filter(Asset.id == asset_id, Asset.org_id == org_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return asset

@router.put("/{asset_id}", response_model=AssetResponse)
def update_asset(
    asset_id: int,
    asset_update: AssetUpdate,
    db: Session = Depends(get_db),
    org_id: str = Depends(get_org_id),
    user_id: str = Depends(get_user_id),
    _: bool = Depends(require_admin)
):
    db_asset = db.query(Asset).filter(Asset.id == asset_id, Asset.org_id == org_id).first()
    if not db_asset:
        raise HTTPException(status_code=404, detail="Asset not found")
        
    if asset_update.qr_code and asset_update.qr_code != db_asset.qr_code:
        existing = db.query(Asset).filter(Asset.org_id == org_id, Asset.qr_code == asset_update.qr_code).first()
        if existing:
            raise HTTPException(status_code=400, detail="This identifier (QR code) is already in use by another asset.")
    
    previous_status = db_asset.status
    update_data = asset_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_asset, key, value)
    
    # Track who updated
    db_asset.updated_by = user_id
    
    # Log activity
    log = ActivityLog(
        org_id=org_id,
        asset_id=db_asset.id,
        asset_name=db_asset.name,
        actor_id=user_id,
        event_type="updated",
        details={
            "previous_status": previous_status,
            "new_status": db_asset.status,
            "updates": list(update_data.keys())
        }
    )
    db.add(log)
    
    db.commit()
    db.refresh(db_asset)
    return db_asset

@router.delete("/{asset_id}")
def delete_asset(
    asset_id: int,
    db: Session = Depends(get_db),
    org_id: str = Depends(get_org_id),
    user_id: str = Depends(get_user_id),
    _: bool = Depends(require_admin)
):
    db_asset = db.query(Asset).filter(Asset.id == asset_id, Asset.org_id == org_id).first()
    if not db_asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    # Log activity BEFORE deletion
    log = ActivityLog(
        org_id=org_id,
        asset_id=db_asset.id,
        asset_name=db_asset.name,
        actor_id=user_id,
        event_type="deleted"
    )
    db.add(log)
    
    db.delete(db_asset)
    db.commit()
    return {"message": "Asset deleted successfully"}
