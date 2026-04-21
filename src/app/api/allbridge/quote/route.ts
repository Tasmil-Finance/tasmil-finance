import { NextResponse } from "next/server";
import { getAllbridgeClient, getNetwork } from "../_sdk";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const fromChain = searchParams.get("fromChain") ?? "stellar";
    const toChain = searchParams.get("toChain") ?? "ethereum";
    const asset = searchParams.get("asset") ?? "USDC";
    const amount = searchParams.get("amount") ?? "100";
    const network = getNetwork();

    const sdk = getAllbridgeClient();
    const quote = await sdk.allbridge.getQuote({ fromChain, toChain, asset, amount });

    return NextResponse.json({ success: true, network, quote });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 });
  }
}
