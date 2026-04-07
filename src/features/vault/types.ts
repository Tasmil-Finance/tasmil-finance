export type VaultToken = "USDC" | "XLM";

export interface VaultStats {
  totalTvl: string;
  currentApy: number;
  totalDepositors: number;
  strategies: StrategyInfo[];
}

export interface StrategyInfo {
  name: string;
  apy: number;
  allocation: number;
}

export interface VaultPosition {
  shares: string;
  balanceUsd: string;
  depositedUsd: string;
  profitUsd: string;
  profitPercent: number;
  currentApy: number;
  allocations: AllocationInfo[];
}

export interface AllocationInfo {
  name: string;
  weight: number;
  apy: number;
}

export interface ActivityItem {
  type: "deposit" | "withdraw" | "rebalance" | "harvest";
  amount?: string;
  token?: string;
  detail?: string;
  timestamp: string;
  txHash?: string;
}

export interface DepositResponse {
  xdr: string;
  estimatedShares: string;
  estimatedValueUsd: string;
  fee: string;
}

export interface WithdrawResponse {
  xdr: string;
  shares: string;
  estimatedAmount: string;
  estimatedValueUsd: string;
}

export type DepositStatus =
  | "idle"
  | "building"
  | "signing"
  | "confirming"
  | "success"
  | "error";
export type WithdrawStatus =
  | "idle"
  | "building"
  | "signing"
  | "confirming"
  | "success"
  | "error";
