import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { useOrganization } from "../../hooks/useOrganization";

export default function HomePage() {
  const { isSignedIn } = useUser();
  const { hasOrganization, isLoading } = useOrganization();
  const navigate = useNavigate();

  useEffect(() => {
    // Only redirect if user doesn't have an organization
    if (isSignedIn && !isLoading && !hasOrganization) {
      navigate("/dashboard/create-organization", { replace: true });
    }
  }, [isSignedIn, hasOrganization, isLoading, navigate]);

  // Show loading while checking organization status
  if (isSignedIn && isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If user is signed in and has organization, show dashboard
  if (isSignedIn && hasOrganization) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4 text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mb-8 text-lg">
            Welcome back! Choose what you'd like to manage.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 justify-center">
            <Link
              to="/dashboard/services"
              className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 inline-block text-lg font-medium transition-colors min-w-[200px] text-center"
            >
              Services
            </Link>
            <Link
              to="/dashboard/incidents"
              className="bg-orange-600 text-white px-8 py-4 rounded-lg hover:bg-orange-700 inline-block text-lg font-medium transition-colors min-w-[200px] text-center"
            >
              Incidents
            </Link>
            <Link
              to="/dashboard/maintenance"
              className="bg-purple-600 text-white px-8 py-4 rounded-lg hover:bg-purple-700 inline-block text-lg font-medium transition-colors min-w-[200px] text-center"
            >
              Maintenance
            </Link>
            <Link
              to="/dashboard/team"
              className="bg-green-600 text-white px-8 py-4 rounded-lg hover:bg-green-700 inline-block text-lg font-medium transition-colors min-w-[200px] text-center"
            >
              Team
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Show the home page for unauthenticated users
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Status Page</h1>
        <p className="text-gray-600 mb-8">
          Multi-tenant status page application
        </p>
        <div className="space-x-4">
          <Link
            to="/sign-in"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Sign In
          </Link>
          <Link
            to="/sign-up"
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}
