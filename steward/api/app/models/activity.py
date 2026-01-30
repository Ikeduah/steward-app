from sqlalchemy import Column, Integer, String, DateTime, Text, JSON
from sqlalchemy.sql import func
from app.core.db import Base

class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(String, index=True, nullable=False)
    
    asset_id = Column(Integer, index=True, nullable=False)
    asset_name = Column(String, nullable=True) # Cache name for history if asset is deleted
    
    actor_id = Column(String, nullable=False) # Clerk User ID
    
    event_type = Column(String, nullable=False) # created, updated, checked_out, checked_in, retired, etc.
    details = Column(JSON, nullable=True) # { "previous_status": "...", "new_status": "..." }
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
