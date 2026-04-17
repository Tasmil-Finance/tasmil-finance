import { NextRequest, NextResponse } from "next/server";
import { getBlendClient, getNetwork, getExplorerUrl } from "../_sdk";

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
      return NextResponse.json({ success: false, error: `Pool not found: ${pool}` }, { status: 404 });
    }

    const reserves = info.reserves.map((r, i) => ({
      index: i,
      address: r.assetAddress,
      asset: r.assetAddress,
      symbol: r.symbol,
      explorerUrl: getExplorerUrl(network, r.assetAddress),
      emissionTokenIds: { borrow: i * 2, supply: i * 2 + 1 },
    }));

    return NextResponse.json({
      success: true,
      pool: {
        poolAddress: pool,
        address: pool,
        reserveCount: reserves.length,
        reserves,
      },
      totalAssets: reserves.length,
      assets: reserves,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to load assets" },
      { status: 500 },
    );
  }
}
