"use client";

import { useQuery } from "@tanstack/react-query";

export type PortfolioHistoryRange = 7 | 30 | 90;

export interface PortfolioHistoryPoint {
  takenAt: string;
  walletUsd: number | null;
  positionsUsd: number | null;
  totalUsd: number;
  partial: boolean;
}

export interface PortfolioHistoryData {
  snapshots: PortfolioHistoryPoint[];
  latestTotalUsd: number | null;
  rangeStartUsd: number;
  deltaUsd: number;
  deltaPercent: number;
}

interface BackendEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
}

function apiBase(): string {
  const base = process.env["NEXT_PUBLIC_BACKEND_URL"];
  return base ? `${base.replace(/\/$/, "")}/api` : "http://localhost:6756/api";
}

async function fetchHistory(
  publicKey: string,
  days: PortfolioHistoryRange,
): Promise<PortfolioHistoryData> {
  const url = `${apiBase()}/portfolio/history?publicKey=${publicKey}&days=${days}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Portfolio history request failed: ${res.status}`);
  const json = (await res.json()) as BackendEnvelope<PortfolioHistoryData>;
  if (!json.success) throw new Error(json.message ?? "Portfolio history request failed");
  return json.data;
}

export function usePortfolioHistory(
  address: string | null | undefined,
  days: PortfolioHistoryRange,
) {
  return useQuery<PortfolioHistoryData>({
    queryKey: ["profile", "portfolio-history", address, days],
    queryFn: () => fetchHistory(address!, days),
    enabled: !!address,
    staleTime: 5 * 60_000,
  });
}
