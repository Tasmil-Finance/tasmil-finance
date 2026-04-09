export type RiskPreset = 'Safe' | 'Balanced' | 'Aggressive';

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
  profitUsd: number;
  profitPercent: number;
  currentApy: number;
  preset: string;
  status: string;
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
