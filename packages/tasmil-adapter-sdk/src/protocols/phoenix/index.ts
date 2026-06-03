/**
 * Phoenix Hub DEX Protocol Adapter
 * Usage: sdk.phoenix.listPools(), sdk.phoenix.getQuote(...)
 */

import type { TasmilClientConfig } from "../../types/common.js";
import type { YieldOpportunity } from "../../types/yield.js";
import type { SwapAdapterQuoteParams } from "../../types/swap.js";
import { getPhoenixContracts } from "../../utils/contracts.js";
import { viewCall, buildScVal, invokeContract } from "../../utils/soroban.js";
import { decodeScVal } from "../../utils/xdr-parser.js";
import { getAssetSymbol, resolveAsset } from "../../utils/asset-resolver.js";
import { createLogger } from "../../utils/logger.js";

const log = createLogger("phoenix");

// ─── Types ────────────────────────────────────────────────────────

export interface PhoenixPoolInfo {
  pool_address?: string;
  asset_a?: { address: string };
  asset_b?: { address: string };
  asset_lp_share?: { address: string };
  stake_address?: string;
  pool_response?: PhoenixPoolResponse;
  [key: string]: unknown;
}

export interface PhoenixPoolResponse {
  asset_a?: { address: string; amount: string };
  asset_b?: { address: string; amount: string };
  asset_lp_share?: { address: string; total_amount: string };
  [key: string]: unknown;
}

export interface PhoenixSimulateSwapResponse {
  ask_amount?: string;
  spread_amount?: string;
  commission_amount?: string;
  total_return?: string;
  [key: string]: unknown;
}

// ─── PhoenixAdapter ───────────────────────────────────────────────

export class PhoenixAdapter {
  private readonly factoryAddress: string;
  private readonly multihopAddress: string;

  constructor(private readonly config: TasmilClientConfig) {
    const contracts = getPhoenixContracts(config.network);
    this.factoryAddress = contracts.factory;
    this.multihopAddress = contracts.multihop;
  }

  /**
   * List all Phoenix pools with details.
   */
  async listPools(): Promise<PhoenixPoolInfo[]> {
    if (!this.factoryAddress) {
      throw new Error(`No Phoenix factory configured for network ${this.config.network}`);
    }
    const xdr = await viewCall(this.config, this.factoryAddress, "query_all_pools_details", []);
    if (!xdr) return [];
    return decodeScVal(xdr) as PhoenixPoolInfo[];
  }

  /**
   * Get pool addresses list only.
   */
  async listPoolAddresses(): Promise<string[]> {
    const xdr = await viewCall(this.config, this.factoryAddress, "query_pools", []);
    if (!xdr) return [];
    return decodeScVal(xdr) as string[];
  }

  /**
   * Get details of a single pool by address.
   */
  async getPool(poolAddress: string): Promise<PhoenixPoolInfo | null> {
    const xdr = await viewCall(this.config, this.factoryAddress, "query_pool_details", [
      buildScVal("address", poolAddress),
    ]);
    if (!xdr) return null;
    return decodeScVal(xdr) as PhoenixPoolInfo;
  }

  /**
   * Find a pool by token pair addresses.
   */
  async findPoolByTokenPair(
    tokenA: string,
    tokenB: string,
  ): Promise<string | null> {
    const xdr = await viewCall(
      this.config,
      this.factoryAddress,
      "query_for_pool_by_token_pair",
      [buildScVal("address", tokenA), buildScVal("address", tokenB)],
    );
    if (!xdr) return null;
    return decodeScVal(xdr) as string;
  }

  /**
   * Get on-chain pool reserves info.
   */
  async getPoolInfo(poolAddress: string): Promise<PhoenixPoolResponse | null> {
    const xdr = await viewCall(this.config, poolAddress, "query_pool_info", []);
    if (!xdr) return null;
    return decodeScVal(xdr) as PhoenixPoolResponse;
  }

  /**
   * Simulate a swap on a pool.
   */
  async simulateSwap(
    poolAddress: string,
    offerAsset: string,
    sellAmount: string,
  ): Promise<PhoenixSimulateSwapResponse | null> {
    const xdr = await viewCall(this.config, poolAddress, "simulate_swap", [
      buildScVal("address", offerAsset),
      buildScVal("i128", sellAmount),
    ]);
    if (!xdr) return null;
    return decodeScVal(xdr) as PhoenixSimulateSwapResponse;
  }

