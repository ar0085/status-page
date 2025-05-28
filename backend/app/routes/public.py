from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.models.organization import (
    Organization,
    Service,
    Incident,
    IncidentStatus,
    Maintenance,
    MaintenanceStatus,
)
from app.schemas.organization import (
    StatusPageResponse,
    PublicService,
    PublicIncident,
    PublicMaintenance,
    Organization as OrganizationResponse,
)
from app.core.auth import get_organization_by_slug

router = APIRouter(prefix="/status", tags=["public"])


@router.get("/{org_slug}/services", response_model=List[PublicService])
async def get_public_services(org_slug: str, db: Session = Depends(get_db)):
    """Get all services for a public organization by slug."""
    organization = get_organization_by_slug(org_slug, db)

    services = db.query(Service).filter(Service.tenant_id == organization.id).all()

    return services


@router.get("/{org_slug}/incidents", response_model=List[PublicIncident])
async def get_public_incidents(
    org_slug: str, active_only: bool = True, db: Session = Depends(get_db)
):
    """Get incidents for a public organization by slug."""
    organization = get_organization_by_slug(org_slug, db)

    query = db.query(Incident).filter(Incident.tenant_id == organization.id)

    if active_only:
        query = query.filter(Incident.status == IncidentStatus.OPEN)

    incidents = query.all()
    return incidents


@router.get("/{org_slug}/timeline", response_model=List[PublicIncident])
async def get_public_timeline(
    org_slug: str, limit: int = 10, db: Session = Depends(get_db)
):
    """Get recent incident history for a public organization by slug."""
    organization = get_organization_by_slug(org_slug, db)

    incidents = (
        db.query(Incident)
        .filter(Incident.tenant_id == organization.id)
        .order_by(Incident.created_at.desc())
        .limit(limit)
        .all()
    )

    return incidents


@router.get("/{org_slug}/maintenance", response_model=List[PublicMaintenance])
async def get_public_maintenances(
    org_slug: str, active_only: bool = True, db: Session = Depends(get_db)
):
    """Get maintenance windows for a public organization by slug."""
    organization = get_organization_by_slug(org_slug, db)

    query = db.query(Maintenance).filter(Maintenance.tenant_id == organization.id)

    if active_only:
        query = query.filter(
            Maintenance.status.in_(
                [MaintenanceStatus.SCHEDULED, MaintenanceStatus.IN_PROGRESS]
            )
        )

    maintenances = query.order_by(Maintenance.scheduled_start.desc()).all()
    return maintenances


@router.get("/{org_slug}", response_model=StatusPageResponse)
async def get_status_page(org_slug: str, db: Session = Depends(get_db)):
    """Get complete status page data for an organization."""
    organization = get_organization_by_slug(org_slug, db)

    # Get all services
    services = db.query(Service).filter(Service.tenant_id == organization.id).all()

    # Get active incidents
    active_incidents = (
        db.query(Incident)
        .filter(
            Incident.tenant_id == organization.id,
            Incident.status == IncidentStatus.OPEN,
        )
        .all()
    )

    # Get active maintenance windows
    active_maintenances = (
        db.query(Maintenance)
        .filter(
            Maintenance.tenant_id == organization.id,
            Maintenance.status.in_(
                [MaintenanceStatus.SCHEDULED, MaintenanceStatus.IN_PROGRESS]
            ),
        )
        .order_by(Maintenance.scheduled_start.asc())
        .all()
    )

    return StatusPageResponse(
        organization=organization,
        services=services,
        active_incidents=active_incidents,
        active_maintenances=active_maintenances,
    )
