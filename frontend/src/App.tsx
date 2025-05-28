import { ClerkProvider } from "@clerk/clerk-react";
import { BrowserRouter as Router } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { OrganizationProvider } from "./hooks/useOrganization";
import AppRoutes from "./routes";
import "./index.css";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>
      <QueryClientProvider client={queryClient}>
        <OrganizationProvider>
          <Router>
            <AppRoutes />
          </Router>
        </OrganizationProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

export default App;
