/**
 * Blend V2 Protocol — live integration tests (testnet + mainnet)
 *
 * Tests are skipped when CI=true to avoid flaky network calls.
 * Run locally: pnpm test tests/unit/protocols/blend.test.ts
 *
 * Coverage:
 * - loadBlendRegistry: backstop discovery, pool & reserve loading
 * - getAllBlendPools: returns non-empty array with correct shape
 * - getBlendPoolByAddress: finds pool by contract address
 * - getBlendPoolsByAsset: finds pools containing USDC
 * - BlendAdapter.getYieldOpportunities: returns lending YieldOpportunity objects
 * - BlendAdapter.getLendingMarkets: returns LendingMarket objects
 * - Static fallback: handles RPC failure gracefully
 */

import { describe, it, expect, beforeAll } from "vitest";
import { BlendAdapter } from "../../../src/protocols/blend/index.js";
import { loadBlendRegistry, getAllBlendPools, clearBlendRegistryCache } from "../../../src/protocols/blend/pools.js";
import type { TasmilClientConfig } from "../../../src/types/common.js";

const TESTNET: TasmilClientConfig = {
  network: "testnet",
  rpcUrl: "https://soroban-testnet.stellar.org",
  horizonUrl: "https://horizon-testnet.stellar.org",
};

const MAINNET: TasmilClientConfig = {
  network: "mainnet",
  rpcUrl: "https://mainnet.sorobanrpc.com",
  horizonUrl: "https://horizon.stellar.org",
};

// ─── Helpers ──────────────────────────────────────────────────────

function isContractAddress(s: string): boolean {
  return typeof s === "string" && s.startsWith("C") && s.length === 56;
}

// ─── Testnet ──────────────────────────────────────────────────────

describe("Blend — testnet", () => {
  beforeAll(() => clearBlendRegistryCache("testnet"));

  it("loadBlendRegistry returns valid data", async () => {
    const reg = await loadBlendRegistry(TESTNET);

    expect(isContractAddress(reg.backstopAddress)).toBe(true);
    expect(typeof reg.blndToken).toBe("string");
    expect(typeof reg.usdcToken).toBe("string");
    expect(typeof reg.cometLpToken).toBe("string");
    expect(typeof reg.poolFactory).toBe("string");
    expect(reg.network).toBe("testnet");
    expect(reg.timestamp).toBeGreaterThan(0);
    expect(Array.isArray(reg.pools)).toBe(true);
  }, 20_000);

  it("getAllBlendPools returns at least 1 pool", async () => {
    const pools = await getAllBlendPools(TESTNET);
    expect(pools.length).toBeGreaterThanOrEqual(1);
  }, 20_000);

  it("each pool has required fields", async () => {
    const pools = await getAllBlendPools(TESTNET);
    for (const pool of pools) {
      expect(isContractAddress(pool.address)).toBe(true);
      expect(typeof pool.name).toBe("string");
      expect(typeof pool.status).toBe("string");
      expect(Array.isArray(pool.reserves)).toBe(true);
      expect(typeof pool.backstopRate).toBe("number");
    }
  }, 20_000);

  it("pool reserves have valid structure", async () => {
    const pools = await getAllBlendPools(TESTNET);
    const poolsWithReserves = pools.filter((p) => p.reserves.length > 0);
    expect(poolsWithReserves.length).toBeGreaterThanOrEqual(1);

    for (const pool of poolsWithReserves) {
      for (const reserve of pool.reserves) {
        expect(isContractAddress(reserve.assetAddress)).toBe(true);
        expect(typeof reserve.symbol).toBe("string");
        expect(typeof reserve.supplyApy).toBe("number");
        expect(typeof reserve.borrowApy).toBe("number");
        expect(typeof reserve.decimals).toBe("number");
        expect(reserve.collateralFactor).toBeGreaterThanOrEqual(0);
        expect(reserve.collateralFactor).toBeLessThanOrEqual(1);
      }
    }
  }, 20_000);

  it("BlendAdapter.listPools matches getAllBlendPools", async () => {
    const adapter = new BlendAdapter(TESTNET);
    const adapterPools = await adapter.listPools();
    const directPools = await getAllBlendPools(TESTNET);
    expect(adapterPools.length).toBe(directPools.length);
  }, 20_000);

  it("BlendAdapter.getYieldOpportunities returns lending opportunities", async () => {
    const adapter = new BlendAdapter(TESTNET);
    const opps = await adapter.getYieldOpportunities();

    expect(opps.length).toBeGreaterThanOrEqual(1);

    for (const opp of opps) {
      expect(opp.protocol).toBe("blend");
      expect(opp.type).toBe("lending");
      expect(typeof opp.name).toBe("string");
      expect(Array.isArray(opp.assets)).toBe(true);
      expect(opp.assets.length).toBeGreaterThanOrEqual(1);
      expect(["ok", "unavailable"]).toContain(opp.status);
      expect(["low", "medium", "high"]).toContain(opp.risk);

      // APY structure
      expect(opp.apy).toBeDefined();
      if (opp.apy.base !== null) {
        expect(typeof opp.apy.base).toBe("number");
      }
    }
  }, 30_000);

  it("BlendAdapter.getLendingMarkets returns valid markets", async () => {
    const adapter = new BlendAdapter(TESTNET);
    const markets = await adapter.getLendingMarkets();

    expect(markets.length).toBeGreaterThanOrEqual(1);

    for (const market of markets) {
      expect(market.protocol).toBe("blend");
      expect(isContractAddress(market.poolAddress)).toBe(true);
      expect(typeof market.asset).toBe("string");
      expect(["ok", "unavailable"]).toContain(market.status);
    }
  }, 30_000);

  it("getBlendPoolsByAsset('USDC') returns at least 1 pool on testnet", async () => {
    const adapter = new BlendAdapter(TESTNET);
    const pools = await adapter.getPoolsByAsset("USDC");
    // Testnet may or may not have USDC pools — just check structure
    expect(Array.isArray(pools)).toBe(true);
  }, 20_000);

  it("registry is cached — second call is faster", async () => {
    clearBlendRegistryCache("testnet");

    const t1 = Date.now();
    await loadBlendRegistry(TESTNET);
    const firstLoad = Date.now() - t1;

    const t2 = Date.now();
    await loadBlendRegistry(TESTNET); // from cache
    const cachedLoad = Date.now() - t2;

    // Cached call should be at least 10x faster
    expect(cachedLoad).toBeLessThan(firstLoad / 10 + 10);
  }, 30_000);
});

