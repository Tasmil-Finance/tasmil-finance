/**
 * Soroswap DEX Aggregator Protocol Adapter
 * Usage: sdk.soroswap.listPools(), sdk.soroswap.getQuote(...)
 */

import type { TasmilClientConfig } from "../../types/common.js";
import type { YieldOpportunity } from "../../types/yield.js";
import type { SwapAdapterQuoteParams } from "../../types/swap.js";
import { SOROSWAP_API_BASE, getSoroswapApiKey } from "../../utils/network.js";
import { getAssetSymbol, resolveAsset } from "../../utils/asset-resolver.js";
import { createLogger } from "../../utils/logger.js";

const log = createLogger("soroswap");

// ─── Types ────────────────────────────────────────────────────────

export interface SoroswapPool {
  address?: string;
  tokenA?: string;
  tokenB?: string;
  token0?: string;
  token1?: string;
  token0_address?: string;
  token1_address?: string;
  reserveA?: string | number;
  reserveB?: string | number;
  tvl?: string | number;
  tvlUsd?: number;
  volume_24h?: string | number;
  fee?: string | number;
  totalFeeBps?: number;
  protocol?: string;
  poolType?: string;
  [key: string]: unknown;
}

export interface SoroswapQuote {
  amountOut?: string;
  amount_out?: string;
  path?: string[];
  trade?: unknown;
  [key: string]: unknown;
}

export type SoroswapProtocol = "soroswap" | "phoenix" | "aqua" | "sdex";

export interface SoroswapQuoteRequest {
  assetIn: string;
  assetOut: string;
  amount: string;
  tradeType: "EXACT_IN" | "EXACT_OUT";
  protocols?: SoroswapProtocol[];
  slippageBps?: number;
  network?: "mainnet" | "testnet";
}

// ─── API Error ────────────────────────────────────────────────────

export class SoroswapApiError extends Error {
  public readonly status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "SoroswapApiError";
    this.status = status;
  }
}

// ─── SoroswapAdapter ─────────────────────────────────────────────

