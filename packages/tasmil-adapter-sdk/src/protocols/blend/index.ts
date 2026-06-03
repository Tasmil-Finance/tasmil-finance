/**
 * Blend V2 Protocol Adapter
 * Usage: sdk.blend.listPools(), sdk.blend.getPool(address), sdk.blend.deposit(...)
 */

import type { TasmilClientConfig } from "../../types/common.js";
import type { YieldOpportunity } from "../../types/yield.js";
import type { LendingMarket } from "../../types/lending.js";
import type { TxBuildResult } from "../../types/common.js";
import { getAssetPriceMap } from "../../utils/price.js";
import {
  getAllBlendPools,
  getBlendPoolByAddress,
  getBlendPoolsByAsset,
  getBlendUserPositions,
  loadBlendRegistry,
  clearBlendRegistryCache,
  getBlendBackstopInfo,
  getBlendBackstopUserBalance,
  getBlendReserveInfo,
  type BlendPoolInfo,
  type BlendRegistryData,
  type BlendUserPositions,
  type BlendBackstopInfo,
  type BlendBackstopUserBalance,
} from "./pools.js";
import {
  buildDeposit,
  buildWithdraw,
  buildBorrow,
  buildRepay,
  buildToggleCollateral,
  buildBackstopDeposit,
  buildBackstopQueueWithdrawal,
  buildBackstopDequeueWithdrawal,
  buildBackstopWithdraw,
  buildCometJoinPool,
  buildCometExitPool,
  buildClaimEmissions,
  type BlendOperationParams,
  type BackstopOperationParams,
  type CometJoinParams,
  type CometExitParams,
} from "./operations.js";

export type { BlendPoolInfo, BlendRegistryData, BlendUserPositions, BlendUserAssetPosition, BlendReserveInfo, BlendBackstopInfo, BlendBackstopUserBalance } from "./pools.js";

import type { BlendReserveInfo } from "./pools.js";
export type { BlendOperationParams, BackstopOperationParams, CometJoinParams, CometExitParams } from "./operations.js";
export { PrecheckError } from "./prechecks.js";

export class BlendAdapter {
  constructor(private readonly config: TasmilClientConfig) {}

  /**
   * List all active Blend V2 lending pools with reserves and APY data.
   */
  async listPools(): Promise<BlendPoolInfo[]> {
    return getAllBlendPools(this.config);
  }

  /**
   * Get a single pool by its contract address.
   */
  async getPool(address: string): Promise<BlendPoolInfo | undefined> {
    return getBlendPoolByAddress(this.config, address);
  }

  /**
   * Find pools that contain a specific asset (symbol or contract address).
   */
  async getPoolsByAsset(assetSymbolOrAddress: string): Promise<BlendPoolInfo[]> {
    return getBlendPoolsByAsset(this.config, assetSymbolOrAddress);
  }

  /**
   * Load the full registry (backstop + pools + reserves).
   */
  async loadRegistry(forceRefresh = false): Promise<BlendRegistryData> {
    return loadBlendRegistry(this.config, forceRefresh);
  }

  /**
   * Get a user's current positions in a pool.
   * Returns actual token amounts (not raw bToken/dToken shares).
   * USD fields (totalSuppliedUsd, borrowCapacityUsd, netApy) are null if oracle unavailable.
   */
  async getUserPositions(poolAddress: string, userAddress: string): Promise<BlendUserPositions> {
    return getBlendUserPositions(this.config, poolAddress, userAddress);
  }

  /**
   * Get backstop APR info for a pool (interest + emission APR, Q4W%, TVL).
   * Mirrors blend-ui BackstopAPR calculation exactly.
   */
  async getReserveInfo(poolAddress: string, assetAddress: string): Promise<BlendReserveInfo | null> {
    return getBlendReserveInfo(this.config, poolAddress, assetAddress);
  }

  async getBackstopInfo(poolAddress: string): Promise<BlendBackstopInfo> {
    return getBlendBackstopInfo(this.config, poolAddress);
  }

  async getBackstopUserBalance(poolAddress: string, userAddress: string): Promise<BlendBackstopUserBalance> {
    return getBlendBackstopUserBalance(this.config, poolAddress, userAddress);
  }

  /**
   * Clear cached registry data (e.g. after network switch).
   */
  clearCache(): void {
    clearBlendRegistryCache(this.config.network);
  }

  // ─── Operation builders ─────────────────────────────────────────
  // Return unsigned XDR + estimated fee. Caller signs and submits.

  async buildDeposit(params: BlendOperationParams): Promise<TxBuildResult> {
    return buildDeposit(this.config, params);
  }

  async buildWithdraw(params: BlendOperationParams): Promise<TxBuildResult> {
    return buildWithdraw(this.config, params);
  }

  async buildBorrow(params: BlendOperationParams): Promise<TxBuildResult> {
    return buildBorrow(this.config, params);
  }

