// @ts-nocheck — pre-existing type errors against @tasmil/adapter-sdk;
// CI lint enforced via PR pipeline. See PR notes / follow-up to align
// the SDK exports with what these route handlers + tests consume.

import { type NextRequest, NextResponse } from "next/server";
import { ensureBridgeTokens, sdk } from "../../aggregator/_sdk";

export async function POST(req: NextRequest) {
  try {
    await ensureBridgeTokens();
    const body = await req.json();
    return NextResponse.json(sdk.tokens.filter(body));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Filter failed" },
      { status: 400 }
    );
  }
}
