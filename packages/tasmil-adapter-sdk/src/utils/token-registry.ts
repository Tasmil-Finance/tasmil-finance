/**
 * Unified Token & Pool Registry
 *
 * Centralizes ALL token addresses and pool mappings across protocols.
 * Solves the testnet USDC problem: same symbol, different addresses per protocol.
 *
 * Design principles:
 * - Address is the source of truth, symbol is just a display label
 * - Each address maps to exactly one entry (no duplicates)
 * - On mainnet: 1 symbol = 1 address (no conflict)
 * - On testnet: 1 symbol = N addresses (disambiguated by protocol tag)
 * - Pool registry: pair string "XLM/USDC" → pool address (per protocol)
 */

import type { StellarNetwork } from "../types/common.js";
import { KNOWN_ASSETS, getAquariusContracts } from "./contracts.js";

// ─── Token Entry ────────────────────────────────────────────────

export interface TokenEntry {
  /** Soroban contract address (C...) */
  address: string;
  /** Human-readable symbol (e.g. "USDC") */
  symbol: string;
  /** Full name (optional, e.g. "USD Coin") */
  name?: string;
  /** Classic format CODE:ISSUER (optional) */
  classic?: string;
  /** Which protocol(s) use this specific address */
  protocols: string[];
  /** Token decimals (default 7) */
  decimals?: number;
}

// ─── Pool Entry ─────────────────────────────────────────────────

export interface PoolEntry {
  /** Pool contract address (C...) */
  address: string;
  /** Protocol that owns this pool */
  protocol: string;
  /** Token pair symbols ["XLM", "USDC"] */
  tokens: [string, string];
  /** Token pair addresses (actual contracts used by this pool) */
  tokenAddresses: [string, string];
  /** Pool type */
  poolType: "constant_product" | "stable" | "concentrated" | "lending" | "unknown";
  /** Human-readable name */
  name: string;
  /** Extra info */
  meta?: Record<string, unknown>;
}

// ─── Testnet token addresses ────────────────────────────────────
// On testnet, same symbol can have multiple addresses per protocol

const TESTNET_TOKENS: TokenEntry[] = [
  // XLM — universal
  { address: "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC", symbol: "XLM", name: "Stellar Lumens", protocols: ["*"], decimals: 7 },

  // USDC — different per protocol!
  { address: "CAZRY5GSFBFXD7H6GAFBA5YGYQTDXU4QKWKMYFWBAZFUCURN3WKX6LF5", symbol: "USDC", name: "USDC (Aquarius)", classic: "USDC:GAHPYWLK6YRN7CVYZOO4H3VDRZ7PVF5UJGLZCSPAEIKJE2XSWF5LAGER", protocols: ["aquarius", "sdex"], decimals: 7 },
  { address: "CAQCFVLOBK5GIULPNZRGATJJMIZL5BSP7X5YJVMGCPTUEPFM4AVSRCJU", symbol: "USDC", name: "USDC (Blend)", classic: "USDC:GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5", protocols: ["blend"], decimals: 7 },
  { address: "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA", symbol: "USDC", name: "USDC (Blend v2)", classic: "USDC:GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5", protocols: ["blend"], decimals: 7 },

  // USDT
  { address: "CBL6KD2LFMLAUKFFWNNXWOXFN73GAXLEA4WMJRLQ5L76DMYTM3KWQVJN", symbol: "USDT", name: "Tether USD", classic: "USDT:GAHPYWLK6YRN7CVYZOO4H3VDRZ7PVF5UJGLZCSPAEIKJE2XSWF5LAGER", protocols: ["aquarius"], decimals: 7 },

  // BLND
  { address: "CB22KRA3YZVCNCQI64JQ5WE7UY2VAV7WFLK6A2JN3HEX56T2EDAFO7QF", symbol: "BLND", name: "Blend Token", protocols: ["blend"], decimals: 7 },

  // AQUA
  { address: "CDNVQW44C3HALYNVQ4SOBXY5EWYTGVYXX6JPESOLQDABJI5FC5LTRRUE", symbol: "AQUA", name: "Aquarius", protocols: ["aquarius"], decimals: 7 },

  // ICE
  { address: "CCQZWA6GDCNLEMNUYTCMYGIXLX3ECAXW7RICSUZWWXM5AMDWAANC4SZK", symbol: "ICE", name: "ICE Governance", classic: "ICE:GAHPYWLK6YRN7CVYZOO4H3VDRZ7PVF5UJGLZCSPAEIKJE2XSWF5LAGER", protocols: ["aquarius"], decimals: 7 },

  // PHO
  { address: "CBZ7M5B3Y4WWBZ5XK5UZCAFOEZ23KSSZXYECYX3IXM6E2JOLQC52DK32", symbol: "PHO", name: "Phoenix", protocols: ["phoenix"], decimals: 7 },

  // CETES
  { address: "CC72F57YTPX76HAA64JQOEGHQAPSADQWSY5DWVBR66JINPFDLNCQYHIC", symbol: "CETES", name: "CETES", protocols: ["blend"], decimals: 7 },

  // wETH
  { address: "CAZAQB3D7KSLSNOSQKYD2V4JP5V2Y3B4RDJZRLBFCCIXDCTE3WHSY3UE", symbol: "wETH", name: "Wrapped ETH", protocols: ["blend"], decimals: 7 },

  // wBTC
  { address: "CAP5AMC2OHNVREO66DFIN6DHJMPOBAJ2KCDDIMFBR7WWJH5RZBFM3UEI", symbol: "wBTC", name: "Wrapped BTC", protocols: ["blend"], decimals: 7 },
];

