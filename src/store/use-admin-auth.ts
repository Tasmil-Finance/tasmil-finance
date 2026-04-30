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

export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set) => ({
      token: null,
      admin: null,
      isAuthenticated: false,
      hasHydrated: false,
      setAuth: (token, admin) => set({ token, admin, isAuthenticated: true }),
      clearAuth: () => set({ token: null, admin: null, isAuthenticated: false }),
    }),
    {
      name: "admin-auth-storage",
      onRehydrateStorage: () => (state) => {
        if (state) {
          useAdminAuthStore.setState({ hasHydrated: true });
        }
      },
    }
  )
);
