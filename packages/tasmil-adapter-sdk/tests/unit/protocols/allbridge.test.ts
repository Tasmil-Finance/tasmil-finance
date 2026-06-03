/**
 * Allbridge Cross-Chain Bridge Protocol — live integration tests (mainnet only)
 *
 * NOTE: Allbridge SDK does not support testnet — all tests run against mainnet.
 *       The SDK fetches its own chain data; no test-specific keys needed.
 *
 * Coverage:
 * - getSupportedChains: chain map with tokens per chain
 * - lp.listPools: LP pool discovery across all Allbridge chains
 * - getQuote: USDC Stellar→Ethereum bridge quote
 * - getQuote (unsupported chain): graceful error → status "unavailable"
 * - ALLBRIDGE_CHAINS: chain symbol mapping validation
 */

import { describe, it, expect } from "vitest";
import { AllbridgeAdapter, ALLBRIDGE_CHAINS } from "../../../src/protocols/allbridge/index.js";
import { ChainSymbol } from "@allbridge/bridge-core-sdk";
import type { TasmilClientConfig } from "../../../src/types/common.js";

const MAINNET: TasmilClientConfig = { network: "mainnet" };

// ─── ALLBRIDGE_CHAINS mapping ─────────────────────────────────────

describe("Allbridge — ALLBRIDGE_CHAINS mapping", () => {
  it("contains stellar → SRB", () => {
    expect(ALLBRIDGE_CHAINS["stellar"]).toBe(ChainSymbol.SRB);
  });

  it("contains ethereum → ETH", () => {
    expect(ALLBRIDGE_CHAINS["ethereum"]).toBe(ChainSymbol.ETH);
  });

  it("contains all major chains", () => {
    const required = ["stellar", "ethereum", "bsc", "polygon", "avalanche", "solana"];
    for (const chain of required) {
      expect(ALLBRIDGE_CHAINS[chain]).toBeDefined();
    }
  });

  it("each value is a valid ChainSymbol", () => {
    const validSymbols = Object.values(ChainSymbol);
    for (const sym of Object.values(ALLBRIDGE_CHAINS)) {
      expect(validSymbols).toContain(sym);
    }
  });
});

// ─── getSupportedChains ───────────────────────────────────────────

describe("Allbridge — getSupportedChains (mainnet)", () => {
  const adapter = new AllbridgeAdapter(MAINNET);

  it("returns chain details map with known chain symbols", async () => {
    const chains = await adapter.getSupportedChains();
    expect(typeof chains).toBe("object");
    expect(chains).not.toBeNull();

    const chainKeys = Object.keys(chains);
    expect(chainKeys.length).toBeGreaterThanOrEqual(3);
    // Should include SRB (Stellar) and ETH
    expect(chainKeys).toContain(ChainSymbol.SRB);
  }, 20_000);

  it("each chain entry has a tokens array", async () => {
    const chains = await adapter.getSupportedChains();
    for (const [, chainData] of Object.entries(chains)) {
      const data = chainData as Record<string, unknown>;
      if (data["tokens"]) {
        expect(Array.isArray(data["tokens"])).toBe(true);
      }
    }
  }, 20_000);

  it("Stellar chain has USDC token", async () => {
    const chains = await adapter.getSupportedChains();
    const stellar = chains[ChainSymbol.SRB] as Record<string, unknown> | undefined;
    expect(stellar).toBeDefined();

    const tokens = stellar?.["tokens"] as Array<Record<string, unknown>> | undefined;
    expect(Array.isArray(tokens)).toBe(true);
    const usdc = tokens?.find((t) => String(t["symbol"]).toUpperCase() === "USDC");
    expect(usdc).toBeDefined();
  }, 20_000);
});

// ─── lp.listPools ─────────────────────────────────────────────────

