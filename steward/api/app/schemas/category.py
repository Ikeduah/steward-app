from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.category import CATEGORY_NAME_MAX


def _clean_name(value: str) -> str:
    # Collapse runs of whitespace so "Lenses" and " Lenses  " are the same name.
    cleaned = " ".join(value.split())
    if not cleaned:
        raise ValueError("Category name can't be empty.")
    return cleaned


class CategoryCreate(BaseModel):
    name: str = Field(max_length=CATEGORY_NAME_MAX)
    parent_id: Optional[int] = None

    _name = field_validator("name")(_clean_name)


class CategoryUpdate(BaseModel):
    """Rename and/or move. Send parent_id null to make it top-level."""

    name: Optional[str] = Field(default=None, max_length=CATEGORY_NAME_MAX)
    parent_id: Optional[int] = None

    @field_validator("name")
    @classmethod
    def _name(cls, value: Optional[str]) -> Optional[str]:
        return None if value is None else _clean_name(value)


class CategoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    org_id: str
    name: str
    parent_id: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class CategoryTreeNode(CategoryResponse):
    """A top-level category with its subcategories, as GET /api/categories returns."""

    asset_count: int = 0
    subcategories: List["CategoryWithCount"] = []


class CategoryWithCount(CategoryResponse):
    asset_count: int = 0


CategoryTreeNode.model_rebuild()
