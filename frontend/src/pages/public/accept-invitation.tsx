import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { routes } from "../../lib/routes";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

interface InvitationDetails {
  email: string;
  role: string;
  organization_name: string;
  expires_at: string;
}

const AcceptInvitation: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isSignedIn, user, isLoaded } = useUser();

  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);

  const token = searchParams.get("token");

  useEffect(() => {
    const fetchInvitationDetails = async () => {
      if (!token) {
        setError("No invitation token provided");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/team/invitation/${token}`);

        if (!response.ok) {
          if (response.status === 404) {
            setError("This invitation is not valid or has expired");
          } else {
            setError("Failed to load invitation details");
          }
          setLoading(false);
          return;
        }

        const data = await response.json();
        setInvitation(data);
      } catch {
        setError("Failed to load invitation details");
      } finally {
        setLoading(false);
      }
    };

    fetchInvitationDetails();
  }, [token]);

  useEffect(() => {
    const handleAcceptInvitation = async () => {
      if (
        !isLoaded ||
        !isSignedIn ||
        !user ||
        !token ||
        accepting ||
        !invitation
      ) {
        return;
      }

      // Check if email matches
      const userEmail = user.primaryEmailAddress?.emailAddress;
      if (userEmail !== invitation.email) {
        setError(
          `This invitation is for ${invitation.email}. Please sign in with that email address.`
        );
        return;
      }

      setAccepting(true);

      try {
        const response = await fetch(`${API_URL}/api/team/accept-invitation`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token: token,
            clerk_user_id: user.id,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          setError(errorData.detail || "Failed to accept invitation");
          setAccepting(false);
          return;
        }

        // Success! Redirect to home page
        navigate(routes.public.home, { replace: true });
      } catch {
        setError("Failed to accept invitation");
        setAccepting(false);
      }
    };

    handleAcceptInvitation();
  }, [isLoaded, isSignedIn, user, token, accepting, invitation, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invitation details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Invitation Error
            </h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => navigate(routes.public.home)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!invitation) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
            <svg
              className="h-6 w-6 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
              />
            </svg>
          </div>

          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Team Invitation
          </h1>

          <div className="text-sm text-gray-600 mb-6">
            <p className="mb-2">You've been invited to join:</p>
            <p className="font-semibold text-gray-900 text-lg">
              {invitation.organization_name}
            </p>
            <p className="mt-2">
              Role:{" "}
              <span className="font-medium capitalize">{invitation.role}</span>
            </p>
            <p className="mt-1">
              Email: <span className="font-medium">{invitation.email}</span>
            </p>
          </div>

          {!isLoaded ? (
            <div className="text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Loading...</p>
            </div>
          ) : !isSignedIn ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 mb-4">
                Please sign in with the email address {invitation.email} to
                accept this invitation.
              </p>
              <button
                onClick={() => navigate(routes.public.signIn)}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Sign In
              </button>
              <button
                onClick={() => navigate(routes.public.signUp)}
                className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200"
              >
                Create Account
              </button>
            </div>
          ) : accepting ? (
            <div className="text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Accepting invitation...</p>
            </div>
          ) : (
            <div className="text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Processing invitation...</p>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Expires: {new Date(invitation.expires_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AcceptInvitation;
