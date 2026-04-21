import { NextResponse, type NextRequest } from "next/server";
import { getBlendClient } from "../../_sdk";

const VALID_OPERATIONS = [
  "deposit",
  "withdraw",
  "borrow",
  "repay",
  "toggle-collateral",
  "join-pool",
  "exit-pool",
  "backstop-deposit",
  "queue-withdrawal",
  "dequeue-withdrawal",
] as const;
type OpName = (typeof VALID_OPERATIONS)[number];

/**
 * POST /api/blend/op/[operation]
 *
 * Builds transaction XDR via SDK + enriches with reserve APY & user position.
 * Returns everything the card needs in a single response — no extra API calls.
 *
 * Body: { pool, asset, amount, from, enable?, lpAmount?, minLpOut?, minBlndOut?, minUsdcOut? }
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

  const sdk = getBlendClient();

  try {
    const txResult = await buildTx(sdk, operation as OpName, body);
    const { xdr, estimatedFee } = txResult;
    const opName = getOperationName(operation as OpName);

    // Pool operations: enrich with APY + position context
    const pool = body.pool;
    const asset = body.asset;
    const from = body.from;
    const isPoolOp = pool && asset && from && isPoolOperation(operation as OpName);

    let context: Record<string, unknown> | undefined;
    if (isPoolOp) {
      const [poolData, positions] = await Promise.allSettled([
        sdk.blend.getPool(pool),
        sdk.blend.getUserPositions(pool, from),
      ]);

      const reserve =
        poolData.status === "fulfilled" && poolData.value
          ? poolData.value.reserves.find((r) => r.assetAddress === asset)
          : null;

      let currentSupplied: number | null = null;
      let currentBorrowed: number | null = null;
      if (positions.status === "fulfilled" && positions.value) {
        const pos = positions.value;
        const supplyPos = [...(pos.collateral ?? []), ...(pos.supply ?? [])].find(
          (p) => p.assetAddress === asset,
        );
        if (supplyPos) currentSupplied = supplyPos.amount;
        const borrowPos = (pos.liabilities ?? []).find((p) => p.assetAddress === asset);
        if (borrowPos) currentBorrowed = borrowPos.amount;
      }

      context = {
        symbol: reserve?.symbol,
        reserveApy: reserve
          ? { supplyApy: reserve.supplyApy, borrowApy: reserve.borrowApy }
          : undefined,
        currentPosition:
          currentSupplied != null || currentBorrowed != null
            ? { suppliedAmount: currentSupplied, borrowedAmount: currentBorrowed }
            : undefined,
      };
    }

    return NextResponse.json({
      success: true,
      operation: opName,
      xdr,
      estimatedFee,
      ...body,
      ...(context ? { context } : {}),
    });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Operation failed" },
      { status: 400 },
    );
  }
}

// ─── Helpers ──────────────────────────────────────────────────────

function isPoolOperation(op: OpName): boolean {
  return ["deposit", "withdraw", "borrow", "repay", "toggle-collateral"].includes(op);
}

async function buildTx(
  sdk: ReturnType<typeof getBlendClient>,
  operation: OpName,
  body: Record<string, string>,
) {
  const { pool, asset, amount, from, enable, lpAmount, minLpOut, minBlndOut, minUsdcOut } = body;

  switch (operation) {
    case "deposit":
      return sdk.blend.buildDeposit({ pool, asset, amount, from });
    case "withdraw":
      return sdk.blend.buildWithdraw({ pool, asset, amount, from });
    case "borrow":
      return sdk.blend.buildBorrow({ pool, asset, amount, from });
    case "repay":
      return sdk.blend.buildRepay({ pool, asset, amount, from });
    case "toggle-collateral":
      return sdk.blend.buildToggleCollateral({
        pool, asset, amount, from,
        enable: enable !== "false" && enable !== undefined,
      });
    case "join-pool":
      return sdk.blend.buildCometJoinPool({ asset, amount, from, minLpOut });
    case "exit-pool":
      return sdk.blend.buildCometExitPool({ lpAmount, from, minBlndOut, minUsdcOut });
    case "backstop-deposit":
      return sdk.blend.buildBackstopDeposit({ pool, amount, from });
    case "queue-withdrawal":
      return sdk.blend.buildBackstopQueueWithdrawal({ pool, amount, from });
    case "dequeue-withdrawal":
      return sdk.blend.buildBackstopDequeueWithdrawal({ pool, amount, from });
  }
}

function getOperationName(op: OpName): string {
  const map: Record<OpName, string> = {
    deposit: "blend_supply",
    withdraw: "blend_withdraw",
    borrow: "blend_borrow",
    repay: "blend_repay",
    "toggle-collateral": "blend_toggle_collateral",
    "join-pool": "backstop_deposit",
    "exit-pool": "backstop_withdraw",
    "backstop-deposit": "backstop_deposit",
    "queue-withdrawal": "backstop_queue",
    "dequeue-withdrawal": "backstop_dequeue",
  };
  return map[op];
}
