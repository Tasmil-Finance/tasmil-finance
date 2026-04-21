import { type NextRequest, NextResponse } from "next/server";
import { getSoroswapClient, getNetwork } from "../_sdk";

/**
 * GET /api/soroswap/price?asset=XLM&currency=USD
 */
export async function GET(req: NextRequest) {
  const network = getNetwork();
  const asset = req.nextUrl.searchParams.get("asset");
  const currency = req.nextUrl.searchParams.get("currency") ?? "USD";

  if (!asset) {
    return NextResponse.json({ success: false, error: "Missing 'asset' param" }, { status: 400 });
  }

  try {
    const sdk = getSoroswapClient();
    const price = await sdk.soroswap.getPrice(asset, currency);
    return NextResponse.json({ success: true, network, protocol: "soroswap", price });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Price fetch failed" },
      { status: 400 },
    );
  }
}
