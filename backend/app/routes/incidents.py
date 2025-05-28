from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.models.organization import Incident, IncidentUpdate, Service, User
from app.schemas.organization import (
    IncidentCreate,
    IncidentUpdate as IncidentUpdateSchema,
    Incident as IncidentResponse,
    IncidentUpdateCreate,
    IncidentUpdateResponse,
)
from app.core.auth import get_current_user
from app.websocket import emit_incident_created, emit_incident_update

router = APIRouter(prefix="/incidents", tags=["incidents"])


@router.get("/", response_model=List[IncidentResponse])
async def get_incidents(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Get all incidents for the current user's tenant."""
    incidents = (
        db.query(Incident).filter(Incident.tenant_id == current_user.tenant_id).all()
    )
    return incidents


@router.post("/", response_model=IncidentResponse, status_code=status.HTTP_201_CREATED)
async def create_incident(
    incident_data: IncidentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new incident for the current user's tenant."""

    # Verify all service IDs belong to the current tenant
    services = (
        db.query(Service)
        .filter(
            Service.id.in_(incident_data.service_ids),
            Service.tenant_id == current_user.tenant_id,
        )
        .all()
    )

    if len(services) != len(incident_data.service_ids):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="One or more service IDs are invalid or don't belong to your organization",
        )

    # Create incident
    incident = Incident(
        title=incident_data.title,
        description=incident_data.description,
        tenant_id=current_user.tenant_id,
    )
    db.add(incident)
    db.flush()  # Get the ID

    # Associate services
    incident.services = services

    db.commit()
    db.refresh(incident)

    # Emit WebSocket event for real-time updates
    await emit_incident_created(
        current_user.tenant_id,
        {
            "id": incident.id,
            "title": incident.title,
            "description": incident.description,
            "status": incident.status.value,
            "services": [{"id": s.id, "name": s.name} for s in services],
            "created_at": incident.created_at.isoformat(),
            "action": "created",
        },
    )

    return incident


@router.get("/{incident_id}", response_model=IncidentResponse)
async def get_incident(
    incident_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a specific incident by ID within the current user's tenant."""
    incident = (
        db.query(Incident)
        .filter(
            Incident.id == incident_id, Incident.tenant_id == current_user.tenant_id
        )
        .first()
    )

    if not incident:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Incident not found"
        )
    return incident


@router.put("/{incident_id}", response_model=IncidentResponse)
async def update_incident(
    incident_id: int,
    incident_update: IncidentUpdateSchema,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update an incident within the current user's tenant."""
    incident = (
        db.query(Incident)
        .filter(
            Incident.id == incident_id, Incident.tenant_id == current_user.tenant_id
        )
        .first()
    )

    if not incident:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Incident not found"
        )

    update_data = incident_update.dict(exclude_unset=True)

    # Handle service IDs update
    if "service_ids" in update_data:
        services = (
            db.query(Service)
            .filter(
                Service.id.in_(update_data["service_ids"]),
                Service.tenant_id == current_user.tenant_id,
            )
            .all()
        )

        if len(services) != len(update_data["service_ids"]):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="One or more service IDs are invalid",
            )

        incident.services = services
        del update_data["service_ids"]

    # Update other fields
    for field, value in update_data.items():
        setattr(incident, field, value)

    db.commit()
    db.refresh(incident)

    # Emit WebSocket event for real-time updates
    await emit_incident_update(
        current_user.tenant_id,
        {
            "id": incident.id,
            "title": incident.title,
            "description": incident.description,
            "status": incident.status.value,
            "services": [{"id": s.id, "name": s.name} for s in incident.services],
            "updated_at": incident.updated_at.isoformat(),
            "action": "updated",
        },
    )

    return incident


@router.post(
    "/{incident_id}/updates",
    response_model=IncidentUpdateResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_incident_update(
    incident_id: int,
    update_data: IncidentUpdateCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create an update for an incident within the current user's tenant."""
    incident = (
        db.query(Incident)
        .filter(
            Incident.id == incident_id, Incident.tenant_id == current_user.tenant_id
        )
        .first()
    )

    if not incident:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Incident not found"
        )

    # Create the update
    update = IncidentUpdate(incident_id=incident_id, text=update_data.text)
    db.add(update)
    db.commit()
    db.refresh(update)

    # Emit WebSocket event for real-time updates
    await emit_incident_update(
        current_user.tenant_id,
        {
            "id": incident.id,
            "title": incident.title,
            "description": incident.description,
            "status": incident.status.value,
            "services": [{"id": s.id, "name": s.name} for s in incident.services],
            "updates": [
                {
                    "id": update.id,
                    "text": update.text,
                    "created_at": update.created_at.isoformat(),
                }
            ],
            "updated_at": incident.updated_at.isoformat(),
            "action": "update_added",
        },
    )

    return update


@router.delete("/{incident_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_incident(
    incident_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete an incident within the current user's tenant."""
    incident = (
        db.query(Incident)
        .filter(
            Incident.id == incident_id, Incident.tenant_id == current_user.tenant_id
        )
        .first()
    )

    if not incident:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Incident not found"
        )

    # Store incident data before deletion
    incident_data = {
        "id": incident.id,
        "title": incident.title,
        "description": incident.description,
        "status": incident.status.value,
        "services": [{"id": s.id, "name": s.name} for s in incident.services],
        "action": "deleted",
    }

    db.delete(incident)
    db.commit()

    # Emit WebSocket event for real-time updates
    await emit_incident_update(current_user.tenant_id, incident_data)
    return None
