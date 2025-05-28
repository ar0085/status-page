from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.models.organization import Organization, User, UserRole
from app.schemas.organization import (
    TeamMemberInvite,
    TeamMemberUpdate,
    TeamMember,
    TeamMemberList,
)
from app.core.auth import get_current_user, require_admin, get_current_tenant
from app.services.team_service import (
    invite_team_member,
    get_team_members,
    update_team_member,
    remove_team_member,
    get_team_member_by_id,
    cancel_invitation,
    get_invitation_by_token,
    get_invitation_by_email,
    accept_invitation,
)

router = APIRouter(prefix="/team", tags=["team"])


@router.get("/members", response_model=TeamMemberList)
async def list_team_members(
    current_user: User = Depends(get_current_user),
    organization: Organization = Depends(get_current_tenant),
    db: Session = Depends(get_db),
):
    """Get all team members for the current organization."""
    members = get_team_members(db, organization.id)
    return TeamMemberList(members=members, total_count=len(members))


@router.post("/invite", response_model=TeamMember, status_code=status.HTTP_201_CREATED)
async def invite_member(
    invite_data: TeamMemberInvite,
    current_user: User = Depends(require_admin),
    organization: Organization = Depends(get_current_tenant),
    db: Session = Depends(get_db),
):
    """Invite a new member to the organization. Admin only."""
    member = await invite_team_member(db, organization.id, invite_data, current_user.id)
    return member


@router.put("/members/{member_id}", response_model=TeamMember)
async def update_member(
    member_id: int,
    update_data: TeamMemberUpdate,
    current_user: User = Depends(require_admin),
    organization: Organization = Depends(get_current_tenant),
    db: Session = Depends(get_db),
):
    """Update a team member's role. Admin only."""
    member = get_team_member_by_id(db, member_id, organization.id)
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Team member not found"
        )

    # Prevent admin from demoting themselves if they're the only admin
    if member.id == current_user.id and update_data.role != UserRole.ADMIN:
        admin_count = (
            db.query(User)
            .filter(User.tenant_id == organization.id, User.role == UserRole.ADMIN)
            .count()
        )

        if admin_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot remove admin role from the last admin",
            )

    updated_member = update_team_member(db, member, update_data)
    return updated_member


@router.delete("/members/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_member(
    member_id: int,
    current_user: User = Depends(require_admin),
    organization: Organization = Depends(get_current_tenant),
    db: Session = Depends(get_db),
):
    """Remove a team member or cancel invitation. Admin only."""
    # Handle pending invitations (negative IDs)
    if member_id < 0:
        invitation_id = -member_id
        cancel_invitation(db, invitation_id, organization.id)
        return

    # Handle actual users
    member = get_team_member_by_id(db, member_id, organization.id)
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Team member not found"
        )

    # Prevent admin from removing themselves if they're the only admin
    if member.id == current_user.id:
        admin_count = (
            db.query(User)
            .filter(User.tenant_id == organization.id, User.role == UserRole.ADMIN)
            .count()
        )

        if admin_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot remove the last admin from the organization",
            )

    remove_team_member(db, member)


@router.get("/members/me", response_model=TeamMember)
async def get_my_profile(
    current_user: User = Depends(get_current_user),
):
    """Get current user's team member profile."""
    return TeamMember(
        id=current_user.id,
        email=current_user.email,
        role=current_user.role,
        clerk_user_id=current_user.clerk_user_id,
        created_at=current_user.created_at,
        is_pending=False,
    )


@router.post("/leave", status_code=status.HTTP_204_NO_CONTENT)
async def leave_organization(
    current_user: User = Depends(get_current_user),
    organization: Organization = Depends(get_current_tenant),
    db: Session = Depends(get_db),
):
    """Leave the current organization."""
    # Prevent admin from leaving if they're the only admin
    if current_user.role == UserRole.ADMIN:
        admin_count = (
            db.query(User)
            .filter(User.tenant_id == organization.id, User.role == UserRole.ADMIN)
            .count()
        )

        if admin_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot leave organization as the last admin. Transfer admin role to another member first.",
            )

    remove_team_member(db, current_user)


# Invitation endpoints (public routes for accepting invitations)
@router.get("/invitation/{token}")
async def get_invitation_details(
    token: str,
    db: Session = Depends(get_db),
):
    """Get invitation details by token (for invitation acceptance page)."""
    invitation = get_invitation_by_token(db, token)
    if not invitation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invitation not found or expired",
        )

    return {
        "email": invitation.email,
        "role": invitation.role,
        "organization_name": invitation.organization.name,
        "expires_at": invitation.expires_at,
    }


@router.post("/accept-invitation")
async def accept_team_invitation(
    token: str,
    clerk_user_id: str,
    db: Session = Depends(get_db),
):
    """Accept a team invitation and create user account."""
    invitation = get_invitation_by_token(db, token)
    if not invitation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invitation not found or expired",
        )

    # Check if user already exists
    existing_user = db.query(User).filter(User.clerk_user_id == clerk_user_id).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="User already exists"
        )

    user = accept_invitation(db, invitation, clerk_user_id)

    return {
        "message": "Invitation accepted successfully",
        "user_id": user.id,
        "organization_id": user.tenant_id,
    }
