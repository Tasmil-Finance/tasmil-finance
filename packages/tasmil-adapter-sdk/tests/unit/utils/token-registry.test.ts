import { describe, it, expect, beforeEach } from "vitest";
import {
  TokenPoolRegistry,
  getTokenPoolRegistry,
} from "../../../src/utils/token-registry.js";

// ─── Known testnet addresses for assertions ────────────────────
const TESTNET = {
  XLM: "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC",
  USDC_AQUARIUS: "CAZRY5GSFBFXD7H6GAFBA5YGYQTDXU4QKWKMYFWBAZFUCURN3WKX6LF5",
  USDC_BLEND: "CAQCFVLOBK5GIULPNZRGATJJMIZL5BSP7X5YJVMGCPTUEPFM4AVSRCJU",
  USDC_BLEND_V2: "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA",
  USDT: "CBL6KD2LFMLAUKFFWNNXWOXFN73GAXLEA4WMJRLQ5L76DMYTM3KWQVJN",
  BLND: "CB22KRA3YZVCNCQI64JQ5WE7UY2VAV7WFLK6A2JN3HEX56T2EDAFO7QF",
  AQUA: "CDNVQW44C3HALYNVQ4SOBXY5EWYTGVYXX6JPESOLQDABJI5FC5LTRRUE",
  ICE: "CCQZWA6GDCNLEMNUYTCMYGIXLX3ECAXW7RICSUZWWXM5AMDWAANC4SZK",
  PHO: "CBZ7M5B3Y4WWBZ5XK5UZCAFOEZ23KSSZXYECYX3IXM6E2JOLQC52DK32",
  // Pools
  AQUA_XLM_USDC_CP: "CD3LFMMLBQ6RBJUD3Z2LFDFE6544WDRMWHEZYPI5YDVESYRSO2TT32BX",
  AQUA_XLM_USDC_CL: "CAD5TBS4NKO35YDYZN3ULQFXDXVL7BPK4Q2RUG7N4DVPYNNOEAUAQJ6F",
  AQUA_USDC_USDT: "CC2NBF7M6QBEOUNTV2C4BK42ID2WK2O3AJRC777BND4O3B6JUV7EY33J",
  BLEND_POOL: "CCEBVDYM32YNYCVNRXQKDFFPISJJCV557CDZEIRBEE4NCV4KHPQ44HGF",
};

const MAINNET = {
  XLM: "CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA",
  USDC: "CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75",
  BLEND_FIXED: "CAJJZSGMMM3PD7N33TAPHGBUGTB43OC73HVIK2L2G6BNGGGYOSSYBXBD",
  PHOENIX_XLM_USDC: "CBHCRSVX3ZZ7EGTSYMKPEFGZNWRVCSESQR3UABET4MIW52N4EVU6BIZX",
};

// ═════════════════════════════════════════════════════════════════
// TOKEN RESOLUTION
// ═════════════════════════════════════════════════════════════════

