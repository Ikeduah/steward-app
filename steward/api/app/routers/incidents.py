from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone

from app.core.debs import get_db
from app.core.security import clerk_guard
from app.models.incident import Incident
from app.models.asset import Asset
from app.models.activity import ActivityLog
from app.schemas.incident import IncidentCreate, IncidentResponse, IncidentUpdate
from app.routers.assets import get_org_id, get_user_id, require_admin
from datetime import timedelta

router = APIRouter()

@router.post("", response_model=IncidentResponse)
def report_incident(
    incident: IncidentCreate,
    db: Session = Depends(get_db),
    org_id: str = Depends(get_org_id),
    user_id: str = Depends(get_user_id)
):
    # 1. Verify asset exists and belongs to org
    asset = db.query(Asset).filter(Asset.id == incident.asset_id, Asset.org_id == org_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    # 2. Create incident
    db_incident = Incident(
        **incident.model_dump(),
        org_id=org_id,
        reported_by=user_id,
        status="Open"
    )
    db.add(db_incident)
    db.flush()
    
    # 3. Trigger Maintenance status if High/Critical
    if incident.severity in ["High", "Critical"] and asset.status != "Maintenance":
        asset.status = "Maintenance"
        # Log automated status change
        db.add(ActivityLog(
            org_id=org_id,
            asset_id=asset.id,
            asset_name=asset.name,
            actor_id="system",
            event_type="updated",
            details={
                "previous_status": "Available", # Simplified assumption
                "new_status": "Maintenance",
                "reason": f"Incident #{db_incident.id} reported with {incident.severity} severity"
            }
        ))

    # 4. Log activity
    log = ActivityLog(
        org_id=org_id,
        asset_id=asset.id,
        asset_name=asset.name,
        actor_id=user_id,
        event_type="incident_reported",
        details={
            "incident_id": db_incident.id,
            "title": db_incident.title,
            "severity": db_incident.severity
        }
    )
    db.add(log)
    
    db.commit()
    db.refresh(db_incident)
    return db_incident

    return db_incident

def process_incident_lifecycle(db: Session, org_id: str):
    """
    Automated lifecycle transitions:
    1. Resolved -> Closed after 7 days
    2. Closed -> Archived after 2 days
    """
    now = datetime.now(timezone.utc)
    
    # 1. Auto-close Resolved tickets > 7 days
    resolve_threshold = now - timedelta(days=7)
    resolved_to_close = db.query(Incident).filter(
        Incident.org_id == org_id,
        Incident.status == "Resolved",
        Incident.updated_at <= resolve_threshold,
        Incident.is_archived == False
    ).all()
    
    for inc in resolved_to_close:
        inc.status = "Closed"
        # Log automated status change
        db.add(ActivityLog(
            org_id=org_id,
            asset_id=inc.asset_id,
            asset_name=inc.asset.name if inc.asset else f"Asset #{inc.asset_id}",
            actor_id="system",
            event_type="incident_updated",
            details={
                "incident_id": inc.id,
                "previous_status": "Resolved",
                "new_status": "Closed",
                "reason": "Automated lifecycle: Resolved for > 7 days"
            }
        ))

    # 2. Auto-archive Closed tickets > 2 days
    archive_threshold = now - timedelta(days=2)
    closed_to_archive = db.query(Incident).filter(
        Incident.org_id == org_id,
        Incident.status == "Closed",
        Incident.updated_at <= archive_threshold,
        Incident.is_archived == False
    ).all()
    
    for inc in closed_to_archive:
        inc.is_archived = True
        # Log automated archival
        db.add(ActivityLog(
            org_id=org_id,
            asset_id=inc.asset_id,
            asset_name=inc.asset.name if inc.asset else f"Asset #{inc.asset_id}",
            actor_id="system",
            event_type="incident_updated",
            details={
                "incident_id": inc.id,
                "action": "archived",
                "reason": "Automated lifecycle: Closed for > 2 days"
            }
        ))

    if resolved_to_close or closed_to_archive:
        db.commit()

from app.core.billing import get_org_plan, PlanLimits

@router.get("", response_model=List[IncidentResponse])
async def get_incidents(
    db: Session = Depends(get_db),
    org_id: str = Depends(get_org_id),
    status: Optional[str] = None,
    severity: Optional[str] = None,
    include_archived: bool = False,
    _: bool = Depends(require_admin)
):
    # Run lifecycle processing
    process_incident_lifecycle(db, org_id)
    
    query = db.query(Incident).filter(Incident.org_id == org_id)
    
    # Enforce history limits (30 days for Starter)
    plan = await get_org_plan(org_id)
    limits = PlanLimits(plan)
    if limits.history_days != float('inf'):
        cutoff = datetime.now(timezone.utc) - timedelta(days=limits.history_days)
        query = query.filter(Incident.created_at >= cutoff)
    
    if not include_archived:
        query = query.filter(Incident.is_archived == False)
        
    if status:
        query = query.filter(Incident.status == status)
    if severity:
        query = query.filter(Incident.severity == severity)
    
    return query.order_by(Incident.created_at.desc()).all()

@router.get("/{incident_id}", response_model=IncidentResponse)
def get_incident(
    incident_id: int,
    db: Session = Depends(get_db),
    org_id: str = Depends(get_org_id),
    _: bool = Depends(require_admin)
):
    db_incident = db.query(Incident).filter(Incident.id == incident_id, Incident.org_id == org_id).first()
    if not db_incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return db_incident

@router.put("/{incident_id}", response_model=IncidentResponse)
def update_incident(
    incident_id: int,
    incident_update: IncidentUpdate,
    db: Session = Depends(get_db),
    org_id: str = Depends(get_org_id),
    user_id: str = Depends(get_user_id),
    _: bool = Depends(require_admin)
):
    db_incident = db.query(Incident).filter(Incident.id == incident_id, Incident.org_id == org_id).first()
    if not db_incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    previous_status = db_incident.status
    update_data = incident_update.model_dump(exclude_unset=True)
    
    for key, value in update_data.items():
        if key == "notes" and value:
            # Append new notes (assuming value is a list of new notes to add)
            current_notes = list(db_incident.notes or [])
            for note in value:
                if "created_at" not in note:
                    note["created_at"] = datetime.now(timezone.utc).isoformat()
                if "actor_id" not in note:
                    note["actor_id"] = user_id
                current_notes.append(note)
            db_incident.notes = current_notes
        else:
            setattr(db_incident, key, value)
    
    # Log activity if status changed
    if "status" in update_data and update_data["status"] != previous_status:
        # Check if we should revert asset status
        if update_data["status"] in ["Resolved", "Closed"]:
            # Check for any other open/in-progress incidents
            other_active = db.query(Incident).filter(
                Incident.asset_id == db_incident.asset_id,
                Incident.org_id == org_id,
                Incident.id != db_incident.id,
                Incident.status.in_(["Open", "In Progress"])
            ).first()

            if not other_active:
                asset = db.query(Asset).filter(Asset.id == db_incident.asset_id).first()
                if asset and asset.status == "Maintenance":
                    asset.status = "Available"
                    db.add(ActivityLog(
                        org_id=org_id,
                        asset_id=asset.id,
                        asset_name=asset.name,
                        actor_id="system",
                        event_type="updated",
                        details={
                            "previous_status": "Maintenance",
                            "new_status": "Available",
                            "reason": f"All incidents for asset resolved (triggered by resolution of #{db_incident.id})"
                        }
                    ))

        log = ActivityLog(
            org_id=org_id,
            asset_id=db_incident.asset_id,
            asset_name=db_incident.asset.name if db_incident.asset else f"Asset #{db_incident.asset_id}",
            actor_id=user_id,
            event_type="incident_updated",
            details={
                "incident_id": db_incident.id,
                "previous_status": previous_status,
                "new_status": db_incident.status
            }
        )
        db.add(log)
    
    db.commit()
    db.refresh(db_incident)
    return db_incident
