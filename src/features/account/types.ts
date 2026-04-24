export type RiskPreset = "Safe" | "Balanced" | "Aggressive";

export interface PresetCardData {
  name: RiskPreset;
  estimatedApy: number;
  poolCount: number;
  poolTypes: string[];
  risks: string[];
  topPools: { name: string; apy: number; weight: number }[];
}

export interface PositionData {
  totalValueUsd: number;
  totalDepositedUsd: number;
  totalWithdrawnUsd: number;
  netDepositsUsd: number;
  profitUsd: number;
  profitPercent: number;
  currentApy: number;
  preset: string;
  status: string;
  baseAsset?: string;
  positions: {
    poolName: string;
    poolType: string;
    protocol: string;
    allocationPercent: number;
    valueUsd: number;
    apy: number;
    q4wExpiresAt?: string;
  }[];
  gasReserveUsd: number;
  balanceStale?: boolean;
  /** True when the keeper's on-chain session-key whitelist is missing a
   *  currently-deployed strategy. UI prompts the user to Refresh Session Key. */
  sessionKeyStale?: boolean;
}

export interface ActivityItem {
  id: string;
  type: string;
  amount?: number;
  amountUsd?: number;
  token?: string;
  detail?: string;
  txHash?: string;
  createdAt: string;
}
