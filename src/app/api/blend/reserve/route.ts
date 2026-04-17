import { NextRequest, NextResponse } from "next/server";
import { getBlendClient, getNetwork, getExplorerUrl } from "../_sdk";

export async function GET(req: NextRequest) {
  const pool = req.nextUrl.searchParams.get("pool");
  const asset = req.nextUrl.searchParams.get("asset");

  if (!pool || !asset) {
    return NextResponse.json(
      { success: false, error: "pool and asset parameters required" },
      { status: 400 },
    );
  }

  try {
    const sdk = getBlendClient();
    const network = getNetwork();
    const info = await sdk.blend.getPool(pool);

    if (!info) {
      return NextResponse.json({ success: false, error: `Pool not found: ${pool}` }, { status: 404 });
    }

    const reserveIndex = info.reserves.findIndex(
      (r) => r.assetAddress === asset || r.symbol === asset,
    );
    const reserve = reserveIndex >= 0 ? info.reserves[reserveIndex] : undefined;

    if (!reserve) {
      return NextResponse.json(
        { success: false, error: `Asset ${asset} not found in pool` },
        { status: 404 },
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
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to load reserve" },
      { status: 500 },
    );
  }
}
