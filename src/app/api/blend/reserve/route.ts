import { type NextRequest, NextResponse } from "next/server";
import { getBlendClient, getExplorerUrl, getNetwork } from "../_sdk";
import { requireEnv } from "@/lib/env";

export async function GET(req: NextRequest) {
  const pool = req.nextUrl.searchParams.get("pool");
  const asset = req.nextUrl.searchParams.get("asset");

  if (!pool || !asset) {
    return NextResponse.json(
      { success: false, error: "pool and asset parameters required" },
      { status: 400 }
    );
  }

  if (pool === asset) {
    return NextResponse.json(
      { success: false, error: "asset must be a reserve contract address, not the pool address" },
      { status: 400 }
    );
  }

  const network = getNetwork();
  const MCP_URL = requireEnv("NEXT_PUBLIC_MCP_STELLAR_URL", "http://localhost:3009");

  try {
    const sdk = getBlendClient();
    const info = await sdk.blend.getPool(pool);

    if (!info) {
      return NextResponse.json(
        { success: false, error: `Pool not found: ${pool}` },
        { status: 404 }
      );
    }

    const assetLower = asset.toLowerCase();
    const reserveIndex = info.reserves.findIndex(
      (r) =>
        r.assetAddress === asset ||
        r.symbol === asset ||
        r.symbol.toLowerCase() === assetLower ||
        r.assetAddress.toLowerCase() === assetLower
    );
    const reserve = reserveIndex >= 0 ? info.reserves[reserveIndex] : undefined;

    if (!reserve) {
      return NextResponse.json(
        { success: false, error: `Asset ${asset} not found in pool` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      reserve: {
        asset: reserve.assetAddress,
        symbol: reserve.symbol,
        reserveIndex,
        totalSupply: reserve.totalSupplied.toFixed(7),
        totalBorrow: reserve.totalBorrowed.toFixed(7),
        supplyApy: reserve.supplyApy,
        borrowApy: reserve.borrowApy,
        collateralFactor: reserve.collateralFactor,
        liabilityFactor: reserve.liabilityFactor,
        utilization: reserve.utilization,
        decimals: reserve.decimals,
        // Not available from SDK — set null (cards handle null gracefully)
        supplyEmissionApy: null,
        borrowEmissionApy: null,
        supplyCap: null,
        assetPrice: null,
        blndPrice: null,
        oracleAddress: null,
        emissionTokenIds: { borrow: reserveIndex * 2, supply: reserveIndex * 2 + 1 },
        assetExplorerUrl: getExplorerUrl(network, reserve.assetAddress),
        blendUrl: `https://app.blend.capital/#/pool/${pool}`,
      },
    });
  } catch {
    /* SDK failed, try MCP */
  }

  // Fallback: MCP-stellar
  try {
    const r = await fetch(`${MCP_URL}/blend-v2/query/reserve?pool=${pool}&asset=${asset}`);
    const d = await r.json();
    if (d.success) return NextResponse.json(d);
  } catch {
    /* ignore */
  }

  return NextResponse.json(
    { success: false, error: `Reserve not found for asset ${asset}` },
    { status: 404 }
  );
}
