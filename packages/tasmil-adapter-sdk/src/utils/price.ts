/**
 * Stellar Asset Price Service
 *
 * Uses StellarTerm ticker API — free, no key, returns price_USD for all
 * Stellar assets including XLM, USDC, EURC, AQUA, etc.
 *
 * Usage:
 *   import { getAssetPriceUsd, getAssetPriceMap } from "./price.js";
 *   const xlmPrice = await getAssetPriceUsd("XLM");         // 0.161
 *   const map = await getAssetPriceMap();                    // Map<string, number>
 *   const tvlUsd = totalSupplied * map.get("XLM")!;
 */

import { createLogger } from "./logger.js";

const log = createLogger("price");

const STELLARTERM_TICKER_URL = "https://api.stellarterm.com/v1/ticker.json";
const CACHE_TTL_MS = 5 * 60_000; // 5 minutes

interface TickerAsset {
  code: string;
  issuer: string | null;
  price_USD: number;
  volume24h_USD: number;
}

let cache: { map: Map<string, number>; ts: number } | null = null;

/**
 * Fetch all Stellar asset prices from StellarTerm.
 * Returns Map<CODE (uppercase), price_USD>.
 * Cached for 5 minutes.
 */
export async function getAssetPriceMap(): Promise<Map<string, number>> {
  if (cache && Date.now() - cache.ts < CACHE_TTL_MS) return cache.map;

  try {
    const res = await fetch(STELLARTERM_TICKER_URL);
    if (!res.ok) {
      log.warn("StellarTerm ticker fetch failed", { status: res.status });
      return cache?.map ?? new Map();
    }

    const data = (await res.json()) as { assets?: TickerAsset[] };
    const map = new Map<string, number>();

    for (const asset of data.assets ?? []) {
      if (asset.price_USD > 0) {
        map.set(asset.code.toUpperCase(), asset.price_USD);
      }
    }

    cache = { map, ts: Date.now() };
    return map;
  } catch (err) {
    log.warn("StellarTerm ticker error", { err: String(err) });
    return cache?.map ?? new Map();
  }
}

/**
 * Get USD price for a single asset by symbol.
 * Returns null if not found.
 */
export async function getAssetPriceUsd(symbol: string): Promise<number | null> {
  const map = await getAssetPriceMap();
  return map.get(symbol.toUpperCase()) ?? null;
}

/**
 * Convert a token amount to USD value.
 * Returns null if price unavailable.
 */
export async function toUsd(amount: number, symbol: string): Promise<number | null> {
  const price = await getAssetPriceUsd(symbol);
  return price != null ? amount * price : null;
}
