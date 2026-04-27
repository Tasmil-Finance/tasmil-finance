"use client";

import { useQuery } from "@tanstack/react-query";

async function fetchEvmTokenBalance(
  wallet: string,
  token: string,
  chain: string,
  decimals: number,
): Promise<number> {
  const res = await fetch(
    `/api/evm-balance?wallet=${encodeURIComponent(wallet)}&token=${encodeURIComponent(token)}&chain=${encodeURIComponent(chain)}&decimals=${decimals}`,
  );
  if (!res.ok) return 0;
  const data = await res.json();
  return data.balance ?? 0;
}

export function useEvmTokenBalance(
  wallet: string | null,
  tokenAddress: string | null | undefined,
  chain: string | null,
  decimals: number = 18,
) {
  return useQuery({
    queryKey: ["evm-token-balance", wallet, tokenAddress, chain],
    queryFn: () => fetchEvmTokenBalance(wallet!, tokenAddress!, chain!, decimals),
    enabled: !!wallet && !!tokenAddress && !!chain,
    staleTime: 4_000,
    refetchInterval: 5_000,
  });
}
