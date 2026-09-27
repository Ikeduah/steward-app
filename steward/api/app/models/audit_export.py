from sqlalchemy import Boolean, Column, Date, DateTime, Integer, String
from sqlalchemy.sql import func
from app.core.db import Base


class AuditExport(Base):
    """
    One row per audit report someone downloaded.

    This is the record that an export happened, and it is also what the
    monthly limit counts. A re-download of the same report and date range in
    another format within 24 hours is recorded with counts_toward_limit false.
    """

    __tablename__ = "audit_exports"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(String, index=True, nullable=False)

    requested_by = Column(String, nullable=False)  # Clerk User ID
    requested_by_name = Column(String, nullable=True)

    report_type = Column(String, nullable=False)  # custody, activity
    format = Column(String, nullable=False)  # csv, pdf
    range_start = Column(Date, nullable=False)
    range_end = Column(Date, nullable=False)
    asset_id = Column(Integer, nullable=True)  # set when the report covers one item

    row_count = Column(Integer, nullable=False)
    # SHA-256 of the file as downloaded, so a copy can later be checked
    # against what Steward produced.
    sha256 = Column(String(64), nullable=False)
    counts_toward_limit = Column(Boolean, nullable=False, default=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
