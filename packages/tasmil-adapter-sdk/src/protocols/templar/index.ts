/**
 * Templar Protocol Adapter
 *
 * Templar Finance provides two distinct services:
 * 1. Cross-chain lending (NEAR-based markets): collateral assets → borrow USDC/PyUSD
 *    Supported pairs: XLM/USDC, XLM/PyUSD, BTC/USDC, wBTC/USDC, stNEAR/USDC
 *    Market state is read via NEAR RPC view calls (no gas, no signing).
 *
 * 2. Cross-chain swaps across 31+ chains (Stellar, Ethereum, Solana, Bitcoin, NEAR, …)
 *    Uses a deposit-address model: user sends to depositAddress, Templar routes the funds.
 *    Supply to lending markets uses this same Stellar-classic payment path.
 *
 * Usage:
 *   sdk.templar.getLendingMarkets()
 *   sdk.templar.loadMarket("ixlm-ixlmusdc.v1.tmplr.near")
 *   sdk.templar.getPosition("ixlm-ixlmusdc.v1.tmplr.near", "user.tmplr.near")
 *   sdk.templar.getSwapQuote({ fromChain: "stellar", toChain: "ethereum", ... })
 *   sdk.templar.buildSupplyXdr({ sender, asset: "XLM", amount: "100", marketId, recipientNearAccount })
 */

import { Asset, Memo, Operation, TransactionBuilder } from "@stellar/stellar-sdk";
import type { TasmilClientConfig, XDR } from "../../types/common.js";
import type { LendingMarket, LendingPosition } from "../../types/lending.js";
import type { YieldOpportunity } from "../../types/yield.js";
import type { SwapAdapterQuoteParams, SwapQuote } from "../../types/swap.js";
import type { BridgeRequest, BridgeQuote } from "../../types/bridge.js";
import { createHorizonClient } from "../../utils/stellar-client.js";
import { getNetworkPassphrase } from "../../utils/network.js";
import { nearViewCall } from "../../utils/near-rpc.js";
import { getAssetSymbol } from "../../utils/asset-resolver.js";
import { createLogger } from "../../utils/logger.js";

const log = createLogger("templar");

// ─── Constants ────────────────────────────────────────────────────

const TEMPLAR_API = "https://app.templarfi.org/api";

/** Soroban contract ID for native Stellar Templar operations */
export const TEMPLAR_CONTRACT = "CCLWL5NYSV2WJQ3VBU44AMDHEVKEPA45N2QP2LL62O3JVKPGWWAQUVAG";

/** All active Templar NEAR lending market contract IDs */
export const TEMPLAR_MARKETS = [
  "ixlm-ixlmusdc.v1.tmplr.near",
  "ixlm-ixlmpyusd.v1.tmplr.near",
  "ibtc-iethusdc.v1.tmplr.near",
  "iethwbtc-iethusdc.v1.tmplr.near",
  "ibtc-usdc-1.v1.tmplr.near",
  "stnear-usdc-1.v1.tmplr.near",
] as const;

export type TemplarMarketId = (typeof TEMPLAR_MARKETS)[number];

// ─── Types ────────────────────────────────────────────────────────

export interface TemplarMarketInfo {
  marketId: string;
  /** Human-readable collateral asset name (e.g. "XLM", "BTC", "stNEAR") */
  collateral: string;
  /** NEAR Intents asset ID for the collateral */
  collateralAssetId: string;
  /** Human-readable borrow asset name (e.g. "USDC (Stellar)", "PyUSD (Stellar)") */
  borrow: string;
  /** NEAR Intents asset ID for the borrow asset */
  borrowAssetId: string;
  /** Maximum LTV ratio as decimal (e.g. 0.75 for 75%). Derived from MCR. */
  maxLtv: number | null;
  /** Borrow APR as decimal (e.g. 0.05 for 5%). From get_current_snapshot.interest_rate. */
  borrowApr: number | null;
  /** Estimated supply APY as decimal. Approximated from borrowAPR × utilization × 0.85. */
  supplyApy: number | null;
  /** Total supplied in borrow-asset units (divided by 1e7) */
  totalSupply: number;
  /** Total borrowed in borrow-asset units */
  totalBorrowed: number;
  /** Available liquidity in borrow-asset units */
  available: number;
  /** Utilization ratio (0–1) */
  utilization: number | null;
  status: "ok" | "unavailable";
  error?: string;
}

