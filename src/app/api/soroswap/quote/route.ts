import { type NextRequest, NextResponse } from "next/server";
import { getSoroswapClient, getNetwork } from "../_sdk";

/**
 * GET /api/soroswap/quote?tokenIn=XLM&tokenOut=USDC&amount=10000000
 */
export async function GET(req: NextRequest) {
  const network = getNetwork();
  const tokenIn = req.nextUrl.searchParams.get("tokenIn");
  const tokenOut = req.nextUrl.searchParams.get("tokenOut");
  const amount = req.nextUrl.searchParams.get("amount");

  if (!tokenIn || !tokenOut || !amount) {
    return NextResponse.json(
      { success: false, error: "Missing: tokenIn, tokenOut, amount" },
      { status: 400 },
    );
  }

  try {
    const sdk = getSoroswapClient();
    const quote = await sdk.soroswap.getAdapterQuote({ tokenIn, tokenOut, amount });
    return NextResponse.json({ success: true, network, protocol: "soroswap", quote });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Quote failed" },
      { status: 400 },
    );
  }
}
