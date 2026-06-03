/**
 * Cross-chain token registry types.
 *
 * These types describe tokens that may exist on multiple chains (Stellar, EVM, Solana)
 * and their bridging/swapping capabilities across the aggregator.
 */

// ─── Chain ──────────────────────────────────────────────────────

export interface ChainInfo {
  id: string;
  name: string;
  symbol: string;
  logo?: string;
}

// ─── Token ──────────────────────────────────────────────────────

export interface CrossChainToken {
  symbol: string;
  name: string;
  logo?: string;
  decimals: number;
  /** Chain IDs where this token exists */
  chains: string[];
  /** Chain ID → contract/address on that chain */
  addresses: Record<string, string>;
  /** Stellar classic-asset issuer (G...). Set only for SAC-wrapped classic assets that can be trustlined. */
  issuer?: string;
  /** Whether this token can be bridged across chains */
  bridgeable: boolean;
  /** Bridge provider IDs that support this token (e.g. "allbridge", "templar") */
  bridgeableVia: string[];
  /** Swap protocol IDs that support this token on Stellar (e.g. "soroswap", "aquarius") */
  swappableOn: string[];
}

// ─── Filter ─────────────────────────────────────────────────────

export interface FilterTokensParams {
  selectedToken: string;
  selectedChain: string;
  direction: "in" | "out";
}

export interface FilterTokensResult {
  tokens: CrossChainToken[];
  chains: string[];
}
