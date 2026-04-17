import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AdminUser {
  id: string;
  email: string;
  role: string;
}

interface AdminAuthState {
  token: string | null;
  admin: AdminUser | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;
  setAuth: (token: string, admin: AdminUser) => void;
  clearAuth: () => void;
}

function readInitialAuth(): Pick<AdminAuthState, "hasHydrated" | "isAuthenticated"> {
  try {
    const raw = localStorage.getItem("admin-auth-storage");
    if (!raw) return { hasHydrated: false, isAuthenticated: false };
    const parsed = JSON.parse(raw);
    return { hasHydrated: true, isAuthenticated: parsed.state?.isAuthenticated ?? false };
  } catch {
    return { hasHydrated: false, isAuthenticated: false };
  }
}

const initialAuth = readInitialAuth();

export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set) => ({
      token: null,
      admin: null,
      isAuthenticated: false,
      hasHydrated: initialAuth.hasHydrated,
      setAuth: (token, admin) => set({ token, admin, isAuthenticated: true }),
      clearAuth: () => set({ token: null, admin: null, isAuthenticated: false }),
    }),
    {
      name: "admin-auth-storage",
      onRehydrateStorage: () => () =>
        useAdminAuthStore.setState({ hasHydrated: true }),
    }
  )
);
