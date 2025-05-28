from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.db.session import get_db
from app.models.organization import Maintenance, Service, User, MaintenanceStatus
from app.schemas.organization import (
    MaintenanceCreate,
    MaintenanceUpdate,
    Maintenance as MaintenanceResponse,
)
from app.core.auth import get_current_user
from app.websocket import emit_maintenance_created, emit_maintenance_update

router = APIRouter(prefix="/maintenance", tags=["maintenance"])


@router.get("/", response_model=List[MaintenanceResponse])
async def get_maintenances(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Get all maintenance windows for the current user's tenant."""
    maintenances = (
        db.query(Maintenance)
        .filter(Maintenance.tenant_id == current_user.tenant_id)
        .order_by(Maintenance.scheduled_start.desc())
        .all()
    )
    return maintenances


@router.post(
    "/", response_model=MaintenanceResponse, status_code=status.HTTP_201_CREATED
)
async def create_maintenance(
    maintenance_data: MaintenanceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new maintenance window for the current user's tenant."""

    # Validate scheduled times
    if maintenance_data.scheduled_end <= maintenance_data.scheduled_start:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Scheduled end time must be after start time",
        )

    # Verify all service IDs belong to the current tenant
    services = (
        db.query(Service)
        .filter(
            Service.id.in_(maintenance_data.service_ids),
            Service.tenant_id == current_user.tenant_id,
        )
        .all()
    )

    if len(services) != len(maintenance_data.service_ids):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="One or more service IDs are invalid or don't belong to your organization",
        )

    # Create maintenance
    maintenance = Maintenance(
        title=maintenance_data.title,
        description=maintenance_data.description,
        scheduled_start=maintenance_data.scheduled_start,
        scheduled_end=maintenance_data.scheduled_end,
        tenant_id=current_user.tenant_id,
    )
    db.add(maintenance)
    db.flush()  # Get the ID

    # Associate services
    maintenance.services = services

    db.commit()
    db.refresh(maintenance)

    # Emit WebSocket event for real-time updates
    await emit_maintenance_created(
        current_user.tenant_id,
        {
            "id": maintenance.id,
            "title": maintenance.title,
            "description": maintenance.description,
            "status": maintenance.status.value,
            "scheduled_start": maintenance.scheduled_start.isoformat(),
            "scheduled_end": maintenance.scheduled_end.isoformat(),
            "services": [{"id": s.id, "name": s.name} for s in services],
            "created_at": maintenance.created_at.isoformat(),
            "action": "created",
        },
    )

    return maintenance


@router.get("/{maintenance_id}", response_model=MaintenanceResponse)
async def get_maintenance(
    maintenance_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a specific maintenance window by ID within the current user's tenant."""
    maintenance = (
        db.query(Maintenance)
        .filter(
            Maintenance.id == maintenance_id,
            Maintenance.tenant_id == current_user.tenant_id,
        )
        .first()
    )

    if not maintenance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Maintenance window not found"
        )
    return maintenance


@router.put("/{maintenance_id}", response_model=MaintenanceResponse)
async def update_maintenance(
    maintenance_id: int,
    maintenance_update: MaintenanceUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a maintenance window within the current user's tenant."""
    maintenance = (
        db.query(Maintenance)
        .filter(
            Maintenance.id == maintenance_id,
            Maintenance.tenant_id == current_user.tenant_id,
        )
        .first()
    )

    if not maintenance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Maintenance window not found"
        )

    update_data = maintenance_update.dict(exclude_unset=True)

    # Validate scheduled times if both are provided
    scheduled_start = update_data.get("scheduled_start", maintenance.scheduled_start)
    scheduled_end = update_data.get("scheduled_end", maintenance.scheduled_end)

    if scheduled_end <= scheduled_start:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Scheduled end time must be after start time",
        )

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

        maintenance.services = services
        del update_data["service_ids"]

    # Handle status transitions
    if "status" in update_data:
        new_status = update_data["status"]
        current_time = datetime.utcnow()

        if new_status == MaintenanceStatus.IN_PROGRESS and not maintenance.actual_start:
            maintenance.actual_start = current_time
        elif new_status == MaintenanceStatus.COMPLETED and not maintenance.actual_end:
            maintenance.actual_end = current_time

    # Update other fields
    for field, value in update_data.items():
        setattr(maintenance, field, value)

    db.commit()
    db.refresh(maintenance)

    # Emit WebSocket event for real-time updates
    await emit_maintenance_update(
        current_user.tenant_id,
        {
            "id": maintenance.id,
            "title": maintenance.title,
            "description": maintenance.description,
            "status": maintenance.status.value,
            "scheduled_start": maintenance.scheduled_start.isoformat(),
            "scheduled_end": maintenance.scheduled_end.isoformat(),
            "actual_start": (
                maintenance.actual_start.isoformat()
                if maintenance.actual_start
                else None
            ),
            "actual_end": (
                maintenance.actual_end.isoformat() if maintenance.actual_end else None
            ),
            "services": [{"id": s.id, "name": s.name} for s in maintenance.services],
            "updated_at": maintenance.updated_at.isoformat(),
            "action": "updated",
        },
    )

    return maintenance


@router.delete("/{maintenance_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_maintenance(
    maintenance_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a maintenance window within the current user's tenant."""
    maintenance = (
        db.query(Maintenance)
        .filter(
            Maintenance.id == maintenance_id,
            Maintenance.tenant_id == current_user.tenant_id,
        )
        .first()
    )

    if not maintenance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Maintenance window not found"
        )

    # Store maintenance data before deletion
    maintenance_data = {
        "id": maintenance.id,
        "title": maintenance.title,
        "description": maintenance.description,
        "status": maintenance.status.value,
        "scheduled_start": maintenance.scheduled_start.isoformat(),
        "scheduled_end": maintenance.scheduled_end.isoformat(),
        "services": [{"id": s.id, "name": s.name} for s in maintenance.services],
        "action": "deleted",
    }

    db.delete(maintenance)
    db.commit()

    # Emit WebSocket event for real-time updates
    await emit_maintenance_update(current_user.tenant_id, maintenance_data)

    return None
