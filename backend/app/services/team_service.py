from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status
from typing import List, Optional
from datetime import datetime, timedelta

from app.models.organization import User, UserRole, Invitation
from app.schemas.organization import (
    TeamMemberInvite,
    TeamMemberUpdate,
    TeamMember,
    InvitationResponse,
)
from app.services.organization_service import (
    get_user_by_clerk_id as _get_user_by_clerk_id,
)
from app.core.config import settings


def get_team_members(db: Session, organization_id: int) -> List[TeamMember]:
    """Get all team members for an organization, including pending invitations."""
    # Get actual users
    users = db.query(User).filter(User.tenant_id == organization_id).all()

    # Get pending invitations
    pending_invitations = (
        db.query(Invitation)
        .filter(
            Invitation.tenant_id == organization_id,
            Invitation.is_accepted == False,
            Invitation.expires_at > datetime.utcnow(),
        )
        .all()
    )

    team_members = []

    # Add actual users
    for user in users:
        team_members.append(
            TeamMember(
                id=user.id,
                email=user.email,
                role=user.role,
                clerk_user_id=user.clerk_user_id,
                created_at=user.created_at,
                is_pending=False,
            )
        )

    # Add pending invitations (with negative IDs to distinguish them)
    for invitation in pending_invitations:
        team_members.append(
            TeamMember(
                id=-invitation.id,  # Negative ID to distinguish from real users
                email=invitation.email,
                role=invitation.role,
                clerk_user_id=f"pending_{invitation.token}",
                created_at=invitation.created_at,
                is_pending=True,
            )
        )

    return team_members


def get_team_member_by_id(
    db: Session, member_id: int, organization_id: int
) -> Optional[User]:
    """Get a specific team member by ID within an organization."""
    return (
        db.query(User)
        .filter(User.id == member_id, User.tenant_id == organization_id)
        .first()
    )


async def invite_team_member(
    db: Session,
    organization_id: int,
    invite_data: TeamMemberInvite,
    invited_by_user_id: int,
) -> TeamMember:
    """Create an invitation for a new team member."""

    # Check if user with this email already exists in the organization
    existing_user = (
        db.query(User)
        .filter(User.email == invite_data.email, User.tenant_id == organization_id)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email is already a member of the organization",
        )

    # Check if there's already a pending invitation for this email
    existing_invitation = (
        db.query(Invitation)
        .filter(
            Invitation.email == invite_data.email,
            Invitation.tenant_id == organization_id,
            Invitation.is_accepted == False,
            Invitation.expires_at > datetime.utcnow(),
        )
        .first()
    )

    if existing_invitation:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="There is already a pending invitation for this email",
        )

    try:
        # Create invitation that expires in 7 days
        invitation = Invitation(
            tenant_id=organization_id,
            email=invite_data.email,
            role=invite_data.role,
            invited_by_user_id=invited_by_user_id,
            expires_at=datetime.utcnow() + timedelta(days=7),
        )

        db.add(invitation)
        db.commit()
        db.refresh(invitation)

        # Send invitation "email" (console log for now)
        await send_invitation_email(invitation.email, invitation.token, organization_id)

        return TeamMember(
            id=-invitation.id,  # Negative ID to distinguish from real users
            email=invitation.email,
            role=invitation.role,
            clerk_user_id=f"pending_{invitation.token}",
            created_at=invitation.created_at,
            is_pending=True,
        )

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create team member invitation",
        )


def update_team_member(
    db: Session, user: User, update_data: TeamMemberUpdate
) -> TeamMember:
    """Update a team member's role."""
    user.role = update_data.role

    try:
        db.commit()
        db.refresh(user)

        return TeamMember(
            id=user.id,
            email=user.email,
            role=user.role,
            clerk_user_id=user.clerk_user_id,
            created_at=user.created_at,
            is_pending=False,
        )

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to update team member",
        )


def remove_team_member(db: Session, user: User) -> None:
    """Remove a team member from the organization."""
    try:
        db.delete(user)
        db.commit()

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to remove team member",
        )


def cancel_invitation(db: Session, invitation_id: int, organization_id: int) -> None:
    """Cancel a pending invitation."""
    invitation = (
        db.query(Invitation)
        .filter(
            Invitation.id == invitation_id,
            Invitation.tenant_id == organization_id,
            Invitation.is_accepted == False,
        )
        .first()
    )

    if not invitation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Invitation not found"
        )

    try:
        db.delete(invitation)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to cancel invitation",
        )


def get_invitation_by_token(db: Session, token: str) -> Optional[Invitation]:
    """Get invitation by token."""
    return (
        db.query(Invitation)
        .filter(
            Invitation.token == token,
            Invitation.is_accepted == False,
            Invitation.expires_at > datetime.utcnow(),
        )
        .first()
    )


def get_invitation_by_email(db: Session, email: str) -> Optional[Invitation]:
    """Get pending invitation by email."""
    return (
        db.query(Invitation)
        .filter(
            Invitation.email == email,
            Invitation.is_accepted == False,
            Invitation.expires_at > datetime.utcnow(),
        )
        .first()
    )


def accept_invitation(db: Session, invitation: Invitation, clerk_user_id: str) -> User:
    """Accept an invitation and create the user account."""
    try:
        # Create the user
        new_user = User(
            clerk_user_id=clerk_user_id,
            email=invitation.email,
            tenant_id=invitation.tenant_id,
            role=invitation.role,
        )

        db.add(new_user)

        # Mark invitation as accepted
        invitation.is_accepted = True

        db.commit()
        db.refresh(new_user)

        return new_user

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to accept invitation",
        )


def get_user_by_clerk_id(db: Session, clerk_user_id: str) -> Optional[User]:
    """Get user by Clerk user ID."""
    return _get_user_by_clerk_id(db, clerk_user_id)


# TODO: Implement email sending
async def send_invitation_email(email: str, token: str, organization_id: int) -> None:
    """Send invitation email to the new team member."""
    # This would integrate with your email service (SendGrid, AWS SES, etc.)
    # Email would contain a link like: http://yourapp.com/accept-invitation?token={token}

    # Use environment-based frontend URL
    if settings.FRONTEND_URL:
        base_url = settings.FRONTEND_URL
    elif settings.ENVIRONMENT == "production":
        # Default production URL - update this to your actual frontend domain
        base_url = "https://your-frontend-domain.onrender.com"
    else:
        # Development fallback
        base_url = "http://localhost:5173"

    invitation_link = f"{base_url}/accept-invitation?token={token}"

    # For now, log the invitation details to console
    print(f"\n🔔 INVITATION CREATED:")
    print(f"   Email: {email}")
    print(f"   Token: {token}")
    print(f"   Invitation Link: {invitation_link}")
    print(f"   Organization ID: {organization_id}")
    print("   (In production, this would be sent via email)\n")
