import { NextResponse } from "next/server";
import { getSoroswapClient, getNetwork } from "../_sdk";

/**
 * GET /api/soroswap/yield
 */
export async function GET() {
  const network = getNetwork();

  try {
    const sdk = getSoroswapClient();
    const opportunities = await sdk.soroswap.getYieldOpportunities();
    return NextResponse.json({
      success: true, network, protocol: "soroswap",
      count: opportunities.length,
      opportunities,
    });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Yield fetch failed" },
      { status: 400 },
    );
  }
}
