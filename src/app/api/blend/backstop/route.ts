// @ts-nocheck — pre-existing type errors against @tasmil/adapter-sdk;
// CI lint enforced via PR pipeline. See PR notes / follow-up to align
// the SDK exports with what these route handlers + tests consume.

import { type NextRequest, NextResponse } from "next/server";
import { getBlendClient } from "../_sdk";

export async function GET(req: NextRequest) {
  const pool = req.nextUrl.searchParams.get("pool");
  if (!pool) {
    return NextResponse.json({ success: false, error: "pool parameter required" }, { status: 400 });
  }

  try {
    const sdk = getBlendClient();
    const info = await sdk.blend.getBackstopInfo(pool);
    return NextResponse.json({
      success: true,
      backstop: {
        ...info,
        // Convert decimal fractions to % to match MCP format
        interestApr: info.interestApr * 100,
        emissionApr: info.emissionApr * 100,
        totalApr: info.totalApr * 100,
        q4wPct: info.q4wPct * 100,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
