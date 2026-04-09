"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import type { PresetCardData, PositionData, ActivityItem } from "../types";

const API_BASE = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:6756/api";

export function usePresets() {
  return useQuery<PresetCardData[]>({
    queryKey: ["account", "presets"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/account/presets`);
      if (!res.ok) throw new Error(`Failed to fetch presets (${res.status})`);
      const json = await res.json();
      return json.data ?? [];
    },
    refetchInterval: 60_000,
  });
}

export function usePosition(publicKey: string | undefined) {
  return useQuery<PositionData | null>({
    queryKey: ["account", "position", publicKey],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/account/position/${publicKey}`);
      if (!res.ok) return null;
      const json = await res.json();
      return json.data ?? null;
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
      if (!res.ok) return [];
      const json = await res.json();
      return json.data ?? [];
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
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? `Deploy request failed (${res.status})`);
      }
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
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? `Fund request failed (${res.status})`);
      }
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
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? `Update preset failed (${res.status})`);
      }
      return (await res.json()).data;
    },
  });
}

export function useSetupAccount() {
  return useMutation({
    mutationFn: async (publicKey: string) => {
      const res = await fetch(`${API_BASE}/account/setup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicKey }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? `Setup request failed (${res.status})`);
      }
      return (await res.json()).data as { setupTxs: string[] };
    },
  });
}

export interface SubmitTxParams {
  signedXdr: string;
  publicKey?: string;
  txType?: "deploy" | "fund" | "withdraw" | "revoke";
  amount?: number;
  token?: string;
}

export function useSubmitTx() {
  return useMutation({
    mutationFn: async (params: SubmitTxParams) => {
      const res = await fetch(`${API_BASE}/account/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? `Submit transaction failed (${res.status})`);
      }
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
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? `Withdraw request failed (${res.status})`);
      }
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
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? `Revoke request failed (${res.status})`);
      }
      return (await res.json()).data;
    },
  });
}
