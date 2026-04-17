"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  useRebalanceControllerGetStatus,
  useRebalanceControllerResume,
  usePoolsControllerGetPools,
} from "@/gen-backend/hooks";
import { $b, $bLive } from "@/lib/kubb-backend";
import type { DiscoveredPool, RebalanceStatus } from "../types";

export function useRebalanceStatus() {
  return useRebalanceControllerGetStatus({
    query: {
      ...$bLive.query,
      refetchInterval: 15_000,
      retry: 2,
      select: (res: unknown): RebalanceStatus =>
        (res as { data?: RebalanceStatus }).data ?? { ready: false, halted: false, haltReason: null },
    },
  });
}

export function useResumeBot() {
  const queryClient = useQueryClient();
  return useRebalanceControllerResume({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: [{ url: "/api/rebalance/status" }] }),
    },
  });
}

export function usePools(baseAsset?: string, riskPreset?: string) {
  return usePoolsControllerGetPools(
    { baseAsset, riskPreset: riskPreset as "SAFE" | "BALANCED" | "AGGRESSIVE" | undefined },
    {
      query: {
        ...$b.query,
        refetchInterval: 60_000,
        retry: 2,
        select: (res: unknown): DiscoveredPool[] =>
          (res as { data?: DiscoveredPool[] }).data ?? [],
      },
    }
  );
}
