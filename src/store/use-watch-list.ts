import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface WatchedAsset {
  symbol: string;
  chain: string;
  contractId?: string;
  issuer?: string;
  addedAt: number;
}

export type WatchedAssetInput = Omit<WatchedAsset, "addedAt" | "chain"> & {
  chain?: string;
};

export function keyOf(
  a: Pick<WatchedAsset, "symbol" | "contractId" | "issuer"> & { chain?: string }
): string {
  const chain = a.chain ?? "stellar";
  return `${chain}:${a.contractId ?? a.issuer ?? a.symbol}`;
}

interface WatchListState {
  items: WatchedAsset[];
  addAsset: (a: WatchedAssetInput) => void;
  removeAsset: (key: string) => void;
  isWatched: (key: string) => boolean;
}

export const useWatchList = create<WatchListState>()(
  persist(
    (set, get) => ({
      items: [],
      addAsset: (a) =>
        set((state) => {
          const next: WatchedAsset = {
            symbol: a.symbol,
            chain: a.chain ?? "stellar",
            contractId: a.contractId,
            issuer: a.issuer,
            addedAt: Date.now(),
          };
          const k = keyOf(next);
          return state.items.some((i) => keyOf(i) === k)
            ? state
            : { items: [...state.items, next] };
        }),
      removeAsset: (key) =>
        set((state) => ({
          items: state.items.filter((i) => keyOf(i) !== key),
        })),
      isWatched: (key) => get().items.some((i) => keyOf(i) === key),
    }),
    {
      name: "tasmil.watchlist",
      version: 2,
      migrate: (persistedState, version) => {
        const s = persistedState as Partial<WatchListState> | undefined;
        if (!s?.items) return { items: [] } as unknown as WatchListState;
        if (version < 2) {
          return {
            ...s,
            items: s.items.map((i) => ({
              ...i,
              chain: i.chain ?? "stellar",
            })),
          } as WatchListState;
        }
        return s as WatchListState;
      },
    }
  )
);
