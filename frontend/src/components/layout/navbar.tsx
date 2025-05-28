import { Link } from "react-router-dom";
import { UserButton, useUser } from "@clerk/clerk-react";
import { Button } from "../ui/button";
import { useOrganization } from "../../hooks/useOrganization";

export function Navbar() {
  const { isSignedIn } = useUser();
  const { organization, hasOrganization } = useOrganization();

  return (
    <nav className="border-b">
      <div className="container mx-auto flex h-16 items-center px-4">
        <Link to="/" className="text-xl font-bold">
          {organization
            ? `${organization.name} - ${organization.slug}`
            : "Status Page"}
        </Link>

        <div className="ml-auto flex items-center space-x-4">
          {isSignedIn ? (
            <>
              {hasOrganization && (
                <>
                  <Link to="/dashboard/services">
                    <Button variant="ghost">Services</Button>
                  </Link>
                  <Link to="/dashboard/incidents">
                    <Button variant="ghost">Incidents</Button>
                  </Link>
                  <Link to="/dashboard/maintenance">
                    <Button variant="ghost">Maintenance</Button>
                  </Link>
                  <Link to="/dashboard/team">
                    <Button variant="ghost">Team</Button>
                  </Link>
                </>
              )}
              <UserButton afterSignOutUrl="/" />
            </>
          ) : (
            <>
              <Link to="/sign-in">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link to="/sign-up">
                <Button>Sign Up</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
