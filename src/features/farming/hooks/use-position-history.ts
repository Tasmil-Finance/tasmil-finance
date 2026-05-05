"use client";

import { useQuery } from "@tanstack/react-query";

export interface PortfolioSnapshot {
  timestamp: string;
  totalValueUsd: number;
  walletUsd: number;
  defiUsd: number;
}

/**
 * Fetches portfolio value history for a keeper-wallet address.
 * Backend endpoint: `GET /api/portfolio/history/:address?days=N`.
 *
 * Returns an empty array (rather than throwing) on non-2xx responses so the
 * dashboard chart degrades gracefully when history isn't yet available.
 */
export function usePositionHistory(address: string | undefined, days = 30) {
  return useQuery<PortfolioSnapshot[]>({
    queryKey: ["portfolio-history", address, days],
    queryFn: async () => {
      if (!address) return [];
      const res = await fetch(`/api/portfolio/history/${address}?days=${days}`, {
        credentials: "include",
      });
      if (!res.ok) return [];
      const json = (await res.json()) as { data?: PortfolioSnapshot[] } | PortfolioSnapshot[];
      return Array.isArray(json) ? json : (json.data ?? []);
    },
    enabled: !!address,
    staleTime: 60_000,
  });
}
