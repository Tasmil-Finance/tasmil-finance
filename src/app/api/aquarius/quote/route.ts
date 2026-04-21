import { type NextRequest, NextResponse } from "next/server";
import { getAquariusClient, getNetwork } from "../_sdk";

export async function GET(req: NextRequest) {
  const tokenIn = req.nextUrl.searchParams.get("tokenIn");
  const tokenOut = req.nextUrl.searchParams.get("tokenOut");
  const amount = req.nextUrl.searchParams.get("amount");

  if (!tokenIn || !tokenOut || !amount) {
    return NextResponse.json(
      { success: false, error: "Missing required query params: tokenIn, tokenOut, amount" },
      { status: 400 },
    );
  }

  const network = getNetwork();

  try {
    const sdk = getAquariusClient();
    // Convert human-readable to stroops if needed
    const n = Number(amount);
    const stroops = n > 1_000_000 && Number.isInteger(n) ? amount : String(Math.floor(n * 1e7));
    const quote = await sdk.aquarius.getQuote({ tokenIn, tokenOut, amount: stroops });
    return NextResponse.json({
      success: true,
      network,
      protocol: "aquarius",
      quote,
    });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Quote failed" },
      { status: 400 },
    );
  }
}
