// ─── Network ─────────────────────────────────────────────────────

export type StellarNetwork = "mainnet" | "testnet";

export interface StellarNetworkConfig {
  networkPassphrase: string;
  rpcUrl: string;
  horizonUrl: string;
  friendbotUrl: string | null;
}

// ─── Assets ──────────────────────────────────────────────────────

/** Stellar asset in "CODE:ISSUER" format, or "XLM" for native */
export type ClassicAsset = string;

/** Soroban contract address (C... 56 chars) */
export type ContractAddress = string;

/** Human-readable symbol (XLM, USDC, etc.) */
export type AssetSymbol = string;

export type AssetFormat = "classic" | "contract" | "symbol";

// ─── Transactions ─────────────────────────────────────────────────

/** Base64-encoded XDR transaction */
export type XDR = string;

export interface TxBuildResult {
  xdr: XDR;
  estimatedFee?: string;
  /** Auth entries required (base64 XDR) */
  auth?: string[];
  /** Enriched context for display — APY in %, position in token units */
  context?: {
    symbol?: string;
    reserveApy?: { supplyApy: number; borrowApy: number };
    currentPosition?: { suppliedAmount?: number | null; borrowedAmount?: number | null };
  };
}

export interface TxSubmitResult {
  success: boolean;
  hash?: string;
  error?: string;
  detail?: string;
}

// ─── SDK Config ───────────────────────────────────────────────────

export interface TasmilClientConfig {
  network: StellarNetwork;
  /** Override Soroban RPC URL */
  rpcUrl?: string;
  /** Override Horizon URL */
  horizonUrl?: string;
  /** Soroswap API key(s) for higher rate limits — comma-separated */
  soroswapApiKeys?: string;
  /** DeFindex REST API base URL (default: https://api.defindex.io) */
  defindexApiUrl?: string;
  /** DeFindex REST API key (Bearer token). Falls back to DEFINDEX_API_KEY env var */
  defindexApiKey?: string;
  /** Tasmil backend REST API base URL (default: http://localhost:6756) */
  tasmilApiUrl?: string;
  /** Tasmil backend REST API key (Bearer token). Falls back to TASMIL_API_KEY env var */
  tasmilApiKey?: string;
}

// ─── Simulation ───────────────────────────────────────────────────

export interface SimulationResult {
  result: string | null;
  resourceFee: string;
  auth: string[];
  footprint: {
    readOnly: string[];
    readWrite: string[];
  };
  cost: {
    cpuInsns: string;
    memBytes: string;
  };
}
