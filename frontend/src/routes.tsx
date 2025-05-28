import * as React from "react";
import { Routes, Route, Link } from "react-router-dom";
import { SignIn, SignUp } from "@clerk/clerk-react";
import { Suspense } from "react";
import { MainLayout } from "./components/layout/main-layout";
import { CreateOrgGuard } from "./components/auth/CreateOrgGuard";
import { DashboardGuard } from "./components/auth/DashboardGuard";
import StatusPage from "./pages/public/status-page";
import HomePage from "./pages/public/home";
import AcceptInvitation from "./pages/public/accept-invitation";
import WebSocketTest from "./pages/test-websocket";

import ServicesDashboard from "./pages/dashboard/services";
import IncidentsDashboard from "./pages/dashboard/incidents";
import MaintenanceDashboard from "./pages/dashboard/maintenance";
import TeamManagement from "./pages/dashboard/team";
import CreateOrganization from "./pages/dashboard/create-organization";
import { routes } from "./lib/routes";

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public status page route - no layout wrapper for clean design */}
      <Route
        path={routes.public.status}
        element={
          <Suspense fallback={<div>Loading...</div>}>
            <StatusPage />
          </Suspense>
        }
      />

      {/* Other routes with main layout */}
      <Route element={<MainLayout />}>
        {/* Public routes */}
        <Route
          path={routes.public.home}
          element={
            <Suspense fallback={<div>Loading...</div>}>
              <HomePage />
            </Suspense>
          }
        />
        <Route
          path={routes.public.acceptInvitation}
          element={
            <Suspense fallback={<div>Loading...</div>}>
              <AcceptInvitation />
            </Suspense>
          }
        />
        <Route
          path="/test-websocket"
          element={
            <Suspense fallback={<div>Loading...</div>}>
              <WebSocketTest />
            </Suspense>
          }
        />
        <Route
          path={routes.public.signIn}
          element={
            <div className="flex items-center justify-center min-h-screen">
              <SignIn />
            </div>
          }
        />
        <Route
          path={routes.public.signUp}
          element={
            <div className="flex items-center justify-center min-h-screen">
              <SignUp />
            </div>
          }
        />

        {/* Organization creation route - protected for authenticated users without organization */}
        <Route
          path={routes.dashboard.createOrganization}
          element={
            <CreateOrgGuard>
              <Suspense fallback={<div>Loading...</div>}>
                <CreateOrganization />
              </Suspense>
            </CreateOrgGuard>
          }
        />

        {/* Protected dashboard routes */}
        <Route
          path={routes.dashboard.services}
          element={
            <DashboardGuard>
              <Suspense fallback={<div>Loading...</div>}>
                <ServicesDashboard />
              </Suspense>
            </DashboardGuard>
          }
        />
        <Route
          path={routes.dashboard.incidents}
          element={
            <DashboardGuard>
              <Suspense fallback={<div>Loading...</div>}>
                <IncidentsDashboard />
              </Suspense>
            </DashboardGuard>
          }
        />
        <Route
          path={routes.dashboard.maintenance}
          element={
            <DashboardGuard>
              <Suspense fallback={<div>Loading...</div>}>
                <MaintenanceDashboard />
              </Suspense>
            </DashboardGuard>
          }
        />
        <Route
          path={routes.dashboard.team}
          element={
            <DashboardGuard>
              <Suspense fallback={<div>Loading...</div>}>
                <TeamManagement />
              </Suspense>
            </DashboardGuard>
          }
        />

        {/* Catch-all route for 404 */}
        <Route
          path="*"
          element={
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-center">
                <h1 className="text-4xl font-bold mb-4 text-gray-900">404</h1>
                <p className="text-gray-600 mb-8">Page not found</p>
                <Link
                  to="/"
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                >
                  Go Home
                </Link>
              </div>
            </div>
          }
        />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