export interface TemplarSwapQuoteParams {
  fromChain: string;
  toChain: string;
  fromToken: string;
  toToken: string;
  /** Amount in smallest unit for the source chain (e.g. ×1e7 for Stellar assets) */
  amount: string;
  senderAddress: string;
  recipientAddress: string;
  /** Slippage tolerance in basis points (default: 300 = 3%) */
  slippageBps?: number;
}

export interface TemplarSwapResult {
  /** Deposit address — only present when dry=false */
  depositAddress?: string;
  /** Optional Stellar memo for the payment */
  depositMemo?: string;
  fromAmount?: string;
  toAmountEstimate?: string;
  minToAmount?: string;
  estimatedTimeSeconds?: number;
  expiresAt?: string;
  fee?: {
    serviceFee?: string;
    serviceFeeBps?: number;
    platformFeeBps?: number;
  };
}

export interface TemplarSupplyParams {
  /** Sender's Stellar address (G...) */
  sender: string;
  /** Stellar asset: "XLM" or "CODE:ISSUER" */
  asset: string;
  /** Human-readable amount (e.g. "100") */
  amount: string;
  /** Templar NEAR market contract ID */
  marketId: string;
  /** Recipient NEAR sub-account (e.g. "user.tmplr.near") */
  recipientNearAccount: string;
}

export interface TemplarSupplyXdrResult {
  xdr: XDR;
  depositAddress: string;
  depositMemo?: string;
  fromAmount?: string;
  toAmountEstimate?: string;
}

// ─── Internal helpers ─────────────────────────────────────────────

/** Resolve a NEAR Intents asset ID fragment to a human-readable symbol */
function resolveTokenName(assetId: string): string {
  if (assetId.includes("111bzQBB5v7Ah")) return "XLM";
  if (assetId.includes("111bzQBB65Gx")) return "USDC (Stellar)";
  if (assetId.includes("G54FvwhYaPve")) return "PyUSD (Stellar)";
  if (assetId.includes("a0b86991c6218")) return "USDC (ETH)";
  if (assetId.includes("2260fac5e554")) return "wBTC (ETH)";
  if (assetId.includes("btc.omft")) return "BTC";
  if (assetId.includes("meta-pool") || assetId.includes("stnear")) return "stNEAR";
  if (assetId.includes("17208628f84f")) return "USDC (NEAR)";
  if (!assetId) return "unknown";
  return assetId.length > 20 ? assetId.slice(-20) : assetId;
}

type NearRecord = Record<string, unknown>;

/**
 * Extract a canonical asset ID string from a Templar NEAR asset config object.
 *
 * Templar uses several wrapper variants for token types:
 *   { "Nep245": { "token_id": "..." } }     — multi-token standard
 *   { "Nep141": { "account_id": "..." } }    — fungible token standard
 *   { "Nep141Near": { "account_id": "..." }} — near-native FT
 *   { "FtBridge": { "contract": "..." } }    — bridged FT
 *   { "Stellar": { ... } }                   — Stellar asset (NEAR Intents)
 *
 * If a clean string ID is not found, falls back to JSON.stringify so that
 * resolveTokenName can still pattern-match embedded substrings.
 */
function extractAssetId(assetObj: unknown): string {
  if (!assetObj || typeof assetObj !== "object") return "";
  const obj = assetObj as NearRecord;

  const WRAPPER_KEYS = ["Nep245", "Nep141", "Nep141Near", "FtBridge", "Ft", "Token", "Stellar"];
  const ID_FIELDS = ["token_id", "account_id", "contract", "address", "id"];

  for (const wk of WRAPPER_KEYS) {
    const wrapper = obj[wk];
    if (!wrapper || typeof wrapper !== "object") continue;
    const w = wrapper as NearRecord;
    for (const idf of ID_FIELDS) {
      if (w[idf] && typeof w[idf] === "string") {
        return w[idf] as string;
      }
    }
  }

  // Fallback: JSON-encode and let pattern-matching handle it
  return JSON.stringify(obj);
}

