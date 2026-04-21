import { type NextRequest, NextResponse } from "next/server";
import { getNetwork } from "../_sdk";

const AQUARIUS_BASE: Record<string, string> = {
  mainnet: "https://amm-api.aqua.network",
  testnet: "https://amm-api-testnet.aqua.network",
};

/**
 * GET /api/aquarius/my-liquidity?pool=C...&user=G...
 *
 * Track user's LP position by querying the pool detail + Horizon account balances.
 * No MCP dependency.
 */
export async function GET(req: NextRequest) {
  const poolAddress = req.nextUrl.searchParams.get("pool");
  const userAddress = req.nextUrl.searchParams.get("user");
  const network = getNetwork();
  const base = AQUARIUS_BASE[network] ?? AQUARIUS_BASE.testnet;

  if (!poolAddress || !userAddress) {
    return NextResponse.json(
      { success: false, error: "Missing required params: pool, user" },
      { status: 400 },
    );
  }

  try {
    // Get pool detail to find LP token address
    const poolRes = await fetch(`${base}/pools/${poolAddress}/`, {
      headers: { Accept: "application/json", "User-Agent": "Tasmil/1.0" },
    });

    if (!poolRes.ok) {
      return NextResponse.json({ success: true, network, protocol: "aquarius", hasPosition: false, positions: [] });
    }

    const pool = await poolRes.json();
    const shareTokenAddress = pool.share_token_address;
    const tokensStr = Array.isArray(pool.tokens_str) ? pool.tokens_str : [];

    // Query Horizon for user's LP token balance
    const horizonBase = network === "testnet"
      ? "https://horizon-testnet.stellar.org"
      : "https://horizon.stellar.org";

    const accRes = await fetch(`${horizonBase}/accounts/${userAddress}`);
    if (!accRes.ok) {
      return NextResponse.json({ success: true, network, protocol: "aquarius", hasPosition: false, positions: [] });
    }

    const account = await accRes.json();
    const balances = account.balances ?? [];

    // Find LP token balance (match by contract or asset code)
    const lpBalance = balances.find((b: any) =>
      b.asset_type === "credit_alphanum12" && b.asset_code?.startsWith("LP") ||
      b.liquidity_pool_id ||
      (shareTokenAddress && b.asset_issuer === shareTokenAddress)
    );

    const shares = lpBalance ? lpBalance.balance ?? "0" : "0";
    const hasPosition = Number(shares) > 0;

    return NextResponse.json({
      success: true,
      network,
      protocol: "aquarius",
      hasPosition,
      positions: hasPosition
        ? [{
            poolAddress,
            shares,
            tokensStr: tokensStr.map((s: string) => s === "native" ? "XLM" : s.includes(":") ? s.split(":")[0] : s),
          }]
        : [],
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch liquidity data" },
      { status: 500 },
    );
  }
}
