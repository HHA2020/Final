import { useEffect, useState } from "react";
import { UserContext } from "./UserContextValue.js";

const API_URL = import.meta.env.VITE_API_URL;

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    async function loadUser() {
      if (!API_URL) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/user`, {
          credentials: "include",
          signal: controller.signal,
        });
        if (response.status === 401) {
          setUser(null);
          return;
        }
        if (!response.ok) {
          throw new Error("Could not load your profile");
        }

        const data = await response.json();
        setUser(data.user);
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Could not restore sign-in:", error);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadUser();
    return () => controller.abort();
  }, []);

  async function login({ role, identifier, password }) {
    if (!API_URL) {
      throw new Error("VITE_API_URL is not configured");
    }

    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role, identifier, password }),
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Could not sign in");
    }

    setUser(data.user);
    return data.user;
  }

  async function logout() {
    if (!API_URL) {
      throw new Error("VITE_API_URL is not configured");
    }

    const response = await fetch(`${API_URL}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    if (!response.ok) {
      throw new Error("Could not sign out");
    }

    setUser(null);
  }

  return (
    <UserContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </UserContext.Provider>
  );
}
