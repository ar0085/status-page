import { useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useOrganization } from "../../hooks/useOrganization";
import type { OrganizationCreateRequest } from "../../types";

const CreateOrganization = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const { refreshOrganization } = useOrganization();
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
  });

  const createOrganizationMutation = useMutation({
    mutationFn: (data: OrganizationCreateRequest) =>
      api.createOrganization(
        data,
        user!.id,
        user!.primaryEmailAddress!.emailAddress
      ),
    onSuccess: async () => {
      // Refresh organization data to update the context
      await refreshOrganization();
      navigate("/dashboard/services");
    },
    onError: (error) => {
      console.error("Failed to create organization:", error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createOrganizationMutation.mutate(formData);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    setFormData({ name, slug });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Create Your Organization
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Set up your status page to monitor your services
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                Organization Name
              </label>
              <div className="mt-1">
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleNameChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Acme Corp"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="slug"
                className="block text-sm font-medium text-gray-700"
              >
                URL Slug
              </label>
              <div className="mt-1">
                <div className="flex rounded-md shadow-sm">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                    status.yoursite.com/
                  </span>
                  <input
                    id="slug"
                    name="slug"
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData({ ...formData, slug: e.target.value })
                    }
                    className="flex-1 block w-full px-3 py-2 border border-gray-300 rounded-none rounded-r-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="acme-corp"
                    pattern="^[a-z0-9-]+$"
                    title="Only lowercase letters, numbers, and hyphens are allowed"
                  />
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  This will be your public status page URL. Only lowercase
                  letters, numbers, and hyphens are allowed.
                </p>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={createOrganizationMutation.isPending}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createOrganizationMutation.isPending
                  ? "Creating..."
                  : "Create Organization"}
              </button>
            </div>

            {createOrganizationMutation.error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">
                  Failed to create organization. Please try again.
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateOrganization;
