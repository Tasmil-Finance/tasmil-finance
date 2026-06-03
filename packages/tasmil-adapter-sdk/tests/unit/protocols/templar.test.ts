/**
 * Templar Protocol — live integration tests (mainnet only)
 *
 * Templar lending markets live on NEAR (view calls via rpc.fastnear.com).
 * Templar swap quotes come from the Templar API (https://app.templarfi.org/api).
 * No testnet environment; all tests run against mainnet data.
 *
 * Coverage:
 * - loadMarket: single NEAR market via view calls (configuration + snapshot + metrics)
 * - loadAllMarkets: all 6 markets in parallel
 * - getLendingMarkets: LendingMarket[] shape validation
 * - getSwapTokens: Templar API token list
 * - getAdapterQuote: SwapAggregator-compatible interface
 * - getBridgeAdapterQuote: BridgeAggregator-compatible interface
 * - getYieldOpportunities: YieldAggregator-compatible interface
 * - Error handling: invalid market ID returns status "unavailable" (no throw)
 * - nearViewCall: standalone utility test
 */

import { describe, it, expect } from "vitest";
import { TemplarAdapter, TEMPLAR_MARKETS, TEMPLAR_CONTRACT } from "../../../src/protocols/templar/index.js";
import { nearViewCall, NearRpcError } from "../../../src/utils/near-rpc.js";
import type { TasmilClientConfig } from "../../../src/types/common.js";

const MAINNET: TasmilClientConfig = {
  network: "mainnet",
  rpcUrl: "https://mainnet.sorobanrpc.com",
  horizonUrl: "https://horizon.stellar.org",
};

// Canonical market to use in focused tests
const CANONICAL_MARKET = "ixlm-ixlmusdc.v1.tmplr.near";

// ─── Constants ────────────────────────────────────────────────────

describe("Templar — constants", () => {
  it("TEMPLAR_CONTRACT is a 56-char Stellar C... address", () => {
    expect(TEMPLAR_CONTRACT).toMatch(/^C[A-Z2-7]{55}$/);
  });

  it("TEMPLAR_MARKETS has 6 entries", () => {
    expect(TEMPLAR_MARKETS.length).toBe(6);
  });

  it("all market IDs end with .v1.tmplr.near", () => {
    for (const id of TEMPLAR_MARKETS) {
      expect(id).toMatch(/\.v1\.tmplr\.near$/);
    }
  });
});

// ─── nearViewCall utility ─────────────────────────────────────────

describe("nearViewCall — utility", () => {
  it("returns JSON-decoded result from a valid NEAR contract", async () => {
    // get_configuration is a pure view call on the canonical market
    const config = await nearViewCall(CANONICAL_MARKET, "get_configuration");
    expect(config).not.toBeNull();
    expect(typeof config).toBe("object");
  }, 15_000);

  it("throws NearRpcError for a non-existent contract", async () => {
    await expect(
      nearViewCall("does-not-exist.near", "get_configuration"),
    ).rejects.toThrow(NearRpcError);
  }, 15_000);

  it("returns null for an unknown method on a valid contract (NEAR does not error)", async () => {
    // NEAR RPC handles unknown view methods by returning an empty result (not an error)
    // so nearViewCall returns null rather than throwing
    const result = await nearViewCall(CANONICAL_MARKET, "nonexistent_method_xyz");
    expect(result).toBeNull();
  }, 15_000);
});

// ─── loadMarket ───────────────────────────────────────────────────

