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

    return NextResponse.json({
      success: true,
      pool: {
        address: info.address,
        poolAddress: info.address,
        name: info.name,
        status: info.status,
        backstopRate: info.backstopRate,
        poolExplorerUrl: getExplorerUrl(network, info.address),
        blendUrl: `https://app.blend.capital/#/pool/${info.address}`,
        reserveList: info.reserves.map((r) => r.assetAddress),
        reserves: info.reserves.map((r) => ({
          address: r.assetAddress,
          asset: r.assetAddress,
          symbol: r.symbol,
          explorerUrl: getExplorerUrl(network, r.assetAddress),
          totalSupply: r.totalSupplied,
          totalBorrow: r.totalBorrowed,
          supplyApy: r.supplyApy,
          borrowApy: r.borrowApy,
          utilization: r.utilization,
          collateralFactor: r.collateralFactor,
          liabilityFactor: r.liabilityFactor,
          decimals: r.decimals,
        })),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to load pool info" },
      { status: 500 },
    );
  }
}
