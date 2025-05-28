import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { useOrganization } from "../../hooks/useOrganization";
import { useEffect } from "react";

interface CreateOrgGuardProps {
  children: React.ReactNode;
}

export function CreateOrgGuard({ children }: CreateOrgGuardProps) {
  const { isSignedIn } = useUser();
  const navigate = useNavigate();
  const { hasOrganization, isLoading } = useOrganization();

  useEffect(() => {
    if (!isSignedIn) {
      // Not signed in, redirect to sign in
      navigate("/sign-in");
      return;
    }

    if (!isLoading && hasOrganization) {
      // User already has an organization, redirect to services
      navigate("/dashboard/services");
      return;
    }
  }, [isSignedIn, hasOrganization, isLoading, navigate]);

  // If not signed in, redirect to sign in
  if (!isSignedIn) {
    return null;
  }

  // Show loading while checking organization
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If user already has an organization, they will be redirected
  if (hasOrganization) {
    return null;
  }

  return <>{children}</>;
}
