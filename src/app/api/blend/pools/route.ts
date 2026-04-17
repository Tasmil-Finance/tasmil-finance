import { NextResponse } from "next/server";
import { getBlendClient, getNetwork } from "../_sdk";

export async function GET() {
  try {
    const sdk = getBlendClient();
    const network = getNetwork();
    const registry = await sdk.blend.loadRegistry();
    const pools = registry.pools.map((p) => ({
      name: p.name,
      address: p.address,
      poolAddress: p.address,
      status: p.status,
      backstopRate: p.backstopRate,
      reserves: p.reserves.map((r) => ({
        symbol: r.symbol,
        asset: r.assetAddress,
        totalSupply: r.totalSupplied,
        totalBorrow: r.totalBorrowed,
        supplyApy: r.supplyApy,
        borrowApy: r.borrowApy,
        utilization: r.utilization,
      })),
    }));

    return NextResponse.json({
      success: true,
      network,
      backstop: registry.backstopAddress,
      cometLp: registry.cometLpToken,
      blndToken: registry.blndToken,
      pools,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to load pools" },
      { status: 500 },
    );
  }
}