describe("TokenPoolRegistry — Token Resolution", () => {
  let testnet: TokenPoolRegistry;
  let mainnet: TokenPoolRegistry;

  beforeEach(() => {
    testnet = getTokenPoolRegistry("testnet");
    mainnet = getTokenPoolRegistry("mainnet");
  });

  // ── getToken (address → entry) ──────────────────────────────

  describe("getToken(address)", () => {
    it("returns entry for known address", () => {
      const entry = testnet.getToken(TESTNET.XLM);
      expect(entry).toBeDefined();
      expect(entry!.symbol).toBe("XLM");
      expect(entry!.name).toBe("Stellar Lumens");
    });

    it("returns undefined for unknown address", () => {
      expect(testnet.getToken("CUNKNOWN_ADDRESS_THAT_DOESNT_EXIST_AAAAAAAAAAAAAAAAAAAAAAAA")).toBeUndefined();
    });

    it("returns correct entry for each USDC variant on testnet", () => {
      const aquaUsdc = testnet.getToken(TESTNET.USDC_AQUARIUS);
      expect(aquaUsdc?.symbol).toBe("USDC");
      expect(aquaUsdc?.protocols).toContain("aquarius");

      const blendUsdc = testnet.getToken(TESTNET.USDC_BLEND);
      expect(blendUsdc?.symbol).toBe("USDC");
      expect(blendUsdc?.protocols).toContain("blend");

      // Different addresses, same symbol
      expect(aquaUsdc?.address).not.toBe(blendUsdc?.address);
    });
  });

  // ── getSymbol (address → symbol string) ─────────────────────

  describe("getSymbol(address)", () => {
    it("resolves all known testnet tokens", () => {
      expect(testnet.getSymbol(TESTNET.XLM)).toBe("XLM");
      expect(testnet.getSymbol(TESTNET.USDC_AQUARIUS)).toBe("USDC");
      expect(testnet.getSymbol(TESTNET.USDC_BLEND)).toBe("USDC");
      expect(testnet.getSymbol(TESTNET.USDC_BLEND_V2)).toBe("USDC");
      expect(testnet.getSymbol(TESTNET.USDT)).toBe("USDT");
      expect(testnet.getSymbol(TESTNET.BLND)).toBe("BLND");
      expect(testnet.getSymbol(TESTNET.AQUA)).toBe("AQUA");
      expect(testnet.getSymbol(TESTNET.ICE)).toBe("ICE");
      expect(testnet.getSymbol(TESTNET.PHO)).toBe("PHO");
    });

    it("resolves mainnet tokens", () => {
      expect(mainnet.getSymbol(MAINNET.XLM)).toBe("XLM");
      expect(mainnet.getSymbol(MAINNET.USDC)).toBe("USDC");
    });

    it("returns truncated address for unknown contracts", () => {
      const result = testnet.getSymbol("CUNKNOWN_ADDRESS_THAT_DOESNT_EXIST_AAAAAAAAAAAAAAAAAAAAAAAA");
      expect(result).toContain("...");
    });
  });

  // ── resolveSymbol (symbol → address, with protocol context) ─

  describe("resolveSymbol(symbol, protocol?)", () => {
    it("resolves XLM without protocol hint", () => {
      expect(testnet.resolveSymbol("XLM")).toBe(TESTNET.XLM);
    });

    it("resolves USDC to Aquarius address by default (first with '*' or first entry)", () => {
      const result = testnet.resolveSymbol("USDC");
      expect(result).toBe(TESTNET.USDC_AQUARIUS);
    });

    it("resolves USDC to Aquarius address with aquarius hint", () => {
      expect(testnet.resolveSymbol("USDC", "aquarius")).toBe(TESTNET.USDC_AQUARIUS);
    });

    it("resolves USDC to Blend address with blend hint", () => {
      expect(testnet.resolveSymbol("USDC", "blend")).toBe(TESTNET.USDC_BLEND);
    });

    it("resolves USDC to Aquarius address with sdex hint", () => {
      expect(testnet.resolveSymbol("USDC", "sdex")).toBe(TESTNET.USDC_AQUARIUS);
    });

    it("is case-insensitive", () => {
      expect(testnet.resolveSymbol("usdc")).toBe(TESTNET.USDC_AQUARIUS);
      expect(testnet.resolveSymbol("Xlm")).toBe(TESTNET.XLM);
      expect(testnet.resolveSymbol("blnd")).toBe(TESTNET.BLND);
    });

    it("mainnet USDC has single address regardless of protocol hint", () => {
      expect(mainnet.resolveSymbol("USDC")).toBe(MAINNET.USDC);
      expect(mainnet.resolveSymbol("USDC", "blend")).toBe(MAINNET.USDC);
      expect(mainnet.resolveSymbol("USDC", "aquarius")).toBe(MAINNET.USDC);
    });

    it("returns undefined for non-existent symbol", () => {
      expect(testnet.resolveSymbol("FAKECOIN")).toBeUndefined();
    });
  });

  // ── getAddresses (symbol → all variants) ────────────────────

  describe("getAddresses(symbol)", () => {
    it("returns 3 USDC variants on testnet", () => {
      const variants = testnet.getAddresses("USDC");
      expect(variants.length).toBe(3);
      expect(variants.map((v) => v.address)).toContain(TESTNET.USDC_AQUARIUS);
      expect(variants.map((v) => v.address)).toContain(TESTNET.USDC_BLEND);
      expect(variants.map((v) => v.address)).toContain(TESTNET.USDC_BLEND_V2);
    });

    it("returns 1 USDC on mainnet (no conflict)", () => {
      const variants = mainnet.getAddresses("USDC");
      expect(variants.length).toBe(1);
      expect(variants[0]!.address).toBe(MAINNET.USDC);
    });

    it("returns 1 XLM on testnet", () => {
      const variants = testnet.getAddresses("XLM");
      expect(variants.length).toBe(1);
    });

    it("returns empty array for unknown symbol", () => {
      expect(testnet.getAddresses("FAKE")).toHaveLength(0);
    });

    it("is case-insensitive", () => {
      expect(testnet.getAddresses("usdc").length).toBe(3);
    });

    it("each variant has protocol tag", () => {
      const variants = testnet.getAddresses("USDC");
      for (const v of variants) {
        expect(v.protocols.length).toBeGreaterThan(0);
      }
    });
  });

  // ── listTokens ──────────────────────────────────────────────

  describe("listTokens()", () => {
    it("returns all tokens for network", () => {
      const tokens = testnet.listTokens();
      expect(tokens.length).toBeGreaterThan(5);
      const symbols = tokens.map((t) => t.symbol);
      expect(symbols).toContain("XLM");
      expect(symbols).toContain("USDC");
      expect(symbols).toContain("BLND");
    });
  });
});

