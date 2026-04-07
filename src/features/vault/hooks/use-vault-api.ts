"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";

import {
  ACTIVITY_REFETCH_MS,
  API_BASE,
  POSITION_REFETCH_MS,
  STATS_REFETCH_MS,
} from "../constants";
import type {
  ActivityItem,
  DepositResponse,
  DepositStatus,
  VaultPosition,
  VaultStats,
  VaultToken,
  WithdrawResponse,
  WithdrawStatus,
} from "../types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message ?? `Request failed: ${res.status}`);
  }
  const json = await res.json();
  // unwrap backend envelope { success, data }
  if (json && typeof json === "object" && "data" in json) {
    return json.data as T;
  }
  return json as T;
}

// ---------------------------------------------------------------------------
// Query hooks
// ---------------------------------------------------------------------------

export function useVaultStats() {
  return useQuery<VaultStats>({
    queryKey: ["vault", "stats"],
    queryFn: () => fetchJson<VaultStats>(`${API_BASE}/stats`),
    refetchInterval: STATS_REFETCH_MS,
  });
}

export function useVaultPosition(publicKey: string | null) {
  return useQuery<VaultPosition>({
    queryKey: ["vault", "position", publicKey],
    queryFn: () => fetchJson<VaultPosition>(`${API_BASE}/position/${publicKey}`),
    refetchInterval: POSITION_REFETCH_MS,
    enabled: !!publicKey,
  });
}

export function useVaultActivity(publicKey: string | null) {
  return useQuery<ActivityItem[]>({
    queryKey: ["vault", "activity", publicKey],
    queryFn: () => fetchJson<ActivityItem[]>(`${API_BASE}/activity/${publicKey}`),
    refetchInterval: ACTIVITY_REFETCH_MS,
    enabled: !!publicKey,
  });
}

// ---------------------------------------------------------------------------
// Deposit mutation
// ---------------------------------------------------------------------------

export function useDeposit() {
  const [status, setStatus] = useState<DepositStatus>("idle");

  const mutation = useMutation({
    mutationFn: async ({
      publicKey,
      token,
      amount,
    }: {
      publicKey: string;
      token: VaultToken;
      amount: string;
    }) => {
      // 1. Build
      setStatus("building");
      const resp = await fetchJson<DepositResponse>(`${API_BASE}/deposit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicKey, token, amount }),
      });

      // 2. Sign
      setStatus("signing");
      const { signTransaction } = await import("@stellar/freighter-api");
      const signedXdr = await signTransaction(resp.xdr, {
        networkPassphrase: process.env.NEXT_PUBLIC_STELLAR_PASSPHRASE ?? "Test SDF Network ; September 2015",
      });

      // 3. Submit
      setStatus("confirming");
      await fetchJson(`${API_BASE}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signedXdr }),
      });

      setStatus("success");
      return resp;
    },
    onError: () => {
      setStatus("error");
    },
  });

  const reset = () => {
    setStatus("idle");
    mutation.reset();
  };

  return { ...mutation, status, reset };
}

// ---------------------------------------------------------------------------
// Withdraw mutation
// ---------------------------------------------------------------------------

export function useWithdraw() {
  const [status, setStatus] = useState<WithdrawStatus>("idle");

  const mutation = useMutation({
    mutationFn: async ({
      publicKey,
      receiveToken,
    }: {
      publicKey: string;
      receiveToken: VaultToken;
    }) => {
      // 1. Build
      setStatus("building");
      const resp = await fetchJson<WithdrawResponse>(`${API_BASE}/withdraw`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicKey, receiveToken }),
      });

      // 2. Sign
      setStatus("signing");
      const { signTransaction } = await import("@stellar/freighter-api");
      const signedXdr = await signTransaction(resp.xdr, {
        networkPassphrase: process.env.NEXT_PUBLIC_STELLAR_PASSPHRASE ?? "Test SDF Network ; September 2015",
      });

      // 3. Submit
      setStatus("confirming");
      await fetchJson(`${API_BASE}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signedXdr }),
      });

      setStatus("success");
      return resp;
    },
    onError: () => {
      setStatus("error");
    },
  });

  const reset = () => {
    setStatus("idle");
    mutation.reset();
  };

  return { ...mutation, status, reset };
}
