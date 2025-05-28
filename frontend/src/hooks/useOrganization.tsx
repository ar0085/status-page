import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { useUser } from "@clerk/clerk-react";
import { useAuth } from "./useAuth";
import { api } from "../lib/api";
import type { Organization, UserCheckResponse } from "../types";

interface OrganizationContextType {
  organization: Organization | null;
  isLoading: boolean;
  hasOrganization: boolean;
  refreshOrganization: () => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(
  undefined
);

interface OrganizationProviderProps {
  children: ReactNode;
}

export function OrganizationProvider({ children }: OrganizationProviderProps) {
  const { isSignedIn, user } = useUser();
  useAuth(); // This ensures the API token is set when user is authenticated
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasOrganization, setHasOrganization] = useState(false);

  const refreshOrganization = async () => {
    if (!isSignedIn || !user) {
      setOrganization(null);
      setHasOrganization(false);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Check if user has an organization (pass email for invitation checking)
      const email = user.primaryEmailAddress?.emailAddress;
      const response: UserCheckResponse = await api.checkUser(user.id, email);

      if (response.has_organization && response.organization) {
        setOrganization(response.organization);
        setHasOrganization(true);
      } else {
        setOrganization(null);
        setHasOrganization(false);
      }
    } catch (error) {
      console.error("Error fetching organization:", error);
      setOrganization(null);
      setHasOrganization(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshOrganization();
  }, [isSignedIn, user]);

  return (
    <OrganizationContext.Provider
      value={{
        organization,
        isLoading,
        hasOrganization,
        refreshOrganization,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error(
      "useOrganization must be used within an OrganizationProvider"
    );
  }
  return context;
}
