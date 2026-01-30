from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class AssetBase(BaseModel):
    name: str
    description: Optional[str] = None
    status: Optional[str] = "Available"
    qr_code: Optional[str] = None
    image_url: Optional[str] = None

class AssetCreate(AssetBase):
    pass

class AssetUpdate(AssetBase):
    name: Optional[str] = None

class AssetResponse(AssetBase):
    id: int
    org_id: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    created_by: Optional[str] = None
    updated_by: Optional[str] = None

    class Config:
        from_attributes = True
