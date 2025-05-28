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
        from app.db.init_db import init_database

        init_database()
    except Exception as e:
        logger.error(f"❌ Failed to initialize database: {e}")
        if settings.ENVIRONMENT == "production":
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

logger.info(f"🌐 CORS allowed origins: {allowed_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
        "database_url_configured": bool(
            settings.DATABASE_URL or settings.db_host != "localhost"
        ),
    }


# Export the socket app as the main app for uvicorn
app = socket_app