// ─── Mainnet token addresses ────────────────────────────────────
// On mainnet, each symbol has exactly 1 address (no conflict)

const MAINNET_TOKENS: TokenEntry[] = [
  { address: "CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA", symbol: "XLM", name: "Stellar Lumens", protocols: ["*"], decimals: 7 },
  { address: "CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75", symbol: "USDC", name: "USD Coin", classic: "USDC:GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN", protocols: ["*"], decimals: 7 },
  { address: "CD25MNVTZDL4Y3XBCPCJXGXATV5WUHHOWMYFF4YBEGU5FCPGMYTVG5JY", symbol: "BLND", name: "Blend Token", protocols: ["blend"], decimals: 7 },
  { address: "CAUIKL3IYGMERDRUN6YSCLWVAKIFG5Q4YJHUKM4S4NJZQIA3BAS6OJPK", symbol: "AQUA", name: "Aquarius", protocols: ["aquarius"], decimals: 7 },
  { address: "CBZ7M5B3Y4WWBZ5XK5UZCAFOEZ23KSSZXYECYX3IXM6E2JOLQC52DK32", symbol: "PHO", name: "Phoenix", protocols: ["phoenix"], decimals: 7 },
  { address: "CDTKPWPLOURQA2SGTKTUQOWRCBZEORB4BWBOMJ3D3ZTQQSGE5F6JBQLV", symbol: "EURC", name: "EUR Coin", protocols: ["*"], decimals: 7 },
];

// ─── Testnet pool registry ──────────────────────────────────────

