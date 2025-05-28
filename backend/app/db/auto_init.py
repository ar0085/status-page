"""Automatic database initialization and schema management."""

import logging
from sqlalchemy import text, inspect
from sqlalchemy.exc import OperationalError, ProgrammingError

from app.models.base import Base
from app.db.session import engine
from app.core.config import settings

logger = logging.getLogger(__name__)


def check_table_exists(table_name: str) -> bool:
    """Check if a specific table exists in the database."""
    try:
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        return table_name in tables
    except Exception as e:
        logger.error(f"Error checking table existence: {e}")
        return False


def get_existing_tables() -> list:
    """Get list of existing tables in the database."""
    try:
        inspector = inspect(engine)
        return inspector.get_table_names()
    except Exception as e:
        logger.error(f"Error getting table list: {e}")
        return []


def ensure_models_loaded():
    """Ensure all models are imported and registered with SQLAlchemy."""
    try:
        # Import all models to register them with SQLAlchemy metadata
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

        logger.info("✅ All models loaded successfully")
        return True
    except ImportError as e:
        logger.error(f"❌ Failed to load models: {e}")
        return False


def create_tables_if_missing():
    """Create database tables if they don't exist."""
    try:
        logger.info("🔍 Checking database tables...")

        # Ensure models are loaded
        if not ensure_models_loaded():
            return False

        # Check if critical tables exist
        critical_tables = ["organizations", "users", "services"]
        existing_tables = get_existing_tables()

        missing_tables = [
            table for table in critical_tables if table not in existing_tables
        ]

        if missing_tables:
            logger.info(f"🔨 Missing tables detected: {missing_tables}")
            logger.info("🚀 Creating database tables...")

            # Create all tables
            Base.metadata.create_all(bind=engine)

            # Verify creation
            new_tables = get_existing_tables()
            logger.info(f"✅ Database tables created: {new_tables}")
            return True
        else:
            logger.info(f"✅ All required tables exist: {existing_tables}")
            return True

    except Exception as e:
        logger.error(f"❌ Failed to create tables: {e}")
        return False


def test_database_connection():
    """Test basic database connectivity."""
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            logger.info("✅ Database connection successful")
            return True
    except Exception as e:
        logger.error(f"❌ Database connection failed: {e}")
        return False


def auto_initialize_database():
    """Automatically initialize database with proper error handling."""
    logger.info("🗄️ Starting automatic database initialization...")

    try:
        # Step 1: Test database connection
        if not test_database_connection():
            logger.error("❌ Database connection failed - skipping initialization")
            return False

        # Step 2: Create tables if missing
        if not create_tables_if_missing():
            logger.error("❌ Table creation failed")
            return False

        logger.info("✅ Automatic database initialization completed successfully")
        return True

    except Exception as e:
        logger.error(f"❌ Database initialization failed: {e}")
        # In production, we want the app to start even if DB init fails
        # The user can then fix it through the API or manual intervention
        if settings.ENVIRONMENT == "production":
            logger.warning("⚠️ Continuing startup despite database issues...")
            return False
        else:
            raise
