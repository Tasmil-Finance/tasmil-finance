import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AuthUser {
  id: string;
  walletAddress: string;
  email?: string;
  type: "guest" | "regular";
  createdAt: string;
  updatedAt: string;
}

interface AuthState {
  isAuthenticated: boolean;
  accessToken: string | null;
  user: AuthUser | null;
  isLoading: boolean;
  expiresAt: number | null;
  setAuthState: (state: { accessToken: string; user: AuthUser }) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
  isTokenExpired: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      accessToken: null,
      user: null,
      isLoading: false,
      expiresAt: null,
      setAuthState: ({ accessToken, user }) => {
        // JWT expires in 24h — store the deadline so we can detect stale tokens
        const expiresAt = Date.now() + 23 * 60 * 60 * 1000; // 23h (1h safety margin)
        set({
          isAuthenticated: true,
          accessToken,
          user,
          isLoading: false,
          expiresAt,
        });
      },
      setLoading: (isLoading) => set({ isLoading }),
      logout: () =>
        set({
          isAuthenticated: false,
          accessToken: null,
          user: null,
          isLoading: false,
          expiresAt: null,
        }),
      isTokenExpired: () => {
        const { expiresAt } = get();
        if (!expiresAt) return true;
        return Date.now() > expiresAt;
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        accessToken: state.accessToken,
        user: state.user,
        expiresAt: state.expiresAt,
      }),
    }
  )
);
