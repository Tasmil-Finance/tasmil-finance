import {
  AllbridgeCoreSdk,
  ChainSymbol,
  Messenger,
  nodeRpcUrlsDefault,
} from "@allbridge/bridge-core-sdk";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ALLBRIDGE_CHAINS: Record<string, ChainSymbol> = {
  stellar: ChainSymbol.SRB,
  ethereum: ChainSymbol.ETH,
  bsc: ChainSymbol.BSC,
  polygon: ChainSymbol.POL,
  avalanche: ChainSymbol.AVA,
  solana: ChainSymbol.SOL,
  arbitrum: ChainSymbol.ARB,
  optimism: ChainSymbol.OPT,
  base: ChainSymbol.BAS,
  tron: ChainSymbol.TRX,
  sui: ChainSymbol.SUI,
};

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

interface QuoteRequestBody {
  fromChain: string;
  toChain: string;
  token: string;
  amount: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as QuoteRequestBody;
    const { fromChain, toChain, token, amount } = body;

    if (!fromChain || !toChain || !token || !amount) {
      return NextResponse.json(
        { error: "Missing required fields: fromChain, toChain, token, amount" },
        { status: 400 },
      );
    }

    const fromSym = ALLBRIDGE_CHAINS[fromChain.toLowerCase()];
    const toSym = ALLBRIDGE_CHAINS[toChain.toLowerCase()];

    if (!fromSym) {
      return NextResponse.json(
        { error: `Unsupported source chain: ${fromChain}` },
        { status: 400 },
      );
    }
    if (!toSym) {
      return NextResponse.json(
        { error: `Unsupported destination chain: ${toChain}` },
        { status: 400 },
      );
    }

    const sdk = getAllbridgeSdk();
    const chains = await sdk.chainDetailsMap();

    const srcToken = chains[fromSym]?.tokens.find(
      (t) => t.symbol.toUpperCase() === token.toUpperCase(),
    );
    const dstToken = chains[toSym]?.tokens.find(
      (t) => t.symbol.toUpperCase() === token.toUpperCase(),
    );

    if (!srcToken) {
      return NextResponse.json(
        { error: `Token ${token} not available on ${fromChain}` },
        { status: 400 },
      );
    }
    if (!dstToken) {
      return NextResponse.json(
        { error: `Token ${token} not available on ${toChain}` },
        { status: 400 },
      );
    }

    const amountOut = await sdk.getAmountToBeReceived(amount, srcToken, dstToken, Messenger.ALLBRIDGE);
    const transferTime = await sdk.getAverageTransferTime(srcToken, dstToken, Messenger.ALLBRIDGE);
    const fee = (parseFloat(amount) - parseFloat(amountOut)).toFixed(6);
    const feePercent = ((parseFloat(fee) / parseFloat(amount)) * 100).toFixed(2) + "%";
    const estimatedTime = transferTime ? `${Math.round(transferTime / 60000)} min` : "3-5 min";

    return NextResponse.json({
      amountIn: amount,
      amountOut,
      fee,
      feePercent,
      estimatedTime,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to get bridge quote";
    return NextResponse.json(
      {
        amountIn: "0",
        amountOut: "0",
        fee: "0",
        feePercent: "N/A",
        estimatedTime: "N/A",
        error: message,
      },
      { status: 500 },
    );
  }
}
