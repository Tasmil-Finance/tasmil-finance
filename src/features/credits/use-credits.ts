"use client";

import { useQuery } from "@tanstack/react-query";
import backendAxios from "@/lib/kubb-backend";
import { useAuthStore } from "@/store/use-auth";

export type CreditReason =
  | "TOPUP_CRYPTO"
  | "TOPUP_FIAT"
  | "CHAT_DEBIT"
  | "CHAT_REVERT"
  | "REFERRAL_JOIN"
  | "REFERRAL_X_SHARE"
  | "ADMIN_ADJUST"
  | "PROMO_GRANT"
  | "WELCOME_GRANT"
  | "TASK_COMPLETED";

export const REASON_LABELS: Record<CreditReason, string> = {
  TOPUP_CRYPTO: "Crypto top-up",
  TOPUP_FIAT: "Fiat top-up",
  CHAT_DEBIT: "Chat",
  CHAT_REVERT: "Chat refund",
  REFERRAL_JOIN: "Referral bonus (points)",
  REFERRAL_X_SHARE: "X share bonus (points)",
  ADMIN_ADJUST: "Admin adjustment",
  PROMO_GRANT: "Promo grant",
  WELCOME_GRANT: "Welcome bonus",
  TASK_COMPLETED: "Task bonus (points)",
};

export interface CreditLedgerEntry {
  id: string;
  reason: CreditReason;
  deltaCredits: number;
  deltaPoints: number;
  idempotencyKey: string;
  metadata: unknown;
  occurredAt: string;
}

export interface CreditSnapshot {
  credits: number;
  points: number;
  recent: CreditLedgerEntry[];
}

export interface CreditLedgerPage {
  items: CreditLedgerEntry[];
  nextCursor: string | null;
}

function unwrap<T>(payload: { data?: T } | T): T {
  return ((payload as { data?: T }).data ?? payload) as T;
}

async function fetchSnapshot(): Promise<CreditSnapshot> {
  const res = await backendAxios.get<{ data?: CreditSnapshot } | CreditSnapshot>("/api/credit/me");
  return unwrap(res.data);
}

async function fetchLedger(cursor?: string, limit = 50): Promise<CreditLedgerPage> {
  const params = new URLSearchParams();
  if (cursor) params.set("cursor", cursor);
  params.set("limit", String(limit));
  const res = await backendAxios.get<{ data?: CreditLedgerPage } | CreditLedgerPage>(
    `/api/credit/me/ledger?${params.toString()}`
  );
  return unwrap(res.data);
}

export function creditQueryKey(walletAddress: string | null) {
  return ["credit", walletAddress ?? "anon"] as const;
}

export function useCredits() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const isExpired = useAuthStore((state) => state.isTokenExpired());
  const wallet = useAuthStore((state) => state.user?.walletAddress ?? null);
  return useQuery({
    queryKey: creditQueryKey(wallet),
    queryFn: fetchSnapshot,
    staleTime: 5_000,
    enabled: !!accessToken && !isExpired,
  });
}

export function useCreditsLedger(cursor?: string, limit = 50) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const isExpired = useAuthStore((state) => state.isTokenExpired());
  const wallet = useAuthStore((state) => state.user?.walletAddress ?? null);
  return useQuery({
    queryKey: [...creditQueryKey(wallet), "ledger", cursor ?? "first", limit] as const,
    queryFn: () => fetchLedger(cursor, limit),
    enabled: !!accessToken && !isExpired,
  });
}