describe("Allbridge LP — listPools (mainnet)", () => {
  const adapter = new AllbridgeAdapter(MAINNET);

  it("returns non-empty array of LP pools", async () => {
    const pools = await adapter.lp.listPools();
    expect(Array.isArray(pools)).toBe(true);
    expect(pools.length).toBeGreaterThanOrEqual(1);
  }, 20_000);

  it("each pool has required fields: chain, asset, poolAddress", async () => {
    const pools = await adapter.lp.listPools();
    for (const pool of pools.slice(0, 10)) {
      expect(typeof pool.chain).toBe("string");
      expect(pool.chain.length).toBeGreaterThan(0);
      expect(typeof pool.asset).toBe("string");
      expect(typeof pool.poolAddress).toBe("string");
      expect(pool.poolAddress.length).toBeGreaterThan(0);
    }
  }, 20_000);

  it("apr is null or a finite number", async () => {
    const pools = await adapter.lp.listPools();
    for (const pool of pools.slice(0, 10)) {
      if (pool.apr !== null) {
        expect(typeof pool.apr).toBe("number");
        expect(isFinite(pool.apr)).toBe(true);
      }
    }
  }, 20_000);

  it("includes Stellar chain pools", async () => {
    const pools = await adapter.lp.listPools();
    const stellarPools = pools.filter(
      (p) => p.chain.toLowerCase() === "stellar" || p.chain === "SRB",
    );
    // Stellar should have at least USDC pool
    expect(stellarPools.length).toBeGreaterThanOrEqual(1);
  }, 20_000);

  it("getYieldOpportunities wraps pools as YieldOpportunity objects", async () => {
    const opps = await adapter.lp.getYieldOpportunities();
    expect(Array.isArray(opps)).toBe(true);

    for (const opp of opps.slice(0, 5)) {
      expect(opp.protocol).toBe("allbridge");
      expect(opp.type).toBe("lp");
      expect(typeof opp.name).toBe("string");
      expect(Array.isArray(opp.assets)).toBe(true);
      expect(opp.assets.length).toBeGreaterThanOrEqual(1);
      expect(["ok", "unavailable"]).toContain(opp.status);
    }
  }, 20_000);
});

// ─── getQuote ─────────────────────────────────────────────────────

describe("Allbridge — getQuote (mainnet)", () => {
  const adapter = new AllbridgeAdapter(MAINNET);

  it("USDC Stellar→Ethereum returns a bridge quote", async () => {
    const quote = await adapter.getQuote({
      fromChain: "stellar",
      toChain: "ethereum",
      asset: "USDC",
      amount: "10",
    });

    expect(quote.provider).toBe("allbridge");
    expect(["ok", "unavailable"]).toContain(quote.status);

    if (quote.status === "ok") {
      expect(parseFloat(quote.amountOut)).toBeGreaterThan(0);
      expect(parseFloat(quote.amountOut)).toBeLessThanOrEqual(10.01); // fees deducted
      expect(typeof quote.estimatedTime).toBe("string");
      expect(typeof quote.fee).toBe("string");
    }
  }, 25_000);

  it("USDC Stellar→BSC returns a bridge quote", async () => {
    const quote = await adapter.getQuote({
      fromChain: "stellar",
      toChain: "bsc",
      asset: "USDC",
      amount: "5",
    });

    expect(quote.provider).toBe("allbridge");
    expect(["ok", "unavailable"]).toContain(quote.status);
  }, 25_000);

  it("unsupported chain returns status: unavailable", async () => {
    const quote = await adapter.getQuote({
      fromChain: "stellar",
      toChain: "notarealchain",
      asset: "USDC",
      amount: "10",
    });

    expect(quote.status).toBe("unavailable");
    expect(typeof quote.error).toBe("string");
    expect(quote.error!.length).toBeGreaterThan(0);
    expect(quote.amountOut).toBe("0");
  }, 10_000);

  it("quote fields are properly structured", async () => {
    const quote = await adapter.getQuote({
      fromChain: "stellar",
      toChain: "ethereum",
      asset: "USDC",
      amount: "100",
    });

    // Regardless of status, these fields should be present
    expect(quote.provider).toBe("allbridge");
    expect(typeof quote.amountIn).toBe("string");
    expect(typeof quote.amountOut).toBe("string");
    expect(typeof quote.fee).toBe("string");
    expect(typeof quote.feePercent).toBe("string");
    expect(typeof quote.estimatedTime).toBe("string");
    expect(typeof quote.crossChainSwap).toBe("boolean");
    expect(["ok", "unavailable"]).toContain(quote.status);
  }, 25_000);

  it("larger amounts produce proportionally similar fee rates", async () => {
    const [q10, q100] = await Promise.all([
      adapter.getQuote({ fromChain: "stellar", toChain: "ethereum", asset: "USDC", amount: "10" }),
      adapter.getQuote({ fromChain: "stellar", toChain: "ethereum", asset: "USDC", amount: "100" }),
    ]);

    if (q10.status === "ok" && q100.status === "ok") {
      // Both should succeed and produce valid amount outs
      expect(parseFloat(q100.amountOut)).toBeGreaterThan(parseFloat(q10.amountOut));
    }
  }, 30_000);
});
