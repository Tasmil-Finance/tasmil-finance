"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  useAccountControllerGetActivity,
  useAccountControllerGetPosition,
} from "@/gen-backend/hooks";
import backendAxios, { $b, $bLive } from "@/lib/kubb-backend";
import type { ActivityItem, PositionData, PresetCardData } from "../types";

// ─── Query hooks (generated + config preset + select to unwrap NestJS envelope) ───

export function usePresets(baseAsset?: string) {
  // Backend supports ?baseAsset=USDC|XLM — different pool universes per
  // deposit asset. Keep the query key distinct so switching the toggle
  // invalidates the cache cleanly.
  const normalized = (baseAsset ?? "USDC").toUpperCase();
  return useQuery({
    queryKey: ["/api/account/presets", normalized] as const,
    refetchInterval: 60_000,
    queryFn: async (): Promise<PresetCardData[]> => {
      const { data } = await backendAxios.get<{ data: PresetCardData[] }>(
        `/api/account/presets?baseAsset=${encodeURIComponent(normalized)}`
      );
      return data.data ?? [];
    },
  });
}

export function usePosition(publicKey: string | undefined) {
  return useAccountControllerGetPosition(publicKey!, {
    query: {
      ...$bLive.query,
      enabled: !!publicKey,
      staleTime: 30_000,
      select: (res: unknown): PositionData | null => (res as { data?: PositionData }).data ?? null,
    },
  });
}

export function useActivity(publicKey: string | undefined) {
  return useAccountControllerGetActivity(
    publicKey!,
    { limit: "50", cursor: "", category: "" },
    {
      query: {
        ...$b.query,
        enabled: !!publicKey,
        refetchInterval: 60_000,
        select: (res: unknown): ActivityItem[] =>
          (res as { data?: { items?: ActivityItem[] } }).data?.items ?? [],
      },
    }
  );
}

// ─── Mutation hooks (backendAxios directly — mutations have no `select`) ─────────

export interface DeployAccountResponse {
  /** Unsigned XDR for the user to sign. Absent when `alreadyDeployed` is true. */
  xdr?: string;
  keeperWalletAddress: string;
  /** True when the server short-circuited because an account already exists
   *  for this pubkey. Caller should skip signing and continue with setup. */
  alreadyDeployed?: boolean;
  /** Account status when alreadyDeployed is true: DEPLOYING / AWAITING_FUND / ... */
  status?: string;
}

export interface DeployAccountArgs {
  publicKey: string;
  /** Opt in to destructive cleanup of an existing DEPLOYING / unfunded
   *  AWAITING_FUND row. Used by the "Reset deployment" recovery path. */
  recover?: boolean;
}

export function useDeployAccount() {
  return useMutation({
    mutationFn: async (args: DeployAccountArgs | string) => {
      const body = typeof args === "string" ? { publicKey: args } : args;
      const { data } = await backendAxios.post<{ data: DeployAccountResponse }>(
        "/api/account/deploy",
        body
      );
      return data.data;
    },
  });
}

export function useFundAccount() {
  return useMutation({
    mutationFn: async (dto: { publicKey: string; amount: number; token: string }) => {
      const { data } = await backendAxios.post<{ data: { xdr: string } }>("/api/account/fund", dto);
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
          return (
            typeof k === "string" &&
            (k.includes("getPosition") ||
              k.includes("getActivity") ||
              k === "/api/account/position" ||
              k === "/api/account/activity")
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
      try {
        const { data } = await backendAxios.post<{ data: unknown }>("/api/account/submit", params);
        return data.data;
      } catch (err: unknown) {
        // Surface backend's specific message (e.g. "txInsufficientFee",
        // "Transaction rejected due to sequence number collision",
        // "Withdraw temporarily blocked by keeper cooldown") instead of
        // axios's generic "Request failed with status code 400".
        const axiosErr = err as {
          response?: { data?: { message?: string | string[] } };
          message?: string;
        };
        const detail = axiosErr.response?.data?.message;
        const text = Array.isArray(detail) ? detail.join("; ") : detail;
        if (text) throw new Error(text);
        throw err;
      }
    },
    // On success, invalidate account-scoped queries so the UI immediately
    // reflects the new account state (e.g. status DEPLOYING → AWAITING_FUND
    // after the setup TX confirms). Without this, React Query serves stale
    // cached data until the next 30-sec poll fires, and the user stays on
    // the OnboardingPage long after the flow is complete.
    onSuccess: () => {
      qc.invalidateQueries({
        predicate: (q) => {
          const k = q.queryKey[0];
          return (
            typeof k === "string" &&
            (k.includes("getPosition") ||
              k.includes("getActivity") ||
              k === "/api/account/position" ||
              k === "/api/account/activity")
          );
        },
      });
    },
  });
}

export function useWithdraw() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dto: { publicKey: string; amount: number }) => {
      try {
        const { data } = await backendAxios.post<{
          data: {
            xdr?: string;
            xdrs?: string[];
            signedXdrs?: string[];
            // Server-side bot-signed submissions: hashes of TXs already
            // confirmed on-chain. No client-side submit needed for these.
            submittedTxHashes?: string[];
          };
        }>("/api/account/withdraw", dto);
        return data.data;
      } catch (err: unknown) {
        // Surface backend's actual message instead of axios's "Request failed
        // with status code 400". Backend includes a specific reason in
        // response.data.message (e.g. "Insufficient withdrawable balance.
        // Unfilled amount: $4.19" or "Transaction rejected due to sequence
        // number collision").
        const axiosErr = err as {
          response?: { data?: { message?: string | string[] } };
          message?: string;
        };
        const detail = axiosErr.response?.data?.message;
        const text = Array.isArray(detail) ? detail.join("; ") : detail;
        if (text) throw new Error(text);
        throw err;
      }
    },
    // Withdraw outcome (success OR failure from a stale cache hit) means our
    // cached position/balance is suspect — invalidate so the dashboard
    // refetches actual on-chain state on next render.
    onSettled: () => {
      queryClient.invalidateQueries({
        predicate: (q) => {
          const k = q.queryKey?.[0];
          return (
            k === "/api/account/me" ||
            k === "/api/account/position" ||
            k === "/api/account/activity"
          );
        },
      });
    },
  });
}

export function useRevoke() {
  return useMutation({
    mutationFn: async (publicKey: string) => {
      const { data } = await backendAxios.post<{ data: { xdr: string } }>("/api/account/revoke", {
        publicKey,
      });
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
