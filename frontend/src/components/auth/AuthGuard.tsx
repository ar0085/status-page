import { useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useOrganization } from "../../hooks/useOrganization";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isSignedIn } = useUser();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const { isLoading, hasOrganization } = useOrganization();

  useEffect(() => {
    const setTokenIfNeeded = async () => {
      if (isSignedIn && hasOrganization) {
        const token = await getToken();
        if (token) {
          // Token is already set in useAuth hook, but we can ensure it's set here too
          // This is mainly for consistency and ensuring API calls work
        }
      }
    };

    setTokenIfNeeded();
  }, [isSignedIn, hasOrganization, getToken]);

  // If not signed in, redirect to sign in
  if (!isSignedIn) {
    navigate("/sign-in");
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

  // If user doesn't have an organization, redirect to create one
  if (!hasOrganization) {
    navigate("/dashboard/create-organization");
    return null;
  }

  return <>{children}</>;
}
