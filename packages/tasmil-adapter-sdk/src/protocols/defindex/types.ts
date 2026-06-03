/**
 * DeFindex Protocol Types
 *
 * Types for vault discovery, detail, balance, history, and account performance.
 * Used by both the DefindexAdapter and DefindexApiClient.
 */

// ─── Core (backward-compatible) ──────────────────────────────────

export interface DefindexVault {
  address: string;
  name: string;
  /** Vault ticker symbol (e.g. "BNSUSDC", "hana"). Resolved from on-chain symbol(). */
  symbol?: string;
  asset: string;
  assetAddress?: string;
  totalSupply?: string;
  tvl?: string | null;
  apy?: number | null;
  status: "ok" | "unavailable";
}

// ─── Enriched types from REST API ────────────────────────────────

export interface DefindexStrategy {
  address: string;
  name: string;
  paused: boolean;
}

export interface DefindexVaultAsset {
  address: string;
  name: string;
  symbol: string;
  strategies: DefindexStrategy[];
}

export interface DefindexFundBreakdown {
  asset: string;
  idle_amount: string;
  invested_amount: string;
  strategy_allocations: Array<{
    amount: string;
    paused: boolean;
    strategy_address: string;
  }>;
  total_amount: string;
}

export interface DefindexVaultDetail {
  address: string;
  name: string;
  symbol: string;
  roles: {
    manager: string;
    emergencyManager: string;
    rebalanceManager: string;
    feeReceiver: string;
  };
  assets: DefindexVaultAsset[];
  totalManagedFunds: DefindexFundBreakdown[];
  feesBps: { vaultFee: number; defindexFee: number };
  apy: number | null;
  status: "ok" | "unavailable";
}

export interface DefindexUserBalance {
  dfTokens: string;
  underlyingBalance: number[];
}

// ─── History & Performance ───────────────────────────────────────

export interface DefindexVaultHistoryParams {
  period?: "all" | "7d" | "30d" | "90d" | "1y";
  interval?: "hourly" | "daily" | "weekly" | "monthly";
  startDate?: string;
  endDate?: string;
}

export interface DefindexVaultHistory {
  vaultAddress: string;
  period: string;
  interval: string;
  dataPoints: unknown[];
  [key: string]: unknown;
}

export interface DefindexAccountPerformanceParams {
  interval?: "hourly" | "daily" | "weekly" | "monthly";
  startDate?: string;
  endDate?: string;
  includeEvents?: boolean;
}

export interface DefindexAccountPerformance {
  accountAddress: string;
  vaultAddress: string;
  interval: string;
  currentPosition: {
    shares: string;
    estimatedValue: string;
    assets: unknown[];
    [key: string]: unknown;
  };
  dataPoints: unknown[];
  [key: string]: unknown;
}
