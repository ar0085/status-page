from sqlalchemy import (
    Column,
    Integer,
    String,
    ForeignKey,
    DateTime,
    Text,
    Enum,
    Boolean,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.models.base import Base
import enum
import secrets


class UserRole(enum.Enum):
    ADMIN = "admin"
    MEMBER = "member"


class ServiceStatus(enum.Enum):
    OPERATIONAL = "operational"
    DEGRADED = "degraded"
    PARTIAL_OUTAGE = "partial_outage"
    MAJOR_OUTAGE = "major_outage"


class IncidentStatus(enum.Enum):
    OPEN = "open"
    RESOLVED = "resolved"


class MaintenanceStatus(enum.Enum):
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class Organization(Base):
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    slug = Column(String, unique=True, index=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    users = relationship("User", back_populates="organization")
    invitations = relationship("Invitation", back_populates="organization")
    services = relationship("Service", back_populates="organization")
    incidents = relationship("Incident", back_populates="organization")
    maintenances = relationship("Maintenance", back_populates="organization")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    clerk_user_id = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    tenant_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.MEMBER)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    organization = relationship("Organization", back_populates="users")


class Invitation(Base):
    __tablename__ = "invitations"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    email = Column(String, nullable=False, index=True)
    role = Column(Enum(UserRole), default=UserRole.MEMBER)
    token = Column(String, unique=True, nullable=False, index=True)
    is_accepted = Column(Boolean, default=False)
    invited_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=False)

    # Relationships
    organization = relationship("Organization", back_populates="invitations")
    invited_by = relationship("User", foreign_keys=[invited_by_user_id])

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.token:
            self.token = secrets.token_urlsafe(32)


class Service(Base):
    __tablename__ = "services"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text)
    status = Column(Enum(ServiceStatus), default=ServiceStatus.OPERATIONAL)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    organization = relationship("Organization", back_populates="services")
    incidents = relationship(
        "Incident", secondary="incident_services", back_populates="services"
    )
    maintenances = relationship(
        "Maintenance", secondary="maintenance_services", back_populates="services"
    )


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text)
    status = Column(Enum(IncidentStatus), default=IncidentStatus.OPEN)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    organization = relationship("Organization", back_populates="incidents")
    services = relationship(
        "Service", secondary="incident_services", back_populates="incidents"
    )
    updates = relationship(
        "IncidentUpdate", back_populates="incident", cascade="all, delete-orphan"
    )


# Association table for many-to-many relationship between incidents and services
from sqlalchemy import Table

incident_services = Table(
    "incident_services",
    Base.metadata,
    Column(
        "incident_id",
        Integer,
        ForeignKey("incidents.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "service_id",
        Integer,
        ForeignKey("services.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)


class IncidentUpdate(Base):
    __tablename__ = "incident_updates"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(
        Integer, ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False
    )
    text = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    incident = relationship("Incident", back_populates="updates")


# Association table for many-to-many relationship between maintenances and services
maintenance_services = Table(
    "maintenance_services",
    Base.metadata,
    Column(
        "maintenance_id",
        Integer,
        ForeignKey("maintenances.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "service_id",
        Integer,
        ForeignKey("services.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)


class Maintenance(Base):
    __tablename__ = "maintenances"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text)
    status = Column(Enum(MaintenanceStatus), default=MaintenanceStatus.SCHEDULED)
    scheduled_start = Column(DateTime(timezone=True), nullable=False)
    scheduled_end = Column(DateTime(timezone=True), nullable=False)
    actual_start = Column(DateTime(timezone=True), nullable=True)
    actual_end = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    organization = relationship("Organization", back_populates="maintenances")
    services = relationship(
        "Service", secondary="maintenance_services", back_populates="maintenances"
    )