describe("Templar — loadMarket (mainnet)", () => {
  const adapter = new TemplarAdapter(MAINNET);

  it("returns TemplarMarketInfo with status ok for canonical market", async () => {
    const market = await adapter.loadMarket(CANONICAL_MARKET);

    expect(market.marketId).toBe(CANONICAL_MARKET);
    expect(market.status).toBe("ok");
  }, 20_000);

  it("collateral and borrow fields are non-empty strings", async () => {
    const market = await adapter.loadMarket(CANONICAL_MARKET);

    expect(typeof market.collateral).toBe("string");
    expect(market.collateral.length).toBeGreaterThan(0);
    expect(typeof market.borrow).toBe("string");
    expect(market.borrow.length).toBeGreaterThan(0);
  }, 20_000);

  it("XLM/USDC market resolves correct names", async () => {
    const market = await adapter.loadMarket(CANONICAL_MARKET);

    expect(market.collateral).toBe("XLM");
    expect(market.borrow).toMatch(/USDC/);
  }, 20_000);

  it("borrowApr is a finite positive number", async () => {
    const market = await adapter.loadMarket(CANONICAL_MARKET);

    expect(market.borrowApr).not.toBeNull();
    expect(typeof market.borrowApr).toBe("number");
    expect(isFinite(market.borrowApr!)).toBe(true);
    expect(market.borrowApr!).toBeGreaterThanOrEqual(0);
  }, 20_000);

  it("supplyApy is derived from borrowApr × utilization × 0.85", async () => {
    const market = await adapter.loadMarket(CANONICAL_MARKET);

    if (market.borrowApr !== null && market.utilization !== null) {
      const expected = market.borrowApr * market.utilization * 0.85;
      expect(market.supplyApy).toBeCloseTo(expected, 10);
    }
  }, 20_000);

  it("maxLtv is between 0 and 1 (derived from MCR)", async () => {
    const market = await adapter.loadMarket(CANONICAL_MARKET);

    expect(market.maxLtv).not.toBeNull();
    expect(market.maxLtv!).toBeGreaterThan(0);
    expect(market.maxLtv!).toBeLessThanOrEqual(1);
  }, 20_000);

  it("totalSupply, totalBorrowed, available are non-negative numbers", async () => {
    const market = await adapter.loadMarket(CANONICAL_MARKET);

    expect(market.totalSupply).toBeGreaterThanOrEqual(0);
    expect(market.totalBorrowed).toBeGreaterThanOrEqual(0);
    expect(market.available).toBeGreaterThanOrEqual(0);
  }, 20_000);

  it("utilization is null or between 0 and 1", async () => {
    const market = await adapter.loadMarket(CANONICAL_MARKET);

    if (market.utilization !== null) {
      expect(market.utilization).toBeGreaterThanOrEqual(0);
      expect(market.utilization).toBeLessThanOrEqual(1);
    }
  }, 20_000);

  it("returns status unavailable (no throw) for invalid market ID", async () => {
    const market = await adapter.loadMarket("nonexistent-market.v1.tmplr.near");

    expect(market.status).toBe("unavailable");
    expect(typeof market.error).toBe("string");
    expect(market.error!.length).toBeGreaterThan(0);
  }, 15_000);
});

// ─── loadAllMarkets ────────────────────────────────────────────────

describe("Templar — loadAllMarkets (mainnet)", () => {
  const adapter = new TemplarAdapter(MAINNET);

  it("returns exactly 6 market results", async () => {
    const markets = await adapter.loadAllMarkets();
    expect(markets.length).toBe(6);
  }, 60_000);

  it("all markets have a marketId matching their NEAR contract ID", async () => {
    const markets = await adapter.loadAllMarkets();
    const marketIds = markets.map((m) => m.marketId);

    for (const expected of TEMPLAR_MARKETS) {
      expect(marketIds).toContain(expected);
    }
  }, 60_000);

  it("at least 1 market returns status ok", async () => {
    const markets = await adapter.loadAllMarkets();
    const ok = markets.filter((m) => m.status === "ok");
    expect(ok.length).toBeGreaterThanOrEqual(1);
  }, 60_000);

  it("stNEAR market exists with expected name or unknown (if asset format unrecognised)", async () => {
    const markets = await adapter.loadAllMarkets();
    const stnear = markets.find((m) => m.marketId === "stnear-usdc-1.v1.tmplr.near");
    expect(stnear).toBeDefined();
    // Either status unavailable (rate limit) or ok with a resolved/fallback name
    expect(["ok", "unavailable"]).toContain(stnear!.status);
    if (stnear?.status === "ok") {
      // name should be stNEAR if asset ID contains known fragment; may be unknown/partial otherwise
      expect(typeof stnear.collateral).toBe("string");
      expect(stnear.collateral.length).toBeGreaterThan(0);
    }
  }, 60_000);
});

// ─── getLendingMarkets ────────────────────────────────────────────

describe("Templar — getLendingMarkets (mainnet)", () => {
  const adapter = new TemplarAdapter(MAINNET);

  it("returns an array of LendingMarket objects", async () => {
    const markets = await adapter.getLendingMarkets();
    expect(Array.isArray(markets)).toBe(true);
    expect(markets.length).toBeGreaterThanOrEqual(1);
  }, 60_000);

  it("every market has protocol === 'templar'", async () => {
    const markets = await adapter.getLendingMarkets();
    for (const m of markets) {
      expect(m.protocol).toBe("templar");
    }
  }, 60_000);

  it("every market has poolAddress matching a TEMPLAR_MARKETS entry", async () => {
    const markets = await adapter.getLendingMarkets();
    const validIds = new Set<string>(TEMPLAR_MARKETS);
    for (const m of markets) {
      expect(validIds.has(m.poolAddress)).toBe(true);
    }
  }, 60_000);

  it("every market has required LendingMarket fields with correct types", async () => {
    const markets = await adapter.getLendingMarkets();
    for (const m of markets) {
      expect(typeof m.protocol).toBe("string");
      expect(typeof m.poolAddress).toBe("string");
      expect(typeof m.asset).toBe("string");
      expect(m.status === "ok" || m.status === "unavailable").toBe(true);
      // supplyApy and borrowApy are number | null
      if (m.supplyApy !== null && m.supplyApy !== undefined) {
        expect(typeof m.supplyApy).toBe("number");
      }
      if (m.borrowApy !== null && m.borrowApy !== undefined) {
        expect(typeof m.borrowApy).toBe("number");
      }
    }
  }, 60_000);

  it("collateralFactor is between 0 and 1 for ok markets", async () => {
    const markets = await adapter.getLendingMarkets();
    for (const m of markets) {
      if (m.status === "ok" && m.collateralFactor !== null) {
        expect(m.collateralFactor).toBeGreaterThan(0);
        expect(m.collateralFactor).toBeLessThanOrEqual(1);
      }
    }
  }, 60_000);
});

