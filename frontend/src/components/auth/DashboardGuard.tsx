import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { useOrganization } from "../../hooks/useOrganization";
import { useEffect } from "react";

interface DashboardGuardProps {
  children: React.ReactNode;
}

export function DashboardGuard({ children }: DashboardGuardProps) {
  const { isSignedIn } = useUser();
  const navigate = useNavigate();
  const { isLoading, hasOrganization } = useOrganization();

  useEffect(() => {
    if (!isSignedIn) {
      navigate("/sign-in", { replace: true });
      return;
    }

    if (!isLoading && !hasOrganization) {
      navigate("/dashboard/create-organization", { replace: true });
      return;
    }
  }, [isSignedIn, isLoading, hasOrganization, navigate]);

  // Show loading while checking
  if (!isSignedIn || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If user doesn't have organization, they will be redirected
  if (!hasOrganization) {
    return null;
  }

  return <>{children}</>;
}
