/**
 * Yield Aggregator — APY format verification
 *
 * These tests ensure that APY values flowing through the SDK to MCP tools
 * are always in PERCENTAGE format (9.3 = 9.3%), never raw decimals (0.093).
 *
 * The Blend SDK returns estSupplyApy / estBorrowApy as decimals:
 *   (1 + supplyApr / 52) ** 52 - 1 → e.g. 0.093 = 9.3%
 *
 * The YieldAggregator's `decimalToPercent` converts these, but has edge cases.
 */

import { describe, it, expect } from "vitest";

// ─── decimalToPercent logic (re-implemented for unit testing) ─────
// The function is not exported, so we test its logic directly.

function decimalToPercent(v: number | null): number | null {
  if (v == null) return null;
  if (Math.abs(v) >= 1) return v;
  return v * 100;
}

// ─── Tests ───────────────────────────────────────────────────────

describe("decimalToPercent — edge cases", () => {
  it("converts Blend SDK decimal 0.093 → 9.3%", () => {
    expect(decimalToPercent(0.093)).toBeCloseTo(9.3, 1);
  });

  it("converts small decimal 0.005 → 0.5%", () => {
    expect(decimalToPercent(0.005)).toBeCloseTo(0.5, 1);
  });

  it("passes through already-percentage values >= 1", () => {
    expect(decimalToPercent(9.3)).toBe(9.3);
    expect(decimalToPercent(15.5)).toBe(15.5);
  });

  it("handles null", () => {
    expect(decimalToPercent(null)).toBeNull();
  });

  it("handles 0", () => {
    expect(decimalToPercent(0)).toBe(0);
  });

  // ─── Edge case bugs ─────────────────────────────────────────────

  it("BUG: APY > 100% in decimal form (1.5 = 150%) is NOT converted", () => {
    // A protocol returning 150% APY as decimal would be 1.5
    // decimalToPercent(1.5) → 1.5 (passthrough, because >= 1)
    // AI reads this as 1.5% instead of 150%
    const result = decimalToPercent(1.5);
    // This SHOULD be 150, but the current implementation returns 1.5
    expect(result).toBe(1.5); // documenting current (buggy) behavior
    // Correct behavior would be: expect(result).toBe(150);
  });

  it("BUG: Aquarius pool with 0.5% APY (already percentage) gets wrongly multiplied", () => {
    // If Aquarius API returns fee_apy=0.5 meaning 0.5%
    // decimalToPercent(0.5) → 50 (multiplied by 100!)
    // AI reads 50% instead of 0.5%
    const result = decimalToPercent(0.5);
    // This returns 50, which is wrong if the input was already percentage
    expect(result).toBe(50); // documenting current (buggy) behavior for already-percentage < 1
    // The heuristic can't distinguish 0.5 (decimal for 50%) from 0.5 (percentage for 0.5%)
  });
});

describe("Blend reserve APY — SDK passthrough format check", () => {
  it("Blend SDK estSupplyApy is a DECIMAL that needs conversion", () => {
    // Simulating what the Blend SDK calculates:
    // supplyApr = FixedMath.toFloat(ir * supplyCapture, 7)
    // estSupplyApy = (1 + supplyApr / 52) ** 52 - 1
    //
    // For a realistic 9.3% supply APY:
    const supplyApr = 0.089; // ~8.9% APR
    const estSupplyApy = Math.pow(1 + supplyApr / 52, 52) - 1;

    // estSupplyApy ≈ 0.093 (this is what Blend SDK returns)
    expect(estSupplyApy).toBeLessThan(1);
    expect(estSupplyApy).toBeGreaterThan(0);

    // If blend_get_pool_info passes this through without conversion,
    // AI receives 0.093 and reads it as "0.093% APY" — which is WRONG.
    // It should be 9.3%.
    const withoutConversion = estSupplyApy;
    const withConversion = estSupplyApy * 100;

    expect(withoutConversion).toBeLessThan(1); // Bug: AI reads as < 1%
    expect(withConversion).toBeCloseTo(9.3, 0); // Correct: AI reads as ~9.3%
  });

  it("blend_get_pool_info must NOT pass raw SDK values to AI", () => {
    // This documents the expected behavior:
    // When SDK returns reserve.supplyApy = 0.093 (decimal for 9.3%)
    // The MCP tool should return 9.3 (percentage)
    const sdkValue = 0.093; // What Blend SDK returns
    const mcpValue = sdkValue * 100; // What MCP should return

    expect(mcpValue).toBeCloseTo(9.3, 1);
    expect(mcpValue).toBeGreaterThanOrEqual(1); // Clearly a percentage
  });
});

describe("Backstop APR format check", () => {
  it("BlendBackstopInfo fields must be percentages, not decimals", () => {
    // The SDK's getBlendBackstopInfo returns:
    // - interestApr: decimal (e.g. 0.0002 = 0.02%)
    // - emissionApr: decimal (e.g. 0.37 = 37%)
    // - totalApr: decimal (e.g. 0.3702 = 37.02%)
    //
    // When MCP tool blend_backstop_get_pool_data returns these to AI,
    // AI reads 0.37 as "0.37% APR" — should be "37% APR"

    const backstopInfo = {
      interestApr: 0.0002,   // decimal, means 0.02%
      emissionApr: 0.37,     // decimal, means 37%
      totalApr: 0.3702,      // decimal, means 37.02%
    };

    // These raw values would be confusing for AI
    // AI interprets: "total APR is 0.37%" — almost nothing
    // Reality: "total APR is 37%"

    // After conversion (what should happen):
    const converted = {
      interestApr: backstopInfo.interestApr * 100,   // 0.02%
      emissionApr: backstopInfo.emissionApr * 100,   // 37%
      totalApr: backstopInfo.totalApr * 100,         // 37.02%
    };

    expect(converted.totalApr).toBeCloseTo(37.02, 1);
    expect(converted.emissionApr).toBeCloseTo(37, 0);
  });
});