/** Parse raw NEAR view call responses into a typed TemplarMarketInfo */
function parseMarketData(
  marketId: string,
  config: NearRecord,
  snap: NearRecord | null,
  metrics: NearRecord | null,
): TemplarMarketInfo {
  // Extract collateral and borrow asset IDs — handles all Templar wrapper variants
  const collateralAssetId = extractAssetId(config["collateral_asset"]);
  const borrowAssetId = extractAssetId(config["borrow_asset"]);

  // LTV = 1 / MCR (Minimum Collateral Ratio)
  const mcr = config["borrow_mcr_maintenance"];
  const maxLtv = mcr ? 1 / parseFloat(String(mcr)) : null;

  // Borrow APR from current snapshot interest rate (decimal form, e.g. 0.05 = 5%)
  const interestRate = snap?.["interest_rate"];
  const borrowApr = interestRate ? parseFloat(String(interestRate)) : null;

  // Liquidity metrics (all values are ×1e7 on NEAR side)
  const depositedActive = metrics?.["deposited_active"];
  const borrowed = metrics?.["borrowed"];
  const available = metrics?.["available"];

  const totalSupply = depositedActive ? parseInt(String(depositedActive)) / 1e7 : 0;
  const totalBorrowed = borrowed ? parseInt(String(borrowed)) / 1e7 : 0;
  const availableNum = available ? parseInt(String(available)) / 1e7 : 0;

  const utilization = totalSupply > 0 ? totalBorrowed / totalSupply : null;

  // Supply APY ≈ borrowAPR × utilization × (1 – 0.15 estimated protocol fee)
  const supplyApy =
    borrowApr !== null && utilization !== null
      ? borrowApr * utilization * 0.85
      : null;

  return {
    marketId,
    collateral: resolveTokenName(collateralAssetId),
    collateralAssetId,
    borrow: resolveTokenName(borrowAssetId),
    borrowAssetId,
    maxLtv,
    borrowApr,
    supplyApy,
    totalSupply,
    totalBorrowed,
    available: availableNum,
    utilization,
    status: "ok",
  };
}

// ─── TemplarAdapter ───────────────────────────────────────────────

export class TemplarAdapter {
  /** Soroban contract for native Stellar Templar operations */
  readonly sorobanContract = TEMPLAR_CONTRACT;

  constructor(private readonly config: TasmilClientConfig) {}

  // ── Lending: Market Data ───────────────────────────────────────

  /**
   * Load live data for a single Templar NEAR lending market.
   * Makes 3 parallel NEAR RPC view calls: get_configuration, get_current_snapshot, get_borrow_asset_metrics.
   */
  async loadMarket(marketId: string): Promise<TemplarMarketInfo> {
    try {
      const [marketConfig, snap, metrics] = await Promise.all([
        nearViewCall(marketId, "get_configuration") as Promise<NearRecord>,
        nearViewCall(marketId, "get_current_snapshot").catch(() => null) as Promise<NearRecord | null>,
        nearViewCall(marketId, "get_borrow_asset_metrics").catch(() => null) as Promise<NearRecord | null>,
      ]);

      if (!marketConfig) {
        return {
          marketId,
          collateral: "?",
          collateralAssetId: "",
          borrow: "?",
          borrowAssetId: "",
          maxLtv: null,
          borrowApr: null,
          supplyApy: null,
          totalSupply: 0,
          totalBorrowed: 0,
          available: 0,
          utilization: null,
          status: "unavailable",
          error: "No configuration returned from NEAR RPC",
        };
      }

      return parseMarketData(marketId, marketConfig, snap, metrics);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log.warn(`Templar loadMarket failed for ${marketId}`, { err: msg });
      return {
        marketId,
        collateral: "?",
        collateralAssetId: "",
        borrow: "?",
        borrowAssetId: "",
        maxLtv: null,
        borrowApr: null,
        supplyApy: null,
        totalSupply: 0,
        totalBorrowed: 0,
        available: 0,
        utilization: null,
        status: "unavailable",
        error: msg,
      };
    }
  }