  /**
   * Build a swap transaction on Phoenix.
   */
  async buildSwap(params: {
    tokenIn: string;
    tokenOut: string;
    amount: string;
    from: string;
    slippageBps?: number;
  }): Promise<{ xdr: string; estimatedFee: string }> {
    const contractIn = resolveAsset(params.tokenIn, "contract", this.config.network);
    const contractOut = resolveAsset(params.tokenOut, "contract", this.config.network);

    const pool = await this.findPoolByTokenPair(contractIn, contractOut);
    if (!pool) throw new Error("No Phoenix pool found for this pair");

    const deadline = String(Math.floor(Date.now() / 1000) + 300);
    const maxSpreadBps = params.slippageBps ?? 100;

    const args = [
      buildScVal("address", params.from),                            // sender
      buildScVal("address", contractIn),                             // offer_asset
      buildScVal("i128", params.amount),                             // offer_amount
      buildScVal("void", undefined),                                 // ask_asset_min_amount (None)
      buildScVal("i64", String(maxSpreadBps)),                       // max_spread_bps
      buildScVal("u64", deadline),                                   // deadline
      buildScVal("i64", "100"),                                      // max_allowed_fee_bps
    ];

    const result = await invokeContract(this.config, pool, "swap", args, params.from);
    return {
      xdr: result.xdr,
      estimatedFee: result.simulationResult.resourceFee,
    };
  }

  /**
   * SwapAdapter-compatible quote method.
   */
  async getAdapterQuote(params: SwapAdapterQuoteParams): Promise<{
    protocol: "phoenix";
    amountIn: string;
    amountOut: string;
    fee: string;
    feePercent: string;
    route: string[];
    estimatedTime: string;
    poolAddress?: string;
    status: "ok" | "no_route";
  }> {
    try {
      // Phoenix Soroban calls require contract addresses (C... 56-char), not symbols
      const contractIn = resolveAsset(params.tokenIn, "contract", this.config.network);
      const contractOut = resolveAsset(params.tokenOut, "contract", this.config.network);

      const poolAddress = await this.findPoolByTokenPair(contractIn, contractOut);

      if (!poolAddress) {
        return {
          protocol: "phoenix",
          amountIn: params.amount,
          amountOut: "0",
          fee: "0",
          feePercent: "N/A",
          route: [],
          estimatedTime: "N/A",
          status: "no_route",
        };
      }

      const sim = await this.simulateSwap(poolAddress, contractIn, params.amount);
      const amountOut = String(sim?.ask_amount ?? "0");

      const tokenInSym = getAssetSymbol(params.tokenIn, this.config.network);
      const tokenOutSym = getAssetSymbol(params.tokenOut, this.config.network);

      return {
        protocol: "phoenix",
        amountIn: params.amount,
        amountOut,
        fee: String(sim?.commission_amount ?? "0"),
        feePercent: "~0.30%",
        route: [tokenInSym, tokenOutSym],
        estimatedTime: "~5s",
        poolAddress,
        status: amountOut !== "0" ? "ok" : "no_route",
      };
    } catch (err) {
      log.warn("Phoenix getAdapterQuote failed", { err: String(err) });
      return {
        protocol: "phoenix",
        amountIn: params.amount,
        amountOut: "0",
        fee: "0",
        feePercent: "N/A",
        route: [],
        estimatedTime: "N/A",
        status: "no_route" as const,
      };
    }
  }

  // ─── Yield Aggregator interface ────────────────────────────────

  async getYieldOpportunities(): Promise<YieldOpportunity[]> {
    let pools: PhoenixPoolInfo[];
    try {
      pools = await this.listPools();
    } catch (err) {
      log.warn("Phoenix listPools failed", { err: String(err) });
      return [];
    }

    const opportunities: YieldOpportunity[] = [];

    for (const pool of pools) {
      const tokenASym = pool.asset_a
        ? getAssetSymbol(pool.asset_a.address, this.config.network)
        : "?";
      const tokenBSym = pool.asset_b
        ? getAssetSymbol(pool.asset_b.address, this.config.network)
        : "?";

      const poolResponse = pool.pool_response as PhoenixPoolResponse | undefined;
      const reserveA = poolResponse?.asset_a?.amount;
      const reserveB = poolResponse?.asset_b?.amount;

      const reserves = [];
      if (reserveA) reserves.push({ symbol: tokenASym, amount: reserveA });
      if (reserveB) reserves.push({ symbol: tokenBSym, amount: reserveB });

      opportunities.push({
        protocol: "phoenix",
        type: "lp",
        name: `Phoenix ${tokenASym}-${tokenBSym}`,
        assets: [tokenASym, tokenBSym],
        apy: { base: null, reward: null, total: null },
        tvl: null,
        poolAddress: (pool.pool_address as string | undefined),
        stakeAddress: (pool.stake_address as string | undefined),
        risk: "medium",
        status: "ok",
        reserves,
      });
    }

    return opportunities;
  }
}
