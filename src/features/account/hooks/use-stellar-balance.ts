"use client";

import { useQuery } from "@tanstack/react-query";
import { activeNetwork } from "@/shared/config/stellar";

/** Known testnet USDC issuer (SDF test anchor / Circle faucet). */
const USDC_ASSET_CODE = "USDC";
const USDC_ISSUER =
  process.env["NEXT_PUBLIC_USDC_ISSUER"] ?? "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";

export interface StellarBalances {
  xlm: number;
  usdc: number;
}

async function fetchBalances(publicKey: string): Promise<StellarBalances> {
  const res = await fetch(`${activeNetwork.horizonUrl}/accounts/${publicKey}`);
  if (!res.ok) return { xlm: 0, usdc: 0 };

  const data = await res.json();
  let xlm = 0;
  let usdc = 0;

  for (const bal of data.balances ?? []) {
    if (bal.asset_type === "native") {
      xlm = Number.parseFloat(bal.balance);
    } else if (
      bal.asset_code === USDC_ASSET_CODE &&
      (bal.asset_issuer === USDC_ISSUER || !USDC_ISSUER)
    ) {
      usdc = Number.parseFloat(bal.balance);
    }
  }

  return { xlm, usdc };
}

export function useStellarBalances(publicKey: string | null | undefined) {
  return useQuery<StellarBalances>({
    queryKey: ["stellar", "balances", publicKey],
    queryFn: () => fetchBalances(publicKey!),
    enabled: !!publicKey,
    refetchInterval: 15_000,
    staleTime: 10_000,
  });
}
