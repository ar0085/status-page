import type {
  Service,
  Incident,
  Maintenance,
  Organization,
  ServiceCreateRequest,
  ServiceUpdateRequest,
  IncidentCreateRequest,
  IncidentUpdateRequest,
  IncidentUpdateCreateRequest,
  MaintenanceCreateRequest,
  MaintenanceUpdateRequest,
  OrganizationCreateRequest,
  UserCheckResponse,
  StatusPageResponse,
  PublicService,
  PublicIncident,
  PublicMaintenance,
  IncidentUpdate,
  TeamMember,
  TeamMemberList,
  TeamMemberInvite,
  TeamMemberUpdate,
} from "../types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

/**
 * Generic API client for making HTTP requests
 */
class ApiClient {
  private baseUrl: string;
  private token?: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setToken(token: string) {
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers = {
      "Content-Type": "application/json",
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
      ...options.headers,
    };

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `API Error: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    // Handle 204 No Content responses (like DELETE operations)
    if (response.status === 204) {
      return undefined as T;
    }

    // Check if response has content before parsing JSON
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return response.json();
    }

    // For non-JSON responses, return empty object
    return {} as T;
  }

  // Organizations
  async checkUser(
    clerkUserId: string,
    email?: string
  ): Promise<UserCheckResponse> {
    const params = email ? `?email=${encodeURIComponent(email)}` : "";
    return this.request<UserCheckResponse>(
      `/api/organizations/check-user/${clerkUserId}${params}`
    );
  }

  async createOrganization(
    data: OrganizationCreateRequest,
    clerkUserId: string,
    email: string
  ): Promise<Organization> {
    const params = new URLSearchParams({
      clerk_user_id: clerkUserId,
      email: email,
    });

    return this.request<Organization>(`/api/organizations?${params}`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getCurrentOrganization(): Promise<Organization> {
    return this.request<Organization>("/api/organizations/current");
  }

  // Services
  async getServices(): Promise<Service[]> {
    return this.request<Service[]>("/api/services");
  }

  async createService(data: ServiceCreateRequest): Promise<Service> {
    return this.request<Service>("/api/services", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateService(
    id: number,
    data: ServiceUpdateRequest
  ): Promise<Service> {
    return this.request<Service>(`/api/services/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteService(id: number): Promise<void> {
    return this.request<void>(`/api/services/${id}`, {
      method: "DELETE",
    });
  }

  // Incidents
  async getIncidents(): Promise<Incident[]> {
    return this.request<Incident[]>("/api/incidents");
  }

  async createIncident(data: IncidentCreateRequest): Promise<Incident> {
    return this.request<Incident>("/api/incidents", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateIncident(
    id: number,
    data: IncidentUpdateRequest
  ): Promise<Incident> {
    return this.request<Incident>(`/api/incidents/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteIncident(id: number): Promise<void> {
    return this.request<void>(`/api/incidents/${id}`, {
      method: "DELETE",
    });
  }

  async createIncidentUpdate(
    incidentId: number,
    data: IncidentUpdateCreateRequest
  ): Promise<IncidentUpdate> {
    return this.request<IncidentUpdate>(
      `/api/incidents/${incidentId}/updates`,
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
  }

  // Maintenance
  async getMaintenances(): Promise<Maintenance[]> {
    return this.request<Maintenance[]>("/api/maintenance");
  }

  async createMaintenance(
    data: MaintenanceCreateRequest
  ): Promise<Maintenance> {
    return this.request<Maintenance>("/api/maintenance", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateMaintenance(
    id: number,
    data: MaintenanceUpdateRequest
  ): Promise<Maintenance> {
    return this.request<Maintenance>(`/api/maintenance/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteMaintenance(id: number): Promise<void> {
    return this.request<void>(`/api/maintenance/${id}`, {
      method: "DELETE",
    });
  }

  // Team management
  async getTeamMembers(): Promise<TeamMemberList> {
    return this.request<TeamMemberList>("/api/team/members");
  }

  async inviteTeamMember(data: TeamMemberInvite): Promise<TeamMember> {
    return this.request<TeamMember>("/api/team/invite", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateTeamMember(
    memberId: number,
    data: TeamMemberUpdate
  ): Promise<TeamMember> {
    return this.request<TeamMember>(`/api/team/members/${memberId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async removeTeamMember(memberId: number): Promise<void> {
    return this.request<void>(`/api/team/members/${memberId}`, {
      method: "DELETE",
    });
  }

  async getMyProfile(): Promise<TeamMember> {
    return this.request<TeamMember>("/api/team/members/me");
  }

  async leaveOrganization(): Promise<void> {
    return this.request<void>("/api/team/leave", {
      method: "POST",
    });
  }

  // Public endpoints (no auth required)
  async getPublicStatusPage(orgSlug: string): Promise<StatusPageResponse> {
    return this.request<StatusPageResponse>(`/api/status/${orgSlug}`);
  }

  async getPublicServices(orgSlug: string): Promise<PublicService[]> {
    return this.request<PublicService[]>(`/api/status/${orgSlug}/services`);
  }

  async getPublicIncidents(
    orgSlug: string,
    activeOnly = true
  ): Promise<PublicIncident[]> {
    const params = activeOnly ? "?active_only=true" : "";
    return this.request<PublicIncident[]>(
      `/api/status/${orgSlug}/incidents${params}`
    );
  }

  async getPublicTimeline(
    orgSlug: string,
    limit = 10
  ): Promise<PublicIncident[]> {
    return this.request<PublicIncident[]>(
      `/api/status/${orgSlug}/timeline?limit=${limit}`
    );
  }

  async getPublicMaintenances(
    orgSlug: string,
    activeOnly = true
  ): Promise<PublicMaintenance[]> {
    const params = activeOnly ? "?active_only=true" : "";
    return this.request<PublicMaintenance[]>(
      `/api/status/${orgSlug}/maintenance${params}`
    );
  }
}

export const api = new ApiClient(API_URL);
