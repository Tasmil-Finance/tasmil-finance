"use client";

import { useQuery } from "@tanstack/react-query";
import { activeNetwork } from "@/shared/config/stellar";

export interface WalletToken {
  assetCode: string;
  assetIssuer: string | null;
  assetType: string;
  balance: number;
  price: number;
  valueUsd: number;
}

export interface WalletTokensResult {
  tokens: WalletToken[];
  totalUsd: number;
}

// Simple price map for known assets — fetched from CoinGecko
const COINGECKO_IDS: Record<string, string> = {
  XLM: "stellar",
  USDC: "usd-coin",
  BTC: "bitcoin",
  ETH: "ethereum",
};

async function fetchPrices(symbols: string[]): Promise<Record<string, number>> {
  const ids = symbols
    .map((s) => COINGECKO_IDS[s.toUpperCase()])
    .filter(Boolean);
  if (ids.length === 0) return {};

  try {
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(",")}&vs_currencies=usd`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return {};
    const data = await res.json();

    const result: Record<string, number> = {};
    for (const [sym, id] of Object.entries(COINGECKO_IDS)) {
      if (data[id]?.usd != null) {
        result[sym] = data[id].usd as number;
      }
    }
    return result;
  } catch {
    return {};
  }
}

async function fetchWalletTokens(address: string): Promise<WalletTokensResult> {
  const res = await fetch(`${activeNetwork.horizonUrl}/accounts/${address}`);
  if (!res.ok) return { tokens: [], totalUsd: 0 };

  const data = await res.json();
  const rawBalances: {
    asset_type: string;
    asset_code?: string;
    asset_issuer?: string;
    balance: string;
  }[] = data.balances ?? [];

  const tokens: Omit<WalletToken, "price" | "valueUsd">[] = rawBalances.map((b) => ({
    assetCode: b.asset_type === "native" ? "XLM" : (b.asset_code ?? ""),
    assetIssuer: b.asset_issuer ?? null,
    assetType: b.asset_type,
    balance: parseFloat(b.balance),
  }));

  const symbols = [...new Set(tokens.map((t) => t.assetCode.toUpperCase()))];
  const prices = await fetchPrices(symbols);

  const enriched: WalletToken[] = tokens.map((t) => {
    const price = prices[t.assetCode.toUpperCase()] ?? 0;
    return { ...t, price, valueUsd: t.balance * price };
  });

  enriched.sort((a, b) => b.valueUsd - a.valueUsd);
  const totalUsd = enriched.reduce((s, t) => s + t.valueUsd, 0);

  return { tokens: enriched, totalUsd };
}

export function useWalletTokens(address: string | null | undefined) {
  return useQuery<WalletTokensResult>({
    queryKey: ["profile", "wallet-tokens", address],
    queryFn: () => fetchWalletTokens(address!),
    enabled: !!address,
    staleTime: 8_000,
    refetchInterval: 10_000,
  });
}
