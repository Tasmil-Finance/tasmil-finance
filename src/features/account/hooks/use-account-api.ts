"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/use-auth";
import type { ActivityItem, PositionData, PresetCardData } from "../types";

const API_BASE = process.env["NEXT_PUBLIC_API_URL"] ?? "https://backend.tasmil-finance.xyz/api";

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const { accessToken, expiresAt } = useAuthStore.getState();
  if (accessToken && expiresAt && Date.now() < expiresAt) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  } else if (accessToken) {
    // Token expired — trigger re-auth
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("auth-token-expired"));
    }
  }
  return headers;
}

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
      const res = await fetch(`${API_BASE}/account/position/${publicKey}`, {
        headers: getAuthHeaders(),
      });
      if (res.status === 401) {
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("auth-token-expired"));
        }
        return null;
      }
      if (!res.ok) return null;
      const json = await res.json();
      return json.data ?? null;
    },
    enabled: !!publicKey,
    retry: 1,
    refetchInterval: 30_000,
  });
}

export function useActivity(publicKey: string | undefined) {
  return useQuery<ActivityItem[]>({
    queryKey: ["account", "activity", publicKey],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/account/activity/${publicKey}`, {
        headers: getAuthHeaders(),
      });
      if (res.status === 401) {
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("auth-token-expired"));
        }
        return [];
      }
      if (!res.ok) return [];
      const json = await res.json();
      return json.data ?? [];
    },
    enabled: !!publicKey,
    retry: 1,
    refetchInterval: 60_000,
  });
}

export function useDeployAccount() {
  return useMutation({
    mutationFn: async (publicKey: string) => {
      const res = await fetch(`${API_BASE}/account/deploy`, {
        method: "POST",
        headers: getAuthHeaders(),
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
        headers: getAuthHeaders(),
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
        headers: getAuthHeaders(),
        body: JSON.stringify({ preset }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (res.status === 401) {
          throw new Error("Unauthorized: strategy changes are admin-protected");
        }
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
        headers: getAuthHeaders(),
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

export function useResumeAccount() {
  return useMutation({
    mutationFn: async (publicKey: string) => {
      const res = await fetch(`${API_BASE}/account/resume/${publicKey}`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? `Resume request failed (${res.status})`);
      }
      return (await res.json()).data as { status: string };
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
        headers: getAuthHeaders(),
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
        headers: getAuthHeaders(),
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
        headers: getAuthHeaders(),
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
