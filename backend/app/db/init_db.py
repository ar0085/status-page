"""Database initialization module for handling migrations and table creation."""

import os
import subprocess
import logging
from pathlib import Path

from sqlalchemy.exc import OperationalError
from app.models.base import Base
from app.db.session import engine
from app.core.config import settings

logger = logging.getLogger(__name__)


def run_migrations():
    """Run Alembic migrations if available."""
    try:
        # Check if we're in the backend directory
        backend_dir = Path(__file__).parent.parent.parent
        alembic_ini = backend_dir / "alembic.ini"

        if alembic_ini.exists():
            logger.info("Running database migrations...")

            # Change to backend directory for alembic
            original_cwd = os.getcwd()
            os.chdir(backend_dir)

            try:
                result = subprocess.run(
                    ["alembic", "upgrade", "head"],
                    capture_output=True,
                    text=True,
                    check=True,
                )
                logger.info("✅ Database migrations completed successfully")
                logger.debug(result.stdout)
            except subprocess.CalledProcessError as e:
                logger.error(f"❌ Migration failed: {e.stderr}")
                raise
            finally:
                os.chdir(original_cwd)
        else:
            logger.info("No alembic.ini found, skipping migrations")

    except Exception as e:
        logger.error(f"Error during migration: {e}")
        if settings.ENVIRONMENT == "production":
            raise


def create_tables():
    """Create database tables using SQLAlchemy."""
    try:
        logger.info("Creating database tables...")
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

    try:
        # First try to run migrations
        run_migrations()
    except Exception as e:
        logger.warning(f"Migration failed, falling back to table creation: {e}")
        # If migrations fail, try to create tables directly
        create_tables()

    logger.info("✅ Database initialization completed")
