"use client";

import {
  AllbridgeCoreSdk,
  ChainSymbol,
  FeePaymentMethod,
  Messenger,
} from "@allbridge/bridge-core-sdk";
import { useCallback, useRef } from "react";

const STELLAR_NETWORK = process.env.NEXT_PUBLIC_STELLAR_NETWORK ?? "testnet";

const CHAIN_TO_ALLBRIDGE: Record<string, string> = {
  stellar: "SRB",
  ethereum: "ETH",
  bsc: "BSC",
  polygon: "POL",
  avalanche: "AVA",
  solana: "SOL",
  arbitrum: "ARB",
  optimism: "OPT",
  base: "BAS",
  tron: "TRX",
  sonic: "SNC",
  celo: "CEL",
  linea: "LIN",
  unichain: "UNI",
};

function createSdk(): AllbridgeCoreSdk {
  return new AllbridgeCoreSdk({
    // Stellar
    [ChainSymbol.SRB]:
      STELLAR_NETWORK === "mainnet"
        ? "https://soroban-rpc.mainnet.stellar.gateway.fm"
        : "https://soroban-testnet.stellar.org",
    [ChainSymbol.STLR]:
      STELLAR_NETWORK === "mainnet"
        ? "https://horizon.stellar.org"
        : "https://horizon-testnet.stellar.org",
    // Solana
    [ChainSymbol.SOL]:
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://solana-rpc.publicnode.com",
    // EVM chains
    [ChainSymbol.ETH]: "https://ethereum-rpc.publicnode.com",
    [ChainSymbol.BSC]: "https://bsc-rpc.publicnode.com",
    [ChainSymbol.POL]: "https://polygon-bor-rpc.publicnode.com",
    [ChainSymbol.ARB]: "https://arbitrum-one-rpc.publicnode.com",
    [ChainSymbol.OPT]: "https://optimism-rpc.publicnode.com",
    [ChainSymbol.AVA]: "https://avalanche-c-chain-rpc.publicnode.com",
    [ChainSymbol.BAS]: "https://base-rpc.publicnode.com",
    [ChainSymbol.CEL]: "https://celo-rpc.publicnode.com",
    [ChainSymbol.SNC]: "https://rpc.soniclabs.com",
    [ChainSymbol.LIN]: "https://linea-rpc.publicnode.com",
    [ChainSymbol.UNI]: "https://unichain.drpc.org",
    // Other chains
    [ChainSymbol.TRX]: "https://tron-rpc.publicnode.com",
    [ChainSymbol.SUI]: "https://sui-rpc.publicnode.com",
    [ChainSymbol.ALG]: "https://mainnet-api.algonode.cloud",
    [ChainSymbol.STX]: "https://stacks-node-api.mainnet.stacks.co",
  });
}

/**
 * Client-side Allbridge bridge execute.
 * Creates AllbridgeCoreSdk directly with explicit RPC URLs (avoids
 * nodeRpcUrlsDefault which points to restricted/paid endpoints).
 */
export function useAllbridgeExecute() {
  const sdkRef = useRef<AllbridgeCoreSdk | null>(null);
  function getSdk() {
    if (!sdkRef.current) sdkRef.current = createSdk();
    return sdkRef.current;
  }

  const execute = useCallback(
    async (params: {
      fromChain: string;
      toChain: string;
      tokenIn: string;
      tokenOut: string;
      amount: string;
      from: string;
      to: string;
      signSolana?: (tx: unknown) => Promise<string>;
      signEvm?: (tx: { to: string; data: string; value?: string }) => Promise<string>;
      signStellar?: (xdr: string) => Promise<string>;
    }): Promise<string> => {
      const { fromChain, toChain, tokenIn, tokenOut, amount, from, to } = params;

      const fromSym = CHAIN_TO_ALLBRIDGE[fromChain];
      const toSym = CHAIN_TO_ALLBRIDGE[toChain];
      if (!fromSym || !toSym) throw new Error(`Unsupported chain: ${fromChain} → ${toChain}`);

      const sdk = getSdk();
      const chains = await sdk.chainDetailsMap();

      const srcChain = chains[fromSym as ChainSymbol];
      const dstChain = chains[toSym as ChainSymbol];
      if (!srcChain) throw new Error(`${fromChain} not found in Allbridge`);
      if (!dstChain) throw new Error(`${toChain} not found in Allbridge`);

      const srcToken = srcChain.tokens.find(
        (t) => t.symbol.toUpperCase() === tokenIn.toUpperCase()
      );
      const dstToken = dstChain.tokens.find(
        (t) => t.symbol.toUpperCase() === (tokenOut || tokenIn).toUpperCase()
      );
      if (!srcToken) throw new Error(`${tokenIn} not on ${fromChain}`);
      if (!dstToken) throw new Error(`${tokenOut} not on ${toChain}`);

      // amount is already human-readable (e.g. "0.1"), pass directly to SDK
      const rawTx = await sdk.bridge.rawTxBuilder.send({
        amount: amount,
        fromAccountAddress: from,
        toAccountAddress: to,
        sourceToken: srcToken,
        destinationToken: dstToken,
        messenger: Messenger.ALLBRIDGE,
        gasFeePaymentMethod: FeePaymentMethod.WITH_NATIVE_CURRENCY,
      });

      // ── Solana: rawTx is a VersionedTransaction ──
      if (fromChain === "solana") {
        if (!params.signSolana) throw new Error("Solana wallet not connected");
        return params.signSolana(rawTx);
      }

      // ── Stellar: rawTx is a string (XDR) ──
      if (fromChain === "stellar") {
        if (!params.signStellar) throw new Error("Stellar wallet not connected");
        return params.signStellar(rawTx as unknown as string);
      }

      // ── EVM: rawTx is { from?, to?, data?, value? } ──
      if (!params.signEvm) throw new Error("EVM wallet not connected");
      const evmTx = rawTx as { to?: string; data?: string; value?: string };
      return params.signEvm({
        to: evmTx.to ?? "",
        data: evmTx.data ?? "0x",
        value: evmTx.value,
      });
    },
    [getSdk]
  );

  return { execute };
}
