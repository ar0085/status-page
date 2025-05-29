"""
Production-safe demo data setup for the status page application.
Creates sample organizations and services for testing in production.
"""

import asyncio
from datetime import datetime
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.organization import Organization, User, OrganizationMember
from app.models.service import Service
from app.models.incident import Incident
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

# Demo organizations that will be created
DEMO_ORGS = [
    {
        "name": "Demo Organization",
        "slug": "demo-org",
        "demo_user_email": "demo@example.com",
        "demo_user_name": "Demo User",
        "services": [
            {
                "name": "Web Application",
                "description": "Main customer-facing web application",
                "status": "operational",
            },
            {
                "name": "API Gateway",
                "description": "REST API gateway and authentication",
                "status": "operational",
            },
            {
                "name": "Database",
                "description": "Primary PostgreSQL database",
                "status": "operational",
            },
            {
                "name": "File Storage",
                "description": "Document and media storage service",
                "status": "operational",
            },
            {
                "name": "Email Service",
                "description": "Transactional email delivery",
                "status": "degraded",
            },
        ],
    },
    {
        "name": "Test Company",
        "slug": "test-company",
        "demo_user_email": "test@company.com",
        "demo_user_name": "Test Admin",
        "services": [
            {
                "name": "Frontend Service",
                "description": "React frontend application",
                "status": "operational",
            },
            {
                "name": "Backend API",
                "description": "FastAPI backend service",
                "status": "operational",
            },
            {
                "name": "Payment Gateway",
                "description": "Payment processing system",
                "status": "partial_outage",
            },
            {
                "name": "Monitoring",
                "description": "System monitoring and alerts",
                "status": "operational",
            },
        ],
    },
]


def create_demo_organization(db: Session, org_data: dict) -> Organization:
    """Create a demo organization with a demo user."""

    # Check if organization already exists
    existing_org = (
        db.query(Organization).filter(Organization.slug == org_data["slug"]).first()
    )
    if existing_org:
        logger.info(f"Organization {org_data['slug']} already exists, skipping")
        return existing_org

    # Create demo user first
    demo_user_clerk_id = f"demo_user_{org_data['slug']}"
    existing_user = db.query(User).filter(User.clerk_id == demo_user_clerk_id).first()

    if not existing_user:
        demo_user = User(
            clerk_id=demo_user_clerk_id,
            email=org_data["demo_user_email"],
            name=org_data["demo_user_name"],
        )
        db.add(demo_user)
        db.flush()  # Get the user ID
        logger.info(f"Created demo user: {demo_user.email}")
    else:
        demo_user = existing_user
        logger.info(f"Demo user already exists: {demo_user.email}")

    # Create organization
    org = Organization(
        name=org_data["name"], slug=org_data["slug"], created_by=demo_user.id
    )
    db.add(org)
    db.flush()  # Get the org ID

    # Add user as organization member
    member = OrganizationMember(
        organization_id=org.id, user_id=demo_user.id, role="admin"
    )
    db.add(member)

    logger.info(f"Created organization: {org.name} (slug: {org.slug})")
    return org


def create_demo_services(db: Session, org: Organization, services_data: list):
    """Create demo services for an organization."""

    for service_data in services_data:
        # Check if service already exists
        existing_service = (
            db.query(Service)
            .filter(
                Service.organization_id == org.id, Service.name == service_data["name"]
            )
            .first()
        )

        if existing_service:
            logger.info(f"Service {service_data['name']} already exists, skipping")
            continue

        service = Service(
            organization_id=org.id,
            name=service_data["name"],
            description=service_data["description"],
            status=service_data["status"],
        )
        db.add(service)
        logger.info(f"Created service: {service.name} (status: {service.status})")


def create_demo_incident(db: Session, org: Organization):
    """Create a sample incident for demonstration."""

    # Check if incident already exists
    existing_incident = (
        db.query(Incident)
        .filter(
            Incident.organization_id == org.id,
            Incident.title == "Sample Incident - Email Service Degradation",
        )
        .first()
    )

    if existing_incident:
        logger.info("Demo incident already exists, skipping")
        return

    # Get a service to attach to the incident
    service = (
        db.query(Service)
        .filter(Service.organization_id == org.id, Service.status == "degraded")
        .first()
    )

    if service:
        incident = Incident(
            organization_id=org.id,
            title="Sample Incident - Email Service Degradation",
            description="Our email service is experiencing intermittent delays. We are investigating the issue and working on a resolution.",
            status="investigating",
        )
        db.add(incident)
        db.flush()

        # Link incident to service
        service.incidents.append(incident)
        logger.info(f"Created demo incident: {incident.title}")


def setup_demo_data() -> bool:
    """Set up demo data in production. Returns True if successful."""

    if not settings.CREATE_DEMO_DATA:
        logger.info("Demo data creation is disabled (CREATE_DEMO_DATA=false)")
        return True

    logger.info("🎭 Setting up demo data for production...")

    try:
        db = SessionLocal()

        for org_data in DEMO_ORGS:
            # Create organization and demo user
            org = create_demo_organization(db, org_data)

            # Create services
            create_demo_services(db, org, org_data["services"])

            # Create a sample incident for the first org
            if org_data["slug"] == "demo-org":
                create_demo_incident(db, org)

        # Commit all changes
        db.commit()
        logger.info("✅ Demo data setup completed successfully!")

        # Log the created organizations for easy access
        orgs = db.query(Organization).all()
        logger.info("📊 Available demo organizations:")
        for org in orgs:
            logger.info(
                f"  - {org.name}: https://status-page-frontend.onrender.com/status/{org.slug}"
            )

        return True

    except Exception as e:
        logger.error(f"❌ Demo data setup failed: {e}")
        db.rollback()
        return False
    finally:
        db.close()


def check_demo_data_exists() -> bool:
    """Check if demo data already exists."""
    try:
        db = SessionLocal()
        demo_org = (
            db.query(Organization).filter(Organization.slug == "demo-org").first()
        )
        return demo_org is not None
    except Exception as e:
        logger.error(f"Error checking demo data: {e}")
        return False
    finally:
        db.close()


if __name__ == "__main__":
    # For manual execution
    setup_demo_data()
