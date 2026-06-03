// ─── Yield / Earn Types ───────────────────────────────────────────

export type PoolType = "lending" | "lp" | "vault" | "backstop" | "staking";

export type ProtocolId =
  | "blend"
  | "blend-backstop"
  | "soroswap"
  | "aquarius"
  | "phoenix"
  | "sdex"
  | "defindex"
  | "templar"
  | "tasmil"
  | "allbridge";

export type RiskLevel = "low" | "medium" | "high";

export interface APYComponents {
  /** Base yield from fees or interest */
  base: number | null;
  /** Reward token yield */
  reward: number | null;
  /** Total = base + reward */
  total: number | null;
  /** Symbol of the reward token, if any */
  rewardToken?: string;
}

export interface PoolTerms {
  /** Lockup period in seconds (0 = no lockup) */
  lockupSeconds?: number;
  /** Entry fee in basis points */
  entryFeeBps?: number;
  /** Exit fee in basis points */
  exitFeeBps?: number;
}

export interface YieldOpportunity {
  /** Unique protocol identifier */
  protocol: ProtocolId;
  /** Pool type classification */
  type: PoolType;
  /** Human-readable name (e.g. "Blend USDC-XLM Pool") */
  name: string;
  /** Underlying asset symbols */
  assets: string[];
  /** APY breakdown */
  apy: APYComponents;
  /** TVL in USD string (e.g. "1234567.89") */
  tvl: string | null;
  /** Pool / vault / market address on-chain */
  poolAddress?: string;
  /** Stake contract address (for AMMs with staking) */
  stakeAddress?: string;
  /** Liquidity/risk level */
  risk: RiskLevel;
  /** Availability status */
  status: "ok" | "unavailable";
  /** Error message if status === "unavailable" */
  error?: string;
  /** Protocol-specific metadata */
  meta?: Record<string, unknown>;
  // ── AMM-specific ──
  fee?: string;
  poolType?: string;
  reserves?: Array<{ symbol: string; amount: string }>;
  // ── Lending-specific ──
  supplyApy?: number | null;
  borrowApy?: number | null;
  utilization?: number | null;
  collateralFactor?: number | null;
  available?: string | null;
}

// ─── Earn Filter Params ───────────────────────────────────────────

export interface YieldFilterParams {
  /** Filter by underlying asset symbol (e.g. "USDC") */
  assetFilter?: string;
  /** Minimum TVL in USD */
  minTvl?: number;
  /** Minimum APY as a number (e.g. 5 = 5%) */
  minApy?: number;
  /** Only include these pool types */
  types?: PoolType[];
  /** Only include these protocols */
  protocols?: ProtocolId[];
}
