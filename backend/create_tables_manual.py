#!/usr/bin/env python3
"""Manual script to create database tables directly."""

import os
import sys
import logging
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def main():
    """Create database tables manually."""
    try:
        logger.info("🚀 Starting manual table creation...")

        # Import after path setup
        from app.core.config import settings
        from app.db.session import engine
        from app.models.base import Base

        # Import all models to register them
        from app.models.organization import (
            User,
            Organization,
            Service,
            Incident,
            IncidentUpdate,
            Maintenance,
            Invitation,
            incident_services,
            maintenance_services,
        )

        logger.info(f"📍 Environment: {settings.ENVIRONMENT}")
        logger.info(f"🗄️ Database URL configured: {bool(settings.DATABASE_URL)}")

        # Create all tables
        logger.info("🔨 Creating database tables...")
        Base.metadata.create_all(bind=engine)

        logger.info("✅ Manual table creation completed successfully!")

        # Test database connection
        from sqlalchemy import text

        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            logger.info("✅ Database connection test successful!")

        # Check if tables exist
        with engine.connect() as conn:
            result = conn.execute(
                text(
                    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
                )
            )
            tables = [row[0] for row in result]
            logger.info(f"📋 Created tables: {tables}")

    except Exception as e:
        logger.error(f"❌ Manual table creation failed: {e}")
        import traceback

        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
