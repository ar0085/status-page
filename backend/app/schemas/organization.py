from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from app.models.organization import (
    UserRole,
    ServiceStatus,
    IncidentStatus,
    MaintenanceStatus,
)


# Organization schemas
class OrganizationBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    slug: str = Field(..., min_length=1, max_length=50, pattern="^[a-z0-9-]+$")


class OrganizationCreate(OrganizationBase):
    pass


class OrganizationUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    slug: Optional[str] = Field(
        None, min_length=1, max_length=50, pattern="^[a-z0-9-]+$"
    )


class Organization(OrganizationBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# User schemas
class UserBase(BaseModel):
    email: str = Field(..., max_length=255)
    role: UserRole = UserRole.MEMBER


class UserCreate(UserBase):
    clerk_user_id: str = Field(..., max_length=255)
    tenant_id: int


class UserUpdate(BaseModel):
    email: Optional[str] = Field(None, max_length=255)
    role: Optional[UserRole] = None


class User(UserBase):
    id: int
    clerk_user_id: str
    tenant_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# Team management schemas
class TeamMemberInvite(BaseModel):
    email: str = Field(..., max_length=255)
    role: UserRole = UserRole.MEMBER


class TeamMemberUpdate(BaseModel):
    role: UserRole


class TeamMember(BaseModel):
    id: int
    email: str
    role: UserRole
    clerk_user_id: str
    created_at: datetime
    is_pending: bool = False  # True if invited but not yet joined

    class Config:
        from_attributes = True


class TeamMemberList(BaseModel):
    members: List[TeamMember]
    total_count: int


# Invitation schemas
class InvitationResponse(BaseModel):
    id: int
    email: str
    role: UserRole
    token: str
    is_accepted: bool
    created_at: datetime
    expires_at: datetime
    organization_name: str

    class Config:
        from_attributes = True


class InvitationAccept(BaseModel):
    token: str


# Service schemas
class ServiceBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None


class ServiceCreate(ServiceBase):
    pass


class ServiceUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    status: Optional[ServiceStatus] = None


class Service(ServiceBase):
    id: int
    tenant_id: int
    status: ServiceStatus
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Incident schemas
class IncidentBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None


class IncidentCreate(IncidentBase):
    service_ids: List[int] = Field(..., min_items=1)


class IncidentUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    status: Optional[IncidentStatus] = None
    service_ids: Optional[List[int]] = None


class Incident(IncidentBase):
    id: int
    tenant_id: int
    status: IncidentStatus
    created_at: datetime
    updated_at: datetime
    services: List[Service] = []
    updates: List["IncidentUpdateResponse"] = []

    class Config:
        from_attributes = True


# Incident Update schemas
class IncidentUpdateBase(BaseModel):
    text: str = Field(..., min_length=1)


class IncidentUpdateCreate(IncidentUpdateBase):
    pass


class IncidentUpdateResponse(IncidentUpdateBase):
    id: int
    incident_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# Maintenance schemas
class MaintenanceBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    scheduled_start: datetime
    scheduled_end: datetime


class MaintenanceCreate(MaintenanceBase):
    service_ids: List[int] = Field(..., min_items=1)


class MaintenanceUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    status: Optional[MaintenanceStatus] = None
    scheduled_start: Optional[datetime] = None
    scheduled_end: Optional[datetime] = None
    actual_start: Optional[datetime] = None
    actual_end: Optional[datetime] = None
    service_ids: Optional[List[int]] = None


class Maintenance(MaintenanceBase):
    id: int
    tenant_id: int
    status: MaintenanceStatus
    actual_start: Optional[datetime] = None
    actual_end: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    services: List[Service] = []

    class Config:
        from_attributes = True


# Response schemas for public status page
class PublicService(BaseModel):
    id: int
    name: str
    description: Optional[str]
    status: ServiceStatus

    class Config:
        from_attributes = True


class PublicIncident(BaseModel):
    id: int
    title: str
    description: Optional[str]
    status: IncidentStatus
    created_at: datetime
    updated_at: datetime
    services: List[PublicService] = []
    updates: List[IncidentUpdateResponse] = []

    class Config:
        from_attributes = True


class PublicMaintenance(BaseModel):
    id: int
    title: str
    description: Optional[str]
    status: MaintenanceStatus
    scheduled_start: datetime
    scheduled_end: datetime
    actual_start: Optional[datetime] = None
    actual_end: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    services: List[PublicService] = []

    class Config:
        from_attributes = True


class StatusPageResponse(BaseModel):
    organization: Organization
    services: List[PublicService]
    active_incidents: List[PublicIncident]
    active_maintenances: List[PublicMaintenance] = []


# WebSocket message schemas
class WebSocketMessage(BaseModel):
    type: str  # "service_update", "incident_update", "incident_created"
    data: dict
    tenant_id: int
