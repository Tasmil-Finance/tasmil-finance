import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WalletState {
  connected: boolean;
  account: string | null;
  signing: boolean;
  setSigning: (signing: boolean) => void;
  setWalletState: (state: { connected: boolean; account: string | null }) => void;
  reset: () => void;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set) => ({
      connected: false,
      account: null,
      signing: false,
      setSigning: (signing) => set({ signing }),
      setWalletState: (state) => set(state),
      reset: () => set({ connected: false, account: null, signing: false }),
    }),
    {
      name: "wallet-storage",
      partialize: (state) => ({
        connected: state.connected,
        account: state.account,
      }),
    }
  )
);
