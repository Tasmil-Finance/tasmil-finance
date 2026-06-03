/**
 * Tasmil Finance — protocol types for the Tasmil managed-strategy adapter.
 *
 * These describe the backend API responses (port 6756) that the adapter
 * normalises into SDK-standard shapes (YieldOpportunity, TxBuildResult).
 */

// ─── Preset / Strategy ──────────────────────────────────────────────

export interface TasmilPreset {
  /** Preset name: SAFE, BALANCED, AGGRESSIVE */
  name: string;
  /** Weighted-average projected APY (percentage, e.g. 12.4 = 12.4%) */
  estimatedApy: number;
  /** Number of pools this preset allocates across */
  poolCount: number;
  /** Pool type labels (e.g. ["lending", "lp"]) */
  poolTypes: string[];
  /** Static risk descriptions */
  risks: string[];
  /** Top 3 pools with allocation percentages */
  topPools: TasmilPresetPool[];
}

export interface TasmilPresetPool {
  /** Pool display name */
  name: string;
  /** Pool APY (percentage) */
  apy: number;
  /** Target allocation weight (percentage, e.g. 35 = 35%) */
  weightPercent: number;
}

// ─── Account Strategy Status ────────────────────────────────────────

export interface AccountStrategyStatus {
  /** Whether the wallet has a Tasmil smart account */
  hasAccount: boolean;
  /** Account lifecycle status */
  status?: "DEPLOYING" | "AWAITING_FUND" | "ACTIVE" | "HALTED" | "REVOKED";
  /** Current risk preset */
  preset?: "SAFE" | "BALANCED" | "AGGRESSIVE";
  /** Base asset the account was funded with */
  baseAsset?: string;
  /** Active assets (e.g. ["USDC", "XLM"]) */
  activeAssets?: string[];
  /** Total portfolio value in USD */
  totalValueUsd?: number;
  /** Total deposited in USD */
  totalDepositedUsd?: number;
  /** Current blended APY (percentage) */
  currentApy?: number;
  /** Profit/loss in USD */
  profitUsd?: number;
  /** Profit/loss as percentage */
  profitPercent?: number;
  /** Per-pool positions */
  positions?: AccountPosition[];
  /** Suggested next step for the guided flow */
  nextStep: "deploy" | "setup" | "fund" | "active" | "halted" | "revoked";
}

export interface AccountPosition {
  /** Pool display name */
  poolName: string;
  /** Protocol (blend, aquarius, soroswap, etc.) */
  protocol: string;
  /** Position value in USD */
  valueUsd: number;
  /** Current pool APY (percentage) */
  apy: number;
  /** Allocation percentage (e.g. 35 = 35%) */
  allocationPercent: number;
}

// ─── Backend API Response Shapes ─────────────────────────────────────

/** Presets endpoint returns {success: true, data: PresetCardData[]} */
export interface PresetCardData {
  name: string;
  estimatedApy: number;
  poolCount: number;
  poolTypes: string[];
  risks: string[];
  topPools: { name: string; apy: number; weight: number }[];
}

/** Position endpoint returns {success: true, data: PositionResponse} */
export interface PositionResponse {
  totalValueUsd: number;
  totalDepositedUsd: number;
  totalWithdrawnUsd?: number;
  netDepositsUsd?: number;
  profitUsd: number;
  profitPercent: number;
  currentApy: number;
  preset: string;
  status: string;
  baseAsset: string;
  activeAssets: string[];
  positions: {
    poolName: string;
    poolType: string;
    protocol: string;
    allocationPercent: number;
    valueUsd: number;
    apy: number;
    q4wExpiresAt?: string;
  }[];
  gasReserveUsd?: number;
  balanceStale?: boolean;
  sessionKeyStale?: boolean;
}

/** Backend wraps all responses in {success: boolean, data: T} */
export interface BackendEnvelope<T> {
  success: boolean;
  data?: T;
  message?: string;
  statusCode?: number;
}

/** Deploy / Setup / Fund endpoints return XDR */
export interface BackendTxResponse {
  xdr: string;
  estimatedFee?: string;
}

/** Preset update response */
export interface BackendPresetResponse {
  success: boolean;
  message?: string;
}
