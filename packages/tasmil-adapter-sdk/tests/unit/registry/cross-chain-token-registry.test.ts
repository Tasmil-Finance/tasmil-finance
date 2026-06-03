/**
 * CrossChainTokenRegistry — unit tests
 *
 * Tests the cross-chain token & chain registry for the aggregator.
 * Covers both testnet and mainnet registries, token lookup, filtering
 * for swap (same-chain) and bridge (cross-chain) scenarios.
 *
 * No network calls — all data is static/hardcoded.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { CrossChainTokenRegistry } from "../../../src/registry/token-registry.js";
import type { CrossChainToken } from "../../../src/registry/types.js";

// ─── Known addresses for assertions ─────────────────────────────

const MAINNET_ADDR = {
  XLM:  "CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA",
  USDC: "CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75",
  USDT: "CCPRPXYHNKFMZFVNM5F3GYPAR6TFJWCGV6D72BM3MVCIRU7GOOS3FI52",
  EURC: "CDTKPWPLOURQA2SGTKTUQOWRCBZEORB4BWBOMJ3D3ZTQQSGE5F6JBQLV",
  BLND: "CD25MNVTZDL4Y3XBCPCJXGXATV5WUHHOWMYFF4YBEGU5FCPGMYTVG5JY",
  AQUA: "CAUIKL3IYGMERDRUN6YSCLWVAKIFG5Q4YJHUKM4S4NJZQIA3BAS6OJPK",
  PHO:  "CBZ7M5B3Y4WWBZ5XK5UZCAFOEZ23KSSZXYECYX3IXM6E2JOLQC52DK32",
  // EVM addresses for cross-chain
  USDC_ETH: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  USDC_ARB: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
  USDC_SOL: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  USDT_ETH: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
};

const TESTNET_ADDR = {
  XLM:  "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC",
  USDC: "CAZRY5GSFBFXD7H6GAFBA5YGYQTDXU4QKWKMYFWBAZFUCURN3WKX6LF5",
  USDT: "CBL6KD2LFMLAUKFFWNNXWOXFN73GAXLEA4WMJRLQ5L76DMYTM3KWQVJN",
  AQUA: "CDNVQW44C3HALYNVQ4SOBXY5EWYTGVYXX6JPESOLQDABJI5FC5LTRRUE",
  BLND: "CB22KRA3YZVCNCQI64JQ5WE7UY2VAV7WFLK6A2JN3HEX56T2EDAFO7QF",
};

// ═════════════════════════════════════════════════════════════════
// CHAINS
// ═════════════════════════════════════════════════════════════════

describe("CrossChainTokenRegistry — Chains", () => {
  it("returns 9 supported chains", () => {
    const reg = new CrossChainTokenRegistry("mainnet");
    const chains = reg.chains();
    expect(chains).toHaveLength(9);
  });

  it("chains are the same for mainnet and testnet", () => {
    const mainnet = new CrossChainTokenRegistry("mainnet");
    const testnet = new CrossChainTokenRegistry("testnet");
    expect(mainnet.chains()).toEqual(testnet.chains());
  });

  it("includes Stellar, Ethereum, Arbitrum, Base, Polygon, Solana, BSC, Avalanche, Optimism", () => {
    const reg = new CrossChainTokenRegistry("mainnet");
    const ids = reg.chains().map((c) => c.id);
    expect(ids).toEqual([
      "stellar", "ethereum", "arbitrum", "base",
      "polygon", "solana", "bsc", "avalanche", "optimism",
    ]);
  });

  it("each chain has id, name, symbol", () => {
    const reg = new CrossChainTokenRegistry("mainnet");
    for (const chain of reg.chains()) {
      expect(chain.id).toBeTruthy();
      expect(chain.name).toBeTruthy();
      expect(chain.symbol).toBeTruthy();
    }
  });
});

// ═════════════════════════════════════════════════════════════════
// TESTNET — TOKEN LISTING & LOOKUP
// ═════════════════════════════════════════════════════════════════

describe("CrossChainTokenRegistry — Testnet Tokens", () => {
  let reg: CrossChainTokenRegistry;

  beforeEach(() => {
    reg = new CrossChainTokenRegistry("testnet");
  });

  it("lists testnet tokens", () => {
    const tokens = reg.list();
    expect(tokens.length).toBeGreaterThanOrEqual(10);
  });

  it("all testnet tokens are Stellar-only", () => {
    for (const token of reg.list()) {
      expect(token.chains).toEqual(["stellar"]);
    }
  });

  it("no testnet tokens are bridgeable", () => {
    for (const token of reg.list()) {
      expect(token.bridgeable).toBe(false);
    }
  });

  it("getBySymbol returns correct testnet tokens", () => {
    const xlm = reg.getBySymbol("XLM");
    expect(xlm).toBeDefined();
    expect(xlm!.name).toBe("Stellar Lumens");
    expect(xlm!.addresses.stellar).toBe(TESTNET_ADDR.XLM);
    expect(xlm!.decimals).toBe(7);

    const usdc = reg.getBySymbol("USDC");
    expect(usdc).toBeDefined();
    expect(usdc!.addresses.stellar).toBe(TESTNET_ADDR.USDC);
  });

  it("getBySymbol returns undefined for non-existent token", () => {
    expect(reg.getBySymbol("FAKECOIN")).toBeUndefined();
  });

  it("testnet includes expected tokens: XLM, USDC, USDT, AQUA, BLND, ETH, BTC", () => {
    const symbols = reg.list().map((t) => t.symbol);
    expect(symbols).toContain("XLM");
    expect(symbols).toContain("USDC");
    expect(symbols).toContain("USDT");
    expect(symbols).toContain("AQUA");
    expect(symbols).toContain("BLND");
    expect(symbols).toContain("ETH");
    expect(symbols).toContain("BTC");
  });

  it("testnet tokens have swappableOn set", () => {
    const xlm = reg.getBySymbol("XLM")!;
    expect(xlm.swappableOn).toContain("aquarius");
    expect(xlm.swappableOn).toContain("sdex");
  });

  it("getRegistry returns both chains and tokens", () => {
    const result = reg.getRegistry();
    expect(result.chains).toHaveLength(9);
    expect(result.tokens.length).toBeGreaterThan(0);
  });
});

// ═════════════════════════════════════════════════════════════════
// MAINNET — TOKEN LISTING & LOOKUP
// ═════════════════════════════════════════════════════════════════

describe("CrossChainTokenRegistry — Mainnet Tokens", () => {
  let reg: CrossChainTokenRegistry;

  beforeEach(() => {
    reg = new CrossChainTokenRegistry("mainnet");
  });

  it("lists mainnet tokens (more than testnet)", () => {
    const mainnet = reg.list();
    const testnet = new CrossChainTokenRegistry("testnet").list();
    expect(mainnet.length).toBeGreaterThan(testnet.length);
  });

  it("getBySymbol returns correct mainnet addresses", () => {
    expect(reg.getBySymbol("XLM")!.addresses.stellar).toBe(MAINNET_ADDR.XLM);
    expect(reg.getBySymbol("USDC")!.addresses.stellar).toBe(MAINNET_ADDR.USDC);
    expect(reg.getBySymbol("USDT")!.addresses.stellar).toBe(MAINNET_ADDR.USDT);
    expect(reg.getBySymbol("EURC")!.addresses.stellar).toBe(MAINNET_ADDR.EURC);
    expect(reg.getBySymbol("BLND")!.addresses.stellar).toBe(MAINNET_ADDR.BLND);
    expect(reg.getBySymbol("AQUA")!.addresses.stellar).toBe(MAINNET_ADDR.AQUA);
    expect(reg.getBySymbol("PHO")!.addresses.stellar).toBe(MAINNET_ADDR.PHO);
  });

  it("mainnet and testnet have different addresses for the same symbol", () => {
    const mainnet = reg;
    const testnet = new CrossChainTokenRegistry("testnet");

    expect(mainnet.getBySymbol("XLM")!.addresses.stellar)
      .not.toBe(testnet.getBySymbol("XLM")!.addresses.stellar);
    expect(mainnet.getBySymbol("USDC")!.addresses.stellar)
      .not.toBe(testnet.getBySymbol("USDC")!.addresses.stellar);
  });

  it("every token has symbol, name, decimals, and at least one chain", () => {
    for (const token of reg.list()) {
      expect(token.symbol).toBeTruthy();
      expect(token.name).toBeTruthy();
      expect(token.decimals).toBeGreaterThan(0);
      expect(token.chains.length).toBeGreaterThanOrEqual(1);
      expect(Object.keys(token.addresses).length).toBeGreaterThanOrEqual(1);
    }
  });

  it("every token has a Stellar address", () => {
    for (const token of reg.list()) {
      expect(token.addresses.stellar).toBeTruthy();
      expect(token.addresses.stellar).toMatch(/^C[A-Z0-9]{55}$/);
    }
  });

  it("includes all major stablecoins", () => {
    const symbols = reg.list().map((t) => t.symbol);
    for (const s of ["USDC", "USDT", "EURC", "USDY", "PYUSD", "oUSD", "USDGLO"]) {
      expect(symbols).toContain(s);
    }
  });

  it("includes DeFi governance tokens", () => {
    const symbols = reg.list().map((t) => t.symbol);
    for (const s of ["BLND", "AQUA", "PHO", "YBX"]) {
      expect(symbols).toContain(s);
    }
  });

  it("includes yield-bearing tokens", () => {
    const symbols = reg.list().map((t) => t.symbol);
    for (const s of ["yXLM", "yUSDC", "yETH", "yBTC"]) {
      expect(symbols).toContain(s);
    }
  });

  it("no duplicate symbols", () => {
    const symbols = reg.list().map((t) => t.symbol);
    const unique = new Set(symbols);
    expect(unique.size).toBe(symbols.length);
  });
});

// ═════════════════════════════════════════════════════════════════
// MAINNET — CROSS-CHAIN / BRIDGEABLE TOKENS
// ═════════════════════════════════════════════════════════════════

describe("CrossChainTokenRegistry — Cross-Chain Tokens (mainnet)", () => {
  let reg: CrossChainTokenRegistry;

  beforeEach(() => {
    reg = new CrossChainTokenRegistry("mainnet");
  });

  it("USDC is bridgeable on 9 chains", () => {
    const usdc = reg.getBySymbol("USDC")!;
    expect(usdc.bridgeable).toBe(true);
    expect(usdc.chains).toHaveLength(9);
    expect(usdc.chains).toContain("stellar");
    expect(usdc.chains).toContain("ethereum");
    expect(usdc.chains).toContain("arbitrum");
    expect(usdc.chains).toContain("base");
    expect(usdc.chains).toContain("polygon");
    expect(usdc.chains).toContain("solana");
    expect(usdc.chains).toContain("bsc");
    expect(usdc.chains).toContain("avalanche");
    expect(usdc.chains).toContain("optimism");
  });

  it("USDC has correct addresses per chain", () => {
    const usdc = reg.getBySymbol("USDC")!;
    expect(usdc.addresses.stellar).toBe(MAINNET_ADDR.USDC);
    expect(usdc.addresses.ethereum).toBe(MAINNET_ADDR.USDC_ETH);
    expect(usdc.addresses.arbitrum).toBe(MAINNET_ADDR.USDC_ARB);
    expect(usdc.addresses.solana).toBe(MAINNET_ADDR.USDC_SOL);
  });

  it("USDC bridgeable via allbridge and templar", () => {
    const usdc = reg.getBySymbol("USDC")!;
    expect(usdc.bridgeableVia).toContain("allbridge");
    expect(usdc.bridgeableVia).toContain("templar");
  });

  it("USDC swappable on all 4 Stellar DEXs", () => {
    const usdc = reg.getBySymbol("USDC")!;
    expect(usdc.swappableOn).toContain("soroswap");
    expect(usdc.swappableOn).toContain("aquarius");
    expect(usdc.swappableOn).toContain("phoenix");
    expect(usdc.swappableOn).toContain("sdex");
  });

  it("USDT is bridgeable on 8 chains", () => {
    const usdt = reg.getBySymbol("USDT")!;
    expect(usdt.bridgeable).toBe(true);
    expect(usdt.chains.length).toBe(8);
    expect(usdt.chains).toContain("stellar");
    expect(usdt.chains).toContain("ethereum");
    expect(usdt.chains).toContain("solana");
  });

  it("USDT bridgeable via allbridge only (no templar)", () => {
    const usdt = reg.getBySymbol("USDT")!;
    expect(usdt.bridgeableVia).toContain("allbridge");
    expect(usdt.bridgeableVia).not.toContain("templar");
  });

  it("USDT has correct EVM address on Ethereum", () => {
    const usdt = reg.getBySymbol("USDT")!;
    expect(usdt.addresses.ethereum).toBe(MAINNET_ADDR.USDT_ETH);
  });

  it("XLM is NOT bridgeable but has templar in bridgeableVia", () => {
    const xlm = reg.getBySymbol("XLM")!;
    expect(xlm.bridgeable).toBe(false);
    expect(xlm.bridgeableVia).toContain("templar");
    expect(xlm.chains).toEqual(["stellar"]);
  });

  it("getBridgeableTokens returns only USDC and USDT", () => {
    const bridgeable = reg.getBridgeableTokens();
    expect(bridgeable).toHaveLength(2);
    const symbols = bridgeable.map((t) => t.symbol).sort();
    expect(symbols).toEqual(["USDC", "USDT"]);
  });

  it("getTokensForChain('stellar') returns all tokens", () => {
    const stellarTokens = reg.getTokensForChain("stellar");
    expect(stellarTokens.length).toBe(reg.list().length);
  });

  it("getTokensForChain('ethereum') returns only bridgeable tokens", () => {
    const ethTokens = reg.getTokensForChain("ethereum");
    expect(ethTokens.length).toBe(2); // USDC + USDT
    const symbols = ethTokens.map((t) => t.symbol).sort();
    expect(symbols).toEqual(["USDC", "USDT"]);
  });

  it("getTokensForChain('solana') returns bridgeable tokens on Solana", () => {
    const solTokens = reg.getTokensForChain("solana");
    expect(solTokens.length).toBe(2); // USDC + USDT
  });

  it("Stellar-only tokens have exactly 1 chain and 1 address", () => {
    const nonBridgeable = reg.list().filter((t) => !t.bridgeable);
    for (const token of nonBridgeable) {
      expect(token.chains).toEqual(["stellar"]);
      expect(Object.keys(token.addresses)).toEqual(["stellar"]);
    }
  });
});

// ═════════════════════════════════════════════════════════════════
// SWAP FILTERING (same-chain: Stellar → Stellar)
// ═════════════════════════════════════════════════════════════════

describe("CrossChainTokenRegistry — Filter for Swap (same-chain)", () => {
  let reg: CrossChainTokenRegistry;

  beforeEach(() => {
    reg = new CrossChainTokenRegistry("mainnet");
  });

  it("selecting XLM on Stellar returns all other Stellar tokens", () => {
    const result = reg.filter({
      selectedToken: "XLM",
      selectedChain: "stellar",
      direction: "in",
    });

    // Should include all tokens except XLM itself
    expect(result.tokens.length).toBe(reg.list().length - 1);
    expect(result.tokens.find((t) => t.symbol === "XLM")).toBeUndefined();
    expect(result.tokens.find((t) => t.symbol === "USDC")).toBeDefined();
    expect(result.tokens.find((t) => t.symbol === "BLND")).toBeDefined();
  });

  it("selecting XLM on Stellar includes Stellar in available chains", () => {
    const result = reg.filter({
      selectedToken: "XLM",
      selectedChain: "stellar",
      direction: "in",
    });

    expect(result.chains).toContain("stellar");
  });

  it("selecting XLM on Stellar also includes EVM chains (from bridgeable tokens)", () => {
    const result = reg.filter({
      selectedToken: "XLM",
      selectedChain: "stellar",
      direction: "in",
    });

    // USDC/USDT are bridgeable, so their chains should be available
    expect(result.chains).toContain("ethereum");
    expect(result.chains).toContain("arbitrum");
    expect(result.chains).toContain("solana");
  });

  it("selecting USDC on Stellar returns all other Stellar tokens", () => {
    const result = reg.filter({
      selectedToken: "USDC",
      selectedChain: "stellar",
      direction: "in",
    });

    expect(result.tokens.find((t) => t.symbol === "XLM")).toBeDefined();
    expect(result.tokens.find((t) => t.symbol === "USDC")).toBeUndefined();
  });

  it("selecting USDC on Stellar includes EVM chains (USDC itself is bridgeable)", () => {
    const result = reg.filter({
      selectedToken: "USDC",
      selectedChain: "stellar",
      direction: "in",
    });

    // USDC is bridgeable, so all its chains should be available
    expect(result.chains).toContain("ethereum");
    expect(result.chains).toContain("base");
    expect(result.chains).toContain("solana");
  });

  it("selecting a Stellar-only token still shows EVM chains from bridgeable tokens", () => {
    const result = reg.filter({
      selectedToken: "BLND",
      selectedChain: "stellar",
      direction: "in",
    });

    // BLND is not bridgeable itself, but USDC/USDT are in the result set
    expect(result.chains).toContain("stellar");
    expect(result.chains).toContain("ethereum"); // from bridgeable USDC/USDT
    expect(result.tokens.find((t) => t.symbol === "USDC")).toBeDefined();
  });

  it("chains are sorted: stellar first, then alphabetical", () => {
    const result = reg.filter({
      selectedToken: "XLM",
      selectedChain: "stellar",
      direction: "in",
    });

    expect(result.chains[0]).toBe("stellar");
    const rest = result.chains.slice(1);
    const sorted = [...rest].sort();
    expect(rest).toEqual(sorted);
  });
});

// ═════════════════════════════════════════════════════════════════
// BRIDGE FILTERING (cross-chain: Ethereum → Stellar, etc.)
// ═════════════════════════════════════════════════════════════════

describe("CrossChainTokenRegistry — Filter for Bridge (cross-chain)", () => {
  let reg: CrossChainTokenRegistry;

  beforeEach(() => {
    reg = new CrossChainTokenRegistry("mainnet");
  });

  it("selecting USDC on Ethereum returns all Stellar tokens + bridgeable tokens", () => {
    const result = reg.filter({
      selectedToken: "USDC",
      selectedChain: "ethereum",
      direction: "in",
    });

    // Should include all Stellar tokens
    expect(result.tokens.find((t) => t.symbol === "XLM")).toBeDefined();
    expect(result.tokens.find((t) => t.symbol === "BLND")).toBeDefined();
    // USDC on other chains is valid (bridge to different chain)
    expect(result.tokens.find((t) => t.symbol === "USDC")).toBeDefined();
  });

  it("selecting USDC on Ethereum includes Stellar + all other USDC chains", () => {
    const result = reg.filter({
      selectedToken: "USDC",
      selectedChain: "ethereum",
      direction: "in",
    });

    expect(result.chains).toContain("stellar");
    expect(result.chains).toContain("arbitrum");
    expect(result.chains).toContain("base");
    expect(result.chains).toContain("solana");
    // Ethereum excluded (it's the selected chain)
    expect(result.chains).not.toContain("ethereum");
  });

  it("selecting USDT on Arbitrum includes Stellar + other USDT chains", () => {
    const result = reg.filter({
      selectedToken: "USDT",
      selectedChain: "arbitrum",
      direction: "in",
    });

    expect(result.chains).toContain("stellar");
    expect(result.chains).toContain("ethereum");
    expect(result.chains).not.toContain("arbitrum"); // excluded — it's selected
  });

  it("selecting USDC on Solana includes all chains except Solana", () => {
    const result = reg.filter({
      selectedToken: "USDC",
      selectedChain: "solana",
      direction: "in",
    });

    expect(result.chains).toContain("stellar");
    expect(result.chains).toContain("ethereum");
    expect(result.chains).not.toContain("solana");
  });
});

// ═════════════════════════════════════════════════════════════════
// TESTNET FILTERING
// ═════════════════════════════════════════════════════════════════

describe("CrossChainTokenRegistry — Filter on Testnet", () => {
  let reg: CrossChainTokenRegistry;

  beforeEach(() => {
    reg = new CrossChainTokenRegistry("testnet");
  });

  it("selecting XLM on testnet returns other testnet tokens", () => {
    const result = reg.filter({
      selectedToken: "XLM",
      selectedChain: "stellar",
      direction: "in",
    });

    expect(result.tokens.length).toBe(reg.list().length - 1);
    expect(result.tokens.find((t) => t.symbol === "XLM")).toBeUndefined();
    expect(result.tokens.find((t) => t.symbol === "USDC")).toBeDefined();
  });

  it("testnet has no EVM chains in results (no bridgeable tokens)", () => {
    const result = reg.filter({
      selectedToken: "XLM",
      selectedChain: "stellar",
      direction: "in",
    });

    expect(result.chains).toEqual(["stellar"]);
  });

  it("testnet tokens have correct addresses", () => {
    expect(reg.getBySymbol("XLM")!.addresses.stellar).toBe(TESTNET_ADDR.XLM);
    expect(reg.getBySymbol("USDC")!.addresses.stellar).toBe(TESTNET_ADDR.USDC);
    expect(reg.getBySymbol("USDT")!.addresses.stellar).toBe(TESTNET_ADDR.USDT);
    expect(reg.getBySymbol("AQUA")!.addresses.stellar).toBe(TESTNET_ADDR.AQUA);
    expect(reg.getBySymbol("BLND")!.addresses.stellar).toBe(TESTNET_ADDR.BLND);
  });
});

// ═════════════════════════════════════════════════════════════════
// FILTER EDGE CASES
// ═════════════════════════════════════════════════════════════════

describe("CrossChainTokenRegistry — Filter Edge Cases", () => {
  let reg: CrossChainTokenRegistry;

  beforeEach(() => {
    reg = new CrossChainTokenRegistry("mainnet");
  });

  it("returns empty for non-existent token", () => {
    const result = reg.filter({
      selectedToken: "FAKECOIN",
      selectedChain: "stellar",
      direction: "in",
    });

    expect(result.tokens).toHaveLength(0);
    expect(result.chains).toHaveLength(0);
  });

  it("returns empty for non-existent chain", () => {
    const result = reg.filter({
      selectedToken: "XLM",
      selectedChain: "fakechain",
      direction: "in",
    });

    expect(result.tokens).toHaveLength(0);
    expect(result.chains).toHaveLength(0);
  });

  it("USDC on Stellar can target USDC on other chains (bridge)", () => {
    const result = reg.filter({
      selectedToken: "USDC",
      selectedChain: "stellar",
      direction: "in",
    });

    // USDC is bridgeable and exists on other chains → should appear in results
    const usdcResult = result.tokens.find((t) => t.symbol === "USDC");
    expect(usdcResult).toBeDefined();
    // It has chains other than stellar (ethereum, solana, etc.)
    expect(usdcResult!.chains.some((c) => c !== "stellar")).toBe(true);
  });

  it("USDT on Stellar appears in results because it's bridgeable to other chains", () => {
    const result = reg.filter({
      selectedToken: "USDT",
      selectedChain: "stellar",
      direction: "in",
    });

    // USDT is bridgeable → included so user can bridge USDT Stellar → USDT Ethereum
    const usdtResult = result.tokens.find((t) => t.symbol === "USDT");
    expect(usdtResult).toBeDefined();
    expect(usdtResult!.chains.some((c) => c !== "stellar")).toBe(true);
    expect(result.chains).toContain("ethereum");
  });

  it("direction param doesn't change result (filtering is symmetric)", () => {
    const inResult = reg.filter({
      selectedToken: "XLM",
      selectedChain: "stellar",
      direction: "in",
    });
    const outResult = reg.filter({
      selectedToken: "XLM",
      selectedChain: "stellar",
      direction: "out",
    });

    expect(inResult.tokens.length).toBe(outResult.tokens.length);
    expect(inResult.chains).toEqual(outResult.chains);
  });
});

// ═════════════════════════════════════════════════════════════════
// SWAP SCENARIOS (real-world user flows)
// ═════════════════════════════════════════════════════════════════

describe("CrossChainTokenRegistry — Swap Scenarios", () => {
  let reg: CrossChainTokenRegistry;

  beforeEach(() => {
    reg = new CrossChainTokenRegistry("mainnet");
  });

  it("scenario: user selects XLM → wants to swap to USDC on Stellar", () => {
    const result = reg.filter({
      selectedToken: "XLM",
      selectedChain: "stellar",
      direction: "in",
    });

    const usdc = result.tokens.find((t) => t.symbol === "USDC");
    expect(usdc).toBeDefined();
    expect(usdc!.swappableOn).toContain("soroswap");
    expect(usdc!.swappableOn).toContain("aquarius");
    expect(result.chains).toContain("stellar");
  });

  it("scenario: user selects EURC → can swap to XLM, USDC, etc.", () => {
    const result = reg.filter({
      selectedToken: "EURC",
      selectedChain: "stellar",
      direction: "in",
    });

    expect(result.tokens.find((t) => t.symbol === "XLM")).toBeDefined();
    expect(result.tokens.find((t) => t.symbol === "USDC")).toBeDefined();
    expect(result.tokens.find((t) => t.symbol === "EURC")).toBeUndefined(); // can't swap to self
  });

  it("scenario: user selects PHO → swappable on all 4 protocols", () => {
    const pho = reg.getBySymbol("PHO")!;
    expect(pho.swappableOn).toContain("soroswap");
    expect(pho.swappableOn).toContain("aquarius");
    expect(pho.swappableOn).toContain("phoenix");
    expect(pho.swappableOn).toContain("sdex");
  });

  it("scenario: CARBON has 3 decimals, not 7", () => {
    const carbon = reg.getBySymbol("CARBON")!;
    expect(carbon.decimals).toBe(3);
  });
});

// ═════════════════════════════════════════════════════════════════
// BRIDGE SCENARIOS (real-world user flows)
// ═════════════════════════════════════════════════════════════════

describe("CrossChainTokenRegistry — Bridge Scenarios", () => {
  let reg: CrossChainTokenRegistry;

  beforeEach(() => {
    reg = new CrossChainTokenRegistry("mainnet");
  });

  it("scenario: bridge USDC from Ethereum to Stellar", () => {
    const result = reg.filter({
      selectedToken: "USDC",
      selectedChain: "ethereum",
      direction: "in",
    });

    // Stellar should be available as target chain
    expect(result.chains).toContain("stellar");
    // All Stellar tokens should be available (user may want to swap after bridge)
    expect(result.tokens.find((t) => t.symbol === "XLM")).toBeDefined();
  });

  it("scenario: bridge USDC from Stellar to Arbitrum", () => {
    const result = reg.filter({
      selectedToken: "USDC",
      selectedChain: "stellar",
      direction: "in",
    });

    expect(result.chains).toContain("arbitrum");
  });

  it("scenario: bridge USDT from BSC to Stellar", () => {
    const result = reg.filter({
      selectedToken: "USDT",
      selectedChain: "bsc",
      direction: "in",
    });

    expect(result.chains).toContain("stellar");
    // USDT available on other chains too
    expect(result.chains).toContain("ethereum");
    expect(result.chains).not.toContain("bsc"); // can't bridge to same chain
  });

  it("scenario: non-bridgeable token on Stellar cannot target EVM chains directly", () => {
    // BLND is not bridgeable
    const blnd = reg.getBySymbol("BLND")!;
    expect(blnd.bridgeable).toBe(false);
    expect(blnd.chains).toEqual(["stellar"]);

    // But filter still shows EVM chains because other tokens (USDC) are bridgeable
    const result = reg.filter({
      selectedToken: "BLND",
      selectedChain: "stellar",
      direction: "in",
    });
    expect(result.chains).toContain("ethereum");
  });

  it("scenario: USDC addresses are correct per chain for bridge execution", () => {
    const usdc = reg.getBySymbol("USDC")!;

    // When bridging FROM Ethereum, the adapter needs the Ethereum USDC address
    expect(usdc.addresses.ethereum).toBe("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");
    // When bridging TO Stellar, the adapter needs the Stellar USDC address
    expect(usdc.addresses.stellar).toBe("CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75");
    // Solana has a different format (base58)
    expect(usdc.addresses.solana).toBe("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
  });

  it("scenario: all USDC EVM addresses start with 0x", () => {
    const usdc = reg.getBySymbol("USDC")!;
    const evmChains = ["ethereum", "arbitrum", "base", "polygon", "bsc", "avalanche", "optimism"];
    for (const chain of evmChains) {
      expect(usdc.addresses[chain]).toMatch(/^0x[a-fA-F0-9]{40}$/);
    }
  });

  it("scenario: Solana addresses are base58 (not 0x)", () => {
    const usdc = reg.getBySymbol("USDC")!;
    expect(usdc.addresses.solana).not.toMatch(/^0x/);
    expect(usdc.addresses.solana!.length).toBeGreaterThan(30);
  });
});

// ═════════════════════════════════════════════════════════════════
// INTEGRATION WITH TasmilClient
// ═════════════════════════════════════════════════════════════════

describe("CrossChainTokenRegistry — via TasmilClient", () => {
  it("accessible as sdk.tokens", async () => {
    const { createTasmilClient } = await import("../../../src/index.js");
    const sdk = createTasmilClient({ network: "mainnet" });

    expect(sdk.tokens).toBeInstanceOf(CrossChainTokenRegistry);
    expect(sdk.tokens.list().length).toBeGreaterThan(0);
    expect(sdk.tokens.chains()).toHaveLength(9);
    expect(sdk.tokens.getBySymbol("USDC")).toBeDefined();
  }, 60_000);

  it("testnet client returns testnet tokens", async () => {
    const { createTasmilClient } = await import("../../../src/index.js");
    const sdk = createTasmilClient({ network: "testnet" });

    expect(sdk.tokens.getBySymbol("XLM")!.addresses.stellar).toBe(TESTNET_ADDR.XLM);
  });

  it("mainnet client returns mainnet tokens", async () => {
    const { createTasmilClient } = await import("../../../src/index.js");
    const sdk = createTasmilClient({ network: "mainnet" });

    expect(sdk.tokens.getBySymbol("XLM")!.addresses.stellar).toBe(MAINNET_ADDR.XLM);
  });
});

// ═════════════════════════════════════════════════════════════════
// LOAD BRIDGE TOKENS (mock — no network calls)
// ═════════════════════════════════════════════════════════════════

describe("CrossChainTokenRegistry — loadBridgeTokens (mocked)", () => {
  // Simulates Allbridge chainDetailsMap() response
  const mockAllbridgeData: Record<string, unknown> = {
    ETH: {
      chainName: "Ethereum",
      tokens: [
        { symbol: "USDC", name: "USD Coin", decimals: 6, tokenAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" },
        { symbol: "USDT", name: "Tether USD", decimals: 6, tokenAddress: "0xdAC17F958D2ee523a2206206994597C13D831ec7" },
        { symbol: "USDe", name: "Ethena USDe", decimals: 18, tokenAddress: "0x4c9EDD5852cd905f086C759E8383e09bff1E68B3" },
      ],
    },
    SOL: {
      chainName: "Solana",
      tokens: [
        { symbol: "USDC", name: "USD Coin", decimals: 6, tokenAddress: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" },
        { symbol: "USDT", name: "Tether USD", decimals: 6, tokenAddress: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB" },
      ],
    },
    SRB: {
      chainName: "Stellar",
      tokens: [
        { symbol: "USDC", name: "USD Coin", decimals: 7, tokenAddress: "CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75" },
      ],
    },
    // New chains not in our static registry
    SUI: {
      chainName: "Sui",
      tokens: [
        { symbol: "USDC", name: "USD Coin", decimals: 6, tokenAddress: "0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN" },
      ],
    },
    ALG: {
      chainName: "Algorand",
      tokens: [
        { symbol: "USDC", name: "USD Coin", decimals: 6, tokenAddress: "31566704" },
      ],
    },
    STX: {
      chainName: "Stacks",
      tokens: [
        { symbol: "USDCx", name: "USDCx", decimals: 6, tokenAddress: "SP3Y2ZSH8P7D50B0VBTSX11S7XSG24M1VB9YFQA4K.token-susdc" },
      ],
    },
    TRX: {
      chainName: "Tron",
      tokens: [
        { symbol: "USDT", name: "Tether USD", decimals: 6, tokenAddress: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t" },
      ],
    },
    ARB: {
      chainName: "Arbitrum",
      tokens: [
        { symbol: "USDC", name: "USD Coin", decimals: 6, tokenAddress: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831" },
        { symbol: "USDT", name: "Tether USD", decimals: 6, tokenAddress: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9" },
        { symbol: "USDe", name: "Ethena USDe", decimals: 18, tokenAddress: "0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34" },
      ],
    },
  };

  const mockAdapter = {
    getSupportedChains: async () => mockAllbridgeData,
  };

  it("adds new chains from Allbridge", async () => {
    const reg = new CrossChainTokenRegistry("mainnet");
    const chainsBefore = reg.chains().length;

    await reg.loadBridgeTokens(mockAdapter);

    expect(reg.chains().length).toBeGreaterThan(chainsBefore);
    const chainIds = reg.chains().map((c) => c.id);
    expect(chainIds).toContain("sui");
    expect(chainIds).toContain("algorand");
    expect(chainIds).toContain("stacks");
    expect(chainIds).toContain("tron");
  });

  it("new chains have correct names", async () => {
    const reg = new CrossChainTokenRegistry("mainnet");
    await reg.loadBridgeTokens(mockAdapter);

    const sui = reg.chains().find((c) => c.id === "sui");
    expect(sui).toBeDefined();
    expect(sui!.name).toBe("Sui");

    const tron = reg.chains().find((c) => c.id === "tron");
    expect(tron).toBeDefined();
    expect(tron!.name).toBe("Tron");
  });

  it("enriches existing USDC with new chains", async () => {
    const reg = new CrossChainTokenRegistry("mainnet");
    const usdcBefore = reg.getBySymbol("USDC")!;
    expect(usdcBefore.chains).not.toContain("sui");
    expect(usdcBefore.chains).not.toContain("algorand");

    await reg.loadBridgeTokens(mockAdapter);

    const usdc = reg.getBySymbol("USDC")!;
    expect(usdc.chains).toContain("sui");
    expect(usdc.chains).toContain("algorand");
    expect(usdc.addresses.sui).toBeTruthy();
    expect(usdc.addresses.algorand).toBe("31566704");
  });

  it("enriches existing USDT with Tron", async () => {
    const reg = new CrossChainTokenRegistry("mainnet");
    await reg.loadBridgeTokens(mockAdapter);

    const usdt = reg.getBySymbol("USDT")!;
    expect(usdt.chains).toContain("tron");
    expect(usdt.addresses.tron).toBe("TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t");
  });

  it("adds new token USDe not in static registry", async () => {
    const reg = new CrossChainTokenRegistry("mainnet");
    expect(reg.getBySymbol("USDE")).toBeUndefined();

    await reg.loadBridgeTokens(mockAdapter);

    const usde = reg.getBySymbol("USDE");
    expect(usde).toBeDefined();
    expect(usde!.bridgeable).toBe(true);
    expect(usde!.bridgeableVia).toContain("allbridge");
    expect(usde!.chains).toContain("ethereum");
    expect(usde!.chains).toContain("arbitrum");
    expect(usde!.addresses.ethereum).toBe("0x4c9EDD5852cd905f086C759E8383e09bff1E68B3");
  });

  it("adds new token USDCx from Stacks", async () => {
    const reg = new CrossChainTokenRegistry("mainnet");
    await reg.loadBridgeTokens(mockAdapter);

    const usdcx = reg.getBySymbol("USDCX");
    expect(usdcx).toBeDefined();
    expect(usdcx!.chains).toContain("stacks");
  });

  it("marks existing tokens as bridgeable via allbridge", async () => {
    const reg = new CrossChainTokenRegistry("mainnet");
    await reg.loadBridgeTokens(mockAdapter);

    const usdc = reg.getBySymbol("USDC")!;
    expect(usdc.bridgeableVia).toContain("allbridge");
    expect(usdc.bridgeable).toBe(true);
  });

  it("does not overwrite existing addresses", async () => {
    const reg = new CrossChainTokenRegistry("mainnet");
    const originalEthAddr = reg.getBySymbol("USDC")!.addresses.ethereum;

    await reg.loadBridgeTokens(mockAdapter);

    // Should keep the original, not overwrite with Allbridge data
    expect(reg.getBySymbol("USDC")!.addresses.ethereum).toBe(originalEthAddr);
  });

  it("does not duplicate chains on second call", async () => {
    const reg = new CrossChainTokenRegistry("mainnet");
    await reg.loadBridgeTokens(mockAdapter);
    const chainsAfterFirst = reg.chains().length;

    await reg.loadBridgeTokens(mockAdapter);
    expect(reg.chains().length).toBe(chainsAfterFirst);
  });

  it("returns stats from loadBridgeTokens", async () => {
    const reg = new CrossChainTokenRegistry("mainnet");
    const stats = await reg.loadBridgeTokens(mockAdapter);

    expect(stats.chainsAdded).toBeGreaterThan(0);
    expect(stats.tokensUpdated).toBeGreaterThan(0);
    expect(stats.tokensAdded).toBeGreaterThan(0);
  });

  it("isBridgeLoaded returns true after load", async () => {
    const reg = new CrossChainTokenRegistry("mainnet");
    expect(reg.isBridgeLoaded()).toBe(false);

    await reg.loadBridgeTokens(mockAdapter);
    expect(reg.isBridgeLoaded()).toBe(true);
  });

  it("filter works with dynamically added chains", async () => {
    const reg = new CrossChainTokenRegistry("mainnet");
    await reg.loadBridgeTokens(mockAdapter);

    // USDC on Sui should now be filterable
    const result = reg.filter({
      selectedToken: "USDC",
      selectedChain: "sui",
      direction: "in",
    });

    expect(result.chains).toContain("stellar");
    expect(result.chains).toContain("ethereum");
    expect(result.chains).not.toContain("sui"); // can't bridge to same chain
    // All Stellar tokens should be valid targets
    expect(result.tokens.find((t) => t.symbol === "XLM")).toBeDefined();
  });

  it("filter shows new chains when selecting from Stellar", async () => {
    const reg = new CrossChainTokenRegistry("mainnet");
    await reg.loadBridgeTokens(mockAdapter);

    const result = reg.filter({
      selectedToken: "XLM",
      selectedChain: "stellar",
      direction: "in",
    });

    // Sui, Algorand, Tron should now be in available chains
    expect(result.chains).toContain("sui");
    expect(result.chains).toContain("algorand");
    expect(result.chains).toContain("tron");
  });

  it("new bridge-only tokens appear in filter results", async () => {
    const reg = new CrossChainTokenRegistry("mainnet");
    await reg.loadBridgeTokens(mockAdapter);

    const result = reg.filter({
      selectedToken: "XLM",
      selectedChain: "stellar",
      direction: "in",
    });

    // USDe should appear as a bridgeable target
    const usde = result.tokens.find((t) => t.symbol === "USDE");
    expect(usde).toBeDefined();
    expect(usde!.bridgeable).toBe(true);
  });

  it("does not mutate static registry arrays", async () => {
    // Create two registries — loading one should not affect the other
    const reg1 = new CrossChainTokenRegistry("mainnet");
    const reg2 = new CrossChainTokenRegistry("mainnet");

    await reg1.loadBridgeTokens(mockAdapter);

    // reg2 should still have original data
    expect(reg2.getBySymbol("USDC")!.chains).not.toContain("sui");
    expect(reg2.chains().length).toBe(9);
  });
});

// ═════════════════════════════════════════════════════════════════
// LOAD BRIDGE TOKENS — LIVE (integration, calls real Allbridge API)
// ═════════════════════════════════════════════════════════════════

describe("CrossChainTokenRegistry — loadBridgeTokens (live Allbridge)", () => {
  it("loads real bridge data from Allbridge SDK", async () => {
    const { createTasmilClient } = await import("../../../src/index.js");
    const sdk = createTasmilClient({ network: "mainnet" });

    const stats = await sdk.loadBridgeTokens();

    // Should discover new chains beyond our hardcoded 9
    expect(sdk.tokens.chains().length).toBeGreaterThan(9);
    expect(stats.chainsAdded).toBeGreaterThan(0);

    // USDC should now be on more chains (Sui, Algorand, etc.)
    const usdc = sdk.tokens.getBySymbol("USDC")!;
    expect(usdc.chains.length).toBeGreaterThan(9);
    expect(usdc.chains).toContain("sui");

    // New chains should be in the list
    const chainIds = sdk.tokens.chains().map((c) => c.id);
    expect(chainIds).toContain("sui");
    expect(chainIds).toContain("tron");
  }, 30_000);

  it("filter works with live Allbridge data", async () => {
    const { createTasmilClient } = await import("../../../src/index.js");
    const sdk = createTasmilClient({ network: "mainnet" });
    await sdk.loadBridgeTokens();

    // Selecting USDC on Sui should show Stellar + other chains
    const result = sdk.tokens.filter({
      selectedToken: "USDC",
      selectedChain: "sui",
      direction: "in",
    });

    expect(result.chains).toContain("stellar");
    expect(result.chains).toContain("ethereum");
    expect(result.tokens.find((t) => t.symbol === "XLM")).toBeDefined();
  }, 30_000);
});
