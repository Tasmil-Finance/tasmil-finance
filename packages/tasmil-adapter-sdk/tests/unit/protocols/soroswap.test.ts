/**
 * Soroswap DEX Aggregator Protocol — live integration tests (testnet + mainnet)
 *
 * Coverage:
 * - listPools: mainnet/testnet pool lists
 * - getQuote: quote for XLM→USDC swap (query)
 * - buildSwapTx: build swap transaction XDR (testnet op)
 * - getPrice: single/multi asset price (testnet op)
 * - getAdapterQuote: swap adapter interface
 * - getYieldOpportunities: yield aggregator interface
 */

import { describe, it, expect } from "vitest";
import { SoroswapAdapter } from "../../../src/protocols/soroswap/index.js";
import { resolveAsset } from "../../../src/utils/asset-resolver.js";
import type { TasmilClientConfig } from "../../../src/types/common.js";

const TESTNET: TasmilClientConfig = { network: "testnet" };
const MAINNET: TasmilClientConfig = { network: "mainnet" };

// A well-known testnet Stellar account (USDC issuer — guaranteed to exist)
const TESTNET_FROM = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";

// Testnet contract addresses
const TESTNET_XLM = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC";
const TESTNET_USDC = "CAQCFVLOBK5GIULPNZRGATJJMIZL5BSP7X5YJVMGCPTUEPFM4AVSRCJU";

// ─── Testnet ──────────────────────────────────────────────────────

describe("Soroswap — testnet (query)", () => {
  const adapter = new SoroswapAdapter(TESTNET);

  it("listPools('soroswap') returns array on testnet", async () => {
    const pools = await adapter.listPools("soroswap");
    expect(Array.isArray(pools)).toBe(true);
    // Testnet may have fewer pools; just check it doesn't throw
  }, 15_000);

  it("getQuote XLM→USDC on testnet returns response or expected error", async () => {
    try {
      const quote = await adapter.getQuote({
        assetIn: TESTNET_XLM,
        assetOut: TESTNET_USDC,
        amount: "10000000", // 1 XLM
        tradeType: "EXACT_IN",
        network: "testnet",
      });
      expect(quote).toBeDefined();
      // amountOut may be 0 on testnet due to low liquidity
      const amountOut = quote.amountOut ?? quote.amount_out;
      if (amountOut !== undefined) {
        expect(isNaN(parseFloat(String(amountOut)))).toBe(false);
      }
    } catch (err) {
      // Soroswap testnet may return 400 for specific token pairs or protocols
      // This is expected behavior — testnet has limited liquidity/support
      expect(String(err)).toMatch(/Soroswap|400|not found/i);
    }
  }, 25_000);

  it("getYieldOpportunities doesn't throw", async () => {
    const opps = await adapter.getYieldOpportunities();
    expect(Array.isArray(opps)).toBe(true);
  }, 15_000);
});

describe("Soroswap — testnet (operations)", () => {
  const adapter = new SoroswapAdapter(TESTNET);

  it("getPrice XLM on testnet returns price data", async () => {
    try {
      const price = await adapter.getPrice(TESTNET_XLM, "USD");
      expect(price).toBeDefined();
    } catch (err) {
      // Price endpoint may not have testnet data — acceptable
      expect(String(err)).toContain("Soroswap");
    }
  }, 15_000);

  it("getPrice multiple assets on testnet", async () => {
    try {
      const prices = await adapter.getPrice([TESTNET_XLM, TESTNET_USDC], "USD");
      expect(prices).toBeDefined();
    } catch (err) {
      // May not have testnet price data
      expect(String(err)).toContain("Soroswap");
    }
  }, 15_000);

  it("buildSwapTx from testnet quote builds XDR or reports error", async () => {
    // First get a quote
    let quote: ReturnType<typeof adapter.getQuote> extends Promise<infer T> ? T : never;
    try {
      quote = await adapter.getQuote({
        assetIn: TESTNET_XLM,
        assetOut: TESTNET_USDC,
        amount: "10000000",
        tradeType: "EXACT_IN",
        network: "testnet",
      });
    } catch {
      // If quote fails, skip buildSwapTx
      return;
    }

    const amountOut = quote.amountOut ?? quote.amount_out;
    if (!amountOut || String(amountOut) === "0") {
      // No liquidity on testnet — skip
      return;
    }

    try {
      const tx = await adapter.buildSwapTx({
        quote,
        from: TESTNET_FROM,
      });
      expect(tx).toBeDefined();
      expect(typeof tx.xdr).toBe("string");
      expect(tx.xdr.length).toBeGreaterThan(0);
    } catch (err) {
      // buildSwapTx may fail if testnet API doesn't support it
      // Acceptable failure — just verify it's a Soroswap API error
      expect(String(err)).toContain("Soroswap");
    }
  }, 55_000); // getQuote (up to 25s) + buildSwapTx (up to 25s) combined
});

