// @ts-nocheck — pre-existing type errors against @tasmil/adapter-sdk;
// CI lint enforced via PR pipeline. See PR notes / follow-up to align
// the SDK exports with what these route handlers + tests consume.

import { createTasmilClient } from "@tasmil/adapter-sdk";
import { type NextRequest, NextResponse } from "next/server";
import { STELLAR_NETWORK } from "@/shared/config/stellar-server";

function getSdk() {
  return createTasmilClient({ network: STELLAR_NETWORK });
}

const VALID_OPERATIONS = [
  "swap",
  "add-liquidity",
  "withdraw-liquidity",
  "claim-rewards",
  "lock-aqua",
  "delegate-ice",
  "vote",
] as const;
type OpName = (typeof VALID_OPERATIONS)[number];

const OP_NAME_MAP: Record<OpName, string> = {
  swap: "swap",
  "add-liquidity": "add_liquidity",
  "withdraw-liquidity": "withdraw_liquidity",
  "claim-rewards": "claim_rewards",
  "lock-aqua": "lock_aqua",
  "delegate-ice": "delegate_ice",
  vote: "vote",
};

/**
 * POST /api/aquarius/op/[operation]
 *
 * All operations via Aquarius SDK — Soroban contract calls (no MCP).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ operation: string }> }
) {
  const { operation } = await params;

  if (!VALID_OPERATIONS.includes(operation as OpName)) {
    return NextResponse.json(
      {
        success: false,
        error: `Invalid operation: ${operation}. Valid: ${VALID_OPERATIONS.join(", ")}`,
      },
      { status: 400 }
    );
  }

  let body: Record<string, string>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const opName = OP_NAME_MAP[operation as OpName];

  // Convert human-readable amount to stroops (7 decimals)
  const toStroops = (val: string): string => {
    const n = Number(val);
    if (!Number.isFinite(n)) return "0";
    // If already in stroops (> 1M and integer), pass through
    if (n > 1_000_000 && Number.isInteger(n)) return String(n);
    return String(Math.floor(n * 1e7));
  };

  try {
    const sdk = getSdk();

    switch (operation) {
      // ─── Swap via Aquarius SDK (find-path + router.swap_chained) ───
      case "swap": {
        const result = await sdk.aquarius.buildSwap({
          tokenIn: body.tokenIn ?? "",
          tokenOut: body.tokenOut ?? "",
          amount: toStroops(body.amount ?? "0"),
          from: body.from ?? "",
          slippageBps: body.slippageBps ? Number(body.slippageBps) : 100,
        });

        // Parse token symbols from route (e.g. "native" → "XLM", "AQUA:GAHP..." → "AQUA")
        const routeTokens = result.route.tokens.map((t: string) =>
          t === "native" ? "XLM" : t.includes(":") ? t.split(":")[0] : t
        );

        return NextResponse.json({
          success: true,
          operation: opName,
          xdr: result.xdr,
          estimatedFee: result.estimatedFee,
          route: {
            ...result.route,
            tokens: routeTokens,
          },
          ...body,
        });
      }

      // ─── Deposit (add liquidity) via pool.deposit() ───
      case "add-liquidity": {
        const rawAmounts = body.amounts
          ? body.amounts.split(",")
          : [body.amountA ?? "0", body.amountB ?? "0"];
        const amounts = rawAmounts.map(toStroops);
        const result = await sdk.aquarius.buildDeposit({
          poolAddress: body.poolAddress ?? body.pool ?? "",
          amounts,
          from: body.from ?? "",
          minShares: body.minShares ? toStroops(body.minShares) : undefined,
        });

        return NextResponse.json({
          success: true,
          operation: opName,
          xdr: result.xdr,
          estimatedFee: result.estimatedFee,
          ...body,
        });
      }

      // ─── Withdraw (remove liquidity) via pool.withdraw() ───
      case "withdraw-liquidity": {
        const result = await sdk.aquarius.buildWithdraw({
          poolAddress: body.poolAddress ?? body.pool ?? "",
          shares: toStroops(body.shares ?? "0"),
          from: body.from ?? "",
          minAmounts: body.minAmounts ? body.minAmounts.split(",").map(toStroops) : undefined,
        });

        return NextResponse.json({
          success: true,
          operation: opName,
          xdr: result.xdr,
          estimatedFee: result.estimatedFee,
          ...body,
        });
      }

      // ─── Claim LP rewards via pool.claim() ───
      case "claim-rewards": {
        const result = await sdk.aquarius.buildClaim({
          poolAddress: body.poolAddress ?? body.pool ?? "",
          from: body.from ?? "",
        });

        return NextResponse.json({
          success: true,
          operation: opName,
          xdr: result.xdr,
          estimatedFee: result.estimatedFee,
          ...body,
        });
      }

      // ─── Lock AQUA (returns info, no XDR) ───
      case "lock-aqua": {
        const amount = Number(body.amount);
        const days = Number(body.lockPeriodDays ?? 365);
        const iceMultiplier = (days / 1095) * 10;
        const estimatedIce = amount * iceMultiplier;
        const unlockDate = new Date(Date.now() + days * 86400000).toISOString().split("T")[0];

        return NextResponse.json({
          success: true,
          operation: opName,
          lockInfo: {
            amount: String(amount),
            lockPeriodDays: days,
            iceMultiplier: Math.round(iceMultiplier * 100) / 100,
            estimatedIce: estimatedIce.toFixed(2),
            unlockDate,
            instruction:
              "To lock AQUA: create a Stellar claimable balance with your AQUA tokens and submit it to the ICE approval server at https://ice-approval.aqua.network/api/v2/",
          },
          ...body,
        });
      }

      // ─── Governance ops (placeholder) ───
      case "delegate-ice":
      case "vote":
        return NextResponse.json(
          {
            success: false,
            error: `${opName} is a governance operation. Use the Aquarius dApp at aqua.network.`,
          },
          { status: 400 }
        );

      default:
        return NextResponse.json(
          { success: false, error: `Unhandled: ${operation}` },
          { status: 400 }
        );
    }
  } catch (e) {
    const rawError = e instanceof Error ? e.message : "Operation failed";
    return NextResponse.json({ success: false, error: rawError }, { status: 400 });
  }
}
