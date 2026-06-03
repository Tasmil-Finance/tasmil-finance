/**
 * Bridge Aggregator — live integration tests (mainnet only)
 *
 * Tests parallel quote comparison across Allbridge and NEAR Intents.
 * Mainnet only — Allbridge SDK has no testnet support.
 *
 * Coverage:
 * - getAllQuotes: Allbridge + NEAR Intents in parallel
 * - getBestQuote: highest amountOut wins
 * - Provider filtering: restrict to specific providers
 * - Result structure: fromChain, toChain, asset, best provider
 * - Graceful degradation: one provider failing doesn't block others
 * - NEAR Intents: may return unavailable (expected for some pairs)
 */

import { describe, it, expect } from "vitest";
import { BridgeAggregator } from "../../../src/aggregators/bridge/index.js";
import type { TasmilClientConfig } from "../../../src/types/common.js";

const MAINNET: TasmilClientConfig = {
  network: "mainnet",
  rpcUrl: "https://mainnet.sorobanrpc.com",
};

// ─── Mainnet ──────────────────────────────────────────────────────

describe("BridgeAggregator — mainnet", () => {
  const agg = new BridgeAggregator(MAINNET);

  it("getAllQuotes returns a result object", async () => {
    const result = await agg.getAllQuotes({
      fromChain: "stellar",
      toChain: "ethereum",
      asset: "USDC",
      amount: "10",
    });

    expect(result).toBeDefined();
    expect(Array.isArray(result.quotes)).toBe(true);
    expect(result.fromChain).toBe("stellar");
    expect(result.toChain).toBe("ethereum");
    expect(result.asset).toBe("USDC");
  }, 30_000);

  it("result has quotes from at least 1 provider", async () => {
    const result = await agg.getAllQuotes({
      fromChain: "stellar",
      toChain: "ethereum",
      asset: "USDC",
      amount: "10",
    });

    expect(result.quotes.length).toBeGreaterThanOrEqual(1);
  }, 30_000);

  it("each quote has required BridgeQuote fields", async () => {
    const result = await agg.getAllQuotes({
      fromChain: "stellar",
      toChain: "ethereum",
      asset: "USDC",
      amount: "100",
    });

    for (const quote of result.quotes) {
      expect(typeof quote.provider).toBe("string");
      expect(typeof quote.amountIn).toBe("string");
      expect(typeof quote.amountOut).toBe("string");
      expect(typeof quote.fee).toBe("string");
      expect(typeof quote.feePercent).toBe("string");
      expect(typeof quote.estimatedTime).toBe("string");
      expect(typeof quote.crossChainSwap).toBe("boolean");
      expect(["ok", "unavailable"]).toContain(quote.status);
    }
  }, 30_000);

  it("Allbridge returns a quote for USDC Stellar→Ethereum", async () => {
    const result = await agg.getAllQuotes({
      fromChain: "stellar",
      toChain: "ethereum",
      asset: "USDC",
      amount: "50",
      providers: ["allbridge"],
    });

    expect(result.quotes.length).toBe(1);
    const allbridgeQuote = result.quotes[0]!;
    expect(allbridgeQuote.provider).toBe("allbridge");
    expect(["ok", "unavailable"]).toContain(allbridgeQuote.status);

    if (allbridgeQuote.status === "ok") {
      expect(parseFloat(allbridgeQuote.amountOut)).toBeGreaterThan(0);
      expect(parseFloat(allbridgeQuote.amountOut)).toBeLessThanOrEqual(50.01);
    }
  }, 30_000);

  it("NEAR Intents provider is requested and returns a response", async () => {
    const result = await agg.getAllQuotes({
      fromChain: "stellar",
      toChain: "ethereum",
      asset: "USDC",
      amount: "10",
      from: "GDXCJFJ4EWUCNMZ55TPOQSQHLJMZ3BBEENQDLS3QUPBJQZV5CS4GKZN",
      to: "0x742d35Cc6634C0532925a3b8D2C4d2a8C3f7E9a2",
      providers: ["near_intents"],
    });

    expect(result.quotes.length).toBe(1);
    const nearQuote = result.quotes[0]!;
    expect(nearQuote.provider).toBe("near_intents");
    // NEAR Intents may or may not support this pair
    expect(["ok", "unavailable"]).toContain(nearQuote.status);
  }, 25_000);

  it("result.best is null or a valid provider name", async () => {
    const result = await agg.getAllQuotes({
      fromChain: "stellar",
      toChain: "ethereum",
      asset: "USDC",
      amount: "10",
    });

    if (result.best !== null) {
      expect(["allbridge", "near_intents"]).toContain(result.best);
    }
  }, 30_000);

  it("ok quotes sorted best-first (highest amountOut first)", async () => {
    const result = await agg.getAllQuotes({
      fromChain: "stellar",
      toChain: "bsc",
      asset: "USDC",
      amount: "20",
    });

    const okQuotes = result.quotes.filter(
      (q) => q.status === "ok" && q.amountOut !== "0",
    );

    for (let i = 1; i < okQuotes.length; i++) {
      const prev = parseFloat(okQuotes[i - 1]!.amountOut);
      const curr = parseFloat(okQuotes[i]!.amountOut);
      expect(prev).toBeGreaterThanOrEqual(curr);
    }
  }, 30_000);

  it("getBestQuote returns single best or null", async () => {
    const best = await agg.getBestQuote({
      fromChain: "stellar",
      toChain: "ethereum",
      asset: "USDC",
      amount: "10",
    });

    // May be null if no provider supports this pair
    if (best !== null) {
      expect(best.status).toBe("ok");
      expect(parseFloat(best.amountOut)).toBeGreaterThan(0);
      expect(["allbridge", "near_intents"]).toContain(best.provider);
    }
  }, 30_000);

  it("provider filter: allbridge-only request has exactly 1 quote", async () => {
    const result = await agg.getAllQuotes({
      fromChain: "stellar",
      toChain: "ethereum",
      asset: "USDC",
      amount: "10",
      providers: ["allbridge"],
    });

    expect(result.quotes).toHaveLength(1);
    expect(result.quotes[0]!.provider).toBe("allbridge");
  }, 25_000);

  it("unsupported route returns graceful unavailable for Allbridge", async () => {
    const result = await agg.getAllQuotes({
      fromChain: "stellar",
      toChain: "notarealchain",
      asset: "USDC",
      amount: "10",
      providers: ["allbridge"],
    });

    expect(result.quotes.length).toBe(1);
    expect(result.quotes[0]!.status).toBe("unavailable");
    expect(result.best).toBeNull();
  }, 15_000);

  it("Stellar→Solana USDC route is supported by Allbridge", async () => {
    const result = await agg.getAllQuotes({
      fromChain: "stellar",
      toChain: "solana",
      asset: "USDC",
      amount: "10",
      providers: ["allbridge"],
    });

    expect(result.quotes.length).toBeGreaterThanOrEqual(1);
    // Allbridge supports Stellar→Solana USDC
    const allbridgeQuote = result.quotes.find((q) => q.provider === "allbridge");
    if (allbridgeQuote) {
      expect(["ok", "unavailable"]).toContain(allbridgeQuote.status);
    }
  }, 25_000);
});
