import { NextResponse, type NextRequest } from "next/server";
import { getSoroswapClient } from "../../_sdk";

const VALID_OPERATIONS = ["swap", "add-liquidity", "remove-liquidity"] as const;
type OpName = (typeof VALID_OPERATIONS)[number];

const OP_NAME_MAP: Record<OpName, string> = {
  swap: "swap",
  "add-liquidity": "add_liquidity",
  "remove-liquidity": "remove_liquidity",
};

/**
 * POST /api/soroswap/op/[operation]
 *
 * All operations go through SDK → Soroswap API directly (no MCP).
 *
 * Body:
 * - swap: { assetIn, assetOut, amount, tradeType, fromAddress, slippageBps? }
 * - add-liquidity: { assetA, assetB, amountA, amountB, to, slippageBps? }
 * - remove-liquidity: { assetA, assetB, liquidity, amountA, amountB, to, slippageBps? }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ operation: string }> },
) {
  const { operation } = await params;

  if (!VALID_OPERATIONS.includes(operation as OpName)) {
    return NextResponse.json(
      { success: false, error: `Invalid operation: ${operation}. Valid: ${VALID_OPERATIONS.join(", ")}` },
      { status: 400 },
    );
  }

  let body: Record<string, string>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const sdk = getSoroswapClient();
  const opName = OP_NAME_MAP[operation as OpName];

  try {
    switch (operation) {
      case "swap": {
        const quote = await sdk.soroswap.getQuote({
          assetIn: body.assetIn ?? "",
          assetOut: body.assetOut ?? "",
          amount: body.amount ?? "0",
          tradeType: (body.tradeType as "EXACT_IN" | "EXACT_OUT") ?? "EXACT_IN",
          slippageBps: body.slippageBps ? Number(body.slippageBps) : 100,
        });

        const from = body.fromAddress ?? body.from ?? "";
        const result = await sdk.soroswap.buildSwapTx({
          quote,
          from,
          to: body.to ?? from,
        });

        return NextResponse.json({
          success: true,
          operation: opName,
          xdr: result.xdr,
          route: Array.isArray(quote.path) ? quote.path : undefined,
          context: {
            amountOut: String(quote.amountOut ?? quote.amount_out ?? "0"),
            feePercent: "~0.30%",
          },
          ...body,
        });
      }

      case "add-liquidity": {
        const result = await sdk.soroswap.addLiquidity({
          assetA: body.assetA ?? "",
          assetB: body.assetB ?? "",
          amountA: body.amountA ?? "0",
          amountB: body.amountB ?? "0",
          to: body.to ?? body.fromAddress ?? body.from ?? "",
          slippageBps: body.slippageBps ? Number(body.slippageBps) : undefined,
        });

        return NextResponse.json({
          success: true,
          operation: opName,
          xdr: result.xdr,
          estimatedFee: result.estimatedFee,
          ...body,
        });
      }

      case "remove-liquidity": {
        const result = await sdk.soroswap.removeLiquidity({
          assetA: body.assetA ?? "",
          assetB: body.assetB ?? "",
          liquidity: body.liquidity ?? "0",
          amountA: body.amountA ?? "0",
          amountB: body.amountB ?? "0",
          to: body.to ?? body.fromAddress ?? body.from ?? "",
          slippageBps: body.slippageBps ? Number(body.slippageBps) : undefined,
        });

        return NextResponse.json({
          success: true,
          operation: opName,
          xdr: result.xdr,
          estimatedFee: result.estimatedFee,
          ...body,
        });
      }

      default:
        return NextResponse.json({ success: false, error: `Unhandled: ${operation}` }, { status: 400 });
    }
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Operation failed" },
      { status: 400 },
    );
  }
}
