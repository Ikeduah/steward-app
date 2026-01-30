from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.db import Base

class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(String, index=True, nullable=False)
    
    asset_id = Column(Integer, ForeignKey("assets.id"), nullable=False)
    assigned_to = Column(String, nullable=False)  # Clerk User ID
    assigned_by = Column(String, nullable=False)  # Clerk Admin ID
    
    checked_out_at = Column(DateTime(timezone=True), server_default=func.now())
    expected_return_at = Column(DateTime(timezone=True), nullable=True)
    actual_return_at = Column(DateTime(timezone=True), nullable=True)
    
    status = Column(String, default="Active")  # Active, Returned
    notes = Column(Text, nullable=True)
    condition_photo_url = Column(String, nullable=True)
    event_tags = Column(JSON, nullable=True) # List of tags e.g. ["Wedding", "Concert"]
    
    # Relationships
    asset = relationship("Asset", backref="assignments")
