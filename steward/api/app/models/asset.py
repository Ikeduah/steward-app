from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean
from sqlalchemy.sql import func
from app.core.db import Base

class Asset(Base):
    __tablename__ = "assets"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(String, index=True, nullable=False)  # Clerk Org ID
    
    name = Column(String, index=True, nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String, default="Available")  # Available, Checked Out, Maintenance, Retired
    
    qr_code = Column(String, unique=True, index=True, nullable=True)
    image_url = Column(String, nullable=True)
    
    # User tracking
    created_by = Column(String, nullable=True)  # Clerk User ID
    updated_by = Column(String, nullable=True)  # Clerk User ID
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
