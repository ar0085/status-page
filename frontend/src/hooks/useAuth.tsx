import { useAuth as useClerkAuth } from "@clerk/clerk-react";
import { useEffect } from "react";
import { api } from "../lib/api";

export function useAuth() {
  const { getToken, isSignedIn, userId } = useClerkAuth();

  useEffect(() => {
    const setApiToken = async () => {
      if (isSignedIn && userId) {
        try {
          const token = await getToken();
          if (token) {
            api.setToken(token);
          }
        } catch (error) {
          console.error("Failed to get auth token:", error);
        }
      } else {
        // Clear token if not signed in
        api.setToken("");
      }
    };

    setApiToken();
  }, [isSignedIn, userId, getToken]);

  return {
    isSignedIn,
    userId,
    getToken,
  };
}