  /**
   * Load all 6 Templar lending markets in parallel.
   */
  async loadAllMarkets(): Promise<TemplarMarketInfo[]> {
    return Promise.all(TEMPLAR_MARKETS.map((id) => this.loadMarket(id)));
  }

  /**
   * Returns all Templar markets as LendingMarket objects (compatible with BlendAdapter interface).
   */
  async getLendingMarkets(): Promise<LendingMarket[]> {
    const markets = await this.loadAllMarkets();
    return markets.map((m) => ({
      protocol: "templar" as const,
      poolAddress: m.marketId,
      poolName: `Templar ${m.collateral}/${m.borrow}`,
      asset: m.borrow,
      supplyApy: m.supplyApy,
      borrowApy: m.borrowApr,
      collateralFactor: m.maxLtv,
      utilization: m.utilization,
      available: m.available > 0 ? m.available.toFixed(2) : null,
      tvl: m.totalSupply > 0 ? m.totalSupply.toFixed(2) : null,
      status: m.status,
      error: m.error,
    }));
  }

  // ── Lending: User Positions ────────────────────────────────────

  /**
   * Get a user's borrow + supply position on a Templar market.
   * @param marketId - Templar NEAR market contract ID
   * @param accountId - NEAR account ID (e.g. "user.tmplr.near")
   */
  async getPosition(marketId: string, accountId: string): Promise<LendingPosition> {
    const [borrowPos, supplyPos] = await Promise.all([
      nearViewCall(marketId, "get_borrow_position", { account_id: accountId }).catch(() => null),
      nearViewCall(marketId, "get_supply_position", { account_id: accountId }).catch(() => null),
    ]);

    const borrow = borrowPos as NearRecord | null;
    const supply = supplyPos as NearRecord | null;

    return {
      protocol: "templar" as const,
      poolAddress: marketId,
      asset: "borrow-asset",
      borrowed: borrow
        ? String(
            borrow["borrowed"] !== undefined
              ? (parseInt(String(borrow["borrowed"])) / 1e7).toFixed(7)
              : "0",
          )
        : undefined,
      supplied: supply
        ? String(
            supply["supplied"] !== undefined
              ? (parseInt(String(supply["supplied"])) / 1e7).toFixed(7)
              : "0",
          )
        : undefined,
      healthFactor:
        borrow?.["health_factor"] != null
          ? parseFloat(String(borrow["health_factor"])) || null
          : null,
    };
  }

  /**
   * Get the raw borrow health record for an account on a market.
   * Returns null if the account has no borrow position.
   */
  async getBorrowHealth(
    marketId: string,
    accountId: string,
  ): Promise<NearRecord | null> {
    const result = await nearViewCall(marketId, "get_borrow_position", {
      account_id: accountId,
    }).catch(() => null);
    return result as NearRecord | null;
  }

  /**
   * Get pending borrow interest for an account on a market.
   */
  async getPendingInterest(
    marketId: string,
    accountId: string,
    snapshotLimit?: number,
  ): Promise<NearRecord | null> {
    const args: NearRecord = { account_id: accountId };
    if (snapshotLimit !== undefined) args["snapshot_limit"] = snapshotLimit;
    const result = await nearViewCall(
      marketId,
      "get_borrow_position_pending_interest",
      args,
    ).catch(() => null);
    return result as NearRecord | null;
  }

  /**
   * Get pending supply yield for an account on a market.
   */
  async getPendingYield(
    marketId: string,
    accountId: string,
    snapshotLimit?: number,
  ): Promise<NearRecord | null> {
    const args: NearRecord = { account_id: accountId };
    if (snapshotLimit !== undefined) args["snapshot_limit"] = snapshotLimit;
    const result = await nearViewCall(
      marketId,
      "get_supply_position_pending_yield",
      args,
    ).catch(() => null);
    return result as NearRecord | null;
  }

