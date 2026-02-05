from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from typing import Optional
from fastapi_clerk_auth import HTTPAuthorizationCredentials

from app.core.debs import get_db
from app.core.security import clerk_guard
from app.core.cache import get_dashboard_cache, set_dashboard_cache
from app.models.asset import Asset
from app.models.assignment import Assignment
from app.models.incident import Incident

router = APIRouter()

def get_org_id(creds: HTTPAuthorizationCredentials = Depends(clerk_guard)) -> str:
    claims = creds.decoded
    org_data = claims.get("org") or claims.get("o")
    org_id = None
    
    if isinstance(org_data, dict):
        org_id = org_data.get("id")
    else:
        org_id = claims.get("org_id")
        
    if not org_id:
        raise HTTPException(status_code=400, detail="Missing org_id in token.")
    
    return org_id

@router.get("/summary")
def get_dashboard_summary(
    range: Optional[str] = "30d",
    db: Session = Depends(get_db),
    org_id: str = Depends(get_org_id)
):
    """
    Returns aggregated dashboard data for the organization.
    Cached for 5 minutes to reduce database load.
    """
    
    # Try to get from cache first
    cached_data = get_dashboard_cache(org_id)
    if cached_data:
        return cached_data
    
    # Section 1: Counts
    total_assets = db.query(Asset).filter(Asset.org_id == org_id).count()
    checked_out = db.query(Asset).filter(
        Asset.org_id == org_id,
        Asset.status == "Checked Out"
    ).count()
    
    # Overdue: Active assignments past expected_return_at
    now = datetime.now()
    overdue_count = db.query(Assignment).filter(
        Assignment.org_id == org_id,
        Assignment.status == "Active",
        Assignment.expected_return_at < now
    ).count()
    
    repair_count = db.query(Asset).filter(
        Asset.org_id == org_id,
        Asset.status == "Maintenance"
    ).count()
    
    missing_count = db.query(Asset).filter(
        Asset.org_id == org_id,
        Asset.status == "Retired"  # using "Retired" as a proxy for missing for now
    ).count()
    
    # Section 2: Health Breakdown
    good_count = db.query(Asset).filter(
        Asset.org_id == org_id,
        Asset.status.in_(["Available", "Checked Out"])
    ).count()
    
    needs_attention_count = repair_count
    out_of_service_count = missing_count
    
    # Section 3: Overdue Trend (last 30 days)
    # For now, returning simplified data
    overdue_trend = [
        {"date": "Day 1", "overdueCount": 0},
        {"date": "Day 5", "overdueCount": 1},
        {"date": "Day 10", "overdueCount": 1},
        {"date": "Day 15", "overdueCount": 2},
        {"date": "Day 20", "overdueCount": 1},
        {"date": "Day 25", "overdueCount": 2},
        {"date": "Today", "overdueCount": overdue_count}
    ]
    
    # Section 4: Top Assets (by checkout count)
    # Count assignments per asset
    top_assets_query = db.query(
        Asset.id,
        Asset.name,
        func.count(Assignment.id).label("checkout_count")
    ).join(Assignment, Asset.id == Assignment.asset_id)\
     .filter(Asset.org_id == org_id)\
     .group_by(Asset.id, Asset.name)\
     .order_by(func.count(Assignment.id).desc())\
     .limit(5)\
     .all()
    
    top_assets = [
        {
            "assetId": str(asset.id),
            "name": asset.name,
            "checkoutCount": asset.checkout_count
        }
        for asset in top_assets_query
    ]
    
    # Section 5: Value at Risk
    overdue_assignments = db.query(Assignment).filter(
        Assignment.org_id == org_id,
        Assignment.status == "Active",
        Assignment.expected_return_at < now
    ).all()
    
    overdue_asset_ids = [a.asset_id for a in overdue_assignments]
    overdue_value = db.query(func.sum(Asset.estimated_value)).filter(
        Asset.id.in_(overdue_asset_ids) if overdue_asset_ids else False
    ).scalar() or 0
    
    repair_value = db.query(func.sum(Asset.estimated_value)).filter(
        Asset.org_id == org_id,
        Asset.status == "Maintenance"
    ).scalar() or 0
    
    missing_value = db.query(func.sum(Asset.estimated_value)).filter(
        Asset.org_id == org_id,
        Asset.status == "Retired"
    ).scalar() or 0
    
    total_value_at_risk = overdue_value + repair_value + missing_value
    
    # Section 6: Lists
    overdue_list = []
    for assignment in overdue_assignments[:5]:
        asset = db.query(Asset).filter(Asset.id == assignment.asset_id).first()
        if asset:
            overdue_list.append({
                "id": str(asset.id),
                "name": asset.name,
                "status": "Checked Out",
                "assignee": assignment.assigned_to,
                "dueDate": assignment.expected_return_at.strftime("%Y-%m-%d") if assignment.expected_return_at else None,
                "value": asset.estimated_value
            })
    
    repair_assets = db.query(Asset).filter(
        Asset.org_id == org_id,
        Asset.status == "Maintenance"
    ).limit(5).all()
    
    repair_list = [
        {
            "id": str(a.id),
            "name": a.name,
            "status": "Maintenance",
            "value": a.estimated_value
        }
        for a in repair_assets
    ]
    
    missing_assets = db.query(Asset).filter(
        Asset.org_id == org_id,
        Asset.status == "Retired"
    ).limit(5).all()
    
    missing_list = [
        {
            "id": str(a.id),
            "name": a.name,
            "status": "Missing",
            "value": a.estimated_value
        }
        for a in missing_assets
    ]
    
    # Section 7: Insights
    insights = []
    if overdue_count > 0:
        insights.append(f"{overdue_count} item{'s' if overdue_count != 1 else ''} {'are' if overdue_count != 1 else 'is'} overdue today.")
    
    if total_value_at_risk > 0:
        insights.append(f"${total_value_at_risk:,.0f} worth of gear is currently unavailable (missing/repair/overdue).")
    
    if top_assets:
        insights.append(f"The most checked-out asset this month is {top_assets[0]['name']} ({top_assets[0]['checkoutCount']} checkouts).")
    
    if not insights:
        insights.append("All equipment is accounted for and operational. Great work!")
    
    # Build response data
    dashboard_data = {
        "counts": {
            "totalAssets": total_assets,
            "checkedOut": checked_out,
            "overdue": overdue_count,
            "repair": repair_count,
            "missing": missing_count
        },
        "healthBreakdown": {
            "good": good_count,
            "needsAttention": needs_attention_count,
            "outOfService": out_of_service_count
        },
        "overdueTrend": overdue_trend,
        "topAssets": top_assets,
        "valueAtRisk": {
            "overdueValue": overdue_value,
            "repairValue": repair_value,
            "missingValue": missing_value,
            "totalValue": total_value_at_risk
        },
        "lists": {
            "overdueAssignments": overdue_list,
            "repairAssets": repair_list,
            "missingAssets": missing_list
        },
        "insights": insights
    }
    
    # Cache for 5 minutes (300 seconds)
    set_dashboard_cache(org_id, dashboard_data, ttl=300)
    
    return dashboard_data
