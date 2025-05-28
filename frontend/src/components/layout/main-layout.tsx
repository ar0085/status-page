import { Outlet } from "react-router-dom";
import { Navbar } from "./navbar";
import { useAuth } from "../../hooks/useAuth";

export function MainLayout() {
  // This hook will automatically set the API token when user is authenticated
  useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto py-6">
        <Outlet />
      </main>
    </div>
  );
}
