import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import {
  CheckCircle,
  AlertCircle,
  XCircle,
  Clock,
  Info,
  Calendar,
} from "lucide-react";
import { api } from "../../lib/api";
import { socket } from "../../lib/socket";
import type { StatusPageResponse, ServiceStatus } from "../../types";

const StatusPage = () => {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const [isConnected, setIsConnected] = useState(false);

  const { data: statusData, refetch } = useQuery<StatusPageResponse>({
    queryKey: ["public-status", orgSlug],
    queryFn: () => api.getPublicStatusPage(orgSlug!),
    enabled: !!orgSlug,
  });

  // Fetch recent incidents for timeline
  const { data: recentIncidents } = useQuery({
    queryKey: ["public-timeline", orgSlug],
    queryFn: () => api.getPublicTimeline(orgSlug!, 5),
    enabled: !!orgSlug,
  });

  // Fetch recent maintenance for timeline
  const { data: recentMaintenances } = useQuery({
    queryKey: ["public-maintenances", orgSlug],
    queryFn: () => api.getPublicMaintenances(orgSlug!, false),
    enabled: !!orgSlug,
  });

  useEffect(() => {
    if (orgSlug && statusData?.organization.id) {
      socket.connect();

      socket.on("connect", () => setIsConnected(true));
      socket.on("disconnect", () => setIsConnected(false));

      socket.subscribeToOrganization(statusData.organization.id);

      socket.on("status_update", () => {
        refetch();
      });

      return () => {
        socket.unsubscribeFromOrganization(statusData.organization.id);
        socket.disconnect();
      };
    }
  }, [orgSlug, statusData?.organization.id, refetch]);

  const getStatusIcon = (status: ServiceStatus) => {
    switch (status) {
      case "operational":
        return <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />;
      case "degraded":
        return (
          <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0" />
        );
      case "partial_outage":
        return <Clock className="h-5 w-5 text-orange-500 flex-shrink-0" />;
      case "major_outage":
        return <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />;
      default:
        return <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />;
    }
  };

  const getStatusText = (status: ServiceStatus) => {
    switch (status) {
      case "operational":
        return "Operational";
      case "degraded":
        return "Degraded Performance";
      case "partial_outage":
        return "Partial Outage";
      case "major_outage":
        return "Major Outage";
      default:
        return "Operational";
    }
  };

  const isAllOperational =
    statusData?.services.every((service) => service.status === "operational") ??
    true;
  const hasActiveIncidents = (statusData?.active_incidents?.length ?? 0) > 0;

  if (!statusData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-500 text-sm font-medium">
            Loading status...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="g-red-50">
      {/* Top Navbar */}
      <nav className="bg-linear-to-r from-red-500 via-orange-400 to-yellow-400 dark:via-none dark:from-blue-500 dark:to-teal-400 border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex space-x-6 text-sm font-semibold text-[#57606a]">
              <a
                href="#"
                className="hover:text-[#0969da] transition-colors"
                tabIndex={0}
              >
                Help
              </a>
              <a
                href="#"
                className="hover:text-[#0969da] transition-colors"
                tabIndex={0}
              >
                Community
              </a>
              <span className="text-[#24292f] cursor-default select-none">
                Status
              </span>
            </div>
            <div className="flex items-center space-x-6 text-sm font-semibold text-[#24292f]">
              <span>{statusData.organization.name}</span>
              <a
                href="#"
                className="text-[#0969da] hover:underline transition-colors"
                tabIndex={0}
              >
                Subscribe to updates
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 sm:px-8 py-12">
        {/* Organization Logo Circle */}
        <div className="flex justify-center mb-10">
          <div className="bg-[#1b1f23] w-20 h-20 rounded-full flex items-center justify-center shadow-md">
            <span className="text-white font-semibold text-3xl select-none">
              {statusData.organization.name.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>

        {/* Overall Status Banner */}
        <div
          className={`rounded-md px-7 py-9 border ${
            isAllOperational && !hasActiveIncidents
              ? "bg-green-50 border-green-300"
              : hasActiveIncidents
              ? "bg-red-50 border-red-300"
              : "bg-yellow-50 border-yellow-300"
          } max-w-4xl mx-auto`}
          role="region"
          aria-live="polite"
          aria-atomic="true"
        >
          <div className="flex items-center justify-center mb-3">
            {isAllOperational && !hasActiveIncidents ? (
              <CheckCircle className="h-10 w-10 text-green-600 mr-4" />
            ) : hasActiveIncidents ? (
              <XCircle className="h-10 w-10 text-red-600 mr-4" />
            ) : (
              <AlertCircle className="h-10 w-10 text-yellow-600 mr-4" />
            )}
            <h1
              className={`text-3xl font-semibold select-none ${
                isAllOperational && !hasActiveIncidents
                  ? "text-green-800"
                  : hasActiveIncidents
                  ? "text-red-800"
                  : "text-yellow-800"
              }`}
            >
              {isAllOperational && !hasActiveIncidents
                ? "All Systems Operational"
                : hasActiveIncidents
                ? "Service Disruption"
                : "Degraded Performance"}
            </h1>
          </div>
          <p
            className={`text-center text-sm font-medium select-text ${
              isAllOperational && !hasActiveIncidents
                ? "text-green-700"
                : hasActiveIncidents
                ? "text-red-700"
                : "text-yellow-700"
            }`}
          >
            Last updated: {new Date().toLocaleString()}
          </p>
        </div>

        {/* Active Incidents Section */}
        {hasActiveIncidents && (
          <section className="max-w-4xl mx-auto mt-16">
            <h2 className="text-2xl font-semibold text-[#24292f] mb-8">
              Active Incidents
            </h2>
            <div className="space-y-6">
              {statusData.active_incidents.map((incident) => (
                <article
                  key={incident.id}
                  className="bg-red-50 border border-red-300 rounded-md p-6 shadow-sm"
                  aria-label={`Incident: ${incident.title}`}
                >
                  <div className="flex space-x-4">
                    <XCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="text-red-900 text-lg font-semibold mb-2">
                        {incident.title}
                      </h3>
                      {incident.description && (
                        <p className="text-red-800 text-sm mb-4 whitespace-pre-line leading-relaxed">
                          {incident.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-6 text-xs text-red-700 font-semibold">
                        <time>
                          Started:{" "}
                          {new Date(incident.created_at).toLocaleString()}
                        </time>
                        <span className="capitalize">
                          Status: {incident.status}
                        </span>
                      </div>
                      {incident.services.length > 0 && (
                        <div className="mt-4">
                          <p className="text-xs font-semibold text-red-800 mb-2">
                            Affected Services:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {incident.services.map((service) => (
                              <span
                                key={service.id}
                                className="inline-block px-2 py-0.5 rounded bg-red-100 text-red-800 text-xs font-semibold select-text"
                              >
                                {service.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* Services Status Section */}
        <div className="mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">
            Current Status
          </h2>

          {/* Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {statusData.services.map((service) => (
              <div
                key={service.id}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md hover:border-gray-300 transition-all duration-200"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(service.status)}
                    <h3 className="font-semibold text-gray-900 text-lg">
                      {service.name}
                    </h3>
                  </div>
                  {service.description && (
                    <Info className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  )}
                </div>

                <div className="mb-3">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      service.status === "operational"
                        ? "bg-green-100 text-green-800"
                        : service.status === "degraded"
                        ? "bg-yellow-100 text-yellow-800"
                        : service.status === "partial_outage"
                        ? "bg-orange-100 text-orange-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {getStatusText(service.status)}
                  </span>
                </div>

                {service.description && (
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {service.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Scheduled Maintenance Section */}
        <section className="max-w-4xl mx-auto mt-16">
          <h2 className="text-2xl font-semibold text-[#24292f] mb-8">
            Scheduled Maintenance
          </h2>
          {statusData.active_maintenances &&
          statusData.active_maintenances.length > 0 ? (
            <div className="space-y-6">
              {statusData.active_maintenances.map((maintenance) => (
                <article
                  key={maintenance.id}
                  className="bg-blue-50 border border-blue-300 rounded-md p-6 shadow-sm"
                  aria-label={`Maintenance: ${maintenance.title}`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-6 w-6 text-blue-600 flex-shrink-0" />
                      <div>
                        <h3 className="text-lg font-semibold text-blue-900 select-text">
                          {maintenance.title}
                        </h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              maintenance.status === "scheduled"
                                ? "bg-blue-100 text-blue-800"
                                : maintenance.status === "in_progress"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {maintenance.status.replace("_", " ").toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {maintenance.description && (
                    <p className="text-blue-800 mb-4 select-text leading-relaxed">
                      {maintenance.description}
                    </p>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm font-medium text-blue-900 mb-1">
                        Scheduled Start:
                      </p>
                      <p className="text-sm text-blue-700 select-text">
                        {new Date(maintenance.scheduled_start).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-900 mb-1">
                        Scheduled End:
                      </p>
                      <p className="text-sm text-blue-700 select-text">
                        {new Date(maintenance.scheduled_end).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {maintenance.services && maintenance.services.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-blue-900 mb-2">
                        Affected Services:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {maintenance.services.map((service) => (
                          <span
                            key={service.id}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {service.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-300 rounded-md py-14 px-10 text-center">
              <Clock className="mx-auto h-10 w-10 text-gray-400 mb-3" />
              <p className="text-gray-600 text-sm max-w-md mx-auto select-text">
                No scheduled maintenance at this time.
              </p>
            </div>
          )}
        </section>

        {/* Recent Activity Timeline */}
        <section className="max-w-4xl mx-auto mt-16">
          <h2 className="text-2xl font-semibold text-[#24292f] mb-8">
            Recent Activity
          </h2>

          {(recentIncidents && recentIncidents.length > 0) ||
          (recentMaintenances && recentMaintenances.length > 0) ? (
            <div className="space-y-4">
              {/* Combine and sort incidents and maintenance by date */}
              {[
                ...(recentIncidents || []).map((incident) => ({
                  type: "incident" as const,
                  data: incident,
                  date: new Date(incident.created_at),
                  id: `incident-${incident.id}`,
                })),
                ...(recentMaintenances || [])
                  .slice(0, 5)
                  .map((maintenance) => ({
                    type: "maintenance" as const,
                    data: maintenance,
                    date: new Date(maintenance.created_at),
                    id: `maintenance-${maintenance.id}`,
                  })),
              ]
                .sort((a, b) => b.date.getTime() - a.date.getTime())
                .slice(0, 5)
                .map((item) => (
                  <div
                    key={item.id}
                    className={`border rounded-md p-4 ${
                      item.type === "incident"
                        ? "bg-orange-50 border-orange-200"
                        : "bg-blue-50 border-blue-200"
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      {item.type === "incident" ? (
                        <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                      ) : (
                        <Calendar className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3
                            className={`font-semibold ${
                              item.type === "incident"
                                ? "text-orange-900"
                                : "text-blue-900"
                            }`}
                          >
                            {item.data.title}
                          </h3>
                          <span
                            className={`text-xs font-medium px-2 py-1 rounded ${
                              item.type === "incident"
                                ? "bg-orange-100 text-orange-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {item.type === "incident"
                              ? "Incident"
                              : "Maintenance"}
                          </span>
                        </div>

                        {item.data.description && (
                          <p
                            className={`text-sm mb-2 ${
                              item.type === "incident"
                                ? "text-orange-800"
                                : "text-blue-800"
                            }`}
                          >
                            {item.data.description.length > 100
                              ? `${item.data.description.substring(0, 100)}...`
                              : item.data.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between text-xs">
                          <time
                            className={`${
                              item.type === "incident"
                                ? "text-orange-700"
                                : "text-blue-700"
                            }`}
                          >
                            {item.date.toLocaleDateString()} at{" "}
                            {item.date.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </time>

                          {item.data.services &&
                            item.data.services.length > 0 && (
                              <span
                                className={`text-xs ${
                                  item.type === "incident"
                                    ? "text-orange-700"
                                    : "text-blue-700"
                                }`}
                              >
                                {item.data.services.length} service
                                {item.data.services.length > 1 ? "s" : ""}{" "}
                                affected
                              </span>
                            )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-300 rounded-md py-14 px-10 text-center">
              <Clock className="mx-auto h-10 w-10 text-gray-400 mb-3" />
              <p className="text-gray-600 text-sm max-w-md mx-auto select-text">
                No recent incidents or maintenance activities.
              </p>
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="max-w-5xl mx-auto mt-20 border-t border-gray-200 pt-8 pb-12">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-6 sm:gap-0 text-sm text-[#57606a]">
            <div className="flex space-x-8">
              <a
                href="#"
                className="hover:text-[#0969da] transition-colors"
                tabIndex={0}
              >
                Incident History
              </a>
              <a
                href="#"
                className="hover:text-[#0969da] transition-colors"
                tabIndex={0}
              >
                System Metrics
              </a>
              <a
                href="#"
                className="hover:text-[#0969da] transition-colors"
                tabIndex={0}
              >
                API Status
              </a>
            </div>
            <div className="text-xs select-text">
              Powered by {statusData.organization.name} Status
            </div>
          </div>
        </footer>
      </main>

      {/* Live Connection Indicator - Dev Only */}
      {import.meta.env.DEV && (
        <div className="fixed bottom-5 right-5 z-50">
          <div
            className={`flex items-center space-x-2 rounded-full border px-4 py-2 text-xs font-semibold shadow-md ${
              isConnected
                ? "bg-green-100 border-green-300 text-green-700"
                : "bg-red-100 border-red-300 text-red-700"
            }`}
            aria-live="polite"
            aria-atomic="true"
          >
            <span
              className={`inline-block h-2 w-2 rounded-full ${
                isConnected ? "bg-green-600" : "bg-red-600"
              }`}
            />
            <span>{isConnected ? "Live" : "Disconnected"}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatusPage;