  async buildRepay(params: BlendOperationParams): Promise<TxBuildResult> {
    return buildRepay(this.config, params);
  }

  async buildToggleCollateral(params: BlendOperationParams & { enable: boolean }): Promise<TxBuildResult> {
    return buildToggleCollateral(this.config, params);
  }

  async buildBackstopDeposit(params: BackstopOperationParams): Promise<TxBuildResult> {
    return buildBackstopDeposit(this.config, params);
  }

  async buildBackstopQueueWithdrawal(params: BackstopOperationParams): Promise<TxBuildResult> {
    return buildBackstopQueueWithdrawal(this.config, params);
  }

  async buildBackstopDequeueWithdrawal(params: BackstopOperationParams): Promise<TxBuildResult> {
    return buildBackstopDequeueWithdrawal(this.config, params);
  }

  async buildBackstopWithdraw(params: BackstopOperationParams): Promise<TxBuildResult> {
    return buildBackstopWithdraw(this.config, params);
  }

  async buildCometJoinPool(params: CometJoinParams): Promise<TxBuildResult> {
    return buildCometJoinPool(this.config, params);
  }

  async buildCometExitPool(params: CometExitParams): Promise<TxBuildResult> {
    return buildCometExitPool(this.config, params);
  }

  async buildClaimEmissions(params: { pool: string; from: string; reserveTokenIds: number[] }): Promise<TxBuildResult> {
    return buildClaimEmissions(this.config, params);
  }

  // ─── Yield Aggregator interface ───────────────────────────────

  /**
   * Returns all Blend pools as YieldOpportunity objects for the yield aggregator.
   * APY values are returned as **percentages** (9.3 = 9.3%).
   * Blend SDK returns decimals (0.093 = 9.3%) — we multiply by 100 here.
   */
  async getYieldOpportunities(): Promise<YieldOpportunity[]> {
    const pools = await this.listPools();

    // Fetch asset prices for TVL conversion to USD
    const priceMap = await getAssetPriceMap();

    const opportunities: YieldOpportunity[] = [];

    for (const pool of pools) {
      for (const reserve of pool.reserves) {
        // Blend SDK returns APY as decimal (0.093 = 9.3%). Convert to percentage.
        const supplyPct = reserve.supplyApy != null ? Math.round(reserve.supplyApy * 100 * 100) / 100 : null;
        const borrowPct = reserve.borrowApy != null ? Math.round(reserve.borrowApy * 100 * 100) / 100 : null;

        // Per-reserve BLND emission APY (from SDK, null if not calculated)
        const emissionPct = reserve.supplyEmissionApy != null
          ? Math.round(reserve.supplyEmissionApy * 100 * 100) / 100
          : null;

        const totalPct = supplyPct != null
          ? (supplyPct ?? 0) + (emissionPct ?? 0)
          : null;

        // Estimate TVL in USD using StellarTerm prices
        let tvlUsd: string | null = null;
        if (reserve.totalSupplied != null) {
          const sym = (reserve.symbol ?? "").toUpperCase();
          const price = priceMap.get(sym);
          if (price != null) {
            tvlUsd = String(Math.round(reserve.totalSupplied * price));
          }
        }

        opportunities.push({
          protocol: "blend",
          type: "lending",
          name: `${pool.name} — ${reserve.symbol}`,
          assets: [reserve.symbol],
          apy: {
            base: supplyPct,
            reward: emissionPct,
            total: totalPct,
            ...(emissionPct != null && emissionPct > 0 ? { rewardToken: "BLND" } : {}),
          },
          tvl: tvlUsd,
          poolAddress: pool.address,
          risk: reserve.collateralFactor > 0.8 ? "medium" : "low",
          status: pool.status === "active" ? "ok" : "unavailable",
          supplyApy: supplyPct,
          borrowApy: borrowPct,
          collateralFactor: reserve.collateralFactor,
          utilization: null,
          available: null,
        });
      }
    }

    return opportunities;
  }

  /**
   * Returns all Blend pools as LendingMarket objects.
   * APY values are returned as **percentages** (9.3 = 9.3%).
   */
  async getLendingMarkets(): Promise<LendingMarket[]> {
    const pools = await this.listPools();
    const markets: LendingMarket[] = [];

    for (const pool of pools) {
      for (const reserve of pool.reserves) {
        const supplyPct = reserve.supplyApy != null ? Math.round(reserve.supplyApy * 100 * 100) / 100 : null;
        const borrowPct = reserve.borrowApy != null ? Math.round(reserve.borrowApy * 100 * 100) / 100 : null;

        markets.push({
          protocol: "blend",
          poolAddress: pool.address,
          poolName: pool.name,
          asset: reserve.symbol,
          assetContract: reserve.assetAddress,
          supplyApy: supplyPct,
          borrowApy: borrowPct,
          collateralFactor: reserve.collateralFactor,
          utilization: null,
          available: null,
          status: pool.status === "active" ? "ok" : "unavailable",
        });
      }
    }

    return markets;
  }
}
