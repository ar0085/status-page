from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import socketio
import os

from app.routes import services, incidents, organizations, public, maintenance, team
from app.websocket import sio
from app.models.base import Base
from app.db.session import engine

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Status Page API",
    description="Multi-tenant status page application API",
    version="1.0.0",
)

# Configure CORS for both development and production
allowed_origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
]

# Add production frontend URL if available
frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    allowed_origins.append(frontend_url)

# Add custom origins from environment
custom_origins = os.getenv("ALLOWED_ORIGINS", "")
if custom_origins:
    allowed_origins.extend(custom_origins.split(","))

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
    return {"status": "healthy"}


# Export the socket app as the main app for uvicorn
app = socket_app
