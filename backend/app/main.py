from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import socketio
import os
import logging

from app.routes import services, incidents, organizations, public, maintenance, team
from app.websocket import sio
from app.core.config import settings

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper()),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Status Page API",
    description="Multi-tenant status page application API",
    version="1.0.0",
)


@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    logger.info(f"🚀 Starting Status Page API in {settings.ENVIRONMENT} mode")

    try:
        # Use the new automatic database initialization
        from app.db.auto_init import auto_initialize_database

        success = auto_initialize_database()
        if success:
            logger.info("✅ Database initialization successful")
        else:
            logger.warning("⚠️ Database initialization had issues - check logs above")

        # Set up demo data in production (one-time only)
        if settings.ENVIRONMENT == "production" and settings.CREATE_DEMO_DATA:
            from app.services.demo_setup import setup_demo_data, check_demo_data_exists

            if not check_demo_data_exists():
                logger.info("🎭 Creating demo data for production...")
                demo_success = setup_demo_data()
                if demo_success:
                    logger.info("✅ Demo data created successfully!")
                else:
                    logger.warning("⚠️ Demo data creation had issues")
            else:
                logger.info("📊 Demo data already exists, skipping creation")

    except Exception as e:
        logger.error(f"❌ Startup database initialization failed: {e}")
        # Don't crash the app in production - let it start and handle DB issues gracefully
        if settings.ENVIRONMENT != "production":
            raise


# Configure CORS for both development and production
allowed_origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
]

# Add production frontend URL if available
if settings.FRONTEND_URL:
    allowed_origins.append(settings.FRONTEND_URL)

# Add custom origins from environment
if settings.ALLOWED_ORIGINS:
    allowed_origins.extend(settings.ALLOWED_ORIGINS.split(","))

# For production, be more permissive with HTTPS origins
if settings.ENVIRONMENT == "production":
    # Allow all HTTPS origins (more secure than wildcards)
    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=r"https://.*\.onrender\.com",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    logger.info("🌐 CORS configured for production with HTTPS Render domains")
else:
    # Development - use specific origins
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    logger.info(f"🌐 CORS allowed origins: {allowed_origins}")

# Include API routes
app.include_router(services.router, prefix="/api")
app.include_router(incidents.router, prefix="/api")
app.include_router(maintenance.router, prefix="/api")
app.include_router(organizations.router, prefix="/api")
app.include_router(team.router, prefix="/api")
app.include_router(public.router, prefix="/api")

# Mount Socket.IO
socket_app = socketio.ASGIApp(sio, app)


@app.get("/")
async def root():
    return {"message": "Status Page API is running"}


@app.get("/health")
async def health_check():
    from app.db.auto_init import get_existing_tables, check_table_exists

    # Check database table status
    tables = get_existing_tables()
    critical_tables = ["organizations", "users", "services"]
    tables_exist = all(check_table_exists(table) for table in critical_tables)

    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
        "database_url_configured": bool(
            settings.DATABASE_URL or settings.db_host != "localhost"
        ),
        "database_tables": {
            "existing_tables": tables,
            "critical_tables_exist": tables_exist,
            "table_count": len(tables),
        },
    }


@app.post("/admin/init-database")
async def manual_database_init():
    """Manual endpoint to trigger database initialization if needed."""
    try:
        from app.db.auto_init import auto_initialize_database

        logger.info("🔧 Manual database initialization triggered")
        success = auto_initialize_database()

        if success:
            return {"status": "success", "message": "Database initialized successfully"}
        else:
            return {
                "status": "partial",
                "message": "Database initialization had issues - check logs",
            }

    except Exception as e:
        logger.error(f"Manual database init failed: {e}")
        return {
            "status": "error",
            "message": f"Database initialization failed: {str(e)}",
        }


@app.get("/admin/debug/organizations")
async def debug_organizations():
    """Debug endpoint to list all organizations and their slugs."""
    try:
        from app.db.session import SessionLocal
        from app.models.organization import Organization

        db = SessionLocal()
        try:
            orgs = db.query(Organization).all()
            return {
                "total_organizations": len(orgs),
                "organizations": [
                    {
                        "id": org.id,
                        "name": org.name,
                        "slug": org.slug,
                        "created_at": (
                            org.created_at.isoformat() if org.created_at else None
                        ),
                    }
                    for org in orgs
                ],
            }
        finally:
            db.close()
    except Exception as e:
        return {"error": f"Failed to fetch organizations: {str(e)}"}


@app.post("/admin/setup-demo-data")
async def setup_demo_data_endpoint():
    """Manual endpoint to create demo data."""
    try:
        from app.services.demo_setup import setup_demo_data, check_demo_data_exists

        if check_demo_data_exists():
            return {
                "status": "info",
                "message": "Demo data already exists",
                "demo_links": [
                    "https://status-page-frontend.onrender.com/status/demo-org",
                    "https://status-page-frontend.onrender.com/status/test-company",
                ],
            }

        logger.info("🎭 Manual demo data creation triggered")
        success = setup_demo_data()

        if success:
            return {
                "status": "success",
                "message": "Demo data created successfully",
                "demo_links": [
                    "https://status-page-frontend.onrender.com/status/demo-org",
                    "https://status-page-frontend.onrender.com/status/test-company",
                ],
            }
        else:
            return {
                "status": "error",
                "message": "Demo data creation failed - check logs",
            }

    except Exception as e:
        logger.error(f"Manual demo setup failed: {e}")
        return {"status": "error", "message": f"Demo data creation failed: {str(e)}"}


# Export the socket app as the main app for uvicorn
app = socket_app
