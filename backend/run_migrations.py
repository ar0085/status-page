#!/usr/bin/env python3
"""Standalone script to run database migrations on Render."""

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
    """Run database migrations."""
    try:
        # Import after path setup
        from app.db.init_db import init_database
        from app.core.config import settings

        logger.info(f"🚀 Running migrations in {settings.ENVIRONMENT} mode")
        logger.info(f"📍 Current directory: {os.getcwd()}")
        logger.info(f"🗄️ Database URL configured: {bool(settings.DATABASE_URL)}")

        # Initialize database
        init_database()

        logger.info("✅ Migration script completed successfully!")

    except Exception as e:
        logger.error(f"❌ Migration script failed: {e}")
        import traceback

        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
