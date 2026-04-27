"use client";

import { useQuery } from "@tanstack/react-query";

async function fetchSolanaTokenBalance(
  walletAddress: string,
  mintAddress: string,
): Promise<number> {
  const res = await fetch(
    `/api/solana-balance?wallet=${encodeURIComponent(walletAddress)}&mint=${encodeURIComponent(mintAddress)}`,
  );
  if (!res.ok) return 0;
  const data = await res.json();
  return data.balance ?? 0;
}

export function useSolanaTokenBalance(
  walletAddress: string | null,
  mintAddress: string | null | undefined,
) {
  return useQuery({
    queryKey: ["solana-token-balance", walletAddress, mintAddress],
    queryFn: () => fetchSolanaTokenBalance(walletAddress!, mintAddress!),
    enabled: !!walletAddress && !!mintAddress,
    staleTime: 4_000,
    refetchInterval: 5_000,
  });
}