export class SoroswapAdapter {
  constructor(private readonly config: TasmilClientConfig) {}

  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    const apiKey = getSoroswapApiKey(this.config.soroswapApiKeys);
    if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;
    return headers;
  }

  private async handleResponse<T>(res: Response, operation: string): Promise<T> {
    if (!res.ok) {
      let detail = res.statusText;
      try {
        const body = (await res.json()) as Record<string, string>;
        detail = body.detail ?? body.error ?? body.message ?? body.title ?? res.statusText;
      } catch { /* ignore parse errors */ }
      const msg = `Soroswap ${operation}: ${detail}`;
      log.error(msg);
      throw new SoroswapApiError(msg, res.status);
    }
    return (await res.json()) as T;
  }

  /**
   * List Soroswap LP pools (also supports phoenix/sdex/aquarius via protocol param).
   */
  async listPools(
    protocol: SoroswapProtocol = "soroswap",
  ): Promise<SoroswapPool[]> {
    const network = this.config.network;
    const url = `${SOROSWAP_API_BASE}/pools?network=${network}&protocol=${protocol}`;
    try {
      const res = await fetch(url, { headers: this.buildHeaders() });
      return this.handleResponse<SoroswapPool[]>(res, "listPools");
    } catch (err) {
      log.warn("Soroswap listPools error", { err: String(err), protocol });
      return [];
    }
  }

  /**
   * Get a quote for a swap via Soroswap aggregator.
   */
  async getQuote(req: SoroswapQuoteRequest): Promise<SoroswapQuote> {
    const body = {
      ...req,
      protocols: req.protocols ?? (["soroswap", "phoenix", "aqua", "sdex"] as SoroswapProtocol[]),
    };
    const res = await fetch(`${SOROSWAP_API_BASE}/quote`, {
      method: "POST",
      headers: this.buildHeaders(),
      body: JSON.stringify(body),
    });
    return this.handleResponse<SoroswapQuote>(res, "getQuote");
  }

  /**
   * Build a transaction XDR from a quote.
   */
  async buildSwapTx(params: {
    quote: unknown;
    from: string;
    to?: string;
    referralId?: string;
    sponsor?: string;
  }): Promise<{ xdr: string }> {
    const res = await fetch(`${SOROSWAP_API_BASE}/quote/build`, {
      method: "POST",
      headers: this.buildHeaders(),
      body: JSON.stringify(params),
    });
    return this.handleResponse<{ xdr: string }>(res, "buildSwapTx");
  }

  /**
   * Get asset price in reference currency.
   */
  async getPrice(
    asset: string | string[],
    referenceCurrency = "USD",
  ): Promise<unknown> {
    const network = this.config.network;
    const body = Array.isArray(asset)
      ? { assets: asset, referenceCurrency, network }
      : { asset, referenceCurrency, network };
    const res = await fetch(`${SOROSWAP_API_BASE}/price`, {
      method: "POST",
      headers: this.buildHeaders(),
      body: JSON.stringify(body),
    });
    return this.handleResponse<unknown>(res, "getPrice");
  }

  /**
   * SwapAdapter-compatible quote method.
   */
  async getAdapterQuote(params: SwapAdapterQuoteParams): Promise<{
    protocol: "soroswap";
    amountIn: string;
    amountOut: string;
    fee: string;
    feePercent: string;
    route: string[];
    estimatedTime: string;
    status: "ok" | "no_route";
    metadata?: unknown;
  }> {
    try {
      // Soroswap API requires Soroban contract addresses (C... 56 chars), not symbols
      const contractIn = resolveAsset(params.tokenIn, "contract", this.config.network);
      const contractOut = resolveAsset(params.tokenOut, "contract", this.config.network);

      const quote = await this.getQuote({
        assetIn: contractIn,
        assetOut: contractOut,
        amount: params.amount,
        tradeType: "EXACT_IN",
        network: this.config.network,
      });

      const amountOut =
        String(quote.amountOut ?? quote.amount_out ?? "0");

      if (!amountOut || amountOut === "0") {
        return {
          protocol: "soroswap",
          amountIn: params.amount,
          amountOut: "0",
          fee: "0",
          feePercent: "N/A",
          route: [],
          estimatedTime: "N/A",
          status: "no_route",
        };
      }

      const tokenInSym = getAssetSymbol(params.tokenIn, this.config.network);
      const tokenOutSym = getAssetSymbol(params.tokenOut, this.config.network);
      const routeSymbols = Array.isArray(quote.path)
        ? quote.path.map((p: string) => getAssetSymbol(p, this.config.network))
        : [tokenInSym, tokenOutSym];

      // Soroswap charges ~0.30% per hop; estimate fee in input token units
      const feeRate = 0.003;
      const estimatedFee = String(Math.floor(Number(params.amount) * feeRate));

      return {
        protocol: "soroswap",
        amountIn: params.amount,
        amountOut,
        fee: estimatedFee,
        feePercent: "~0.30%",
        route: routeSymbols,
        estimatedTime: "~5s",
        status: "ok",
        metadata: quote,
      };
    } catch (err) {
      log.warn("Soroswap getAdapterQuote failed", { err: String(err) });
      throw err;
    }
  }

  // ─── Liquidity operations ──────────────────────────────────────

  /**
   * Build add-liquidity XDR via Soroswap API.
   */
  async addLiquidity(params: {
    assetA: string;
    assetB: string;
    amountA: string;
    amountB: string;
    to: string;
    slippageBps?: number;
  }): Promise<{ xdr: string; estimatedFee?: string }> {
    const network = this.config.network;
    const res = await fetch(`${SOROSWAP_API_BASE}/liquidity/add?network=${network}`, {
      method: "POST",
      headers: this.buildHeaders(),
      body: JSON.stringify(params),
    });
    return this.handleResponse<{ xdr: string; estimatedFee?: string }>(res, "addLiquidity");
  }

  /**
   * Build remove-liquidity XDR via Soroswap API.
   */
  async removeLiquidity(params: {
    assetA: string;
    assetB: string;
    liquidity: string;
    amountA: string;
    amountB: string;
    to: string;
    slippageBps?: number;
  }): Promise<{ xdr: string; estimatedFee?: string }> {
    const network = this.config.network;
    const res = await fetch(`${SOROSWAP_API_BASE}/liquidity/remove?network=${network}`, {
      method: "POST",
      headers: this.buildHeaders(),
      body: JSON.stringify(params),
    });
    return this.handleResponse<{ xdr: string; estimatedFee?: string }>(res, "removeLiquidity");
  }

  // ─── Yield Aggregator interface ────────────────────────────────

  async getYieldOpportunities(): Promise<YieldOpportunity[]> {
    const pools = await this.listPools("soroswap");
    const opportunities: YieldOpportunity[] = [];

    for (const pool of pools) {
      const token0Sym = getAssetSymbol(
        (pool.token0 ?? pool.token0_address ?? "") as string,
        this.config.network,
      );
      const token1Sym = getAssetSymbol(
        (pool.token1 ?? pool.token1_address ?? "") as string,
        this.config.network,
      );

      const tvlRaw = pool.tvl;
      const tvl = tvlRaw != null ? String(tvlRaw) : null;

      const feeRaw = pool.fee;
      const feePct = feeRaw != null ? Number(feeRaw) * 100 : null;

      opportunities.push({
        protocol: "soroswap",
        type: "lp",
        name: `Soroswap ${token0Sym}-${token1Sym}`,
        assets: [token0Sym, token1Sym],
        apy: {
          base: feePct,
          reward: null,
          total: feePct,
        },
        tvl,
        poolAddress: pool.address,
        risk: "medium",
        status: "ok",
        fee: feeRaw != null ? String(feeRaw) : undefined,
      });
    }

    return opportunities;
  }
}
