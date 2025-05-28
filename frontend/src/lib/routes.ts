// Route configuration for the application
export const routes = {
  public: {
    home: "/",
    signIn: "/sign-in",
    signUp: "/sign-up",
    status: "/status/:orgSlug",
    statusPage: (orgSlug: string) => `/status/${orgSlug}`,
    acceptInvitation: "/accept-invitation",
  },
  dashboard: {
    root: "/dashboard",
    services: "/dashboard/services",
    incidents: "/dashboard/incidents",
    maintenance: "/dashboard/maintenance",
    team: "/dashboard/team",
    createOrganization: "/dashboard/create-organization",
  },
} as const;

export type Routes = typeof routes;
