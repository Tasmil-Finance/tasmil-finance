"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import type { PresetCardData, PositionData, ActivityItem } from "../types";

const API_BASE = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:6756/api";

export function usePresets() {
  return useQuery<PresetCardData[]>({
    queryKey: ["account", "presets"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/account/presets`);
      const json = await res.json();
      return json.data;
    },
    refetchInterval: 60_000,
  });
}

export function usePosition(publicKey: string | undefined) {
  return useQuery<PositionData>({
    queryKey: ["account", "position", publicKey],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/account/position/${publicKey}`);
      const json = await res.json();
      return json.data;
    },
    enabled: !!publicKey,
    refetchInterval: 30_000,
  });
}

export function useActivity(publicKey: string | undefined) {
  return useQuery<ActivityItem[]>({
    queryKey: ["account", "activity", publicKey],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/account/activity/${publicKey}`);
      const json = await res.json();
      return json.data;
    },
    enabled: !!publicKey,
    refetchInterval: 60_000,
  });
}

export function useDeployAccount() {
  return useMutation({
    mutationFn: async (publicKey: string) => {
      const res = await fetch(`${API_BASE}/account/deploy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicKey }),
      });
      return (await res.json()).data;
    },
  });
}

export function useFundAccount() {
  return useMutation({
    mutationFn: async (dto: { publicKey: string; amount: number; token: string }) => {
      const res = await fetch(`${API_BASE}/account/fund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dto),
      });
      return (await res.json()).data;
    },
  });
}

export function useUpdatePreset() {
  return useMutation({
    mutationFn: async ({ publicKey, preset }: { publicKey: string; preset: string }) => {
      const res = await fetch(`${API_BASE}/account/preset/${publicKey}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preset }),
      });
      return (await res.json()).data;
    },
  });
}

export function useSubmitTx() {
  return useMutation({
    mutationFn: async (signedXdr: string) => {
      const res = await fetch(`${API_BASE}/account/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signedXdr }),
      });
      return (await res.json()).data;
    },
  });
}

export function useWithdraw() {
  return useMutation({
    mutationFn: async (dto: { publicKey: string; amount: number }) => {
      const res = await fetch(`${API_BASE}/account/withdraw`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dto),
      });
      return (await res.json()).data;
    },
  });
}

export function useRevoke() {
  return useMutation({
    mutationFn: async (publicKey: string) => {
      const res = await fetch(`${API_BASE}/account/revoke`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicKey }),
      });
      return (await res.json()).data;
    },
  });
}