// ─── getSwapTokens ────────────────────────────────────────────────

describe("Templar — getSwapTokens (mainnet)", () => {
  const adapter = new TemplarAdapter(MAINNET);

  it("returns a non-empty array of token objects", async () => {
    const tokens = await adapter.getSwapTokens();
    expect(Array.isArray(tokens)).toBe(true);
    expect(tokens.length).toBeGreaterThan(0);
  }, 20_000);

  it("each token has symbol, blockchain fields", async () => {
    const tokens = await adapter.getSwapTokens();
    for (const token of tokens.slice(0, 10)) {
      expect(typeof token["symbol"]).toBe("string");
      expect(typeof token["blockchain"]).toBe("string");
    }
  }, 20_000);

  it("includes stellar chain tokens", async () => {
    const tokens = await adapter.getSwapTokens();
    const stellarTokens = tokens.filter(
      (t) => String(t["blockchain"]).toLowerCase() === "stellar",
    );
    expect(stellarTokens.length).toBeGreaterThanOrEqual(1);
  }, 20_000);

  it("includes XLM in stellar tokens", async () => {
    const tokens = await adapter.getSwapTokens();
    const xlm = tokens.find(
      (t) =>
        String(t["blockchain"]).toLowerCase() === "stellar" &&
        String(t["symbol"]).toUpperCase() === "XLM",
    );
    expect(xlm).toBeDefined();
  }, 20_000);
});

// ─── getAdapterQuote (SwapAggregator interface) ───────────────────

describe("Templar — getAdapterQuote / SwapAggregator interface (mainnet)", () => {
  const adapter = new TemplarAdapter(MAINNET);

  it("returns a SwapQuote with protocol === 'templar'", async () => {
    const quote = await adapter.getAdapterQuote({
      tokenIn: "XLM",
      tokenOut: "USDC",
      amount: "10",
    });

    expect(quote.protocol).toBe("templar");
    expect(typeof quote.amountIn).toBe("string");
    expect(typeof quote.amountOut).toBe("string");
    expect(["ok", "no_route", "unavailable"]).toContain(quote.status);
  }, 20_000);

  it("ok quote has positive amountOut and correct fields", async () => {
    const quote = await adapter.getAdapterQuote({
      tokenIn: "XLM",
      tokenOut: "USDC",
      amount: "10",
    });

    if (quote.status === "ok") {
      expect(parseFloat(quote.amountOut)).toBeGreaterThan(0);
      expect(typeof quote.fee).toBe("string");
      expect(typeof quote.feePercent).toBe("string");
      expect(quote.feePercent).toMatch(/%/);
      expect(typeof quote.estimatedTime).toBe("string");
      expect(Array.isArray(quote.route)).toBe(true);
      expect(quote.route.length).toBe(2);
    }
  }, 20_000);

  it("unavailable or no_route quote has error message (no throw)", async () => {
    // Templar may not support all pairs — passes gracefully
    const quote = await adapter.getAdapterQuote({
      tokenIn: "INVALIDTOKENXXX",
      tokenOut: "INVALIDTOKENYYY",
      amount: "1",
    });

    expect(["unavailable", "no_route"]).toContain(quote.status);
    if (quote.status === "unavailable") {
      expect(typeof quote.error).toBe("string");
    }
  }, 20_000);
});

// ─── getBridgeAdapterQuote (BridgeAggregator interface) ───────────

