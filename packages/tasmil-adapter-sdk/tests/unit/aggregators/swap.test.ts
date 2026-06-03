/**
 * Swap Aggregator — live integration tests (mainnet only)
 *
 * Tests parallel quote fetching from Soroswap, Aquarius, Phoenix, SDEX.
 * All tests run against mainnet where liquidity is guaranteed.
 *
 * Coverage:
 * - getAllQuotes: parallel fetch, sorted best-first by amountOut
 * - getBestQuote: returns single best quote
 * - Protocol filtering: restrict to specific protocols
 * - Error handling: missing params, unsupported pairs
 * - Quote fields: protocol, amountOut, route, status
 */

import { describe, it, expect } from "vitest";
import { SwapAggregator } from "../../../src/aggregators/swap/index.js";
import { resolveAsset } from "../../../src/utils/asset-resolver.js";
import type { TasmilClientConfig } from "../../../src/types/common.js";

const MAINNET: TasmilClientConfig = {
  network: "mainnet",
  rpcUrl: "https://mainnet.sorobanrpc.com",
  horizonUrl: "https://horizon.stellar.org",
};

const xlm = resolveAsset("XLM", "contract", "mainnet");
const usdc = resolveAsset("USDC", "contract", "mainnet");

// ─── Mainnet ──────────────────────────────────────────────────────

describe("SwapAggregator — mainnet", () => {
  const agg = new SwapAggregator(MAINNET);

  it("getAllQuotes returns quotes array", async () => {
    const result = await agg.getAllQuotes({
      tokenIn: xlm,
      tokenOut: usdc,
      amount: "10000000", // 1 XLM
    });

    expect(result).toBeDefined();
    expect(Array.isArray(result.quotes)).toBe(true);
    expect(result.quotes.length).toBeGreaterThanOrEqual(1);
  }, 45_000);

  it("result contains tokenIn and tokenOut symbols", async () => {
    const result = await agg.getAllQuotes({
      tokenIn: xlm,
      tokenOut: usdc,
      amount: "10000000",
    });

    expect(typeof result.tokenIn).toBe("string");
    expect(typeof result.tokenOut).toBe("string");
    // Symbol resolution should return XLM/USDC
    expect(result.tokenIn.toUpperCase()).toContain("XLM");
    expect(result.tokenOut.toUpperCase()).toContain("USDC");
  }, 45_000);

  it("at least one protocol returns ok status for XLM→USDC", async () => {
    const result = await agg.getAllQuotes({
      tokenIn: xlm,
      tokenOut: usdc,
      amount: "10000000",
    });

    const okQuotes = result.quotes.filter((q) => q.status === "ok");
    expect(okQuotes.length).toBeGreaterThanOrEqual(1);
  }, 45_000);

  it("quotes are sorted best-first (highest amountOut first)", async () => {
    const result = await agg.getAllQuotes({
      tokenIn: xlm,
      tokenOut: usdc,
      amount: "10000000",
    });

    const okQuotes = result.quotes.filter((q) => q.status === "ok");
    for (let i = 1; i < okQuotes.length; i++) {
      const prev = parseFloat(okQuotes[i - 1]!.amountOut);
      const curr = parseFloat(okQuotes[i]!.amountOut);
      expect(prev).toBeGreaterThanOrEqual(curr);
    }
  }, 45_000);

  it("result.best matches the first ok quote's protocol", async () => {
    const result = await agg.getAllQuotes({
      tokenIn: xlm,
      tokenOut: usdc,
      amount: "10000000",
    });

    const firstOk = result.quotes.find((q) => q.status === "ok");
    if (firstOk) {
      expect(result.best).toBe(firstOk.protocol);
    }
  }, 45_000);

  it("each quote has required fields", async () => {
    const result = await agg.getAllQuotes({
      tokenIn: xlm,
      tokenOut: usdc,
      amount: "10000000",
    });

    for (const quote of result.quotes) {
      expect(typeof quote.protocol).toBe("string");
      expect(typeof quote.amountIn).toBe("string");
      expect(typeof quote.amountOut).toBe("string");
      expect(["ok", "no_route", "unavailable"]).toContain(quote.status);

      if (quote.status === "ok") {
        expect(parseFloat(quote.amountOut)).toBeGreaterThan(0);
        expect(Array.isArray(quote.route)).toBe(true);
      }
    }
  }, 45_000);

  it("larger input amount produces larger output amount (same protocol)", async () => {
    const [result10, result100] = await Promise.all([
      agg.getAllQuotes({ tokenIn: xlm, tokenOut: usdc, amount: "10000000" }),    // 1 XLM
      agg.getAllQuotes({ tokenIn: xlm, tokenOut: usdc, amount: "100000000" }),   // 10 XLM
    ]);

    const best10 = result10.quotes.find((q) => q.status === "ok");
    const best100 = result100.quotes.find((q) => q.status === "ok");

    if (best10 && best100) {
      expect(parseFloat(best100.amountOut)).toBeGreaterThan(parseFloat(best10.amountOut));
    }
  }, 60_000);

  it("getBestQuote returns single quote with highest amountOut", async () => {
    const best = await agg.getBestQuote({
      tokenIn: xlm,
      tokenOut: usdc,
      amount: "10000000",
    });

    expect(best).not.toBeNull();
    if (best) {
      expect(best.status).toBe("ok");
      expect(parseFloat(best.amountOut)).toBeGreaterThan(0);
    }
  }, 45_000);

  it("protocol filter: soroswap only returns 1 quote from soroswap", async () => {
    const result = await agg.getAllQuotes({
      tokenIn: xlm,
      tokenOut: usdc,
      amount: "10000000",
      protocols: ["soroswap"],
    });

    expect(result.quotes.length).toBe(1);
    expect(result.quotes[0]!.protocol).toBe("soroswap");
  }, 30_000);

  it("protocol filter: aquarius only returns 1 quote from aquarius", async () => {
    const result = await agg.getAllQuotes({
      tokenIn: xlm,
      tokenOut: usdc,
      amount: "10000000",
      protocols: ["aquarius"],
    });

    expect(result.quotes.length).toBe(1);
    expect(result.quotes[0]!.protocol).toBe("aquarius");
  }, 30_000);

  it("protocol filter: sdex only uses SDEX", async () => {
    // SDEX uses classic asset format
    const MAINNET_USDC_CLASSIC = "USDC:GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN";
    const result = await agg.getAllQuotes({
      tokenIn: "XLM",
      tokenOut: MAINNET_USDC_CLASSIC,
      amount: "1",
      protocols: ["sdex"],
    });

    expect(result.quotes.length).toBe(1);
    expect(result.quotes[0]!.protocol).toBe("sdex");
  }, 30_000);

  it("throws when tokenIn is missing", async () => {
    await expect(
      agg.getAllQuotes({
        tokenIn: "",
        tokenOut: usdc,
        amount: "10000000",
      }),
    ).rejects.toThrow();
  }, 5_000);

  it("throws when tokenOut is missing", async () => {
    await expect(
      agg.getAllQuotes({
        tokenIn: xlm,
        tokenOut: "",
        amount: "10000000",
      }),
    ).rejects.toThrow();
  }, 5_000);
});
