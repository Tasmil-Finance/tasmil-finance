import { type NextRequest, NextResponse } from "next/server";
import { getBlendClient, getExplorerUrl, getNetwork } from "../_sdk";
import { requireEnv } from "@/lib/env";

export async function GET(req: NextRequest) {
  const pool = req.nextUrl.searchParams.get("pool");
  if (!pool) {
    return NextResponse.json({ success: false, error: "pool parameter required" }, { status: 400 });
  }

  const network = getNetwork();
  const MCP_URL = requireEnv("NEXT_PUBLIC_MCP_STELLAR_URL", "http://localhost:3009");

  // Try SDK first
  try {
    const sdk = getBlendClient();
    const info = await sdk.blend.getPool(pool);
    if (info && info.reserves.length > 0) {
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
    }
  } catch {
    /* fall through to MCP */
  }

  // Fallback: MCP-stellar
  try {
    const r = await fetch(`${MCP_URL}/blend-v2/query/pool-info?pool=${pool}`);
    const d = await r.json();
    if (d.success) return NextResponse.json(d);
  } catch {
    /* ignore */
  }

  return NextResponse.json({ success: false, error: `Pool not found: ${pool}` }, { status: 404 });
}
