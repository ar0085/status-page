import { Link } from "react-router-dom";

export default function Dashboard() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4 text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mb-8 text-lg">
          Welcome back! Choose what you'd like to manage.
        </p>
        <div className="flex flex-col sm:flex-row gap-6 justify-center">
          <Link
            to="/dashboard/services"
            className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 inline-block text-lg font-medium transition-colors min-w-[200px]"
          >
            Services
          </Link>
          <Link
            to="/dashboard/incidents"
            className="bg-orange-600 text-white px-8 py-4 rounded-lg hover:bg-orange-700 inline-block text-lg font-medium transition-colors min-w-[200px]"
          >
            Incidents
          </Link>
          <Link
            to="/dashboard/maintenance"
            className="bg-purple-600 text-white px-8 py-4 rounded-lg hover:bg-purple-700 inline-block text-lg font-medium transition-colors min-w-[200px]"
          >
            Maintenance
          </Link>
        </div>
      </div>
    </div>
  );
}
