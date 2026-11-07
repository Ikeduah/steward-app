"""Asset categories: two levels, category -> subcategory.

Every member can read the list (the Assets page filters by it); only admins
can change it. Every query is scoped to the caller's org.
"""
from typing import Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.debs import get_db
from app.models.activity import ActivityLog
from app.models.asset import Asset
from app.models.category import Category
from app.routers.assets import get_org_id, get_user_id, require_admin
from app.schemas.category import (
    CategoryCreate,
    CategoryResponse,
    CategoryTreeNode,
    CategoryUpdate,
    CategoryWithCount,
)

router = APIRouter()

# Offered once, by an admin pressing "Add suggested categories". Never added
# automatically, so a team's list only ever holds what someone chose.
SUGGESTED_CATEGORIES = [
    "Cameras",
    "Lenses",
    "Audio",
    "Lighting",
    "Grip",
    "Cables & Power",
    "IT",
]

DUPLICATE_NAME = "A category with this name already exists here."


def _get_category(db: Session, org_id: str, category_id: int) -> Category:
    category = (
        db.query(Category)
        .filter(Category.id == category_id, Category.org_id == org_id)
        .first()
    )
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category


def _has_subcategories(db: Session, org_id: str, category_id: int) -> bool:
    return (
        db.query(Category.id)
        .filter(Category.org_id == org_id, Category.parent_id == category_id)
        .first()
        is not None
    )


def _check_parent(
    db: Session, org_id: str, parent_id: Optional[int], moving_id: Optional[int] = None
) -> None:
    """Allow only two levels: a parent must itself be top-level."""
    if parent_id is None:
        return
    if moving_id is not None and parent_id == moving_id:
        raise HTTPException(status_code=400, detail="A category can't be inside itself.")
    parent = _get_category(db, org_id, parent_id)
    if parent.parent_id is not None:
        raise HTTPException(
            status_code=400,
            detail="Subcategories can't have their own subcategories.",
        )
    if moving_id is not None and _has_subcategories(db, org_id, moving_id):
        raise HTTPException(
            status_code=400,
            detail="This category has subcategories, so it can't become a subcategory itself.",
        )


def _name_taken(
    db: Session, org_id: str, parent_id: Optional[int], name: str, exclude_id: Optional[int] = None
) -> bool:
    query = db.query(Category.id).filter(
        Category.org_id == org_id,
        func.lower(Category.name) == name.lower(),
    )
    query = query.filter(
        Category.parent_id.is_(None) if parent_id is None else Category.parent_id == parent_id
    )
    if exclude_id is not None:
        query = query.filter(Category.id != exclude_id)
    return query.first() is not None


def _commit(db: Session) -> None:
    """Commit, turning a lost race on the unique name index into a 409."""
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail=DUPLICATE_NAME)


def _tree(db: Session, org_id: str) -> List[CategoryTreeNode]:
    categories = (
        db.query(Category)
        .filter(Category.org_id == org_id)
        .order_by(func.lower(Category.name))
        .all()
    )
    counts: Dict[int, int] = dict(
        db.query(Asset.category_id, func.count(Asset.id))
        .filter(Asset.org_id == org_id, Asset.category_id.isnot(None))
        .group_by(Asset.category_id)
        .all()
    )

    nodes: Dict[int, CategoryTreeNode] = {}
    for c in categories:
        if c.parent_id is None:
            node = CategoryTreeNode.model_validate(c)
            node.asset_count = counts.get(c.id, 0)
            nodes[c.id] = node
    for c in categories:
        if c.parent_id is not None and c.parent_id in nodes:
            child = CategoryWithCount.model_validate(c)
            child.asset_count = counts.get(c.id, 0)
            nodes[c.parent_id].subcategories.append(child)
    return list(nodes.values())


@router.get("", response_model=List[CategoryTreeNode])
def list_categories(
    db: Session = Depends(get_db),
    org_id: str = Depends(get_org_id),
):
    return _tree(db, org_id)


@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(
    payload: CategoryCreate,
    db: Session = Depends(get_db),
    org_id: str = Depends(get_org_id),
    user_id: str = Depends(get_user_id),
    _: bool = Depends(require_admin),
):
    _check_parent(db, org_id, payload.parent_id)
    if _name_taken(db, org_id, payload.parent_id, payload.name):
        raise HTTPException(status_code=409, detail=DUPLICATE_NAME)

    category = Category(
        org_id=org_id,
        name=payload.name,
        parent_id=payload.parent_id,
        created_by=user_id,
    )
    db.add(category)
    _commit(db)
    db.refresh(category)
    return category


@router.post("/suggested", response_model=List[CategoryTreeNode])
def add_suggested_categories(
    db: Session = Depends(get_db),
    org_id: str = Depends(get_org_id),
    user_id: str = Depends(get_user_id),
    _: bool = Depends(require_admin),
):
    """Add the suggested top-level categories, skipping names already used."""
    for name in SUGGESTED_CATEGORIES:
        if not _name_taken(db, org_id, None, name):
            db.add(Category(org_id=org_id, name=name, created_by=user_id))
    _commit(db)
    return _tree(db, org_id)


@router.put("/{category_id}", response_model=CategoryResponse)
def update_category(
    category_id: int,
    payload: CategoryUpdate,
    db: Session = Depends(get_db),
    org_id: str = Depends(get_org_id),
    _: bool = Depends(require_admin),
):
    category = _get_category(db, org_id, category_id)
    fields = payload.model_fields_set

    new_parent = payload.parent_id if "parent_id" in fields else category.parent_id
    new_name = payload.name if payload.name is not None else category.name

    if "parent_id" in fields:
        _check_parent(db, org_id, new_parent, moving_id=category.id)
    if _name_taken(db, org_id, new_parent, new_name, exclude_id=category.id):
        raise HTTPException(status_code=409, detail=DUPLICATE_NAME)

    category.name = new_name
    category.parent_id = new_parent
    _commit(db)
    db.refresh(category)
    return category


@router.delete("/{category_id}")
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    org_id: str = Depends(get_org_id),
    user_id: str = Depends(get_user_id),
    _: bool = Depends(require_admin),
):
    category = _get_category(db, org_id, category_id)
    if _has_subcategories(db, org_id, category.id):
        raise HTTPException(
            status_code=409,
            detail="Delete or move this category's subcategories first.",
        )

    # The foreign key also clears these (ON DELETE SET NULL); doing it here
    # records each change in the activity log and works on SQLite too.
    assets = (
        db.query(Asset)
        .filter(Asset.org_id == org_id, Asset.category_id == category.id)
        .all()
    )
    for asset in assets:
        asset.category_id = None
        db.add(ActivityLog(
            org_id=org_id,
            asset_id=asset.id,
            asset_name=asset.name,
            actor_id=user_id,
            event_type="category_changed",
            details={
                "previous_category": category.name,
                "new_category": None,
                "reason": "category_deleted",
            },
        ))

    db.delete(category)
    db.commit()
    return {"message": "Category deleted", "uncategorized_assets": len(assets)}
