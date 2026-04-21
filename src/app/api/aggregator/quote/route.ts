import { NextRequest, NextResponse } from "next/server";
import { createTasmilClient } from "@tasmil/adapter-sdk";
import { STELLAR_NETWORK } from "@/shared/config/stellar-server";

function getClient() {
  return createTasmilClient({ network: STELLAR_NETWORK });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      tokenIn: string;
      tokenOut: string;
      amount: string;
      fromChain?: string;
      toChain?: string;
      from?: string;
      protocols?: string[];
    };

    const { tokenIn, tokenOut, amount, fromChain = "stellar", toChain = "stellar", from, protocols } = body;
    const isCrossChain = fromChain !== toChain;
    const sdk = getClient();

    if (isCrossChain) {
      // ── Cross-chain bridge ──────────────────────────────────
      const result = await sdk.bridge.getAllQuotes({
        fromChain: fromChain as any,
        toChain:   toChain as any,
        asset:    tokenIn,
        assetOut: tokenOut !== tokenIn ? tokenOut : undefined,
        amount,
        from,
        providers: protocols as any,
      });

      const quotes = result.quotes.map((q) => ({
        provider:      q.provider,
        amountIn:      q.amountIn,
        amountOut:     q.amountOut,
        fee:           q.fee,
        feePercent:    q.feePercent,
        estimatedTime: q.estimatedTime,
        route:         [] as string[],
        status:        q.status,
        error:         q.error,
        depositAddress: q.depositAddress,
      }));

      return NextResponse.json({
        mode:   "bridge",
        quotes,
        best:   result.best ?? null,
      });
    }

    // ── Same-chain swap ──────────────────────────────────────
    // Pass symbols — each adapter resolves to its own required format internally
    const result = await sdk.swap.getAllQuotes({
      tokenIn,
      tokenOut,
      amount,
      from,
      protocols: protocols as any,
    });

    const quotes = result.quotes.map((q) => ({
      protocol:      q.protocol,
      amountIn:      q.amountIn,
      amountOut:     q.amountOut,
      fee:           q.fee,
      feePercent:    q.feePercent,
      estimatedTime: q.estimatedTime,
      route:         q.route,
      poolAddress:   q.poolAddress,
      status:        q.status,
      error:         q.error,
    }));

    return NextResponse.json({
      mode:   "swap",
      quotes,
      best:   result.best ?? null,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Quote failed" },
      { status: 400 },
    );
  }
}
