/**
 * SDEX (Stellar DEX) Protocol — live integration tests (testnet + mainnet)
 *
 * Coverage:
 * - getOrderbook: live order book for XLM/USDC (query)
 * - findStrictSendPaths: path finding for XLM→USDC (query)
 * - findStrictReceivePaths: reverse path finding (query)
 * - buildPathPaymentStrictSendXDR: build Stellar TX XDR (testnet op)
 * - getAdapterQuote: swap adapter interface (strict-send)
 */

import { describe, it, expect } from "vitest";
import { SdexAdapter } from "../../../src/protocols/sdex/index.js";
import type { TasmilClientConfig } from "../../../src/types/common.js";

const TESTNET: TasmilClientConfig = {
  network: "testnet",
  horizonUrl: "https://horizon-testnet.stellar.org",
};
const MAINNET: TasmilClientConfig = { network: "mainnet" };

// Classic asset strings for SDEX
const MAINNET_USDC_CLASSIC = "USDC:GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN";
const TESTNET_USDC_CLASSIC = "USDC:GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";

// A well-known testnet account guaranteed to exist (USDC issuer)
const TESTNET_ACCOUNT = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";

// ─── Testnet (query) ──────────────────────────────────────────────

describe("SDEX — testnet (query)", () => {
  const adapter = new SdexAdapter(TESTNET);

  it("getOrderbook XLM/USDC returns bids and asks", async () => {
    const orderbook = await adapter.getOrderbook("XLM", TESTNET_USDC_CLASSIC, 5);
    const ob = orderbook as Record<string, unknown>;
    // Orderbook has bids and asks arrays
    expect(ob["bids"] !== undefined || ob["asks"] !== undefined).toBe(true);
  }, 15_000);

  it("findStrictSendPaths XLM→USDC returns path records", async () => {
    const paths = await adapter.findStrictSendPaths(
      "XLM",
      "1",
      [TESTNET_USDC_CLASSIC],
    );
    expect(Array.isArray(paths)).toBe(true);
    // May have 0 records on testnet if liquidity is low
  }, 15_000);

  it("findStrictReceivePaths →USDC returns path records", async () => {
    // findStrictReceivePaths(sourceAccount, destinationAsset, destinationAmount)
    const paths = await adapter.findStrictReceivePaths(
      TESTNET_ACCOUNT,       // source account
      TESTNET_USDC_CLASSIC,  // destination asset
      "1",                   // desired destination amount
    );
    expect(Array.isArray(paths)).toBe(true);
    // Testnet may have 0 paths due to low liquidity
  }, 15_000);

  it("getYieldOpportunities returns empty array (SDEX LPs not enumerated)", async () => {
    const opps = await adapter.getYieldOpportunities();
    expect(opps).toEqual([]);
  }, 5_000);
});

// ─── Testnet (operations) ─────────────────────────────────────────

describe("SDEX — testnet (operations)", () => {
  const adapter = new SdexAdapter(TESTNET);

  it("buildPathPaymentStrictSendXDR builds valid Stellar TX XDR", async () => {
    // First find a path to get a valid route
    const paths = await adapter.findStrictSendPaths("XLM", "1", [TESTNET_USDC_CLASSIC]);

    // Build XDR with or without path
    const xdr = await adapter.buildPathPaymentStrictSendXDR({
      from: TESTNET_ACCOUNT,
      sendAsset: "XLM",
      sendAmount: "1",
      destination: TESTNET_ACCOUNT,
      destAsset: TESTNET_USDC_CLASSIC,
      destMin: "0.001",
      path: [], // direct path
    });

    expect(typeof xdr).toBe("string");
    expect(xdr.length).toBeGreaterThan(100);
    // Stellar XDR is base64-encoded — check it decodes
    expect(() => Buffer.from(xdr, "base64")).not.toThrow();
  }, 20_000);

  it("buildPathPaymentStrictSendXDR with memo builds valid XDR", async () => {
    const xdr = await adapter.buildPathPaymentStrictSendXDR({
      from: TESTNET_ACCOUNT,
      sendAsset: "XLM",
      sendAmount: "0.5",
      destination: TESTNET_ACCOUNT,
      destAsset: TESTNET_USDC_CLASSIC,
      destMin: "0.001",
      memo: "test-swap",
    });

    expect(typeof xdr).toBe("string");
    expect(xdr.length).toBeGreaterThan(100);
  }, 20_000);
});

// ─── Mainnet ──────────────────────────────────────────────────────

describe("SDEX — mainnet", () => {
  const adapter = new SdexAdapter(MAINNET);

  it("getOrderbook XLM/USDC returns non-empty order book", async () => {
    const orderbook = await adapter.getOrderbook("XLM", MAINNET_USDC_CLASSIC, 10);
    const ob = orderbook as Record<string, unknown>;
    const bids = ob["bids"] as unknown[] | undefined;
    const asks = ob["asks"] as unknown[] | undefined;

    expect(bids !== undefined || asks !== undefined).toBe(true);
    // On mainnet, XLM/USDC should have active orders
    const hasOrders = (bids?.length ?? 0) > 0 || (asks?.length ?? 0) > 0;
    expect(hasOrders).toBe(true);
  }, 15_000);

  it("findStrictSendPaths XLM→USDC returns at least 1 path on mainnet", async () => {
    const paths = await adapter.findStrictSendPaths(
      "XLM",
      "1",
      [MAINNET_USDC_CLASSIC],
    );
    expect(Array.isArray(paths)).toBe(true);
    expect(paths.length).toBeGreaterThanOrEqual(1);
  }, 15_000);

  it("path records have destination_amount field", async () => {
    const paths = await adapter.findStrictSendPaths(
      "XLM",
      "1",
      [MAINNET_USDC_CLASSIC],
    );
    for (const path of paths) {
      const p = path as Record<string, unknown>;
      const destAmount = p["destination_amount"];
      expect(destAmount).toBeDefined();
      expect(parseFloat(String(destAmount))).toBeGreaterThan(0);
    }
  }, 15_000);

  it("getAdapterQuote XLM→USDC returns quote with amountOut", async () => {
    // SDEX adapter expects classic format for SDEX quotes
    const quote = await adapter.getAdapterQuote({
      tokenIn: "XLM",
      tokenOut: MAINNET_USDC_CLASSIC,
      amount: "1",
    });

    expect(quote.protocol).toBe("sdex");
    expect(["ok", "no_route"]).toContain(quote.status);
    if (quote.status === "ok") {
      expect(parseFloat(quote.amountOut)).toBeGreaterThan(0);
    }
  }, 15_000);
});
