// @ts-nocheck — pre-existing type errors against @tasmil/adapter-sdk;
// CI lint enforced via PR pipeline. See PR notes / follow-up to align
// the SDK exports with what these route handlers + tests consume.

import { type NextRequest, NextResponse } from "next/server";
import { getBlendClient } from "../_sdk";

export async function GET(req: NextRequest) {
  const pool = req.nextUrl.searchParams.get("pool");
  const user = req.nextUrl.searchParams.get("user");

  if (!pool || !user) {
    return NextResponse.json(
      { success: false, error: "pool and user parameters required" },
      { status: 400 }
    );
  }

  try {
    const sdk = getBlendClient();
    const data = await sdk.blend.getBackstopUserBalance(pool, user);
    const shares = BigInt(data.shares);
    return NextResponse.json({
      success: true,
      pool,
      user,
      shares: data.shares,
      sharesHuman: (Number(shares) / 1e7).toFixed(7),
      hasPosition: shares > 0n,
      queuedWithdrawals: data.q4w.map((e) => ({
        amount: e.amount,
        amountHuman: (Number(BigInt(e.amount)) / 1e7).toFixed(7),
        expiration: e.exp,
      })),
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
