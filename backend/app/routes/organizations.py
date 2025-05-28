from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional

from app.db.session import get_db
from app.models.organization import Organization, User
from app.schemas.organization import (
    OrganizationCreate,
    Organization as OrganizationResponse,
)
from app.services.organization_service import create_organization, get_user_by_clerk_id
from app.services.team_service import get_invitation_by_email, accept_invitation
from app.core.auth import get_current_user

router = APIRouter(prefix="/organizations", tags=["organizations"])


@router.post(
    "/", response_model=OrganizationResponse, status_code=status.HTTP_201_CREATED
)
async def create_new_organization(
    org_data: OrganizationCreate,
    clerk_user_id: str,
    email: str,
    db: Session = Depends(get_db),
):
    """Create a new organization. This endpoint is called during user onboarding."""

    # Check if user already exists
    existing_user = get_user_by_clerk_id(db, clerk_user_id)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already belongs to an organization",
        )

    organization = create_organization(db, org_data, clerk_user_id, email)
    return organization


@router.get("/current", response_model=OrganizationResponse)
async def get_current_organization(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Get the current user's organization."""
    organization = (
        db.query(Organization).filter(Organization.id == current_user.tenant_id).first()
    )

    if not organization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found"
        )

    return organization


@router.get("/check-user/{clerk_user_id}")
async def check_user_organization(
    clerk_user_id: str, email: str = None, db: Session = Depends(get_db)
):
    """Check if a user exists and has an organization. Used during login flow."""
    user = get_user_by_clerk_id(db, clerk_user_id)

    if user:
        # User exists, check their organization
        organization = (
            db.query(Organization).filter(Organization.id == user.tenant_id).first()
        )

        return {
            "user_exists": True,
            "has_organization": bool(organization),
            "organization": organization,
        }

    # User doesn't exist yet, check for pending invitation
    if email:
        invitation = get_invitation_by_email(db, email)
        if invitation:
            # Auto-accept the invitation and create the user
            try:
                new_user = accept_invitation(db, invitation, clerk_user_id)
                organization = (
                    db.query(Organization)
                    .filter(Organization.id == new_user.tenant_id)
                    .first()
                )

                return {
                    "user_exists": True,
                    "has_organization": True,
                    "organization": organization,
                }
            except Exception as e:
                # If auto-acceptance fails, still return no organization to trigger normal flow
                pass

    return {"user_exists": False, "has_organization": False, "organization": None}
