"""Database initialization module for handling migrations and table creation."""

import os
import subprocess
import logging
from pathlib import Path
import sys

from sqlalchemy.exc import OperationalError
from app.models.base import Base
from app.db.session import engine
from app.core.config import settings

logger = logging.getLogger(__name__)


def run_migrations():
    """Run Alembic migrations if available."""
    try:
        # Find backend directory - handle different deployment scenarios
        current_dir = Path(__file__).parent.parent.parent
        backend_dir = current_dir

        # In Render, we might be in /opt/render/project/src/backend
        if not (backend_dir / "alembic.ini").exists():
            # Try one level up
            backend_dir = current_dir.parent
        if not (backend_dir / "alembic.ini").exists():
            # Try looking for backend subdirectory
            backend_dir = current_dir / "backend"
        if not (backend_dir / "alembic.ini").exists():
            # Try parent/backend
            backend_dir = current_dir.parent / "backend"

        alembic_ini = backend_dir / "alembic.ini"

        if alembic_ini.exists():
            logger.info(f"Running database migrations from {backend_dir}...")

            # Change to backend directory for alembic
            original_cwd = os.getcwd()
            os.chdir(backend_dir)

            try:
                # Add current directory to Python path for imports
                if str(backend_dir) not in sys.path:
                    sys.path.insert(0, str(backend_dir))

                result = subprocess.run(
                    ["alembic", "upgrade", "head"],
                    capture_output=True,
                    text=True,
                    check=True,
                )
                logger.info("✅ Database migrations completed successfully")
                logger.info(f"Migration output: {result.stdout}")
                if result.stderr:
                    logger.info(f"Migration stderr: {result.stderr}")
            except subprocess.CalledProcessError as e:
                logger.error(f"❌ Migration failed: {e.stderr}")
                logger.error(f"Migration stdout: {e.stdout}")
                raise
            finally:
                os.chdir(original_cwd)
        else:
            logger.warning(
                f"No alembic.ini found at {backend_dir}, skipping migrations"
            )
            # Fallback to table creation
            create_tables()

    except Exception as e:
        logger.error(f"Error during migration: {e}")
        if settings.ENVIRONMENT == "production":
            # In production, still try table creation as fallback
            logger.info("Attempting fallback table creation...")
            create_tables()
        else:
            raise


def ensure_models_imported():
    """Ensure all models are imported for SQLAlchemy metadata."""
    try:
        # Import all models to register them with SQLAlchemy
        from app.models.user import User
        from app.models.organization import Organization
        from app.models.service import Service
        from app.models.incident import Incident, IncidentUpdate
        from app.models.maintenance import Maintenance
        from app.models.invitation import Invitation

        logger.info("✅ All models imported successfully")
    except ImportError as e:
        logger.error(f"❌ Failed to import models: {e}")
        raise


def create_tables():
    """Create database tables using SQLAlchemy."""
    try:
        logger.info("Creating database tables...")

        # Ensure all models are imported first
        ensure_models_imported()

        Base.metadata.create_all(bind=engine)
        logger.info("✅ Database tables created successfully")
    except OperationalError as e:
        logger.error(f"❌ Database connection failed: {e}")
        if settings.ENVIRONMENT == "production":
            raise
    except Exception as e:
        logger.error(f"❌ Error creating database tables: {e}")
        if settings.ENVIRONMENT == "production":
            raise


def init_database():
    """Initialize database with migrations and table creation."""
    logger.info("🗄️ Initializing database...")

    # Always ensure models are imported first
    ensure_models_imported()

    try:
        # First try to run migrations
        run_migrations()
    except Exception as e:
        logger.warning(f"Migration failed, falling back to table creation: {e}")
        # If migrations fail, try to create tables directly
        create_tables()

    logger.info("✅ Database initialization completed")
