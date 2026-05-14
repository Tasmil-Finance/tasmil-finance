import { type NextRequest, NextResponse } from "next/server";
import { getBlendClient, getExplorerUrl, getNetwork } from "../_sdk";
import { requireEnv } from "@/lib/env";

export async function GET(req: NextRequest) {
  const pool = req.nextUrl.searchParams.get("pool");
  if (!pool) {
    return NextResponse.json({ success: false, error: "pool parameter required" }, { status: 400 });
  }

  try {
    const sdk = getBlendClient();
    const network = getNetwork();
    const info = await sdk.blend.getPool(pool);

    if (!info) {
      return NextResponse.json(
        { success: false, error: `Pool not found: ${pool}` },
        { status: 404 }
      );
    }

    const reserves = info.reserves.map((r, i) => ({
      index: i,
      address: r.assetAddress,
      asset: r.assetAddress,
      symbol: r.symbol,
      totalSupply: r.totalSupplied,
      totalBorrow: r.totalBorrowed,
      supplyApy: r.supplyApy,
      borrowApy: r.borrowApy,
      utilization: r.utilization,
      collateralFactor: r.collateralFactor,
      explorerUrl: getExplorerUrl(network, r.assetAddress),
      emissionTokenIds: { borrow: i * 2, supply: i * 2 + 1 },
    }));

    return NextResponse.json({
      success: true,
      pool: {
        poolAddress: pool,
        address: pool,
        name: info.name,
        status: info.status,
        reserveCount: reserves.length,
        reserves,
      },
      totalAssets: reserves.length,
      assets: reserves,
    });
  } catch {
    /* SDK failed, try MCP */
  }

  // Fallback: MCP-stellar
  const MCP_URL = requireEnv("NEXT_PUBLIC_MCP_STELLAR_URL", "http://localhost:3009");
  try {
    const r = await fetch(`${MCP_URL}/blend-v2/query/assets?pool=${pool}`);
    const d = await r.json();
    if (d.success) return NextResponse.json(d);
  } catch {
    /* ignore */
  }

  return NextResponse.json(
    { success: false, error: "Failed to load assets from both SDK and MCP" },
    { status: 500 }
  );
}
