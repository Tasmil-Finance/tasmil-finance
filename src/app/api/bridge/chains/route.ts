import {
  AllbridgeCoreSdk,
  type ChainSymbol,
  nodeRpcUrlsDefault,
} from "@allbridge/bridge-core-sdk";
import { NextResponse } from "next/server";

function getStellarRpcUrl(): string {
  return process.env.NEXT_PUBLIC_STELLAR_TESTNET === "true"
    ? "https://soroban-testnet.stellar.org"
    : "https://soroban.stellar.org";
}

function getAllbridgeSdk(): AllbridgeCoreSdk {
  return new AllbridgeCoreSdk({
    ...nodeRpcUrlsDefault,
    SRB: getStellarRpcUrl(),
  });
}

export async function GET() {
  try {
    const sdk = getAllbridgeSdk();
    const detailsMap = await sdk.chainDetailsMap();

    const chains: Record<
      string,
      {
        name: string;
        chainSymbol: ChainSymbol;
        tokens: { symbol: string; decimals: number; tokenAddress: string }[];
      }
    > = {};

    for (const [symbol, details] of Object.entries(detailsMap)) {
      if (!details) continue;
      chains[symbol] = {
        name: details.name,
        chainSymbol: symbol as ChainSymbol,
        tokens: details.tokens.map((t) => ({
          symbol: t.symbol,
          decimals: t.decimals,
          tokenAddress: t.tokenAddress,
        })),
      };
    }

    return NextResponse.json(
      { chains },
      {
        headers: {
          "Cache-Control": "public, max-age=300",
        },
      },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch chain details";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
