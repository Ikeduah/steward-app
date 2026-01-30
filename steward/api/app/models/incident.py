from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, JSON, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.db import Base

class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(String, index=True, nullable=False)
    
    asset_id = Column(Integer, ForeignKey("assets.id"), nullable=False)
    reported_by = Column(String, nullable=False) # Clerk User ID
    
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    severity = Column(String, nullable=False) # Low, Medium, High, Critical
    status = Column(String, default="Open") # Open, In Progress, Resolved, Closed
    notes = Column(JSON, default=list) # List of { "text": "...", "created_at": "...", "actor_id": "..." }
    photo_url = Column(String, nullable=True)
    is_archived = Column(Boolean, default=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    asset = relationship("Asset", backref="incidents")
