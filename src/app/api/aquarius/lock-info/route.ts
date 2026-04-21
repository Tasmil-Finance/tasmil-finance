import { type NextRequest, NextResponse } from "next/server";
import { getNetwork } from "../_sdk";

/**
 * GET /api/aquarius/lock-info?amount=1000&days=365
 *
 * Calculates ICE governance token estimate for locking AQUA.
 * ICE multiplier = (lockPeriodDays / 1095) * 10 (linear, max 10x for 3 years)
 */
export async function GET(req: NextRequest) {
  const amount = req.nextUrl.searchParams.get("amount");
  const days = req.nextUrl.searchParams.get("days");
  const network = getNetwork();

  if (!amount || !days) {
    return NextResponse.json(
      { success: false, error: "Missing required params: amount, days" },
      { status: 400 },
    );
  }

  const amountNum = Number(amount);
  const daysNum = Number(days);

  if (daysNum < 1 || daysNum > 1095) {
    return NextResponse.json(
      { success: false, error: "Lock period must be 1-1095 days" },
      { status: 400 },
    );
  }

  const iceMultiplier = (daysNum / 1095) * 10;
  const estimatedIce = amountNum * iceMultiplier;
  const unlockDate = new Date(Date.now() + daysNum * 86400000).toISOString().split("T")[0]!;

  return NextResponse.json({
    success: true,
    network,
    protocol: "aquarius",
    lockInfo: {
      amount: String(amountNum),
      lockPeriodDays: daysNum,
      iceMultiplier: Math.round(iceMultiplier * 100) / 100,
      estimatedIce: estimatedIce.toFixed(2),
      unlockDate,
      instruction:
        "To lock AQUA: create a Stellar claimable balance with your AQUA tokens and submit it to the ICE approval server.",
    },
  });
}