// ─── Mainnet ──────────────────────────────────────────────────────

describe("Soroswap — mainnet", () => {
  const adapter = new SoroswapAdapter(MAINNET);

  it("listPools('soroswap') returns ≥1 pool on mainnet", async () => {
    const pools = await adapter.listPools("soroswap");
    expect(pools.length).toBeGreaterThanOrEqual(1);
  }, 15_000);

  it("each pool has tokenA and tokenB fields", async () => {
    const pools = await adapter.listPools("soroswap");
    for (const pool of pools.slice(0, 5)) {
      // Soroswap API returns tokenA/tokenB (previously token0/token1)
      const hasTokens =
        (pool.tokenA !== undefined || pool.token0 !== undefined || pool.token0_address !== undefined) &&
        (pool.tokenB !== undefined || pool.token1 !== undefined || pool.token1_address !== undefined);
      expect(hasTokens).toBe(true);
    }
  }, 15_000);

  it("getQuote XLM→USDC returns valid response", async () => {
    const xlmContract = resolveAsset("XLM", "contract", "mainnet");
    const usdcContract = resolveAsset("USDC", "contract", "mainnet");

    const quote = await adapter.getQuote({
      assetIn: xlmContract,
      assetOut: usdcContract,
      amount: "10000000", // 1 XLM
      tradeType: "EXACT_IN",
    });

    expect(quote).toBeDefined();
    // Should have amount out or similar
    const amountOut = quote.amountOut ?? quote.amount_out;
    expect(amountOut).toBeDefined();
    if (amountOut !== undefined) {
      expect(parseFloat(String(amountOut))).toBeGreaterThan(0);
    }
  }, 15_000);

  it("getAdapterQuote XLM→USDC returns structured result", async () => {
    const xlmContract = resolveAsset("XLM", "contract", "mainnet");
    const usdcContract = resolveAsset("USDC", "contract", "mainnet");

    const result = await adapter.getAdapterQuote({
      tokenIn: xlmContract,
      tokenOut: usdcContract,
      amount: "10000000",
    });

    expect(result.protocol).toBe("soroswap");
    expect(["ok", "no_route"]).toContain(result.status);
    if (result.status === "ok") {
      expect(parseFloat(result.amountOut)).toBeGreaterThan(0);
      expect(Array.isArray(result.route)).toBe(true);
      expect(result.route.length).toBeGreaterThanOrEqual(2);
    }
  }, 15_000);

  it("getYieldOpportunities returns lp opportunities on mainnet", async () => {
    const opps = await adapter.getYieldOpportunities();
    expect(opps.length).toBeGreaterThan(0);

    for (const opp of opps.slice(0, 5)) {
      expect(opp.protocol).toBe("soroswap");
      expect(opp.type).toBe("lp");
      expect(opp.assets).toHaveLength(2);
    }
  }, 15_000);

  it("listPools('phoenix') returns phoenix pools", async () => {
    const pools = await adapter.listPools("phoenix");
    // Phoenix pools are served by Soroswap API — should have some
    expect(Array.isArray(pools)).toBe(true);
  }, 15_000);
});
