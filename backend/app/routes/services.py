from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.models.organization import Service, User, Organization
from app.schemas.organization import (
    ServiceCreate,
    ServiceUpdate,
    Service as ServiceResponse,
)
from app.core.auth import get_current_user, get_current_tenant
from app.websocket import emit_service_update

router = APIRouter(prefix="/services", tags=["services"])


@router.get("/", response_model=List[ServiceResponse])
async def get_services(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Get all services for the current user's tenant."""
    services = (
        db.query(Service).filter(Service.tenant_id == current_user.tenant_id).all()
    )
    return services


@router.post("/", response_model=ServiceResponse, status_code=status.HTTP_201_CREATED)
async def create_service(
    service_data: ServiceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new service for the current user's tenant."""
    service = Service(**service_data.dict(), tenant_id=current_user.tenant_id)
    db.add(service)
    db.commit()
    db.refresh(service)

    # Emit WebSocket event for real-time updates
    await emit_service_update(
        current_user.tenant_id,
        {
            "id": service.id,
            "name": service.name,
            "description": service.description,
            "status": service.status.value,
            "action": "created",
        },
    )

    return service


@router.get("/{service_id}", response_model=ServiceResponse)
async def get_service(
    service_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a specific service by ID within the current user's tenant."""
    service = (
        db.query(Service)
        .filter(Service.id == service_id, Service.tenant_id == current_user.tenant_id)
        .first()
    )

    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Service not found"
        )
    return service


@router.put("/{service_id}", response_model=ServiceResponse)
async def update_service(
    service_id: int,
    service_update: ServiceUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a service within the current user's tenant."""
    service = (
        db.query(Service)
        .filter(Service.id == service_id, Service.tenant_id == current_user.tenant_id)
        .first()
    )

    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Service not found"
        )

    # Update only provided fields
    update_data = service_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(service, field, value)

    db.commit()
    db.refresh(service)

    # Emit WebSocket event for real-time updates
    await emit_service_update(
        current_user.tenant_id,
        {
            "id": service.id,
            "name": service.name,
            "description": service.description,
            "status": service.status.value,
            "action": "updated",
        },
    )

    return service


@router.delete("/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_service(
    service_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a service within the current user's tenant."""
    service = (
        db.query(Service)
        .filter(Service.id == service_id, Service.tenant_id == current_user.tenant_id)
        .first()
    )

    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Service not found"
        )

    # Store service data before deletion
    service_data = {
        "id": service.id,
        "name": service.name,
        "description": service.description,
        "status": service.status.value,
        "action": "deleted",
    }

    db.delete(service)
    db.commit()

    # Emit WebSocket event for real-time updates
    await emit_service_update(current_user.tenant_id, service_data)

    return None
