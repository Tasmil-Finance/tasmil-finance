import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ChainType = "stellar" | "evm" | "solana";

export interface SavedAddress {
  address: string;
  label: string;
  chainType: ChainType;
  source: "connected" | "manual";
  addedAt: number;
}

interface AddressStore {
  // All saved addresses (connected + manual)
  addresses: SavedAddress[];

  // Currently selected source & destination
  selectedSource: string | null;
  selectedDest: string | null;

  // Actions
  addAddress: (addr: Omit<SavedAddress, "addedAt">) => void;
  removeAddress: (address: string) => void;
  setSelectedSource: (address: string | null) => void;
  setSelectedDest: (address: string | null) => void;

  // Sync connected wallet addresses (called when wallets connect/disconnect)
  syncConnectedWallet: (chainType: ChainType, address: string | null, label: string) => void;

  // Getters
  getByChain: (chainType: ChainType) => SavedAddress[];
  getAll: () => SavedAddress[];
}

export const useAddressStore = create<AddressStore>()(
  persist(
    (set, get) => ({
      addresses: [],
      selectedSource: null,
      selectedDest: null,

      addAddress: (addr) => {
        const existing = get().addresses.find((a) => a.address === addr.address);
        if (existing) return; // no duplicates
        set((s) => ({
          addresses: [...s.addresses, { ...addr, addedAt: Date.now() }],
        }));
      },

      removeAddress: (address) => {
        set((s) => ({
          addresses: s.addresses.filter((a) => a.address !== address),
          selectedSource: s.selectedSource === address ? null : s.selectedSource,
          selectedDest: s.selectedDest === address ? null : s.selectedDest,
        }));
      },

      setSelectedSource: (address) => set({ selectedSource: address }),
      setSelectedDest: (address) => set({ selectedDest: address }),

      syncConnectedWallet: (chainType, address, label) => {
        if (!address) {
          // Wallet disconnected — remove connected entries of this chain type
          set((s) => ({
            addresses: s.addresses.filter(
              (a) => !(a.chainType === chainType && a.source === "connected")
            ),
          }));
          return;
        }
        const existing = get().addresses.find((a) => a.address === address);
        if (!existing) {
          set((s) => ({
            addresses: [
              ...s.addresses,
              { address, label, chainType, source: "connected", addedAt: Date.now() },
            ],
          }));
        }
      },

      getByChain: (chainType) => get().addresses.filter((a) => a.chainType === chainType),
      getAll: () => get().addresses,
    }),
    {
      name: "bridge-addresses",
      partialize: (s) => ({
        addresses: s.addresses,
        selectedSource: s.selectedSource,
        selectedDest: s.selectedDest,
      }),
    }
  )
);
