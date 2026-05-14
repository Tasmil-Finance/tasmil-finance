import { type NextRequest, NextResponse } from "next/server";
import { getBlendClient } from "../_sdk";
import { requireEnv } from "@/lib/env";

export async function GET(req: NextRequest) {
  const pool = req.nextUrl.searchParams.get("pool");
  const user = req.nextUrl.searchParams.get("user");

  if (!pool || !user) {
    return NextResponse.json(
      { success: false, error: "pool and user parameters required" },
      { status: 400 }
    );
  }

  try {
    const sdk = getBlendClient();
    const pos = await sdk.blend.getUserPositions(pool, user);

    // Merge collateral + supply + liabilities into flat positions array
    // matching MCP-stellar response format
    const positions: unknown[] = [];

    for (const c of pos.collateral) {
      positions.push({
        asset: c.assetAddress,
        symbol: c.symbol,
        isCollateral: true,
        isSupply: false,
        isBorrow: false,
        suppliedAmount: c.amount.toFixed(7),
        borrowedAmount: null,
        supplyApy: c.apy,
        borrowApy: null,
        netApy: (c.apy * 100).toFixed(4),
        supplyEmissionApy: null,
        borrowEmissionApy: null,
        assetPrice: null,
        suppliedUsd: null,
        borrowedUsd: null,
        borrowCapacityUsd: null,
      });
    }

    for (const s of pos.supply) {
      positions.push({
        asset: s.assetAddress,
        symbol: s.symbol,
        isCollateral: false,
        isSupply: true,
        isBorrow: false,
        suppliedAmount: s.amount.toFixed(7),
        borrowedAmount: null,
        supplyApy: s.apy,
        borrowApy: null,
        netApy: (s.apy * 100).toFixed(4),
        supplyEmissionApy: null,
        borrowEmissionApy: null,
        assetPrice: null,
        suppliedUsd: null,
        borrowedUsd: null,
        borrowCapacityUsd: null,
      });
    }

    for (const l of pos.liabilities) {
      positions.push({
        asset: l.assetAddress,
        symbol: l.symbol,
        isCollateral: false,
        isSupply: false,
        isBorrow: true,
        suppliedAmount: null,
        borrowedAmount: l.amount.toFixed(7),
        supplyApy: null,
        borrowApy: l.apy,
        netApy: (-l.apy * 100).toFixed(4),
        supplyEmissionApy: null,
        borrowEmissionApy: null,
        assetPrice: null,
        suppliedUsd: null,
        borrowedUsd: null,
        borrowCapacityUsd: null,
      });
    }

    const hasPosition = positions.length > 0;
    const totalSuppliedUsd = pos.totalSuppliedUsd;
    const totalBorrowedUsd = pos.totalBorrowedUsd;
    const borrowCapacityUsd = pos.borrowCapacityUsd;
    const availableBorrowUsd =
      borrowCapacityUsd != null && totalBorrowedUsd != null
        ? Math.max(0, borrowCapacityUsd - totalBorrowedUsd)
        : null;
    const healthFactor =
      totalBorrowedUsd != null && totalBorrowedUsd > 0 && borrowCapacityUsd != null
        ? borrowCapacityUsd / totalBorrowedUsd
        : null;

    return NextResponse.json({
      success: true,
      hasPosition,
      poolAddress: pos.poolAddress,
      poolName: pos.poolName,
      user,
      positions,
      summary: {
        totalSuppliedUsd: totalSuppliedUsd?.toFixed(2) ?? null,
        totalBorrowedUsd: totalBorrowedUsd?.toFixed(2) ?? null,
        totalBorrowCapacityUsd: borrowCapacityUsd?.toFixed(2) ?? null,
        availableBorrowUsd: availableBorrowUsd?.toFixed(2) ?? null,
        healthFactor: healthFactor?.toFixed(4) ?? null,
        netApy: pos.netApy != null ? (pos.netApy * 100).toFixed(2) : null,
      },
    });
  } catch {
    /* SDK failed, try MCP */
  }

  // Fallback: MCP-stellar
  const MCP_URL = requireEnv("NEXT_PUBLIC_MCP_STELLAR_URL", "http://localhost:3009");
  try {
    const r = await fetch(`${MCP_URL}/blend-v2/query/positions?pool=${pool}&user=${user}`);
    const d = await r.json();
    if (d.success) return NextResponse.json(d);
  } catch {
    /* ignore */
  }

  return NextResponse.json(
    { success: false, error: "Failed to load positions from both SDK and MCP" },
    { status: 500 }
  );
}
