import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { api } from "../../lib/api";
import type { Incident, IncidentStatus } from "../../types";

const IncidentsDashboard = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingIncident, setEditingIncident] = useState<Incident | null>(null);
  const [newIncidentUpdate, setNewIncidentUpdate] = useState<{
    incidentId: number;
    text: string;
  } | null>(null);
  const [expandedIncidents, setExpandedIncidents] = useState<Set<number>>(
    new Set()
  );
  const queryClient = useQueryClient();

  // Fetch incidents
  const {
    data: incidents = [],
    isLoading: incidentsLoading,
    error: incidentsError,
  } = useQuery({
    queryKey: ["incidents"],
    queryFn: () => api.getIncidents(),
  });

  // Fetch services for the form
  const { data: services = [] } = useQuery({
    queryKey: ["services"],
    queryFn: () => api.getServices(),
  });

  // Create incident mutation
  const createIncidentMutation = useMutation({
    mutationFn: (data: {
      title: string;
      description?: string;
      service_ids: number[];
    }) => api.createIncident(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
      setIsCreateModalOpen(false);
    },
    onError: (error) => {
      console.error("Failed to create incident:", error);
      alert("Failed to create incident. Please try again.");
    },
  });

  // Update incident mutation
  const updateIncidentMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: {
        title?: string;
        description?: string;
        status?: IncidentStatus;
        service_ids?: number[];
      };
    }) => api.updateIncident(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
      setEditingIncident(null);
    },
    onError: (error) => {
      console.error("Failed to update incident:", error);
      alert("Failed to update incident. Please try again.");
    },
  });

  // Delete incident mutation
  const deleteIncidentMutation = useMutation({
    mutationFn: (id: number) => api.deleteIncident(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
    },
    onError: (error) => {
      console.error("Failed to delete incident:", error);
      if (!error.message.includes("404")) {
        alert("Failed to delete incident. Please try again.");
      }
    },
  });

  // Create incident update mutation
  const createIncidentUpdateMutation = useMutation({
    mutationFn: ({ incidentId, text }: { incidentId: number; text: string }) =>
      api.createIncidentUpdate(incidentId, { text }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
      setNewIncidentUpdate(null);
    },
    onError: (error) => {
      console.error("Failed to create incident update:", error);
      alert("Failed to create incident update. Please try again.");
    },
  });

  const handleCreateIncident = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const serviceIds = formData.getAll("service_ids").map(Number);

    if (!title.trim() || serviceIds.length === 0) {
      alert("Please provide a title and select at least one service.");
      return;
    }

    createIncidentMutation.mutate({
      title: title.trim(),
      description: description.trim() || undefined,
      service_ids: serviceIds,
    });
  };

  const handleUpdateIncident = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingIncident) return;

    const formData = new FormData(e.currentTarget);
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const status = formData.get("status") as IncidentStatus;
    const serviceIds = formData.getAll("service_ids").map(Number);

    updateIncidentMutation.mutate({
      id: editingIncident.id,
      data: {
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        service_ids: serviceIds,
      },
    });
  };

  const handleCreateIncidentUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newIncidentUpdate) return;

    const formData = new FormData(e.currentTarget);
    const text = formData.get("text") as string;

    if (!text.trim()) {
      alert("Please provide update text.");
      return;
    }

    createIncidentUpdateMutation.mutate({
      incidentId: newIncidentUpdate.incidentId,
      text: text.trim(),
    });
  };

  const getStatusIcon = (status: IncidentStatus) => {
    switch (status) {
      case "open":
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case "resolved":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: IncidentStatus) => {
    switch (status) {
      case "open":
        return "bg-red-100 text-red-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const toggleIncidentExpansion = (incidentId: number) => {
    setExpandedIncidents((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(incidentId)) {
        newSet.delete(incidentId);
      } else {
        newSet.add(incidentId);
      }
      return newSet;
    });
  };

  if (incidentsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading incidents...</div>
      </div>
    );
  }

  if (incidentsError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-600">
          Error loading incidents: {incidentsError.message}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Incidents</h1>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Incident
        </button>
      </div>

      {incidents.length === 0 ? (
        <div className="text-center py-12">
          <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No incidents yet
          </h3>
          <p className="text-gray-500 mb-4">
            Create your first incident to track service issues.
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Create Incident
          </button>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Incident
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Affected Services
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {incidents.map((incident) => (
                <React.Fragment key={incident.id}>
                  <tr
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => toggleIncidentExpansion(incident.id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {incident.updates && incident.updates.length > 0 ? (
                          expandedIncidents.has(incident.id) ? (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          )
                        ) : (
                          <div className="w-4 h-4" />
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {incident.title}
                          </div>
                          {incident.description && (
                            <div className="text-sm text-gray-500">
                              {incident.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          incident.status
                        )}`}
                      >
                        {getStatusIcon(incident.status)}
                        {incident.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {incident.services
                          .map((service) => service.name)
                          .join(", ")}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(incident.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div
                        className="flex items-center gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => setEditingIncident(incident)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            setNewIncidentUpdate({
                              incidentId: incident.id,
                              text: "",
                            })
                          }
                          className="text-green-600 hover:text-green-900"
                          title="Add Update"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (
                              confirm(
                                `Are you sure you want to delete "${incident.title}"?`
                              )
                            ) {
                              deleteIncidentMutation.mutate(incident.id);
                            }
                          }}
                          disabled={deleteIncidentMutation.isPending}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Expanded Updates Row */}
                  {expandedIncidents.has(incident.id) &&
                    incident.updates &&
                    incident.updates.length > 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 bg-gray-50">
                          <div className="space-y-3">
                            <h4 className="font-medium text-gray-900 text-sm mb-3">
                              Incident Updates ({incident.updates.length})
                            </h4>
                            {incident.updates
                              .sort(
                                (a, b) =>
                                  new Date(b.created_at).getTime() -
                                  new Date(a.created_at).getTime()
                              )
                              .map((update) => (
                                <div
                                  key={update.id}
                                  className="bg-white border border-gray-200 rounded-lg p-4"
                                >
                                  <div className="flex justify-between items-start mb-2">
                                    <div className="text-sm text-gray-900">
                                      {update.text}
                                    </div>
                                    <time className="text-xs text-gray-500 ml-4 flex-shrink-0">
                                      {new Date(
                                        update.created_at
                                      ).toLocaleString()}
                                    </time>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </td>
                      </tr>
                    )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Incident Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create New Incident</h2>
            <form onSubmit={handleCreateIncident} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Brief description of the incident"
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
                  placeholder="Detailed description of the incident"
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
                  disabled={createIncidentMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {createIncidentMutation.isPending ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Incident Modal */}
      {editingIncident && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit Incident</h2>
            <form onSubmit={handleUpdateIncident} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  name="title"
                  defaultValue={editingIncident.title}
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
                  defaultValue={editingIncident.description || ""}
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
                  defaultValue={editingIncident.status}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="open">Open</option>
                  <option value="resolved">Resolved</option>
                </select>
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
                        defaultChecked={editingIncident.services.some(
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
                  onClick={() => setEditingIncident(null)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateIncidentMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {updateIncidentMutation.isPending ? "Updating..." : "Update"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Incident Update Modal */}
      {newIncidentUpdate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add Incident Update</h2>
            <form onSubmit={handleCreateIncidentUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Update Text *
                </label>
                <textarea
                  name="text"
                  required
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Provide an update on the incident status..."
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setNewIncidentUpdate(null)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createIncidentUpdateMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {createIncidentUpdateMutation.isPending
                    ? "Adding..."
                    : "Add Update"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncidentsDashboard;
