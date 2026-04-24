"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useAccountControllerGetPresets,
  useAccountControllerGetPosition,
  useAccountControllerGetActivity,
} from "@/gen-backend/hooks";
import { $b, $bLive } from "@/lib/kubb-backend";
import backendAxios from "@/lib/kubb-backend";
import type { ActivityItem, PositionData, PresetCardData } from "../types";

// ─── Query hooks (generated + config preset + select to unwrap NestJS envelope) ───

export function usePresets() {
  return useAccountControllerGetPresets({
    query: {
      ...$b.query,
      refetchInterval: 60_000,
      select: (res: unknown): PresetCardData[] =>
        (res as { data?: PresetCardData[] }).data ?? [],
    },
  });
}

export function usePosition(publicKey: string | undefined) {
  return useAccountControllerGetPosition(publicKey!, {
    query: {
      ...$bLive.query,
      enabled: !!publicKey,
      select: (res: unknown): PositionData | null =>
        (res as { data?: PositionData }).data ?? null,
    },
  });
}

export function useActivity(publicKey: string | undefined) {
  return useAccountControllerGetActivity(publicKey!, { limit: "50" }, {
    query: {
      ...$b.query,
      enabled: !!publicKey,
      refetchInterval: 60_000,
      select: (res: unknown): ActivityItem[] =>
        (res as { data?: ActivityItem[] }).data ?? [],
    },
  });
}

// ─── Mutation hooks (backendAxios directly — mutations have no `select`) ─────────

export function useDeployAccount() {
  return useMutation({
    mutationFn: async (publicKey: string) => {
      const { data } = await backendAxios.post<{ data: { xdr: string } }>(
        "/api/account/deploy",
        { publicKey }
      );
      return data.data;
    },
  });
}

export function useFundAccount() {
  return useMutation({
    mutationFn: async (dto: { publicKey: string; amount: number; token: string }) => {
      const { data } = await backendAxios.post<{ data: { xdr: string } }>(
        "/api/account/fund",
        dto
      );
      return data.data;
    },
  });
}

export function useUpdatePreset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ publicKey, preset }: { publicKey: string; preset: string }) => {
      const { data } = await backendAxios.put<{ data: unknown }>(
        `/api/account/preset/${publicKey}`,
        { preset }
      );
      return data.data;
    },
    // Refresh position so the dashboard shows the new preset + allocation
    // pipeline picks it up on the next rebalance cycle.
    onSuccess: () => {
      qc.invalidateQueries({
        predicate: (q) => {
          const k = q.queryKey[0];
          return typeof k === "string" && (
            k.includes("getPosition") ||
            k.includes("getActivity") ||
            k === "/api/account/position" ||
            k === "/api/account/activity"
          );
        },
      });
    },
  });
}

export function useSetupAccount() {
  return useMutation({
    mutationFn: async (publicKey: string) => {
      const { data } = await backendAxios.post<{ data: { setupTxs: string[] } }>(
        "/api/account/setup",
        { publicKey }
      );
      return data.data;
    },
  });
}

export function useResumeAccount() {
  return useMutation({
    mutationFn: async (publicKey: string) => {
      const { data } = await backendAxios.post<{ data: { status: string } }>(
        `/api/account/resume/${publicKey}`
      );
      return data.data;
    },
  });
}

export interface SubmitTxParams {
  signedXdr: string;
  publicKey?: string;
  txType?: "deploy" | "setup" | "fund" | "withdraw" | "revoke" | "reactivate";
  amount?: number;
  token?: string;
}

export function useSubmitTx() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: SubmitTxParams) => {
      const { data } = await backendAxios.post<{ data: unknown }>(
        "/api/account/submit",
        params
      );
      return data.data;
    },
    // On success, invalidate account-scoped queries so the UI immediately
    // reflects the new account state (e.g. status DEPLOYING → AWAITING_FUND
    // after the setup TX confirms). Without this, React Query serves stale
    // cached data until the next 30-sec poll fires, and the user stays on
    // the OnboardingPage long after the flow is complete.
    onSuccess: () => {
      qc.invalidateQueries({ predicate: (q) => {
        const k = q.queryKey[0];
        return typeof k === "string" && (
          k.includes("getPosition") ||
          k.includes("getActivity") ||
          k === "/api/account/position" ||
          k === "/api/account/activity"
        );
      }});
    },
  });
}

export function useWithdraw() {
  return useMutation({
    mutationFn: async (dto: { publicKey: string; amount: number }) => {
      const { data } = await backendAxios.post<{
        data: { xdr?: string; xdrs?: string[]; signedXdrs?: string[] };
      }>("/api/account/withdraw", dto);
      return data.data;
    },
  });
}

export function useRevoke() {
  return useMutation({
    mutationFn: async (publicKey: string) => {
      const { data } = await backendAxios.post<{ data: { xdr: string } }>(
        "/api/account/revoke",
        { publicKey }
      );
      return data.data;
    },
  });
}

export function useReactivate() {
  return useMutation({
    mutationFn: async (publicKey: string) => {
      const { data } = await backendAxios.post<{ data: { setupTxs: string[] } }>(
        "/api/account/reactivate",
        { publicKey }
      );
      return data.data;
    },
  });
}
