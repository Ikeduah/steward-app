from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.schemas.asset import AssetResponse

class IncidentBase(BaseModel):
    asset_id: int
    title: str
    description: str
    severity: str
    photo_url: Optional[str] = None

class IncidentCreate(IncidentBase):
    pass

class IncidentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    severity: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[List[dict]] = None
    is_archived: Optional[bool] = None

class IncidentResponse(IncidentBase):
    id: int
    org_id: str
    reported_by: str
    status: str
    photo_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    notes: List[dict] = []
    is_archived: bool = False
    asset: Optional[AssetResponse] = None

    class Config:
        from_attributes = True
