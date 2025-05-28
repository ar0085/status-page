import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Edit,
  Trash2,
  Calendar,
  Clock,
  CheckCircle,
  Play,
} from "lucide-react";
import { api } from "../../lib/api";
import type { Maintenance, MaintenanceStatus } from "../../types";

const MaintenanceDashboard = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingMaintenance, setEditingMaintenance] =
    useState<Maintenance | null>(null);
  const queryClient = useQueryClient();

  // Fetch maintenances
  const {
    data: maintenances = [],
    isLoading: maintenancesLoading,
    error: maintenancesError,
  } = useQuery({
    queryKey: ["maintenances"],
    queryFn: () => api.getMaintenances(),
  });

  // Fetch services for the form
  const { data: services = [] } = useQuery({
    queryKey: ["services"],
    queryFn: () => api.getServices(),
  });

  // Create maintenance mutation
  const createMaintenanceMutation = useMutation({
    mutationFn: (data: {
      title: string;
      description?: string;
      scheduled_start: string;
      scheduled_end: string;
      service_ids: number[];
    }) => api.createMaintenance(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenances"] });
      setIsCreateModalOpen(false);
    },
    onError: (error) => {
      console.error("Failed to create maintenance:", error);
      alert("Failed to create maintenance. Please try again.");
    },
  });

  // Update maintenance mutation
  const updateMaintenanceMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: {
        title?: string;
        description?: string;
        status?: MaintenanceStatus;
        scheduled_start?: string;
        scheduled_end?: string;
        service_ids?: number[];
      };
    }) => api.updateMaintenance(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenances"] });
      setEditingMaintenance(null);
    },
    onError: (error) => {
      console.error("Failed to update maintenance:", error);
      alert("Failed to update maintenance. Please try again.");
    },
  });

  // Delete maintenance mutation
  const deleteMaintenanceMutation = useMutation({
    mutationFn: (id: number) => api.deleteMaintenance(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenances"] });
    },
    onError: (error) => {
      console.error("Failed to delete maintenance:", error);
      if (!error.message.includes("404")) {
        alert("Failed to delete maintenance. Please try again.");
      }
    },
  });

  const handleCreateMaintenance = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const scheduledStart = formData.get("scheduled_start") as string;
    const scheduledEnd = formData.get("scheduled_end") as string;
    const serviceIds = formData.getAll("service_ids").map(Number);

    if (
      !title.trim() ||
      !scheduledStart ||
      !scheduledEnd ||
      serviceIds.length === 0
    ) {
      alert(
        "Please provide all required fields and select at least one service."
      );
      return;
    }

    if (new Date(scheduledEnd) <= new Date(scheduledStart)) {
      alert("End time must be after start time.");
      return;
    }

    createMaintenanceMutation.mutate({
      title: title.trim(),
      description: description.trim() || undefined,
      scheduled_start: scheduledStart,
      scheduled_end: scheduledEnd,
      service_ids: serviceIds,
    });
  };

  const handleUpdateMaintenance = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingMaintenance) return;

    const formData = new FormData(e.currentTarget);
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const status = formData.get("status") as MaintenanceStatus;
    const scheduledStart = formData.get("scheduled_start") as string;
    const scheduledEnd = formData.get("scheduled_end") as string;
    const serviceIds = formData.getAll("service_ids").map(Number);

    if (
      scheduledEnd &&
      scheduledStart &&
      new Date(scheduledEnd) <= new Date(scheduledStart)
    ) {
      alert("End time must be after start time.");
      return;
    }

    updateMaintenanceMutation.mutate({
      id: editingMaintenance.id,
      data: {
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        scheduled_start: scheduledStart,
        scheduled_end: scheduledEnd,
        service_ids: serviceIds,
      },
    });
  };

  const getStatusIcon = (status: MaintenanceStatus) => {
    switch (status) {
      case "scheduled":
        return <Calendar className="w-4 h-4 text-blue-500" />;
      case "in_progress":
        return <Play className="w-4 h-4 text-yellow-500" />;
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: MaintenanceStatus) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (maintenancesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading maintenance windows...</div>
      </div>
    );
  }

  if (maintenancesError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-600">
          Error loading maintenance windows: {maintenancesError.message}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Maintenance</h1>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Schedule Maintenance
        </button>
      </div>

      {maintenances.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No maintenance windows scheduled
          </h3>
          <p className="text-gray-500 mb-4">
            Schedule your first maintenance window to keep users informed.
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Schedule Maintenance
          </button>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Maintenance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Affected Services
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Scheduled Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {maintenances.map((maintenance) => (
                <tr key={maintenance.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {maintenance.title}
                      </div>
                      {maintenance.description && (
                        <div className="text-sm text-gray-500">
                          {maintenance.description}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                        maintenance.status
                      )}`}
                    >
                      {getStatusIcon(maintenance.status)}
                      {maintenance.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {maintenance.services
                        .map((service) => service.name)
                        .join(", ")}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatDateTime(maintenance.scheduled_start)}
                    </div>
                    <div className="text-sm text-gray-500">
                      to {formatDateTime(maintenance.scheduled_end)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingMaintenance(maintenance)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (
                            confirm(
                              `Are you sure you want to delete "${maintenance.title}"?`
                            )
                          ) {
                            deleteMaintenanceMutation.mutate(maintenance.id);
                          }
                        }}
                        disabled={deleteMaintenanceMutation.isPending}
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
      )}

      {/* Create Maintenance Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Schedule New Maintenance</h2>
            <form onSubmit={handleCreateMaintenance} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Brief description of the maintenance"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Detailed description of the maintenance work"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scheduled Start *
                </label>
                <input
                  type="datetime-local"
                  name="scheduled_start"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scheduled End *
                </label>
                <input
                  type="datetime-local"
                  name="scheduled_end"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Affected Services *
                </label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {services.map((service) => (
                    <label key={service.id} className="flex items-center">
                      <input
                        type="checkbox"
                        name="service_ids"
                        value={service.id}
                        className="mr-2"
                      />
                      <span className="text-sm">{service.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMaintenanceMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {createMaintenanceMutation.isPending
                    ? "Scheduling..."
                    : "Schedule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Maintenance Modal */}
      {editingMaintenance && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Edit Maintenance</h2>
            <form onSubmit={handleUpdateMaintenance} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  name="title"
                  defaultValue={editingMaintenance.title}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  defaultValue={editingMaintenance.description || ""}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  defaultValue={editingMaintenance.status}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scheduled Start *
                </label>
                <input
                  type="datetime-local"
                  name="scheduled_start"
                  defaultValue={editingMaintenance.scheduled_start.slice(0, 16)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scheduled End *
                </label>
                <input
                  type="datetime-local"
                  name="scheduled_end"
                  defaultValue={editingMaintenance.scheduled_end.slice(0, 16)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Affected Services *
                </label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {services.map((service) => (
                    <label key={service.id} className="flex items-center">
                      <input
                        type="checkbox"
                        name="service_ids"
                        value={service.id}
                        defaultChecked={editingMaintenance.services.some(
                          (s) => s.id === service.id
                        )}
                        className="mr-2"
                      />
                      <span className="text-sm">{service.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingMaintenance(null)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateMaintenanceMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {updateMaintenanceMutation.isPending
                    ? "Updating..."
                    : "Update"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaintenanceDashboard;
