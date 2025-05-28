// User role types
export enum UserRole {
  ADMIN = "admin",
  MEMBER = "member",
}

// Service status types
export enum ServiceStatus {
  OPERATIONAL = "operational",
  DEGRADED = "degraded",
  PARTIAL_OUTAGE = "partial_outage",
  MAJOR_OUTAGE = "major_outage",
}

// Incident status types
export enum IncidentStatus {
  OPEN = "open",
  RESOLVED = "resolved",
}

// Maintenance status types
export enum MaintenanceStatus {
  SCHEDULED = "scheduled",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
}

// Organization interface
export interface Organization {
  id: number;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

// User interface
export interface User {
  id: number;
  clerk_user_id: string;
  email: string;
  tenant_id: number;
  role: UserRole;
  created_at: string;
}

// Service interface
export interface Service {
  id: number;
  tenant_id: number;
  name: string;
  description?: string;
  status: ServiceStatus;
  created_at: string;
  updated_at: string;
}

// Incident interface
export interface Incident {
  id: number;
  tenant_id: number;
  title: string;
  description?: string;
  status: IncidentStatus;
  created_at: string;
  updated_at: string;
  services: Service[];
  updates?: IncidentUpdate[];
}

// Incident update interface
export interface IncidentUpdate {
  id: number;
  incident_id: number;
  text: string;
  created_at: string;
}

// Maintenance interface
export interface Maintenance {
  id: number;
  tenant_id: number;
  title: string;
  description?: string;
  status: MaintenanceStatus;
  scheduled_start: string;
  scheduled_end: string;
  actual_start?: string;
  actual_end?: string;
  created_at: string;
  updated_at: string;
  services: Service[];
}

// API request types
export interface ServiceCreateRequest {
  name: string;
  description?: string;
}

export interface ServiceUpdateRequest {
  name?: string;
  description?: string;
  status?: ServiceStatus;
}

export interface IncidentCreateRequest {
  title: string;
  description?: string;
  service_ids: number[];
}

export interface IncidentUpdateRequest {
  title?: string;
  description?: string;
  status?: IncidentStatus;
  service_ids?: number[];
}

export interface IncidentUpdateCreateRequest {
  text: string;
}

export interface MaintenanceCreateRequest {
  title: string;
  description?: string;
  scheduled_start: string;
  scheduled_end: string;
  service_ids: number[];
}

export interface MaintenanceUpdateRequest {
  title?: string;
  description?: string;
  status?: MaintenanceStatus;
  scheduled_start?: string;
  scheduled_end?: string;
  actual_start?: string;
  actual_end?: string;
  service_ids?: number[];
}

export interface OrganizationCreateRequest {
  name: string;
  slug: string;
}

// Public status page types
export interface PublicService {
  id: number;
  name: string;
  description?: string;
  status: ServiceStatus;
}

export interface PublicIncident {
  id: number;
  title: string;
  description?: string;
  status: IncidentStatus;
  created_at: string;
  updated_at: string;
  services: PublicService[];
  updates: IncidentUpdate[];
}

export interface PublicMaintenance {
  id: number;
  title: string;
  description?: string;
  status: MaintenanceStatus;
  scheduled_start: string;
  scheduled_end: string;
  actual_start?: string;
  actual_end?: string;
  created_at: string;
  updated_at: string;
  services: PublicService[];
}

export interface StatusPageResponse {
  organization: Organization;
  services: PublicService[];
  active_incidents: PublicIncident[];
  active_maintenances: PublicMaintenance[];
}

// WebSocket message types
export interface WebSocketMessage {
  type: string;
  data: Record<string, unknown>;
  tenant_id: number;
}

// Auth check response
export interface UserCheckResponse {
  user_exists: boolean;
  has_organization: boolean;
  organization?: Organization;
}

// Team management types
export interface TeamMember {
  id: number;
  email: string;
  role: UserRole;
  clerk_user_id: string;
  created_at: string;
  is_pending: boolean;
}

export interface TeamMemberList {
  members: TeamMember[];
  total_count: number;
}

export interface TeamMemberInvite {
  email: string;
  role: UserRole;
}

export interface TeamMemberUpdate {
  role: UserRole;
}
