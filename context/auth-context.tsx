"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { authControllerLogin, authControllerRegister, authControllerGuest, authControllerGetSession } from "@/gen/client";
import { withAuth } from "@/lib/kubb-config";
import { useAuthStore } from "@/store/use-auth";

interface User {
  id: string;
  email: string;
  type: "guest" | "regular";
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  guest: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize auth from localStorage
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (token) {
        const { setTokens } = useAuthStore.getState();
        setTokens(token);
      }
    }
    
    // Try to load user from session
    authControllerGetSession(withAuth)
      .then((response) => {
        const sessionUser = (response as { user?: User }).user;
        if (sessionUser) {
          setUser(sessionUser);
        }
      })
      .catch(() => {
        // Not authenticated, that's okay
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authControllerLogin({ email, password }, withAuth) as { access_token?: string; user?: User };
    if (response.access_token) {
      const { setTokens } = useAuthStore.getState();
      setTokens(response.access_token);
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', response.access_token);
      }
    }
    if (response.user) {
      setUser(response.user);
    }
  };

  const register = async (email: string, password: string) => {
    const response = await authControllerRegister({ email, password }, withAuth) as { access_token?: string; user?: User };
    if (response.access_token) {
      const { setTokens } = useAuthStore.getState();
      setTokens(response.access_token);
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', response.access_token);
      }
    }
    if (response.user) {
      setUser(response.user);
    }
  };

  const guest = async () => {
    const response = await authControllerGuest(withAuth) as { access_token?: string; user?: User };
    if (response.access_token) {
      const { setTokens } = useAuthStore.getState();
      setTokens(response.access_token);
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', response.access_token);
      }
    }
    if (response.user) {
      setUser(response.user);
    }
  };

  const logout = () => {
    const { logout } = useAuthStore.getState();
    logout();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, guest, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