const TESTNET_POOLS: PoolEntry[] = [
  // Aquarius AMM pools
  { address: "CD3LFMMLBQ6RBJUD3Z2LFDFE6544WDRMWHEZYPI5YDVESYRSO2TT32BX", protocol: "aquarius", tokens: ["USDC", "XLM"], tokenAddresses: ["CAZRY5GSFBFXD7H6GAFBA5YGYQTDXU4QKWKMYFWBAZFUCURN3WKX6LF5", "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC"], poolType: "constant_product", name: "USDC/XLM (Volatile)" },
  { address: "CAD5TBS4NKO35YDYZN3ULQFXDXVL7BPK4Q2RUG7N4DVPYNNOEAUAQJ6F", protocol: "aquarius", tokens: ["USDC", "XLM"], tokenAddresses: ["CAZRY5GSFBFXD7H6GAFBA5YGYQTDXU4QKWKMYFWBAZFUCURN3WKX6LF5", "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC"], poolType: "concentrated", name: "USDC/XLM (Concentrated)" },
  { address: "CC2NBF7M6QBEOUNTV2C4BK42ID2WK2O3AJRC777BND4O3B6JUV7EY33J", protocol: "aquarius", tokens: ["USDC", "USDT"], tokenAddresses: ["CAZRY5GSFBFXD7H6GAFBA5YGYQTDXU4QKWKMYFWBAZFUCURN3WKX6LF5", "CBL6KD2LFMLAUKFFWNNXWOXFN73GAXLEA4WMJRLQ5L76DMYTM3KWQVJN"], poolType: "stable", name: "USDC/USDT (Stable)" },
  { address: "CCSXYUVLYALKJGIIYMGYLZI447VS6TDWFTVDL43B4IKK2WERHLWUVCRC", protocol: "aquarius", tokens: ["XLM", "AQUA"], tokenAddresses: ["CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC", "CDNVQW44C3HALYNVQ4SOBXY5EWYTGVYXX6JPESOLQDABJI5FC5LTRRUE"], poolType: "constant_product", name: "XLM/AQUA (Volatile)" },

  // Blend lending pools
  { address: "CCEBVDYM32YNYCVNRXQKDFFPISJJCV557CDZEIRBEE4NCV4KHPQ44HGF", protocol: "blend", tokens: ["XLM", "USDC"], tokenAddresses: ["CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC", "CAQCFVLOBK5GIULPNZRGATJJMIZL5BSP7X5YJVMGCPTUEPFM4AVSRCJU"], poolType: "lending", name: "TestnetV2 Pool" },
];

// ─── Mainnet pool registry ──────────────────────────────────────

const MAINNET_POOLS: PoolEntry[] = [
  // Blend lending pools
  { address: "CAJJZSGMMM3PD7N33TAPHGBUGTB43OC73HVIK2L2G6BNGGGYOSSYBXBD", protocol: "blend", tokens: ["XLM", "USDC"], tokenAddresses: ["CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA", "CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75"], poolType: "lending", name: "Fixed Pool" },
  { address: "CAE7QVOMBLZ53CDRGK3UNRRHG5EZ5NQA7HHTFASEMYBWHG6MDFZTYHXC", protocol: "blend", tokens: ["XLM", "USDC"], tokenAddresses: ["CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA", "CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75"], poolType: "lending", name: "Orbit Pool" },

  // Phoenix AMM pools
  { address: "CBHCRSVX3ZZ7EGTSYMKPEFGZNWRVCSESQR3UABET4MIW52N4EVU6BIZX", protocol: "phoenix", tokens: ["XLM", "USDC"], tokenAddresses: ["CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA", "CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75"], poolType: "constant_product", name: "XLM/USDC (Phoenix)" },
  { address: "CBCZGGNOEUZG4CAAE7TGTQQHETZMKUT4OIPFHHPKEUX46U4KXBBZ3GLH", protocol: "phoenix", tokens: ["XLM", "PHO"], tokenAddresses: ["CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA", "CBZ7M5B3Y4WWBZ5XK5UZCAFOEZ23KSSZXYECYX3IXM6E2JOLQC52DK32"], poolType: "constant_product", name: "XLM/PHO (Phoenix)" },
];

// ─── Registry class ─────────────────────────────────────────────

export class TokenPoolRegistry {
  private tokens: Map<string, TokenEntry>; // address → entry
  private symbolIndex: Map<string, TokenEntry[]>; // symbol → entries[]
  private pools: PoolEntry[];
  private pairIndex: Map<string, PoolEntry[]>; // "XLM/USDC" → pools[]

