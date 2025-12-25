import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WalletState {
  // Core state
  connected: boolean;
  account: string | null;
  signing: boolean;

  // Actions
  setWalletState: (state: {
    connected: boolean;
    account: string | null;
  }) => void;
  setSigning: (signing: boolean) => void;
  reset: () => void;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set) => ({
      // Initial state
      connected: false,
      account: null,
      signing: false,

      // Actions
      setWalletState: ({ connected, account }) =>
        set({
          connected,
          account,
        }),

      setSigning: (signing) => set({ signing }),

      reset: () =>
        set({
          connected: false,
          account: null,
          signing: false,
        }),
    }),
    {
      name: "wallet-storage",
      partialize: (state) => ({
        connected: state.connected,
        account: state.account,
      }),
    },
  ),
);

