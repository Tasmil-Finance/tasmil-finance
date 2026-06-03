// ─── Lending Types ────────────────────────────────────────────────

export interface LendingMarket {
  protocol: "blend" | "templar";
  /** Pool / market identifier address */
  poolAddress: string;
  /** Human-readable pool name */
  poolName?: string;
  /** Underlying asset symbol */
  asset: string;
  /** Asset contract address */
  assetContract?: string;
  supplyApy: number | null;
  borrowApy: number | null;
  /** Loan-to-value / collateral factor (0–1) */
  collateralFactor: number | null;
  /** Utilization ratio (0–1) */
  utilization: number | null;
  /** Available liquidity to borrow (human-readable) */
  available: string | null;
  /** Total supply in USD */
  tvl?: string | null;
  status: "ok" | "unavailable";
  error?: string;
}

export interface LendingPosition {
  protocol: "blend" | "templar";
  poolAddress: string;
  asset: string;
  /** Supplied amount (human-readable) */
  supplied?: string;
  /** Borrowed amount (human-readable) */
  borrowed?: string;
  /** Collateral tokens held */
  collateral?: string;
  /** Pending reward tokens */
  pendingRewards?: string;
  healthFactor?: number | null;
}

export interface BorrowQuote {
  protocol: "blend" | "templar";
  poolAddress: string;
  asset: string;
  amount: string;
  /** APY at time of quote */
  borrowApy: number;
  /** Required collateral amount */
  requiredCollateral?: string;
  /** Max borrow given current collateral */
  maxBorrow?: string;
  status: "ok" | "insufficient_collateral" | "unavailable";
}
