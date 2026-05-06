"use client";

import { useQuery } from "@tanstack/react-query";
import { activeNetwork, isMainnet } from "@/shared/config/stellar";

const IS_TESTNET = !isMainnet;

/** USDC issuer defaults by network (override via NEXT_PUBLIC_USDC_ISSUER). */
const USDC_ASSET_CODE = "USDC";
const DEFAULT_USDC_ISSUER = IS_TESTNET
  ? "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5"
  : "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN";
const USDC_ISSUER = process.env.NEXT_PUBLIC_USDC_ISSUER ?? DEFAULT_USDC_ISSUER;

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