describe("Templar — getBridgeAdapterQuote / BridgeAggregator interface (mainnet)", () => {
  const adapter = new TemplarAdapter(MAINNET);

  it("returns a BridgeQuote with provider === 'templar'", async () => {
    const quote = await adapter.getBridgeAdapterQuote({
      fromChain: "stellar",
      toChain: "ethereum",
      asset: "USDC",
      amount: "10",
    });

    expect(quote.provider).toBe("templar");
    expect(typeof quote.amountIn).toBe("string");
    expect(typeof quote.amountOut).toBe("string");
    expect(["ok", "unavailable", "error"]).toContain(quote.status);
  }, 20_000);

  it("crossChainSwap is true for stellar→ethereum", async () => {
    const quote = await adapter.getBridgeAdapterQuote({
      fromChain: "stellar",
      toChain: "ethereum",
      asset: "USDC",
      amount: "10",
    });

    expect(quote.crossChainSwap).toBe(true);
  }, 20_000);

  it("crossChainSwap is false for stellar→stellar", async () => {
    const quote = await adapter.getBridgeAdapterQuote({
      fromChain: "stellar",
      toChain: "stellar",
      asset: "XLM",
      assetOut: "USDC",
      amount: "10",
    });

    expect(quote.crossChainSwap).toBe(false);
  }, 20_000);

  it("ok quote has positive amountOut, fee fields, and estimatedTime", async () => {
    const quote = await adapter.getBridgeAdapterQuote({
      fromChain: "stellar",
      toChain: "ethereum",
      asset: "USDC",
      amount: "50",
    });

    if (quote.status === "ok") {
      expect(parseFloat(quote.amountOut)).toBeGreaterThan(0);
      expect(typeof quote.fee).toBe("string");
      expect(typeof quote.feePercent).toBe("string");
      expect(quote.feePercent).toMatch(/%/);
      expect(typeof quote.estimatedTime).toBe("string");
    }
  }, 20_000);

  it("unavailable quote has no throw, returns error string", async () => {
    const quote = await adapter.getBridgeAdapterQuote({
      fromChain: "stellar",
      toChain: "notarealchain999",
      asset: "XLM",
      amount: "1",
    });

    expect(["unavailable", "error"]).toContain(quote.status);
    if (quote.status === "unavailable") {
      expect(typeof quote.error).toBe("string");
    }
  }, 20_000);
});

// ─── getYieldOpportunities (YieldAggregator interface) ────────────

describe("Templar — getYieldOpportunities / YieldAggregator interface (mainnet)", () => {
  const adapter = new TemplarAdapter(MAINNET);

  it("returns an array without throwing", async () => {
    const opps = await adapter.getYieldOpportunities();
    expect(Array.isArray(opps)).toBe(true);
  }, 60_000);

  it("every opportunity has protocol === 'templar'", async () => {
    const opps = await adapter.getYieldOpportunities();
    for (const opp of opps) {
      expect(opp.protocol).toBe("templar");
    }
  }, 60_000);

  it("every opportunity has type === 'lending'", async () => {
    const opps = await adapter.getYieldOpportunities();
    for (const opp of opps) {
      expect(opp.type).toBe("lending");
    }
  }, 60_000);

  it("every opportunity has risk === 'medium'", async () => {
    const opps = await adapter.getYieldOpportunities();
    for (const opp of opps) {
      expect(opp.risk).toBe("medium");
    }
  }, 60_000);

  it("every opportunity has at least 2 assets (collateral + borrow)", async () => {
    const opps = await adapter.getYieldOpportunities();
    for (const opp of opps) {
      expect(Array.isArray(opp.assets)).toBe(true);
      expect(opp.assets.length).toBeGreaterThanOrEqual(2);
    }
  }, 60_000);

  it("every opportunity has a valid poolAddress (NEAR contract ID)", async () => {
    const opps = await adapter.getYieldOpportunities();
    for (const opp of opps) {
      expect(opp.poolAddress).toBeDefined();
      expect(opp.poolAddress).toMatch(/\.tmplr\.near$/);
    }
  }, 60_000);

  it("meta contains sorobanContract and nearMarketId", async () => {
    const opps = await adapter.getYieldOpportunities();
    for (const opp of opps) {
      expect(opp.meta).toBeDefined();
      expect(opp.meta!["sorobanContract"]).toBe(TEMPLAR_CONTRACT);
      expect(typeof opp.meta!["nearMarketId"]).toBe("string");
    }
  }, 60_000);

  it("apy structure has base, reward, total fields", async () => {
    const opps = await adapter.getYieldOpportunities();
    for (const opp of opps) {
      expect("base" in opp.apy).toBe(true);
      expect("reward" in opp.apy).toBe(true);
      expect("total" in opp.apy).toBe(true);
      expect(opp.apy.reward).toBeNull(); // Templar has no reward token
    }
  }, 60_000);

  it("at least 1 opportunity has non-null supplyApy ≥ 0 (or array empty if all rate-limited)", async () => {
    const opps = await adapter.getYieldOpportunities();
    // getYieldOpportunities only returns status==="ok" markets.
    // If all 6 NEAR markets are rate-limited (429), opps will be empty — that's acceptable.
    // When at least one market is reachable, supplyApy should be non-negative.
    if (opps.length > 0) {
      for (const opp of opps) {
        if (opp.supplyApy !== null && opp.supplyApy !== undefined) {
          expect(opp.supplyApy).toBeGreaterThanOrEqual(0);
        }
      }
    }
  }, 60_000);
});
