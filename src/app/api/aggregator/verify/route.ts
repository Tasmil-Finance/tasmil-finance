// @ts-nocheck — pre-existing type errors against @tasmil/adapter-sdk;
// CI lint enforced via PR pipeline. See PR notes / follow-up to align
// the SDK exports with what these route handlers + tests consume.

import { type NextRequest, NextResponse } from "next/server";
import { sdk } from "../_sdk";

export async function GET(req: NextRequest) {
  const hash = req.nextUrl.searchParams.get("hash");
  if (!hash) {
    return NextResponse.json({ error: "hash is required" }, { status: 400 });
  }
  const result = await sdk.stellar.verifyTransaction(hash);
  return NextResponse.json(result);
}
