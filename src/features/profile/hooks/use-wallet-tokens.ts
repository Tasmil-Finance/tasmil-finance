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

// CoinGecko IDs for price lookup — testnet tokens use mainnet prices
const COINGECKO_IDS: Record<string, string> = {
  XLM: "stellar",
  USDC: "usd-coin",
  USDT: "tether",
  BTC: "bitcoin",
  WBTC: "bitcoin",
  ETH: "ethereum",
  WETH: "ethereum",
  SOL: "solana",
  AQUA: "aquarius-fi",
  BLND: "blend-protocol",
  DAI: "dai",
  EURC: "euro-coin",
  PYUSD: "paypal-usd",
  CETES: "cetes",
  ICE: "ice-token",
};

// In-memory price cache to avoid CoinGecko rate limits (30 req/min on free tier)
let _priceCache: Record<string, number> = {};
let _priceCacheTime = 0;
const PRICE_CACHE_TTL = 60_000; // 60s — prices update at most once per minute

/** Returns the latest cached prices (for use by other hooks like defi-positions). */
export function getCachedPrices(): Record<string, number> {
  return { ..._priceCache };
}

async function fetchPrices(
  symbols: string[],
  tokens: Omit<WalletToken, "price" | "valueUsd">[]
): Promise<Record<string, number>> {
  const now = Date.now();

  // Return cached prices if still fresh
  if (now - _priceCacheTime < PRICE_CACHE_TTL && Object.keys(_priceCache).length > 0) {
    return { ..._priceCache };
  }

  const result: Record<string, number> = {};

  // 1. Fetch from CoinGecko
  const ids = symbols.map((s) => COINGECKO_IDS[s.toUpperCase()]).filter(Boolean);

  if (ids.length > 0) {
    try {
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${[...new Set(ids)].join(",")}&vs_currencies=usd`;
      const res = await fetch(url, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        for (const [sym, id] of Object.entries(COINGECKO_IDS)) {
          if (data[id]?.usd != null) {
            result[sym] = data[id].usd as number;
          }
        }
      } else if (res.status === 429) {
        // Rate limited — return cached prices
        if (Object.keys(_priceCache).length > 0) return { ..._priceCache };
      }
    } catch {
      // CoinGecko unavailable — return cached prices
      if (Object.keys(_priceCache).length > 0) return { ..._priceCache };
    }
  }

  // 2. For tokens without CoinGecko price, try Stellar SDEX orderbook
  //    Get price in XLM, then convert to USD using XLM price
  const xlmPrice = result.XLM ?? 0;
  if (xlmPrice > 0) {
    const missing = tokens.filter(
      (t) => t.balance > 0 && result[t.assetCode.toUpperCase()] == null && t.assetIssuer
    );

    for (const token of missing.slice(0, 5)) {
      try {
        const url = `${activeNetwork.horizonUrl}/order_book?selling_asset_type=credit_alphanum${token.assetCode.length > 4 ? "12" : "4"}&selling_asset_code=${token.assetCode}&selling_asset_issuer=${token.assetIssuer}&buying_asset_type=native&limit=1`;
        const res = await fetch(url);
        if (!res.ok) continue;
        const book = await res.json();
        const bestAsk = book?.asks?.[0];
        if (bestAsk) {
          const priceInXlm = parseFloat(bestAsk.price);
          if (priceInXlm > 0) {
            result[token.assetCode.toUpperCase()] = priceInXlm * xlmPrice;
          }
        }
      } catch {
        // SDEX lookup failed for this token
      }
    }
  }

  // Update cache
  if (Object.keys(result).length > 0) {
    _priceCache = { ...result };
    _priceCacheTime = now;
  }

  return result;
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
  const prices = await fetchPrices(symbols, tokens);

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
    staleTime: 4_000,
    refetchInterval: 5_000,
  });
}
