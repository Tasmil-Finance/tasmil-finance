"use client";

export type HistoryRange = "7d" | "30d" | "90d" | "all";

export interface HistoryPoint {
  ts: number; // unix ms
  valueUsd: number;
}

export interface PortfolioHistory {
  data: HistoryPoint[];
  range: HistoryRange;
  isLoading: boolean;
  isPlaceholder: boolean;
  error: Error | null;
}

/**
 * Phase 1 stub: backend endpoint not yet shipped. Returns empty data and
 * `isPlaceholder: true` so consumers render an informational empty state.
 * Phase 2 will swap to a real React Query hook against
 * `GET /api/account/:publicKey/history?range=...`.
 */
export function usePortfolioHistory(
  _publicKey: string | undefined,
  range: HistoryRange
): PortfolioHistory {
  return {
    data: [],
    range,
    isLoading: false,
    isPlaceholder: true,
    error: null,
  };
}
