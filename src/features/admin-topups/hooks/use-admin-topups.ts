"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAdminAuthStore } from "@/store/use-admin-auth";
import type { AdminFiatTopup } from "../lib/types";

const ADMIN_TOPUPS_QUERY_KEY = ["admin", "topups", "fiat-pending"] as const;

interface ApiEnvelope<T> {
  success?: boolean;
  data?: T;
}

function unwrap<T>(json: ApiEnvelope<T> | T): T {
  if (
    json &&
    typeof json === "object" &&
    "data" in json &&
    (json as ApiEnvelope<T>).data !== undefined
  ) {
    return (json as ApiEnvelope<T>).data as T;
  }
  return json as T;
}

async function fetchFiatPending(token: string): Promise<AdminFiatTopup[]> {
  const res = await fetch("/api/admin/topups?rail=FIAT&status=PENDING", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`listFiatTopups ${res.status}`);
  return unwrap(await res.json());
}

async function postFulfill(token: string, topupId: string, bankTxRef: string): Promise<void> {
  const res = await fetch(`/api/admin/topup/${topupId}/fulfill`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ bankTxRef }),
  });
  if (!res.ok) {
    throw new Error(`fulfillTopup ${res.status}: ${await res.text()}`);
  }
}

async function postCancel(token: string, topupId: string): Promise<void> {
  const res = await fetch(`/api/admin/topup/${topupId}/cancel`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error(`cancelTopup ${res.status}: ${await res.text()}`);
  }
}

export function useFiatPendingTopups() {
  const token = useAdminAuthStore((s) => s.token);
  return useQuery<AdminFiatTopup[]>({
    queryKey: ADMIN_TOPUPS_QUERY_KEY,
    queryFn: () => fetchFiatPending(token!),
    enabled: !!token,
    refetchInterval: 30_000,
  });
}

export function useFulfillTopup() {
  const queryClient = useQueryClient();
  const token = useAdminAuthStore((s) => s.token);
  return useMutation({
    mutationFn: ({ topupId, bankTxRef }: { topupId: string; bankTxRef: string }) =>
      postFulfill(token!, topupId, bankTxRef),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ADMIN_TOPUPS_QUERY_KEY }),
  });
}

export function useCancelTopup() {
  const queryClient = useQueryClient();
  const token = useAdminAuthStore((s) => s.token);
  return useMutation({
    mutationFn: ({ topupId }: { topupId: string }) => postCancel(token!, topupId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ADMIN_TOPUPS_QUERY_KEY }),
  });
}