// ═════════════════════════════════════════════════════════════════
// POOL RESOLUTION
// ═════════════════════════════════════════════════════════════════

describe("TokenPoolRegistry — Pool Resolution", () => {
  let testnet: TokenPoolRegistry;
  let mainnet: TokenPoolRegistry;

  beforeEach(() => {
    testnet = getTokenPoolRegistry("testnet");
    mainnet = getTokenPoolRegistry("mainnet");
  });

  // ── findPools (pair → pools) ────────────────────────────────

  describe("findPools(tokenA, tokenB, protocol?)", () => {
    it("finds XLM/USDC pools across protocols on testnet", () => {
      const pools = testnet.findPools("XLM", "USDC");
      expect(pools.length).toBeGreaterThanOrEqual(3); // 2 aquarius + 1 blend
    });

    it("finds both orderings: XLM/USDC and USDC/XLM", () => {
      const a = testnet.findPools("XLM", "USDC");
      const b = testnet.findPools("USDC", "XLM");
      expect(a.length).toBe(b.length);
      expect(a.map((p) => p.address).sort()).toEqual(b.map((p) => p.address).sort());
    });

    it("filters by protocol", () => {
      const aquaPools = testnet.findPools("XLM", "USDC", "aquarius");
      expect(aquaPools.length).toBe(2); // constant_product + concentrated
      expect(aquaPools.every((p) => p.protocol === "aquarius")).toBe(true);

      const blendPools = testnet.findPools("XLM", "USDC", "blend");
      expect(blendPools.length).toBe(1);
      expect(blendPools[0]!.protocol).toBe("blend");
    });

    it("returns empty for non-existent pair", () => {
      expect(testnet.findPools("XLM", "FAKECOIN")).toHaveLength(0);
    });

    it("is case-insensitive", () => {
      expect(testnet.findPools("xlm", "usdc").length).toBeGreaterThan(0);
    });

    it("each pool has tokenAddresses (actual contract addresses)", () => {
      const pools = testnet.findPools("XLM", "USDC");
      for (const p of pools) {
        expect(p.tokenAddresses).toBeDefined();
        expect(p.tokenAddresses.length).toBe(2);
        expect(p.tokenAddresses[0]).toMatch(/^C[A-Z0-9]{55}$/);
        expect(p.tokenAddresses[1]).toMatch(/^C[A-Z0-9]{55}$/);
      }
    });

    it("pool tokenAddresses match the protocol's USDC variant", () => {
      const aquaPools = testnet.findPools("XLM", "USDC", "aquarius");
      for (const p of aquaPools) {
        // Aquarius pools should use Aquarius USDC (CAZRY5...)
        expect(p.tokenAddresses).toContain(TESTNET.USDC_AQUARIUS);
      }

      const blendPools = testnet.findPools("XLM", "USDC", "blend");
      for (const p of blendPools) {
        // Blend pools should use Blend USDC (CAQCFV...)
        expect(p.tokenAddresses).toContain(TESTNET.USDC_BLEND);
      }
    });
  });

  // ── resolvePool (pair + protocol → single pool) ─────────────

  describe("resolvePool(pair, protocol)", () => {
    it("resolves 'XLM/USDC' on aquarius to constant_product pool", () => {
      const pool = testnet.resolvePool("XLM/USDC", "aquarius");
      expect(pool).toBeDefined();
      expect(pool!.protocol).toBe("aquarius");
      expect(pool!.poolType).toBe("constant_product");
      expect(pool!.address).toBe(TESTNET.AQUA_XLM_USDC_CP);
    });

    it("resolves 'XLM/USDC' on blend to lending pool", () => {
      const pool = testnet.resolvePool("XLM/USDC", "blend");
      expect(pool).toBeDefined();
      expect(pool!.protocol).toBe("blend");
      expect(pool!.poolType).toBe("lending");
      expect(pool!.address).toBe(TESTNET.BLEND_POOL);
    });

    it("handles different separators: /, -, space", () => {
      expect(testnet.resolvePool("XLM/USDC", "aquarius")?.address).toBe(TESTNET.AQUA_XLM_USDC_CP);
      expect(testnet.resolvePool("XLM-USDC", "aquarius")?.address).toBe(TESTNET.AQUA_XLM_USDC_CP);
      expect(testnet.resolvePool("XLM USDC", "aquarius")?.address).toBe(TESTNET.AQUA_XLM_USDC_CP);
    });

    it("handles reversed pair order", () => {
      expect(testnet.resolvePool("USDC/XLM", "aquarius")?.address).toBe(TESTNET.AQUA_XLM_USDC_CP);
    });

    it("is case-insensitive", () => {
      expect(testnet.resolvePool("xlm/usdc", "aquarius")?.address).toBe(TESTNET.AQUA_XLM_USDC_CP);
    });

    it("returns undefined for non-existent pair", () => {
      expect(testnet.resolvePool("XLM/FAKE", "aquarius")).toBeUndefined();
    });

    it("returns undefined for pair that exists but not on requested protocol", () => {
      expect(testnet.resolvePool("USDC/USDT", "blend")).toBeUndefined(); // only on aquarius
    });

    it("mainnet: resolves phoenix pool", () => {
      const pool = mainnet.resolvePool("XLM/USDC", "phoenix");
      expect(pool).toBeDefined();
      expect(pool!.address).toBe(MAINNET.PHOENIX_XLM_USDC);
    });
  });

  // ── getPool (address → entry) ───────────────────────────────

  describe("getPool(address)", () => {
    it("finds pool by address", () => {
      const pool = testnet.getPool(TESTNET.AQUA_XLM_USDC_CP);
      expect(pool).toBeDefined();
      expect(pool!.name).toBe("USDC/XLM (Volatile)");
      expect(pool!.protocol).toBe("aquarius");
    });

    it("returns undefined for unknown address", () => {
      expect(testnet.getPool("CUNKNOWN")).toBeUndefined();
    });
  });

  // ── listPools ───────────────────────────────────────────────

  describe("listPools(protocol?)", () => {
    it("returns all pools", () => {
      expect(testnet.listPools().length).toBeGreaterThan(0);
    });

    it("filters by protocol", () => {
      const aquaPools = testnet.listPools("aquarius");
      expect(aquaPools.length).toBeGreaterThan(0);
      expect(aquaPools.every((p) => p.protocol === "aquarius")).toBe(true);
    });

    it("returns empty for protocol with no pools", () => {
      expect(testnet.listPools("phoenix")).toHaveLength(0); // no phoenix testnet pools
    });
  });
});

