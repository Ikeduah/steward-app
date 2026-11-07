from sqlalchemy import CheckConstraint, Column, DateTime, ForeignKey, Index, Integer, String, func
from app.core.db import Base

# Longest name a category can have. Shared with the API schema and the migration.
CATEGORY_NAME_MAX = 60


class Category(Base):
    """An asset category, or a subcategory when parent_id is set.

    Only two levels exist (category -> subcategory). The database stops a
    category being its own parent and stops duplicate names under one parent;
    the API enforces the two-level limit, which a constraint can't express.
    """

    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(String, index=True, nullable=False)  # Clerk Org ID

    name = Column(String(CATEGORY_NAME_MAX), nullable=False)
    # RESTRICT: a category can't be deleted while it still has subcategories.
    parent_id = Column(
        Integer,
        ForeignKey("categories.id", ondelete="RESTRICT"),
        index=True,
        nullable=True,
    )

    created_by = Column(String, nullable=True)  # Clerk User ID
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    __table_args__ = (
        CheckConstraint(
            "parent_id IS NULL OR parent_id <> id",
            name="ck_categories_not_own_parent",
        ),
        # No duplicate names under the same parent, ignoring case. COALESCE
        # makes top-level categories (parent_id NULL) collide with each other,
        # which a plain unique constraint would not do.
        Index(
            "uq_categories_org_parent_name",
            "org_id",
            func.coalesce(parent_id, 0),
            func.lower(name),
            unique=True,
        ),
    )