  // ── Swap: Token List ───────────────────────────────────────────

  /**
   * Fetch all tokens supported for swap across all 31+ chains.
   * Returns the raw token list from the Templar API.
   */
  async getSwapTokens(): Promise<NearRecord[]> {
    const res = await fetch(`${TEMPLAR_API}/swaps/tokens`);
    if (!res.ok) {
      throw new Error(`Templar API error: ${res.status} ${res.statusText}`);
    }
    const data = (await res.json()) as NearRecord;
    return (data["tokens"] as NearRecord[] | undefined) ?? [];
  }

  // ── Swap: Quote & Execute ──────────────────────────────────────

  /**
   * Get a cross-chain swap quote from Templar.
   *
   * @param params - Swap parameters. `amount` must be in smallest unit (e.g. ×1e7 for Stellar assets).
   * @param dry - If true, returns estimate only (no deposit address). Default: true.
   * @returns Swap result. `depositAddress` is only set when dry=false.
   */
  async getSwapQuote(
    params: TemplarSwapQuoteParams,
    dry = true,
  ): Promise<TemplarSwapResult> {
    const res = await fetch(`${TEMPLAR_API}/swaps/quote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fromChain: params.fromChain,
        toChain: params.toChain,
        fromToken: params.fromToken,
        toToken: params.toToken,
        amount: params.amount,
        senderAddress: params.senderAddress,
        recipientAddress: params.recipientAddress,
        slippageTolerance: params.slippageBps ?? 300,
        dry,
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText);
      throw new Error(`Templar swap quote failed (${res.status}): ${text}`);
    }

    const data = (await res.json()) as NearRecord;

    // API returns error details in "detail" or "message" fields
    if (data["detail"] || (!data["toAmountEstimate"] && !data["depositAddress"])) {
      const errMsg = String(data["detail"] ?? data["message"] ?? "No estimate returned");
      throw new Error(`Templar: ${errMsg}`);
    }

    const feeBreakdown = data["feeBreakdown"] as NearRecord | undefined;

    return {
      depositAddress: data["depositAddress"] as string | undefined,
      depositMemo: data["depositMemo"] as string | undefined,
      fromAmount: data["fromAmount"] as string | undefined,
      toAmountEstimate: data["toAmountEstimate"] as string | undefined,
      minToAmount: data["minToAmount"] as string | undefined,
      estimatedTimeSeconds: data["estimatedTimeSeconds"] as number | undefined,
      expiresAt: data["expiresAt"] as string | undefined,
      fee: feeBreakdown
        ? {
            serviceFee: feeBreakdown["serviceFee"] as string | undefined,
            serviceFeeBps: feeBreakdown["serviceFeeBps"] as number | undefined,
            platformFeeBps: feeBreakdown["platformFeeBps"] as number | undefined,
          }
        : undefined,
    };
  }

  /**
   * Check the status of a Templar swap by deposit address.
   */
  async getSwapStatus(depositAddress: string): Promise<NearRecord> {
    const res = await fetch(
      `${TEMPLAR_API}/swaps/status?depositAddress=${encodeURIComponent(depositAddress)}`,
    );
    if (!res.ok) {
      throw new Error(
        `Templar status check failed: ${res.status} ${res.statusText}`,
      );
    }
    return res.json() as Promise<NearRecord>;
  }

  // ── Supply: Stellar → Templar NEAR Market ──────────────────────

  /**
   * Build a Stellar classic payment XDR to supply collateral to a Templar lending market.
   *
   * Flow:
   * 1. Calls Templar API to obtain a deposit address + memo (dry=false)
   * 2. Builds a Stellar classic Payment operation to that deposit address
   * 3. The NEAR Intents MPC bridge routes the funds into the target NEAR market
   *
   * The returned XDR must be signed and submitted to Horizon by the caller.
   */
  async buildSupplyXdr(params: TemplarSupplyParams): Promise<TemplarSupplyXdrResult> {
    const { sender, asset, amount, marketId, recipientNearAccount } = params;

    if (!sender) throw new Error("sender address is required");
    if (parseFloat(amount) <= 0) throw new Error("amount must be positive");

    // Convert human-readable amount to Stellar smallest unit (7 decimals)
    const amountRaw = String(Math.floor(parseFloat(amount) * 1e7));

    // Obtain real deposit address from Templar API
    const quote = await this.getSwapQuote(
      {
        fromChain: "stellar",
        toChain: "near",
        fromToken: asset,
        toToken: marketId,
        amount: amountRaw,
        senderAddress: sender,
        recipientAddress: recipientNearAccount,
        slippageBps: 100,
      },
      false, // execute — must get real deposit address
    );

    if (!quote.depositAddress) {
      throw new Error(
        "Templar API did not return a deposit address for the supply operation",
      );
    }

    // Build Stellar classic payment XDR
    const horizon = createHorizonClient(this.config);
    const account = await horizon.loadAccount(sender);
    const networkPassphrase = getNetworkPassphrase(this.config.network);

    let paymentAsset: Asset;
    if (!asset || asset === "XLM" || asset === "native") {
      paymentAsset = Asset.native();
    } else {
      const parts = asset.split(":");
      if (parts.length !== 2 || !parts[0] || !parts[1]) {
        throw new Error(
          `Invalid asset format: "${asset}" — expected "XLM" or "CODE:ISSUER"`,
        );
      }
      paymentAsset = new Asset(parts[0], parts[1]);
    }

    const builder = new TransactionBuilder(account, {
      fee: "1000",
      networkPassphrase,
    })
      .addOperation(
        Operation.payment({
          destination: quote.depositAddress,
          asset: paymentAsset,
          amount,
        }),
      )
      .setTimeout(300);

    if (quote.depositMemo) {
      const memoStr = String(quote.depositMemo);
      if (memoStr.length > 28) {
        throw new Error(
          `Templar deposit memo too long for Stellar Memo.text (max 28 chars): "${memoStr}"`,
        );
      }
      builder.addMemo(Memo.text(memoStr));
    }

    const xdr = builder.build().toXDR();

    return {
      xdr,
      depositAddress: quote.depositAddress,
      depositMemo: quote.depositMemo,
      fromAmount: quote.fromAmount,
      toAmountEstimate: quote.toAmountEstimate,
    };
  }

  // ── SwapAggregator interface ───────────────────────────────────

  /**
   * SwapAggregator-compatible quote method.
   * Attempts a Stellar-to-Stellar dry-run quote through Templar.
   *
   * Note: Templar is a cross-chain DEX. Same-chain Stellar swaps route through NEAR
   * and back, adding latency (~2min) vs native DEXes. Best used for pairs not
   * available on Soroswap/Aquarius/Phoenix/SDEX.
   */
  async getAdapterQuote(params: SwapAdapterQuoteParams): Promise<SwapQuote> {
    const { tokenIn, tokenOut, amount, from, slippageBps } = params;

    try {
      // Amount from the aggregator is already in stroops (smallest unit, ×1e7).
      // Templar API also expects smallest unit — pass through as-is.
      const amountRaw = amount;

      // Templar API expects human-readable token symbols (e.g. "XLM", "USDC"), not contract addresses
      const fromSymbol = getAssetSymbol(tokenIn, this.config.network);
      const toSymbol = getAssetSymbol(tokenOut, this.config.network);

      const quote = await this.getSwapQuote(
        {
          fromChain: "stellar",
          toChain: "stellar",
          fromToken: fromSymbol,
          toToken: toSymbol,
          amount: amountRaw,
          senderAddress: from ?? "",
          recipientAddress: from ?? "",
          slippageBps: slippageBps ?? 300,
        },
        true, // dry run — estimate only
      );

      const amountOut = quote.toAmountEstimate ?? "0";
      const amountIn = quote.fromAmount ?? amountRaw;
      const feeBps = quote.fee?.serviceFeeBps ?? quote.fee?.platformFeeBps ?? 10; // default 0.1%

      return {
        protocol: "templar",
        amountIn,
        amountOut,
        fee: String(Math.floor(parseFloat(amountIn) * feeBps / 10000)),
        feePercent: `~${(feeBps / 100).toFixed(2)}%`,
        route: [tokenIn, tokenOut],
        estimatedTime: quote.estimatedTimeSeconds
          ? `~${Math.ceil(quote.estimatedTimeSeconds / 60)}min`
          : "~2min",
        status: amountOut !== "0" ? "ok" : "no_route",
      };
    } catch (err) {
      return {
        protocol: "templar",
        amountIn: amount,
        amountOut: "0",
        fee: "0",
        feePercent: "N/A",
        route: [],
        estimatedTime: "N/A",
        status: "unavailable",
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  // ── BridgeAggregator interface ─────────────────────────────────

  /**
   * BridgeAggregator-compatible quote method.
   * Supports any of the 31+ chains Templar supports.
   */
  async getBridgeAdapterQuote(request: BridgeRequest): Promise<BridgeQuote> {
    const { fromChain, toChain, asset, assetOut, amount, from, to } = request;

    try {
      // For Stellar source assets, convert human-readable to smallest unit
      const isStellarSource = fromChain.toLowerCase() === "stellar";
      const amountRaw = isStellarSource
        ? String(Math.floor(parseFloat(amount) * 1e7))
        : amount;

      const quote = await this.getSwapQuote(
        {
          fromChain,
          toChain,
          fromToken: asset,
          toToken: assetOut ?? asset,
          amount: amountRaw,
          senderAddress: from ?? "",
          recipientAddress: to ?? from ?? "",
          slippageBps: 300,
        },
        true,
      );

      const amountOut = quote.toAmountEstimate ?? "0";
      const amountIn = quote.fromAmount ?? amountRaw;
      const feeBps = quote.fee?.serviceFeeBps ?? quote.fee?.platformFeeBps ?? 10;

      return {
        provider: "templar",
        amountIn,
        amountOut,
        fee: String(Math.floor(parseFloat(amountIn) * feeBps / 10000)),
        feePercent: `~${(feeBps / 100).toFixed(2)}%`,
        estimatedTime: quote.estimatedTimeSeconds
          ? `~${Math.ceil(quote.estimatedTimeSeconds / 60)}min`
          : "~2min",
        crossChainSwap: fromChain.toLowerCase() !== toChain.toLowerCase(),
        status: amountOut !== "0" ? "ok" : "error",
      };
    } catch (err) {
      return {
        provider: "templar",
        amountIn: amount,
        amountOut: "0",
        fee: "0",
        feePercent: "N/A",
        estimatedTime: "N/A",
        crossChainSwap: fromChain.toLowerCase() !== toChain.toLowerCase(),
        status: "unavailable",
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  // ── YieldAggregator interface ──────────────────────────────────

  /**
   * Returns Templar lending markets as YieldOpportunity objects.
   * Markets are typed as "lending" with medium risk (cross-chain lending).
   */
  async getYieldOpportunities(): Promise<YieldOpportunity[]> {
    const markets = await this.loadAllMarkets();

    return markets
      .filter((m) => m.status === "ok")
      .map((m) => ({
        protocol: "templar" as const,
        type: "lending" as const,
        name: `Templar — ${m.collateral} → ${m.borrow}`,
        assets: [m.collateral, m.borrow],
        apy: {
          base: m.supplyApy,
          reward: null,
          total: m.supplyApy,
        },
        tvl: m.totalSupply > 0 ? m.totalSupply.toFixed(2) : null,
        poolAddress: m.marketId,
        risk: "medium" as const, // cross-chain lending carries additional bridge risk
        status: "ok" as const,
        supplyApy: m.supplyApy,
        borrowApy: m.borrowApr,
        collateralFactor: m.maxLtv,
        utilization: m.utilization,
        available: m.available > 0 ? m.available.toFixed(2) : null,
        meta: {
          sorobanContract: TEMPLAR_CONTRACT,
          nearMarketId: m.marketId,
          collateralAssetId: m.collateralAssetId,
          borrowAssetId: m.borrowAssetId,
        },
      }));
  }
}