// ═════════════════════════════════════════════════════════════════
// DYNAMIC ADDITIONS
// ═════════════════════════════════════════════════════════════════

describe("TokenPoolRegistry — Dynamic Additions", () => {
  it("addToken makes new token resolvable", () => {
    const reg = new TokenPoolRegistry("testnet");
    reg.addToken({
      address: "CFAKETOKEN_FOR_TEST_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
      symbol: "FAKE",
      name: "Fake Token",
      protocols: ["test"],
    });

    expect(reg.getSymbol("CFAKETOKEN_FOR_TEST_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA")).toBe("FAKE");
    expect(reg.resolveSymbol("FAKE")).toBe("CFAKETOKEN_FOR_TEST_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");
  });

  it("addPool makes new pool findable", () => {
    const reg = new TokenPoolRegistry("testnet");
    reg.addPool({
      address: "CFAKEPOOL_FOR_TEST_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
      protocol: "test",
      tokens: ["XLM", "FAKE"],
      tokenAddresses: [TESTNET.XLM, "CFAKETOKEN"],
      poolType: "constant_product",
      name: "Test Pool",
    });

    const pools = reg.findPools("XLM", "FAKE");
    expect(pools.length).toBe(1);
    expect(pools[0]!.name).toBe("Test Pool");
  });

  it("addToken does not duplicate existing", () => {
    const reg = new TokenPoolRegistry("testnet");
    const before = reg.listTokens().length;
    reg.addToken({
      address: TESTNET.XLM,
      symbol: "XLM",
      protocols: ["*"],
    });
    expect(reg.listTokens().length).toBe(before); // no change
  });

  it("addPool does not duplicate existing", () => {
    const reg = new TokenPoolRegistry("testnet");
    const before = reg.listPools().length;
    reg.addPool({
      address: TESTNET.AQUA_XLM_USDC_CP,
      protocol: "aquarius",
      tokens: ["USDC", "XLM"],
      tokenAddresses: [TESTNET.USDC_AQUARIUS, TESTNET.XLM],
      poolType: "constant_product",
      name: "duplicate",
    });
    expect(reg.listPools().length).toBe(before);
  });
});

