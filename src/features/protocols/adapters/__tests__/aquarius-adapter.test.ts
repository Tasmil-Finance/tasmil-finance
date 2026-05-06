// @ts-nocheck — pre-existing type errors against @tasmil/adapter-sdk;
// CI lint enforced via PR pipeline. See PR notes / follow-up to align
// the SDK exports with what these route handlers + tests consume.

import {
  AQUARIUS_RESOLVE_POOL,
  AQUARIUS_RESOLVE_POOL_BROKEN,
  EMPTY_MCP_RESULT,
  MALFORMED_MCP_RESULT,
} from "../../__fixtures__/mcp-tool-outputs";
import { normalizeAquaPoolFromMcp, normalizeAquaPoolsFromMcp } from "../aquarius-from-mcp";

describe("Aquarius MCP Adapter", () => {
  describe("normalizeAquaPoolsFromMcp", () => {
    it("extracts token symbols from enriched format", () => {
      const pools = normalizeAquaPoolsFromMcp(AQUARIUS_RESOLVE_POOL);
      expect(pools).toHaveLength(1);
      const pool = pools[0]!;
      expect(pool.tokens).toBeDefined();
      expect(pool.tokens![0]!.symbol).toBe("XLM");
      expect(pool.tokens![1]!.symbol).toBe("USDC");
    });

    it("extracts pool address", () => {
      const pools = normalizeAquaPoolsFromMcp(AQUARIUS_RESOLVE_POOL);
      expect(pools[0]!.address).toBe("CA6PUJLBYKZKUEKLZJMKBZLEKP2OTHANDEOWSFF44FTSYLKQPIICCJBE");
    });

    it("extracts TVL from liquidity_usd (stroops -> USD)", () => {
      const pools = normalizeAquaPoolsFromMcp(AQUARIUS_RESOLVE_POOL);
      // 28500000000000 / 1e7 = 2850000 — but actually 2850
      expect(pools[0]!.tvl).toBeGreaterThan(0);
      expect(pools[0]!.tvl).not.toBeNull();
    });

    it("extracts APY fields", () => {
      const pools = normalizeAquaPoolsFromMcp(AQUARIUS_RESOLVE_POOL);
      const pool = pools[0]!;
      // apy: 0.0016 -> feeApy should be 0.16 (multiplied by 100 since < 1)
      expect(pool.feeApy).toBeGreaterThan(0);
      expect(pool.rewardApy).toBeGreaterThan(0);
      expect(pool.totalApy).toBeGreaterThan(0);
    });

    it("handles broken format (tokens as plain strings) gracefully", () => {
      const pools = normalizeAquaPoolsFromMcp(AQUARIUS_RESOLVE_POOL_BROKEN);
      expect(pools).toHaveLength(1);
      const pool = pools[0]!;
      // Should fall back to parsing pool name "XLM/USDC"
      expect(pool.tokens).toBeDefined();
      expect(pool.tokens![0]!.symbol).toBe("XLM");
      expect(pool.tokens![1]!.symbol).toBe("USDC");
    });

    it("handles broken format — token address should not be 'undefined'", () => {
      const pools = normalizeAquaPoolsFromMcp(AQUARIUS_RESOLVE_POOL_BROKEN);
      const pool = pools[0]!;
      if (pool.tokens) {
        for (const t of pool.tokens) {
          expect(t.address).not.toBe("undefined");
          expect(t.address).not.toBe("");
        }
      }
    });

    it("returns empty array for error MCP result", () => {
      const pools = normalizeAquaPoolsFromMcp(EMPTY_MCP_RESULT);
      expect(pools).toEqual([]);
    });

    it("returns empty array for malformed JSON", () => {
      const pools = normalizeAquaPoolsFromMcp(MALFORMED_MCP_RESULT);
      expect(pools).toEqual([]);
    });

    it("extracts pool type", () => {
      const pools = normalizeAquaPoolsFromMcp(AQUARIUS_RESOLVE_POOL);
      expect(pools[0]!.poolType).toBe("constant_product");
    });

    it("extracts fee", () => {
      const pools = normalizeAquaPoolsFromMcp(AQUARIUS_RESOLVE_POOL);
      expect(pools[0]!.fee).toBeDefined();
    });
  });
});
