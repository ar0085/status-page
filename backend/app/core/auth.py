from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import jwt
import requests
from app.core.config import settings
from app.db.session import get_db
from app.models.organization import User, Organization

security = HTTPBearer()


async def verify_clerk_token(token: str) -> dict:
    """Verify Clerk JWT token and return user data."""
    try:
        # In production, you would verify the JWT signature using Clerk's public keys
        # For now, we'll decode without verification for development
        headers = jwt.get_unverified_header(token)
        payload = jwt.decode(token, options={"verify_signature": False})

        return payload
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    """Get current authenticated user from JWT token."""
    token = credentials.credentials
    payload = await verify_clerk_token(token)

    clerk_user_id = payload.get("sub")
    if not clerk_user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token: missing user ID",
        )

    user = db.query(User).filter(User.clerk_user_id == clerk_user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    return user


async def get_current_tenant(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> Organization:
    """Get current user's organization/tenant."""
    organization = (
        db.query(Organization).filter(Organization.id == current_user.tenant_id).first()
    )
    if not organization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found"
        )

    return organization


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Require user to have admin role."""
    from app.models.organization import UserRole

    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required"
        )
    return current_user


def get_organization_by_slug(slug: str, db: Session) -> Organization:
    """Get organization by slug for public endpoints."""
    organization = db.query(Organization).filter(Organization.slug == slug).first()
    if not organization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found"
        )
    return organization
