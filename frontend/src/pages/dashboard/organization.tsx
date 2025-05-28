import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useOrganization } from "../../hooks/useOrganization";

export default function OrganizationSettings() {
  const { organization, refreshOrganization } = useOrganization();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: organization?.name || "",
    slug: organization?.slug || "",
  });

  // Fetch current user profile to check admin status
  const { data: currentUser } = useQuery({
    queryKey: ["my-profile"],
    queryFn: () => api.getMyProfile(),
  });

  // For now, we'll just show organization details since update isn't implemented
  // TODO: Add organization update API endpoint
  const updateOrganizationMutation = useMutation({
    mutationFn: async (_data: { name: string; slug: string }) => {
      // This would be api.updateOrganization(data) when implemented
      throw new Error("Organization update not yet implemented");
    },
    onSuccess: () => {
      refreshOrganization();
      setIsEditing(false);
    },
    onError: (error) => {
      console.error("Failed to update organization:", error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateOrganizationMutation.mutate(formData);
  };

  const handleCancel = () => {
    setFormData({
      name: organization?.name || "",
      slug: organization?.slug || "",
    });
    setIsEditing(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const isAdmin = currentUser?.role === "admin";

  if (!organization) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">No organization found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Organization Settings
          </h1>
          <p className="text-gray-600 mt-2">
            Manage your organization details and settings
          </p>
        </div>
        {isAdmin && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            disabled={true} // Disabled until API is implemented
            title="Organization editing coming soon"
          >
            Edit Organization
          </button>
        )}
      </div>

      {/* Organization Details */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Organization Details</h2>

        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Organization Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Organization Slug
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) =>
                  setFormData({ ...formData, slug: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                pattern="^[a-z0-9-]+$"
                title="Only lowercase letters, numbers, and hyphens allowed"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Used in your public status page URL: /status/{formData.slug}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={updateOrganizationMutation.isPending}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {updateOrganizationMutation.isPending
                  ? "Saving..."
                  : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Organization Name
              </label>
              <p className="text-lg text-gray-900">{organization.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Organization Slug
              </label>
              <p className="text-lg text-gray-900 font-mono">
                {organization.slug}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Public status page:{" "}
                <a
                  href={`/status/${organization.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800"
                >
                  /status/{organization.slug}
                </a>
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Created
              </label>
              <p className="text-lg text-gray-900">
                {formatDate(organization.created_at)}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Updated
              </label>
              <p className="text-lg text-gray-900">
                {formatDate(organization.updated_at)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
            Organization ID
          </h3>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {organization.id}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
            Status Page URL
          </h3>
          <p className="text-lg font-mono text-blue-600 mt-2 break-all">
            /status/{organization.slug}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
            Your Role
          </h3>
          <p className="text-2xl font-bold text-gray-900 mt-2 capitalize">
            {currentUser?.role || "Loading..."}
          </p>
        </div>
      </div>

      {/* Admin Notice */}
      {!isAdmin && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800">
            <strong>Note:</strong> Only administrators can modify organization
            settings. Contact an admin if you need to make changes.
          </p>
        </div>
      )}

      {/* Coming Soon Notice */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-2">Coming Soon</h3>
        <ul className="text-gray-700 space-y-1">
          <li>• Organization name and slug editing</li>
          <li>• Custom branding and themes</li>
          <li>• Integration settings</li>
          <li>• Usage analytics and reporting</li>
        </ul>
      </div>
    </div>
  );
}
