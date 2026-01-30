from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.schemas.asset import AssetResponse

class AssignmentBase(BaseModel):
    asset_id: int
    assigned_to: str
    expected_return_at: Optional[datetime] = None
    notes: Optional[str] = None
    condition_photo_url: Optional[str] = None
    event_tags: Optional[List[str]] = None

class AssignmentCreate(AssignmentBase):
    pass

class AssignmentUpdate(BaseModel):
    actual_return_at: Optional[datetime] = None
    status: Optional[str] = None
    notes: Optional[str] = None

class AssignmentResponse(AssignmentBase):
    id: int
    org_id: str
    assigned_by: str
    checked_out_at: datetime
    actual_return_at: Optional[datetime] = None
    status: str
    condition_photo_url: Optional[str] = None
    event_tags: Optional[List[str]] = None
    asset: Optional[AssetResponse] = None

    class Config:
        from_attributes = True
