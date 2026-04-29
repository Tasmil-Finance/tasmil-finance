"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/use-auth";
import { fetchReferralSnapshot, type ReferralSnapshot } from "../lib/fetch-referral";

export function referralQueryKey(walletAddress: string | null) {
  return ["referral", walletAddress ?? "anon"] as const;
}

export function useReferralSnapshot() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const isExpired = useAuthStore((s) => s.isTokenExpired());
  const wallet = useAuthStore((s) => s.user?.walletAddress ?? null);
  return useQuery<ReferralSnapshot>({
    queryKey: referralQueryKey(wallet),
    queryFn: fetchReferralSnapshot,
    enabled: !!accessToken && !isExpired,
    staleTime: 30_000,
  });
}
