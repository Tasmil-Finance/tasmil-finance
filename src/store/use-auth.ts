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

// Parse the `exp` claim (seconds since epoch) out of a JWT, returning a ms timestamp.
// Returns null if the token is malformed or carries no exp claim.
function parseJwtExp(token: string): number | null {
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    const json = JSON.parse(
      typeof atob !== "undefined" ? atob(padded) : Buffer.from(padded, "base64").toString("utf8")
    );
    return typeof json.exp === "number" ? json.exp * 1000 : null;
  } catch {
    return null;
  }
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
        const jwtExp = parseJwtExp(accessToken);
        // Fallback: 23h after now if the JWT has no parseable exp claim.
        const fallback = Date.now() + 23 * 60 * 60 * 1000;
        const expiresAt = jwtExp ?? fallback;
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
        // SECURITY: accessToken is NOT persisted — it lives only in memory.
        // The backend sets it in an httpOnly cookie; JS reads it from this store.
        // Persisting it would expose the JWT in localStorage (XSS risk).
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        expiresAt: state.expiresAt,
      }),
    }
  )
);
