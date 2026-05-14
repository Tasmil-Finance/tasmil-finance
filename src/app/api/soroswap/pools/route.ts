import { type NextRequest, NextResponse } from "next/server";
import { getNetwork, getSoroswapClient } from "../_sdk";
import { requireEnv } from "@/lib/env";

const MCP_URL = requireEnv("NEXT_PUBLIC_MCP_STELLAR_URL", "http://localhost:3009");

/**
 * GET /api/soroswap/pools?protocol=soroswap&page=1&limit=10
 *
 * Lists pools via SDK (Soroswap aggregator API) or MCP fallback.
 * protocol: soroswap | phoenix | aqua | sdex | all (default: soroswap)
 */
export async function GET(req: NextRequest) {
  const network = getNetwork();
  const protocol = req.nextUrl.searchParams.get("protocol") ?? "soroswap";
  const page = Math.max(1, Number(req.nextUrl.searchParams.get("page") ?? "1"));
  const limit = Math.min(50, Math.max(1, Number(req.nextUrl.searchParams.get("limit") ?? "10")));

  // Try SDK first
  try {
    const sdk = getSoroswapClient();
    const allPools = await sdk.soroswap.listPools(
      protocol === "all" ? undefined : (protocol as any)
    );

    // Client-side paginate
    const totalCount = allPools.length;
    const totalPages = Math.ceil(totalCount / limit);
    const offset = (page - 1) * limit;
    const paginated = allPools.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      network,
      protocol: "soroswap",
      filter: protocol,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      pools: paginated,
    });
  } catch {
    // SDK failed, fallback to MCP
  }

  try {
    const r = await fetch(`${MCP_URL}/api/tools/swap_get_pools`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ network, protocol: protocol === "all" ? undefined : protocol }),
    });
    const d = await r.json();
    if (d.success) {
      const pools = d.pools ?? [];
      const totalCount = pools.length;
      const totalPages = Math.ceil(totalCount / limit);
      const offset = (page - 1) * limit;
      return NextResponse.json({
        success: true,
        network,
        protocol: "soroswap",
        filter: protocol,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
        pools: pools.slice(offset, offset + limit),
      });
    }
    return NextResponse.json({ success: false, error: d.error ?? "MCP failed" }, { status: 500 });
  } catch {
    return NextResponse.json({ success: false, error: "Both SDK and MCP failed" }, { status: 500 });
  }
}