// ═════════════════════════════════════════════════════════════════
// SINGLETON & NETWORK ISOLATION
// ═════════════════════════════════════════════════════════════════

describe("TokenPoolRegistry — Singleton & Network Isolation", () => {
  it("getTokenPoolRegistry returns same instance for same network", () => {
    const a = getTokenPoolRegistry("testnet");
    const b = getTokenPoolRegistry("testnet");
    expect(a).toBe(b);
  });

  it("different networks return different instances", () => {
    const testnet = getTokenPoolRegistry("testnet");
    const mainnet = getTokenPoolRegistry("mainnet");
    expect(testnet).not.toBe(mainnet);
  });

  it("testnet and mainnet have different USDC addresses", () => {
    const testnet = getTokenPoolRegistry("testnet");
    const mainnet = getTokenPoolRegistry("mainnet");

    const testUsdc = testnet.resolveSymbol("USDC");
    const mainUsdc = mainnet.resolveSymbol("USDC");

    expect(testUsdc).not.toBe(mainUsdc);
  });

  it("testnet XLM and mainnet XLM have different SAC addresses", () => {
    const testnet = getTokenPoolRegistry("testnet");
    const mainnet = getTokenPoolRegistry("mainnet");

    expect(testnet.resolveSymbol("XLM")).toBe(TESTNET.XLM);
    expect(mainnet.resolveSymbol("XLM")).toBe(MAINNET.XLM);
  });
});

// ═════════════════════════════════════════════════════════════════
// BLEND-SPECIFIC: USDC ADDRESS PER POOL
// ═════════════════════════════════════════════════════════════════

