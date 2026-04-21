import { NextResponse } from "next/server";
import { getAllbridgeClient, getNetwork } from "../_sdk";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const chain = searchParams.get("chain") ?? "stellar";
    const network = getNetwork();
    const sdk = getAllbridgeClient();

    const chains = (await sdk.allbridge.getSupportedChains()) as Record<string, any>;

    // Map chain name to Allbridge chain symbol
    const CHAIN_MAP: Record<string, string> = {
      stellar: "SRB", ethereum: "ETH", bsc: "BSC", polygon: "POL",
      avalanche: "AVA", solana: "SOL", arbitrum: "ARB", optimism: "OPT",
      base: "BAS", tron: "TRX",
    };

    if (chain === "all") {
      // Return pools from all chains
      const allPools: any[] = [];
      for (const [chainName, sym] of Object.entries(CHAIN_MAP)) {
        const tokens = chains[sym]?.tokens ?? [];
        for (const t of tokens) {
          allPools.push({
            chain: chainName,
            symbol: t.symbol,
            name: t.name,
            tokenAddress: t.tokenAddress,
            poolAddress: t.poolAddress,
            decimals: t.decimals,
            apr7d: t.apr7d ?? null,
            apr30d: t.apr30d ?? null,
            feeShare: t.feeShare ?? null,
            lpRate: t.lpRate ?? null,
          });
        }
      }
      return NextResponse.json({ success: true, network, chain, pools: allPools, count: allPools.length });
    }

    const sym = CHAIN_MAP[chain.toLowerCase()];
    if (!sym) {
      return NextResponse.json({
        success: false,
        error: `Chain "${chain}" not supported. Supported: ${Object.keys(CHAIN_MAP).join(", ")}`,
      }, { status: 400 });
    }

    const tokens = chains[sym]?.tokens ?? [];
    const pools = tokens.map((t: any) => ({
      chain,
      symbol: t.symbol,
      name: t.name,
      tokenAddress: t.tokenAddress,
      poolAddress: t.poolAddress,
      decimals: t.decimals,
      apr7d: t.apr7d ?? null,
      apr30d: t.apr30d ?? null,
      feeShare: t.feeShare ?? null,
      lpRate: t.lpRate ?? null,
    }));

    return NextResponse.json({ success: true, network, chain, pools, count: pools.length });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 });
  }
}
