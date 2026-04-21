import { NextResponse } from "next/server";
import { getAllbridgeClient, getNetwork } from "../_sdk";

export async function GET() {
  try {
    const network = getNetwork();
    const sdk = getAllbridgeClient();
    const chains = (await sdk.allbridge.getSupportedChains()) as Record<string, any>;

    const CHAIN_MAP: Record<string, string> = {
      SRB: "stellar", ETH: "ethereum", BSC: "bsc", POL: "polygon",
      AVA: "avalanche", SOL: "solana", ARB: "arbitrum", OPT: "optimism",
      BAS: "base", TRX: "tron",
    };

    const supported = Object.entries(chains).map(([sym, data]: [string, any]) => ({
      chain: CHAIN_MAP[sym] ?? sym,
      chainSymbol: sym,
      tokens: (data.tokens ?? []).map((t: any) => ({
        symbol: t.symbol,
        name: t.name,
        tokenAddress: t.tokenAddress,
        poolAddress: t.poolAddress,
        decimals: t.decimals,
      })),
      tokenCount: (data.tokens ?? []).length,
    }));

    return NextResponse.json({ success: true, network, chains: supported, count: supported.length });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 });
  }
}
