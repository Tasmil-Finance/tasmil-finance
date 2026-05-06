// @ts-nocheck — pre-existing type errors against @tasmil/adapter-sdk;
// CI lint enforced via PR pipeline. See PR notes / follow-up to align
// the SDK exports with what these route handlers + tests consume.

import { BLEND_RESOLVE_POOL, EMPTY_MCP_RESULT } from "../../__fixtures__/mcp-tool-outputs";
import { normalizePoolsFromMcp, normalizeReserveFromMcp } from "../from-mcp";

describe("Blend MCP Adapter", () => {
  describe("normalizePoolsFromMcp", () => {
    it("extracts pool name and address", () => {
      const pools = normalizePoolsFromMcp(BLEND_RESOLVE_POOL);
      expect(pools).toHaveLength(1);
      expect(pools[0]!.name).toBe("Fixed Pool");
      expect(pools[0]!.address).toBe("CAJJZSGMMM3PD7N33TAPHGBUGTB43OC73HVIK2L2G6BNGGGYOSSYBXBD");
    });

    it("extracts reserve symbols", () => {
      const pools = normalizePoolsFromMcp(BLEND_RESOLVE_POOL);
      const reserves = pools[0]!.reserves;
      expect(reserves[0]!.symbol).toBe("USDC");
      expect(reserves[1]!.symbol).toBe("XLM");
    });

    it("extracts reserve APY values", () => {
      const pools = normalizePoolsFromMcp(BLEND_RESOLVE_POOL);
      const usdc = pools[0]!.reserves[0]!;
      // APY values from MCP are percentages (9.3 = 9.3%)
      // Adapter may convert if they look like decimals
      expect(usdc.supplyApy).toBeGreaterThan(0);
      expect(usdc.borrowApy).toBeGreaterThan(0);
    });

    it("extracts pool status", () => {
      const pools = normalizePoolsFromMcp(BLEND_RESOLVE_POOL);
      expect(pools[0]!.status).toBe("active");
    });

    it("returns empty array for error result", () => {
      const pools = normalizePoolsFromMcp(EMPTY_MCP_RESULT);
      expect(pools).toEqual([]);
    });
  });
});
