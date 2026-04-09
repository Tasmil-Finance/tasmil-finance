export interface RebalanceStatus {
  ready: boolean;
  halted: boolean;
  haltReason: string | null;
}

export interface DiscoveredPool {
  id: string;
  protocol: "blend" | "soroswap" | "phoenix" | "aquarius" | "sdex";
  poolType: "lending" | "backstop" | "lp";
  poolAddress: string;
  strategyContractAddress?: string;
  asset: string;
  assetSymbol: string;
  pairedAsset?: string;
  pairedAssetSymbol?: string;
  currentApy: number;
  tvlUsd: number;
  volume7d?: number;
  q4wPercent?: number;
  riskScore: number;
  enabled: boolean;
  lastUpdated: string;
}

export interface ApySnapshot {
  poolId: string;
  apy: number;
  tvlUsd: number;
  timestamp: string;
}