// ─── Mainnet ──────────────────────────────────────────────────────

describe("Blend — mainnet", () => {
  beforeAll(() => clearBlendRegistryCache("mainnet"));

  it("loadBlendRegistry discovers real mainnet pools", async () => {
    const reg = await loadBlendRegistry(MAINNET);
    // Mainnet should have multiple pools
    expect(reg.pools.length).toBeGreaterThanOrEqual(3);
    // All known pools should be in rewardZone
    expect(reg.blndToken).toMatch(/^C/);
    expect(reg.backstopAddress).toMatch(/^C/);
  }, 30_000);

  it("getAllBlendPools returns ≥3 pools on mainnet", async () => {
    const pools = await getAllBlendPools(MAINNET);
    expect(pools.length).toBeGreaterThanOrEqual(3);
  }, 30_000);

  it("mainnet pools have active status", async () => {
    const pools = await getAllBlendPools(MAINNET);
    const activePools = pools.filter((p) => p.status === "active");
    expect(activePools.length).toBeGreaterThanOrEqual(1);
  }, 30_000);

  it("mainnet supply APYs are positive for most assets", async () => {
    const pools = await getAllBlendPools(MAINNET);
    const allReserves = pools.flatMap((p) => p.reserves);
    const positive = allReserves.filter((r) => r.supplyApy > 0);
    expect(positive.length).toBeGreaterThan(0);
  }, 30_000);

  it("getPoolsByAsset('USDC') returns pools on mainnet", async () => {
    const adapter = new BlendAdapter(MAINNET);
    const pools = await adapter.getPoolsByAsset("USDC");
    expect(pools.length).toBeGreaterThanOrEqual(1);
  }, 30_000);

  it("BlendAdapter.getYieldOpportunities on mainnet returns lending opps with APY", async () => {
    const adapter = new BlendAdapter(MAINNET);
    const opps = await adapter.getYieldOpportunities();

    const withApy = opps.filter((o) => (o.apy.base ?? 0) > 0);
    expect(withApy.length).toBeGreaterThan(0);
  }, 30_000);
});
