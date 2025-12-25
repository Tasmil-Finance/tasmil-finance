import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AuthUser {
  id: string;
  email?: string;
  walletAddress?: string;
  type: "guest" | "regular" | "wallet";
}

interface AuthState {
  // Core state
  accessToken: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setTokens: (accessToken: string) => void;
  setUser: (user: AuthUser) => void;
  setAuthState: (state: {
    accessToken: string;
    user: AuthUser;
  }) => void;
  setLoading: (isLoading: boolean) => void;
  updateUser: (updates: Partial<AuthUser>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      accessToken: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,

      // Actions
      setTokens: (accessToken) =>
        set({
          accessToken,
          isAuthenticated: true,
        }),

      setUser: (user) =>
        set({
          user,
          isAuthenticated: true,
        }),

      setAuthState: ({ accessToken, user }) =>
        set({
          accessToken,
          user,
          isAuthenticated: true,
          isLoading: false,
        }),

      setLoading: (isLoading) => set({ isLoading }),

      updateUser: (updates) => {
        const currentUser = get().user;
        if (currentUser) {
          set({
            user: { ...currentUser, ...updates },
          });
        }
      },

      logout: () =>
        set({
          accessToken: null,
          user: null,
          isAuthenticated: false,
          isLoading: false,
        }),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        accessToken: state.accessToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);

