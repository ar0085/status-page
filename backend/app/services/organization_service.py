from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status
from app.models.organization import Organization, User, UserRole
from app.schemas.organization import OrganizationCreate, UserCreate
import re


def create_organization(
    db: Session, org_data: OrganizationCreate, creator_clerk_id: str, creator_email: str
) -> Organization:
    """Create a new organization and assign the creator as admin."""

    # Validate slug format
    if not re.match(r"^[a-z0-9-]+$", org_data.slug):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Slug must contain only lowercase letters, numbers, and hyphens",
        )

    try:
        # Create organization
        organization = Organization(name=org_data.name, slug=org_data.slug)
        db.add(organization)
        db.flush()  # Get the ID without committing

        # Create admin user
        admin_user = User(
            clerk_user_id=creator_clerk_id,
            email=creator_email,
            tenant_id=organization.id,
            role=UserRole.ADMIN,
        )
        db.add(admin_user)
        db.commit()
        db.refresh(organization)

        return organization

    except IntegrityError as e:
        db.rollback()
        if "slug" in str(e):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Organization slug already exists",
            )
        elif "clerk_user_id" in str(e):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="User already exists"
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create organization",
        )


def get_user_by_clerk_id(db: Session, clerk_user_id: str) -> User:
    """Get user by Clerk ID."""
    return db.query(User).filter(User.clerk_user_id == clerk_user_id).first()


def create_user(db: Session, user_data: UserCreate) -> User:
    """Create a new user."""
    try:
        user = User(**user_data.dict())
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email or Clerk ID already exists",
        )


def get_organization_by_slug(db: Session, slug: str) -> Organization:
    """Get organization by slug."""
    return db.query(Organization).filter(Organization.slug == slug).first()
