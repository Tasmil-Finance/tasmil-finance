import { type NextRequest, NextResponse } from "next/server";
import { getNetwork } from "../_sdk";

const SOROSWAP_API_BASE = "https://api.soroswap.finance";

/**
 * GET /api/soroswap/positions?user=G...
 *
 * Get user's LP positions via Soroswap API directly (no MCP).
 */
export async function GET(req: NextRequest) {
  const network = getNetwork();
  const user = req.nextUrl.searchParams.get("user");

  if (!user) {
    return NextResponse.json({ success: false, error: "Missing 'user' param" }, { status: 400 });
  }

  try {
    // Build headers with API key
    const headers: Record<string, string> = { Accept: "application/json" };
    const apiKey = process.env.SOROSWAP_API_KEYS?.split(",")[0] ?? process.env.SOROSWAP_API_KEY;
    if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

    const res = await fetch(`${SOROSWAP_API_BASE}/liquidity/positions/${user}?network=${network}`, {
      headers,
    });

    if (res.ok) {
      const data = await res.json();
      const positions = Array.isArray(data) ? data : (data.positions ?? []);
      return NextResponse.json({
        success: true,
        network,
        protocol: "soroswap",
        hasPosition: positions.length > 0,
        positions,
        count: positions.length,
      });
    }

    // API error or 404 — return empty
    return NextResponse.json({
      success: true,
      network,
      protocol: "soroswap",
      hasPosition: false,
      positions: [],
      count: 0,
    });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Failed to fetch positions" },
      { status: 500 }
    );
  }
}
