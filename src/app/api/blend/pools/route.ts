import { NextResponse } from "next/server";
import { getBlendClient, getNetwork } from "../_sdk";
import { requireEnv } from "@/lib/env";

const MCP_URL = requireEnv("NEXT_PUBLIC_MCP_STELLAR_URL", "http://localhost:3009");

export async function GET() {
  const network = getNetwork();

  // Try SDK first (no MCP dependency)
  try {
    const sdk = getBlendClient();
    const registry = await sdk.blend.loadRegistry(true);
    // Only use SDK result if it actually loaded from chain (has reserves)
    const hasRealData = registry.pools.some((p) => p.reserves.length > 0);
    if (hasRealData) {
      return NextResponse.json({
        success: true,
        network,
        backstopAddress: registry.backstopAddress,
        cometLp: registry.cometLpToken,
        blndToken: registry.blndToken,
        usdcToken: registry.usdcToken,
        pools: registry.pools.map((p) => ({
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
        })),
      });
    }
  } catch {
    // SDK failed, fall through to MCP
  }

  // Fallback: use MCP-stellar (always works when server is running)
  try {
    const r = await fetch(`${MCP_URL}/blend-v2/query/pools`);
    const d = await r.json();
    if (d.success) return NextResponse.json(d);
    return NextResponse.json(
      { success: false, error: d.error ?? "MCP query failed" },
      { status: 500 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Both SDK and MCP failed. Is mcp-stellar running?" },
      { status: 500 }
    );
  }
}
