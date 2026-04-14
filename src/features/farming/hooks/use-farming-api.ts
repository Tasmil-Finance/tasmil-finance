"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/use-auth";
import type { DiscoveredPool, RebalanceStatus } from "../types";

const API_BASE = process.env["NEXT_PUBLIC_API_URL"] ?? "https://backend.tasmil-finance.xyz/api";

export function useRebalanceStatus() {
  return useQuery<RebalanceStatus>({
    queryKey: ["rebalance", "status"],
    queryFn: async () => {
      try {
        const res = await fetch(`${API_BASE}/rebalance/status`);
        if (!res.ok) return { ready: false, halted: false, haltReason: null };
        const json = await res.json();
        return json.data ?? json;
      } catch {
        return { ready: false, halted: false, haltReason: null };
      }
    },
    retry: 2,
    refetchInterval: 15_000,
  });
}

export function useResumeBot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const token = useAuthStore.getState().accessToken;
      const res = await fetch(`${API_BASE}/rebalance/resume`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? `Resume bot failed (${res.status})`);
      }
      return (await res.json()).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rebalance", "status"] });
    },
  });
}

export function usePools(baseAsset?: string, riskPreset?: string) {
  return useQuery<DiscoveredPool[]>({
    queryKey: ["pools", baseAsset, riskPreset],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (baseAsset) params.set("baseAsset", baseAsset);
        if (riskPreset) params.set("riskPreset", riskPreset);
        const qs = params.toString();
        const res = await fetch(`${API_BASE}/pools${qs ? `?${qs}` : ""}`);
        if (!res.ok) return [];
        const json = await res.json();
        return json.data ?? json;
      } catch {
        return [];
      }
    },
    retry: 2,
    refetchInterval: 60_000,
  });
}
