import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { api } from "../../lib/api";
import type { Service, ServiceCreateRequest, ServiceStatus } from "../../types";

const ServicesDashboard = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: services = [], isLoading } = useQuery<Service[]>({
    queryKey: ["services"],
    queryFn: () => api.getServices(),
  });

  const createServiceMutation = useMutation({
    mutationFn: (data: ServiceCreateRequest) => api.createService(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      setIsCreateModalOpen(false);
    },
  });

  const updateServiceMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: { status: ServiceStatus };
    }) => api.updateService(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
    },
  });

  const deleteServiceMutation = useMutation({
    mutationFn: (id: number) => api.deleteService(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
    },
    onError: (error) => {
      console.error("Failed to delete service:", error);
      // Don't show error for 404 (service already deleted)
      if (!error.message.includes("404")) {
        alert("Failed to delete service. Please try again.");
      }
    },
  });

  const handleCreateService = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;

    createServiceMutation.mutate({ name, description });
  };

  const handleStatusChange = (service: Service, newStatus: ServiceStatus) => {
    updateServiceMutation.mutate({
      id: service.id,
      data: { status: newStatus },
    });
  };

  const getStatusColor = (status: ServiceStatus) => {
    switch (status) {
      case "operational":
        return "bg-green-100 text-green-800";
      case "degraded":
        return "bg-yellow-100 text-yellow-800";
      case "partial_outage":
        return "bg-orange-100 text-orange-800";
      case "major_outage":
        return "bg-red-100 text-red-800";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Services</h1>
          <p className="text-gray-600 mt-2">
            Manage your organization's services and their status
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add Service</span>
        </button>
      </div>

      {services.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <Plus className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No services yet
          </h3>
          <p className="text-gray-600 mb-4">
            Get started by creating your first service
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            Create Service
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {services.map((service) => (
                  <tr key={service.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {service.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={service.status}
                        onChange={(e) =>
                          handleStatusChange(
                            service,
                            e.target.value as ServiceStatus
                          )
                        }
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border-0 focus:ring-2 focus:ring-blue-500 ${getStatusColor(
                          service.status
                        )}`}
                      >
                        <option value="operational">Operational</option>
                        <option value="degraded">Degraded</option>
                        <option value="partial_outage">Partial Outage</option>
                        <option value="major_outage">Major Outage</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {service.description || "No description"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => {
                            if (
                              confirm(
                                `Are you sure you want to delete "${service.name}"?`
                              )
                            ) {
                              deleteServiceMutation.mutate(service.id);
                            }
                          }}
                          disabled={deleteServiceMutation.isPending}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Service Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4">Create New Service</h2>
            <form onSubmit={handleCreateService}>
              <div className="mb-4">
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Service Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., API Gateway"
                />
              </div>
              <div className="mb-6">
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Description (optional)
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Brief description of this service..."
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createServiceMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {createServiceMutation.isPending
                    ? "Creating..."
                    : "Create Service"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServicesDashboard;
