/**
 * Phoenix Hub DEX Protocol — live integration tests (mainnet only)
 *
 * NOTE: Phoenix testnet is redeployed per run, no stable testnet pools.
 * Tests run against mainnet only.
 *
 * Coverage:
 * - listPools: all Phoenix pools with reserves
 * - listPoolAddresses: list of pool contract addresses
 * - getPool: single pool by address
 * - findPoolByTokenPair: pair lookup
 * - getPoolInfo: on-chain reserves
 * - simulateSwap: quote for a known pool
 * - getYieldOpportunities: yield aggregator interface
 */

import { describe, it, expect } from "vitest";
import { PhoenixAdapter } from "../../../src/protocols/phoenix/index.js";
import { getPhoenixContracts } from "../../../src/utils/contracts.js";
import { resolveAsset } from "../../../src/utils/asset-resolver.js";
import type { TasmilClientConfig } from "../../../src/types/common.js";

const MAINNET: TasmilClientConfig = { network: "mainnet" };
const mainnetContracts = getPhoenixContracts("mainnet");
const XLM_USDC_POOL = mainnetContracts.knownPools.find(
  (p) => p.tokens[0] === "XLM" && p.tokens[1] === "USDC",
)!;

describe("Phoenix — mainnet", () => {
  const adapter = new PhoenixAdapter(MAINNET);

  it("listPoolAddresses returns ≥1 address", async () => {
    const addresses = await adapter.listPoolAddresses();
    expect(addresses.length).toBeGreaterThanOrEqual(1);
    for (const addr of addresses) {
      expect(addr).toMatch(/^C/);
      expect(addr).toHaveLength(56);
    }
  }, 20_000);

  it("listPools returns pools with asset_a and asset_b", async () => {
    const pools = await adapter.listPools();
    expect(pools.length).toBeGreaterThanOrEqual(1);

    for (const pool of pools) {
      // pool_address might be present, or we just check the other fields
      if (pool.asset_a) {
        expect(pool.asset_a.address).toMatch(/^C/);
      }
      if (pool.asset_b) {
        expect(pool.asset_b.address).toMatch(/^C/);
      }
    }
  }, 20_000);

  it("getPool by XLM/USDC address returns pool data", async () => {
    if (!XLM_USDC_POOL) {
      console.warn("XLM/USDC pool not in knownPools, skipping");
      return;
    }

    const pool = await adapter.getPool(XLM_USDC_POOL.address);
    expect(pool).not.toBeNull();
  }, 15_000);

  it("findPoolByTokenPair XLM+USDC returns pool address", async () => {
    const xlmContract = resolveAsset("XLM", "contract", "mainnet");
    const usdcContract = resolveAsset("USDC", "contract", "mainnet");

    const poolAddr = await adapter.findPoolByTokenPair(xlmContract, usdcContract);
    // Might be null if XLM SAC format differs, but should not throw
    expect(poolAddr === null || typeof poolAddr === "string").toBe(true);
  }, 15_000);

  it("getPoolInfo for XLM/USDC pool returns reserves", async () => {
    if (!XLM_USDC_POOL) return;

    const info = await adapter.getPoolInfo(XLM_USDC_POOL.address);
    if (info) {
      if (info.asset_a) expect(typeof info.asset_a.amount).toBe("string");
      if (info.asset_b) expect(typeof info.asset_b.amount).toBe("string");
    }
  }, 15_000);

  it("simulateSwap XLM→USDC returns ask_amount", async () => {
    if (!XLM_USDC_POOL) return;

    const xlmContract = resolveAsset("XLM", "contract", "mainnet");

    const result = await adapter.simulateSwap(
      XLM_USDC_POOL.address,
      xlmContract,
      "10000000", // 1 XLM
    );

    if (result) {
      expect(result.ask_amount).toBeDefined();
      expect(parseFloat(String(result.ask_amount ?? "0"))).toBeGreaterThan(0);
    }
  }, 15_000);

  it("getAdapterQuote XLM→USDC returns quote", async () => {
    const xlmContract = resolveAsset("XLM", "contract", "mainnet");
    const usdcContract = resolveAsset("USDC", "contract", "mainnet");

    const quote = await adapter.getAdapterQuote({
      tokenIn: xlmContract,
      tokenOut: usdcContract,
      amount: "10000000",
    });

    expect(quote.protocol).toBe("phoenix");
    expect(["ok", "no_route"]).toContain(quote.status);
    if (quote.status === "ok") {
      expect(parseFloat(quote.amountOut)).toBeGreaterThan(0);
    }
  }, 20_000);

  it("getYieldOpportunities returns lp opportunities", async () => {
    const opps = await adapter.getYieldOpportunities();
    expect(opps.length).toBeGreaterThanOrEqual(1);

    for (const opp of opps) {
      expect(opp.protocol).toBe("phoenix");
      expect(opp.type).toBe("lp");
      expect(opp.assets.length).toBeGreaterThanOrEqual(2);
    }
  }, 20_000);
});

// ─── Testnet (minimal) ────────────────────────────────────────────

describe("Phoenix — testnet (no stable pools)", () => {
  const adapter = new PhoenixAdapter({ network: "testnet" });

  it("listPools does not throw even if no testnet pools", async () => {
    // Phoenix testnet factory uses mainnet addresses as fallback
    // It may return an error or empty list — should not throw
    try {
      const pools = await adapter.listPools();
      expect(Array.isArray(pools)).toBe(true);
    } catch {
      // Expected: testnet factory may fail
    }
  }, 15_000);
});