describe("TokenPoolRegistry — Blend USDC Resolution", () => {
  let testnet: TokenPoolRegistry;
  let mainnet: TokenPoolRegistry;

  beforeEach(() => {
    testnet = getTokenPoolRegistry("testnet");
    mainnet = getTokenPoolRegistry("mainnet");
  });

  it("Blend testnet pool uses Blend USDC (CAQCFV), not Aquarius USDC (CAZRY5)", () => {
    const pool = testnet.resolvePool("XLM/USDC", "blend");
    expect(pool).toBeDefined();
    expect(pool!.tokenAddresses).toContain(TESTNET.USDC_BLEND);
    expect(pool!.tokenAddresses).not.toContain(TESTNET.USDC_AQUARIUS);
  });

  it("Aquarius testnet pool uses Aquarius USDC (CAZRY5), not Blend USDC (CAQCFV)", () => {
    const pool = testnet.resolvePool("XLM/USDC", "aquarius");
    expect(pool).toBeDefined();
    expect(pool!.tokenAddresses).toContain(TESTNET.USDC_AQUARIUS);
    expect(pool!.tokenAddresses).not.toContain(TESTNET.USDC_BLEND);
  });

  it("Blend backstop usdcToken config matches what's in pool tokenAddresses", () => {
    // Blend backstop uses CAQCFV USDC on testnet
    const blendPool = testnet.getPool(TESTNET.BLEND_POOL);
    expect(blendPool).toBeDefined();
    // The USDC in pool tokenAddresses should be the Blend USDC
    expect(blendPool!.tokenAddresses).toContain(TESTNET.USDC_BLEND);
  });

  it("mainnet Blend pools exist with correct names", () => {
    const fixedPool = mainnet.getPool(MAINNET.BLEND_FIXED);
    expect(fixedPool).toBeDefined();
    expect(fixedPool!.name).toBe("Fixed Pool");
    expect(fixedPool!.protocol).toBe("blend");
  });

  it("mainnet Blend pools use single mainnet USDC (no variant conflict)", () => {
    const fixedPool = mainnet.getPool(MAINNET.BLEND_FIXED);
    expect(fixedPool).toBeDefined();
    expect(fixedPool!.tokenAddresses).toContain(MAINNET.USDC);
  });

  it("all 3 testnet USDC variants resolve to 'USDC' symbol", () => {
    expect(testnet.getSymbol(TESTNET.USDC_AQUARIUS)).toBe("USDC");
    expect(testnet.getSymbol(TESTNET.USDC_BLEND)).toBe("USDC");
    expect(testnet.getSymbol(TESTNET.USDC_BLEND_V2)).toBe("USDC");
  });

  it("can distinguish USDC variants by protocol tag", () => {
    const variants = testnet.getAddresses("USDC");
    const aquaVariant = variants.find((v) => v.protocols.includes("aquarius"));
    const blendVariant = variants.find((v) => v.protocols.includes("blend") && v.name?.includes("Blend)"));

    expect(aquaVariant).toBeDefined();
    expect(blendVariant).toBeDefined();
    expect(aquaVariant!.address).toBe(TESTNET.USDC_AQUARIUS);
    expect(blendVariant!.address).toBe(TESTNET.USDC_BLEND);
  });

  it("dynamic addPool: can add Blend pool with different USDC at runtime", () => {
    const reg = new TokenPoolRegistry("testnet");

    // Simulate discovering a new Blend pool that uses CBIELT USDC
    reg.addPool({
      address: "CFAKEBLENDPOOL_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
      protocol: "blend",
      tokens: ["XLM", "USDC"],
      tokenAddresses: [TESTNET.XLM, TESTNET.USDC_BLEND_V2], // Uses v2 USDC
      poolType: "lending",
      name: "New Blend Pool",
    });

    const pool = reg.getPool("CFAKEBLENDPOOL_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");
    expect(pool).toBeDefined();
    expect(pool!.tokenAddresses).toContain(TESTNET.USDC_BLEND_V2);
    expect(pool!.tokenAddresses).not.toContain(TESTNET.USDC_BLEND); // different USDC variant
  });
});

// ═════════════════════════════════════════════════════════════════
// BLEND NOTE: On-chain reserve discovery
// ═════════════════════════════════════════════════════════════════
//
// Blend pools have dynamic reserves read from chain via loadRegistry().
// The static pool entries in this registry cover the KNOWN pools with
// their primary token pairs. But a Blend pool like "Fixed Pool" may
// actually have 4+ reserves (XLM, USDC, BLND, wETH, etc.).
//
// The registry's tokenAddresses only lists the PRIMARY pair.
// For full reserve lists, use sdk.blend.loadRegistry() → pool.reserves.
//
// This is intentional: the registry is for QUICK lookups ("find me
// the XLM/USDC pool on Blend"). For detailed reserve data, query
// on-chain via the SDK.
// ═════════════════════════════════════════════════════════════════

// ═════════════════════════════════════════════════════════════════
// DYNAMIC AQUARIUS API LOADING (integration test)
// ═════════════════════════════════════════════════════════════════

