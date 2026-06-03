/**
 * Cross-protocol asset format resolver.
 * Adapted from apps/mcp-stellar/src/utils/asset-resolver.ts
 *
 * Protocols use different asset formats:
 * - SDEX / Horizon: "XLM" or "CODE:ISSUER" (classic format)
 * - Soroban (Soroswap, Phoenix, Aquarius, Blend): "C..." (56-char contract ID)
 * - Some accept "XLM" or "native" as shorthand
 */

import type { AssetFormat, StellarNetwork } from "../types/common.js";
import { KNOWN_ASSETS } from "./contracts.js";

// ─── Per-network lookup maps ──────────────────────────────────────

let _lastNetwork: string | null = null;
let KNOWN_ASSET_MAP: Record<string, { classic: string; contract: string }> = {};
let CONTRACT_TO_SYMBOL: Map<string, string> = new Map();

function ensureMaps(network: StellarNetwork): void {
  if (network === _lastNetwork) return;
  _lastNetwork = network;
  const assets = (KNOWN_ASSETS[network] ?? {}) as Record<
    string,
    { classic: string; contract: string }
  >;
  KNOWN_ASSET_MAP = assets;
  CONTRACT_TO_SYMBOL = new Map(
    Object.entries(assets).map(([sym, v]) => [v.contract, sym]),
  );
}

export function detectAssetFormat(asset: string, network: StellarNetwork): AssetFormat {
  ensureMaps(network);
  if (asset === "XLM" || asset === "native" || asset === "xlm") return "symbol";
  if (asset.startsWith("C") && asset.length === 56) return "contract";
  if (asset.includes(":")) return "classic";
  if (KNOWN_ASSET_MAP[asset.toUpperCase()]) return "symbol";
  return "classic";
}

export function resolveAsset(
  asset: string,
  targetFormat: AssetFormat,
  network: StellarNetwork,
): string {
  ensureMaps(network);
  const currentFormat = detectAssetFormat(asset, network);
  if (currentFormat === targetFormat) return asset;

  let symbol: string | undefined;

  if (currentFormat === "symbol") {
    symbol = asset === "native" || asset === "xlm" ? "XLM" : asset.toUpperCase();
  } else if (currentFormat === "contract") {
    symbol = CONTRACT_TO_SYMBOL.get(asset);
  } else if (currentFormat === "classic") {
    const code = asset.split(":")[0]?.toUpperCase();
    if (code && KNOWN_ASSET_MAP[code]) symbol = code;
  }

  if (!symbol || !KNOWN_ASSET_MAP[symbol]) return asset;

  const entry = KNOWN_ASSET_MAP[symbol]!;
  switch (targetFormat) {
    case "symbol":
      return symbol;
    case "classic":
      return entry.classic;
    case "contract":
      return entry.contract;
    default:
      return asset;
  }
}

export function getAssetSymbol(asset: string, network: StellarNetwork): string {
  ensureMaps(network);
  const format = detectAssetFormat(asset, network);
  if (format === "symbol") return asset === "native" ? "XLM" : asset.toUpperCase();
  if (format === "contract")
    return CONTRACT_TO_SYMBOL.get(asset) ?? asset.slice(0, 8) + "...";
  if (format === "classic") return asset.split(":")[0] ?? asset;
  return asset;
}

// ─── Symbol cache ─────────────────────────────────────────────────
const _symbolCache = new Map<string, string>();

/**
 * Resolve a contract address to a human-readable symbol.
 * Falls back to calling symbol() on the contract.
 */
export async function resolveContractSymbol(
  contract: string,
  network: StellarNetwork,
  viewCallFn?: (contractId: string, method: string, args: unknown[]) => Promise<string | null>,
): Promise<string> {
  const known = getAssetSymbol(contract, network);
  if (!known.endsWith("...")) return known;

  const cached = _symbolCache.get(contract);
  if (cached !== undefined) return cached;

  if (viewCallFn) {
    try {
      const symbolXdr = await viewCallFn(contract, "symbol", []);
      if (symbolXdr) {
        const { decodeScVal } = await import("./xdr-parser.js");
        const sym = decodeScVal(symbolXdr);
        if (typeof sym === "string" && sym.length > 0 && sym.length < 12) {
          _symbolCache.set(contract, sym);
          return sym;
        }
      }
    } catch {
      // symbol() not available
    }
  }

  _symbolCache.set(contract, known);
  return known;
}

/**
 * Async version that allows fallback to an external token registry.
 */
export async function resolveAssetAsync(
  asset: string,
  targetFormat: AssetFormat = "contract",
  network: StellarNetwork,
  registryLookup?: (symbol: string) => Promise<{ contract: string } | null>,
): Promise<string> {
  const sync = resolveAsset(asset, targetFormat, network);

  if (targetFormat === "contract" && sync.startsWith("C") && sync.length === 56) {
    return sync;
  }
  if (targetFormat !== "contract") {
    return sync;
  }

  if (registryLookup) {
    try {
      const entry = await registryLookup(asset);
      if (entry?.contract) return entry.contract;
    } catch {
      // not found
    }
  }

  return sync;
}
