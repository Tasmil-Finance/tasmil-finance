import { NextResponse } from "next/server";
import { getAquariusClient, getNetwork } from "../_sdk";

export async function GET() {
  const network = getNetwork();

  try {
    const sdk = getAquariusClient();
    const opportunities = await sdk.aquarius.getYieldOpportunities();
    return NextResponse.json({
      success: true,
      network,
      protocol: "aquarius",
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