describe("TokenPoolRegistry — loadAquariusPools (live API)", () => {
  it("loads testnet pools from Aquarius API", async () => {
    const reg = new TokenPoolRegistry("testnet");
    const beforePools = reg.listPools("aquarius").length;
    const loaded = await reg.loadAquariusPools(1, 20); // just 1 page, 20 pools

    expect(loaded).toBeGreaterThan(0);
    expect(reg.listPools("aquarius").length).toBeGreaterThan(beforePools);

    // Should be able to find USDC/USDT stable pool
    const stablePools = reg.findPools("USDC", "USDT", "aquarius");
    expect(stablePools.length).toBeGreaterThan(0);
    expect(stablePools.some((p) => p.poolType === "stable")).toBe(true);
  }, 15000);

  it("loads mainnet pools from Aquarius API", async () => {
    const reg = new TokenPoolRegistry("mainnet");
    const loaded = await reg.loadAquariusPools(1, 20);

    expect(loaded).toBeGreaterThan(0);

    // Should find XLM/AQUA pool
    const pools = reg.findPools("XLM", "AQUA", "aquarius");
    expect(pools.length).toBeGreaterThan(0);
  }, 15000);

  it("resolves pools that only exist on API (not hardcoded)", async () => {
    const reg = new TokenPoolRegistry("testnet");
    await reg.loadAquariusPools(1, 50);

    // ICE/XLM pool only comes from API, not hardcoded
    const pools = reg.findPools("ICE", "XLM", "aquarius");
    expect(pools.length).toBeGreaterThan(0);
    expect(pools[0]!.address).toBeTruthy();
  }, 15000);

  it("does not duplicate pools already hardcoded", async () => {
    const reg = new TokenPoolRegistry("testnet");
    const hardcodedCount = reg.listPools("aquarius").length;
    await reg.loadAquariusPools(1, 50);

    // Check no duplicate for USDC/XLM constant_product
    const cpPools = reg.findPools("USDC", "XLM", "aquarius").filter((p) => p.poolType === "constant_product");
    expect(cpPools.length).toBe(1); // should still be 1, not 2
  }, 15000);

  it("auto-discovers new tokens from API", async () => {
    const reg = new TokenPoolRegistry("testnet");
    await reg.loadAquariusPools(1, 50);

    // DAI should be discovered from API if DAI pool exists
    const daiPools = reg.findPools("XLM", "DAI");
    if (daiPools.length > 0) {
      expect(reg.getSymbol(daiPools[0]!.tokenAddresses[0])).toBeTruthy();
    }
  }, 15000);
});

// ═════════════════════════════════════════════════════════════════
// EDGE CASES & REAL-WORLD SCENARIOS
// ═════════════════════════════════════════════════════════════════

describe("TokenPoolRegistry — Real-World Scenarios", () => {
  let testnet: TokenPoolRegistry;

  beforeEach(() => {
    testnet = getTokenPoolRegistry("testnet");
  });

  it("scenario: AI agent resolves 'swap XLM to USDC on Aquarius'", () => {
    const pool = testnet.resolvePool("XLM/USDC", "aquarius");
    expect(pool).toBeDefined();
    expect(pool!.tokenAddresses[0]).toBe(TESTNET.USDC_AQUARIUS); // correct USDC for Aquarius
    expect(pool!.tokenAddresses[1]).toBe(TESTNET.XLM);
  });

  it("scenario: AI agent resolves 'deposit to Blend XLM/USDC pool'", () => {
    const pool = testnet.resolvePool("XLM/USDC", "blend");
    expect(pool).toBeDefined();
    expect(pool!.tokenAddresses).toContain(TESTNET.USDC_BLEND); // correct USDC for Blend
  });

  it("scenario: user asks 'add LP XLM/AQUA' — finds pool instantly", () => {
    const pool = testnet.resolvePool("XLM/AQUA", "aquarius");
    expect(pool).toBeDefined();
    expect(pool!.poolType).toBe("constant_product");
    expect(pool!.tokenAddresses).toContain(TESTNET.AQUA);
  });

  it("scenario: resolve USDC address depends on context", () => {
    // When swapping on Aquarius: use Aquarius USDC
    const aquaUsdc = testnet.resolveSymbol("USDC", "aquarius");
    // When depositing to Blend: use Blend USDC
    const blendUsdc = testnet.resolveSymbol("USDC", "blend");

    expect(aquaUsdc).not.toBe(blendUsdc);
    expect(aquaUsdc).toBe(TESTNET.USDC_AQUARIUS);
    expect(blendUsdc).toBe(TESTNET.USDC_BLEND);
  });

  it("scenario: mainnet has no USDC conflict", () => {
    const mainnet = getTokenPoolRegistry("mainnet");
    const aquaUsdc = mainnet.resolveSymbol("USDC", "aquarius");
    const blendUsdc = mainnet.resolveSymbol("USDC", "blend");
    // Same address on mainnet — no conflict
    expect(aquaUsdc).toBe(blendUsdc);
    expect(aquaUsdc).toBe(MAINNET.USDC);
  });

  it("scenario: find all pools for a pair across all protocols", () => {
    const pools = testnet.findPools("XLM", "USDC");
    const protocols = [...new Set(pools.map((p) => p.protocol))];
    expect(protocols).toContain("aquarius");
    expect(protocols).toContain("blend");

    const types = [...new Set(pools.map((p) => p.poolType))];
    expect(types).toContain("constant_product");
    expect(types).toContain("concentrated");
    expect(types).toContain("lending");
  });
});