  constructor(private readonly network: StellarNetwork) {
    const tokenList = network === "mainnet" ? MAINNET_TOKENS : TESTNET_TOKENS;
    const poolList = network === "mainnet" ? MAINNET_POOLS : TESTNET_POOLS;

    // Build token maps
    this.tokens = new Map();
    this.symbolIndex = new Map();
    for (const t of tokenList) {
      this.tokens.set(t.address, t);
      const existing = this.symbolIndex.get(t.symbol) ?? [];
      existing.push(t);
      this.symbolIndex.set(t.symbol, existing);
    }

    // Build pool pair index (both orderings: "XLM/USDC" and "USDC/XLM")
    this.pools = poolList;
    this.pairIndex = new Map();
    for (const p of poolList) {
      const key1 = `${p.tokens[0]}/${p.tokens[1]}`;
      const key2 = `${p.tokens[1]}/${p.tokens[0]}`;
      for (const key of [key1, key2]) {
        const existing = this.pairIndex.get(key) ?? [];
        existing.push(p);
        this.pairIndex.set(key, existing);
      }
    }
  }

  // ─── Token resolution ───────────────────────────────────────

  /** Get token by contract address (instant, no network call) */
  getToken(address: string): TokenEntry | undefined {
    return this.tokens.get(address);
  }

  /** Get symbol for contract address (with fallback to KNOWN_ASSETS) */
  getSymbol(address: string): string {
    const entry = this.tokens.get(address);
    if (entry) return entry.symbol;

    // Fallback to SDK KNOWN_ASSETS
    const known = KNOWN_ASSETS[this.network];
    for (const [sym, info] of Object.entries(known)) {
      if ((info as { contract?: string }).contract === address) return sym;
    }

    // Unknown — return truncated
    return address.length > 10 ? `${address.slice(0, 6)}...` : address;
  }

  /**
   * Resolve symbol to contract address.
   * If multiple addresses exist (testnet USDC), uses protocol hint to pick the right one.
   */
  resolveSymbol(symbol: string, protocol?: string): string | undefined {
    const upper = symbol.toUpperCase();
    const entries = this.symbolIndex.get(upper);
    if (!entries || entries.length === 0) return undefined;

    // Only 1 entry → return it
    if (entries.length === 1) return entries[0]!.address;

    // Multiple entries (testnet USDC problem)
    if (protocol) {
      // Find entry matching protocol
      const match = entries.find((e) => e.protocols.includes(protocol) || e.protocols.includes("*"));
      if (match) return match.address;
    }

    // Default: return first with "*" (universal), or first entry
    const universal = entries.find((e) => e.protocols.includes("*"));
    return universal?.address ?? entries[0]!.address;
  }

  /** Get all addresses for a symbol (for testnet: multiple USDC variants) */
  getAddresses(symbol: string): TokenEntry[] {
    return this.symbolIndex.get(symbol.toUpperCase()) ?? [];
  }

  /** List all known tokens */
  listTokens(): TokenEntry[] {
    return [...this.tokens.values()];
  }

  // ─── Pool resolution ────────────────────────────────────────

  /**
   * Find pools by token pair.
   * "XLM/USDC" → all pools with this pair, across all protocols.
   * Optional protocol filter.
   */
  findPools(tokenA: string, tokenB: string, protocol?: string): PoolEntry[] {
    const key = `${tokenA.toUpperCase()}/${tokenB.toUpperCase()}`;
    const pools = this.pairIndex.get(key) ?? [];
    if (protocol) return pools.filter((p) => p.protocol === protocol);
    return pools;
  }

  /** Find a specific pool by address */
  getPool(address: string): PoolEntry | undefined {
    return this.pools.find((p) => p.address === address);
  }

  /** List all pools, optionally filtered by protocol */
  listPools(protocol?: string): PoolEntry[] {
    if (protocol) return this.pools.filter((p) => p.protocol === protocol);
    return [...this.pools];
  }

