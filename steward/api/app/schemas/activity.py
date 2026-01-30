from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

class ActivityLogBase(BaseModel):
    asset_id: int
    asset_name: Optional[str] = None
    event_type: str
    details: Optional[Dict[str, Any]] = None

class ActivityLogCreate(ActivityLogBase):
    pass

class ActivityLogResponse(ActivityLogBase):
    id: int
    org_id: str
    actor_id: str
    created_at: datetime

    class Config:
        from_attributes = True
