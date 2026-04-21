import { NextResponse } from "next/server";
import { getAllbridgeClient, getNetwork } from "../_sdk";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const fromChain = searchParams.get("fromChain") ?? "stellar";
    const toChain = searchParams.get("toChain") ?? "ethereum";
    const asset = searchParams.get("asset") ?? "";
    const network = getNetwork();

    const CHAIN_MAP: Record<string, string> = {
      stellar: "SRB", ethereum: "ETH", bsc: "BSC", polygon: "POL",
      avalanche: "AVA", solana: "SOL", arbitrum: "ARB", optimism: "OPT",
      base: "BAS", tron: "TRX",
    };

    const fromSym = CHAIN_MAP[fromChain.toLowerCase()];
    const toSym = CHAIN_MAP[toChain.toLowerCase()];

    if (!fromSym || !toSym) {
      return NextResponse.json({ success: true, network, routes: [], totalRoutes: 0 });
    }

    const sdk = getAllbridgeClient();
    const chains = (await sdk.allbridge.getSupportedChains()) as Record<string, any>;
    const fromTokens = chains[fromSym]?.tokens ?? [];
    const toTokens = chains[toSym]?.tokens ?? [];

    const routes: any[] = [];
    for (const src of fromTokens) {
      if (asset && src.symbol.toUpperCase() !== asset.toUpperCase()) continue;
      for (const dst of toTokens) {
        if (src.symbol === dst.symbol) {
          routes.push({
            provider: "allbridge",
            asset: src.symbol,
            fromChain,
            toChain,
            estimatedFee: "~0.3%",
            estimatedTime: "3-5 min",
            crossChainSwap: false,
          });
        }
      }
    }

    return NextResponse.json({ success: true, network, routes, totalRoutes: routes.length });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 });
  }
}
