import { type NextRequest, NextResponse } from "next/server";
import { getTokenPoolRegistry } from "@tasmil/adapter-sdk";

function getNetwork(): "mainnet" | "testnet" {
  const raw = process.env["NEXT_PUBLIC_STELLAR_NETWORK"] ?? process.env["STELLAR_NETWORK"] ?? "mainnet";
  return raw.toLowerCase().includes("test") ? "testnet" : "mainnet";
}

/**
 * GET /api/aquarius/registry?action=resolve-pool&pair=XLM/USDC&protocol=aquarius
 * GET /api/aquarius/registry?action=resolve-symbol&symbol=USDC&protocol=blend
 * GET /api/aquarius/registry?action=find-pools&tokenA=XLM&tokenB=USDC
 * GET /api/aquarius/registry?action=get-symbol&address=CAZRY5...
 * GET /api/aquarius/registry?action=list-pools&protocol=aquarius
 * GET /api/aquarius/registry?action=load&source=aquarius  (loads from API)
 *
 * Exposes the TokenPoolRegistry for AI agent and test usage.
 */
export async function GET(req: NextRequest) {
  const network = getNetwork();
  const registry = getTokenPoolRegistry(network);
  const action = req.nextUrl.searchParams.get("action") ?? "list-pools";

  switch (action) {
    case "resolve-pool": {
      const pair = req.nextUrl.searchParams.get("pair");
      const protocol = req.nextUrl.searchParams.get("protocol") ?? "aquarius";
      if (!pair) return NextResponse.json({ success: false, error: "Missing 'pair'" }, { status: 400 });
      const pool = registry.resolvePool(pair, protocol);
      return NextResponse.json({
        success: !!pool,
        network,
        pool: pool ?? null,
      });
    }

    case "resolve-symbol": {
      const symbol = req.nextUrl.searchParams.get("symbol");
      const protocol = req.nextUrl.searchParams.get("protocol");
      if (!symbol) return NextResponse.json({ success: false, error: "Missing 'symbol'" }, { status: 400 });
      const address = registry.resolveSymbol(symbol, protocol ?? undefined);
      const variants = registry.getAddresses(symbol);
      return NextResponse.json({
        success: !!address,
        network,
        address,
        variants: variants.map((v) => ({
          address: v.address,
          symbol: v.symbol,
          name: v.name,
          protocols: v.protocols,
        })),
      });
    }

    case "find-pools": {
      const tokenA = req.nextUrl.searchParams.get("tokenA") ?? "";
      const tokenB = req.nextUrl.searchParams.get("tokenB") ?? "";
      const protocol = req.nextUrl.searchParams.get("protocol");
      const pools = registry.findPools(tokenA, tokenB, protocol ?? undefined);
      return NextResponse.json({ success: true, network, count: pools.length, pools });
    }

    case "get-symbol": {
      const address = req.nextUrl.searchParams.get("address") ?? "";
      const symbol = registry.getSymbol(address);
      const token = registry.getToken(address);
      return NextResponse.json({ success: true, network, symbol, token });
    }

    case "list-pools": {
      const protocol = req.nextUrl.searchParams.get("protocol");
      const pools = registry.listPools(protocol ?? undefined);
      return NextResponse.json({ success: true, network, count: pools.length, pools });
    }

    case "list-tokens": {
      const tokens = registry.listTokens();
      return NextResponse.json({
        success: true, network, count: tokens.length,
        tokens: tokens.map((t) => ({ address: t.address, symbol: t.symbol, name: t.name, protocols: t.protocols })),
      });
    }

    case "load": {
      const source = req.nextUrl.searchParams.get("source") ?? "aquarius";
      if (source === "aquarius") {
        const loaded = await registry.loadAquariusPools(3, 100);
        return NextResponse.json({ success: true, network, loaded, totalPools: registry.listPools().length });
      }
      return NextResponse.json({ success: false, error: `Unknown source: ${source}` }, { status: 400 });
    }

    default:
      return NextResponse.json({ success: false, error: `Unknown action: ${action}` }, { status: 400 });
  }
}