  /**
   * Quick resolve: "XLM/USDC" on aquarius → pool address + token addresses.
   * Returns undefined if not found.
   */
  resolvePool(pair: string, protocol: string): PoolEntry | undefined {
    const [a, b] = pair.split(/[\/\-\s]+/).map((s) => s.trim().toUpperCase());
    if (!a || !b) return undefined;
    const pools = this.findPools(a, b, protocol);
    return pools[0]; // first match
  }

  /** Add a pool dynamically (e.g. from API fetch) */
  addPool(pool: PoolEntry): void {
    // Avoid duplicates
    if (this.pools.some((p) => p.address === pool.address)) return;
    this.pools.push(pool);
    const key1 = `${pool.tokens[0]}/${pool.tokens[1]}`;
    const key2 = `${pool.tokens[1]}/${pool.tokens[0]}`;
    for (const key of [key1, key2]) {
      const existing = this.pairIndex.get(key) ?? [];
      existing.push(pool);
      this.pairIndex.set(key, existing);
    }
  }

  /** Add a token dynamically (e.g. from on-chain resolution) */
  addToken(token: TokenEntry): void {
    if (this.tokens.has(token.address)) return;
    this.tokens.set(token.address, token);
    const existing = this.symbolIndex.get(token.symbol) ?? [];
    existing.push(token);
    this.symbolIndex.set(token.symbol, existing);
  }

  // ─── Bulk load from API ────────────────────────────────────

  /**
   * Load Aquarius pools from API and add them to the registry.
   * Call once at app startup for full pool coverage (~300 mainnet, ~63 testnet).
   * Static hardcoded pools remain as instant fallback.
   */
  async loadAquariusPools(maxPages = 3, pageSize = 100): Promise<number> {
    const AQUARIUS_BASE: Record<string, string> = {
      mainnet: "https://amm-api.aqua.network",
      testnet: "https://amm-api-testnet.aqua.network",
    };
    const base = AQUARIUS_BASE[this.network];
    if (!base) return 0;

    let loaded = 0;
    for (let page = 1; page <= maxPages; page++) {
      try {
        const res = await fetch(`${base}/pools/?sort=-liquidity&page=${page}&size=${pageSize}`, {
          headers: { Accept: "application/json", "User-Agent": "Tasmil/1.0" },
        });
        if (!res.ok) break;
        const data = await res.json() as { items: Record<string, unknown>[]; total: number };
        if (!data.items?.length) break;

        for (const p of data.items) {
          const strs = (p.tokens_str ?? []) as string[];
          const addrs = (p.tokens_addresses ?? []) as string[];
          if (strs.length < 2 || addrs.length < 2) continue;

          const symParse = (s: string) => s === "native" ? "XLM" : s.includes(":") ? s.split(":")[0]! : s;
          const tokenA = symParse(strs[0]!);
          const tokenB = symParse(strs[1]!);
          const poolType = (p.pool_type ?? "unknown") as PoolEntry["poolType"];

          // Add tokens if not known
          for (let i = 0; i < 2; i++) {
            if (!this.tokens.has(addrs[i]!)) {
              this.addToken({
                address: addrs[i]!,
                symbol: i === 0 ? tokenA : tokenB,
                protocols: ["aquarius"],
              });
            }
          }

          // Add pool
          this.addPool({
            address: p.address as string,
            protocol: "aquarius",
            tokens: [tokenA, tokenB],
            tokenAddresses: [addrs[0]!, addrs[1]!],
            poolType,
            name: `${tokenA}/${tokenB} (${poolType.replace(/_/g, " ")})`,
          });
          loaded++;
        }

        if (data.items.length < pageSize) break;
      } catch {
        break;
      }
    }
    return loaded;
  }
}

// ─── Singleton per network ──────────────────────────────────────

const registries = new Map<StellarNetwork, TokenPoolRegistry>();

export function getTokenPoolRegistry(network: StellarNetwork): TokenPoolRegistry {
  let registry = registries.get(network);
  if (!registry) {
    registry = new TokenPoolRegistry(network);
    registries.set(network, registry);
  }
  return registry;
}
