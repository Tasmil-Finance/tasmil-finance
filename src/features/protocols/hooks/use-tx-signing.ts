"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { useWallet } from "@/shared/context/wallet-context";
import { activeNetwork } from "@/shared/config/stellar";
import { checkWalletNetwork, parseSigningError } from "@/lib/stellar-network-check";
import type { CardMode } from "../schemas/common.schema";

// Module-level cache: survives component remounts within the same browser session.
type TxCacheEntry = { success: boolean; hash?: string; message: string };
const sessionTxCache = new Map<string, TxCacheEntry>();

interface TxSigningOptions {
  mode: CardMode;
  /** LangGraph stream context (chat mode only). */
  stream?: any;
  /** Tool call ID for LangGraph state persistence (chat mode only). */
  toolCallId?: string;
  /** Operation name for logging/persistence. */
  operation?: string;
  /** CopilotKit respond callback (chat mode only). */
  respond?: (result: Record<string, unknown>) => void;
}

interface TxSigningResult {
  sign: (xdr: string) => Promise<{ success: boolean; hash?: string; error?: string }>;
  signing: boolean;
  txResult: TxCacheEntry | null;
  txError: string | null;
  resetResult: () => void;
}

export function useTxSigning(options: TxSigningOptions): TxSigningResult {
  const { mode, stream, toolCallId, operation, respond } = options;
  const { signTransaction, address: walletAddress } = useWallet();

  // Initialise from session cache or LangGraph persisted state
  const [txResult, setTxResult] = useState<TxCacheEntry | null>(() => {
    if (toolCallId) {
      const cached = sessionTxCache.get(toolCallId);
      if (cached) return cached;
      if (mode === "chat" && stream) {
        const persisted = (stream.values as any)?.signed_txs?.[toolCallId];
        if (persisted) {
          return {
            success: persisted.success,
            hash: persisted.hash,
            message: persisted.error ?? (persisted.success ? "Transaction successful!" : "Transaction failed"),
          };
        }
      }
    }
    return null;
  });

  const [signing, setSigning] = useState(false);
  const [txError, setTxError] = useState<string | null>(null);

  const cacheTxResult = useCallback(
    (entry: TxCacheEntry) => {
      if (toolCallId) sessionTxCache.set(toolCallId, entry);
      setTxResult(entry);
    },
    [toolCallId],
  );

  const resetResult = useCallback(() => {
    setTxResult(null);
    setTxError(null);
  }, []);

  const sign = useCallback(
    async (xdr: string) => {
      if (!xdr) return { success: false, error: "No transaction XDR available" };

      setSigning(true);
      setTxError(null);

      try {
        await checkWalletNetwork();

        if (mode === "playground") {
          // Playground: use wallet context signTransaction + MCP aggregator submit
          const signedXdr = await signTransaction(xdr);
          const MCP_URL = process.env["NEXT_PUBLIC_MCP_STELLAR_URL"] ?? "http://localhost:3009";
          const submitRes = await fetch(`${MCP_URL}/api/aggregator/submit`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ signedXdr, protocol: "blend" }),
          });
          const submitData = await submitRes.json();

          if (submitData.success) {
            const hash = submitData.hash ?? "Submitted";
            cacheTxResult({ success: true, hash, message: "Transaction successful!" });
            return { success: true, hash };
          }

          const e = submitData.error ?? submitData.detail ?? submitData.message ?? "Submission failed";
          const errMsg = typeof e === "string" ? e : JSON.stringify(e);
          setTxError(errMsg);
          cacheTxResult({ success: false, message: errMsg });
          return { success: false, error: errMsg };
        }

        // Chat: use StellarWalletsKit + direct Soroban submit + LangGraph persist
        const { StellarWalletsKit } = await import("@creit.tech/stellar-wallets-kit/sdk");
        try {
          if (walletAddress) StellarWalletsKit.setWallet(walletAddress);
        } catch {
          // ignore
        }

        const signingResult = await StellarWalletsKit.signTransaction(xdr, {
          address: walletAddress ?? "",
          networkPassphrase: activeNetwork.networkPassphrase,
        });
        const signedTxXdr = signingResult.signedTxXdr || signingResult;

        if (!signedTxXdr || typeof signedTxXdr !== "string") {
          throw new Error("Invalid signed transaction format");
        }

        toast.info("Submitting to network...");

        const { TransactionBuilder } = await import("@stellar/stellar-sdk");
        const { getSorobanClient } = await import("@/lib/stellar-client");
        const soroban = getSorobanClient();
        const signedTx = TransactionBuilder.fromXDR(signedTxXdr, activeNetwork.networkPassphrase);
        const response = await soroban.sendTransaction(signedTx as any);

        if (response.status === "PENDING") {
          const { hash } = response;
          const cardResult = { success: true, hash, message: "Transaction successful!" };
          cacheTxResult(cardResult);

          toast.success("Transaction submitted successfully!", {
            description: `Hash: ${hash.slice(0, 8)}...`,
            duration: 5000,
          });

          // Persist to LangGraph thread state
          if (stream && toolCallId) {
            await stream.submit(
              {
                messages: [{ id: `__hidden__tx-success-${Date.now()}`, type: "human" as const, content: `Transaction ${hash} submitted successfully` }],
                ...(walletAddress ? { wallet_address: walletAddress } : {}),
                signed_txs: { [toolCallId]: { success: true, hash, operation, timestamp: Date.now() } },
              },
              { streamMode: ["values"], streamSubgraphs: false, streamResumable: true },
            );
          }

          respond?.({ success: true, hash });
          return { success: true, hash };
        }

        throw new Error(`Transaction failed with status: ${response.status}`);
      } catch (error) {
        const msg = parseSigningError(error);
        const isRejection =
          msg.toLowerCase().includes("rejected") ||
          msg.toLowerCase().includes("denied") ||
          msg.toLowerCase().includes("cancel");

        const cardResult = {
          success: false,
          message: isRejection ? "Transaction rejected by user" : msg,
        };
        cacheTxResult(cardResult);

        if (isRejection) {
          if (mode === "playground") {
            // In playground, rejection is just a cancel — don't show as error
            return { success: false, error: "cancelled" };
          }
          toast.error("Transaction rejected", { description: "You cancelled the transaction" });
        } else {
          setTxError(msg);
          toast.error("Transaction failed", { description: msg });
        }

        // Persist error to LangGraph
        if (mode === "chat" && stream && toolCallId) {
          await stream.submit(
            {
              messages: [{
                id: `__hidden__tx-${isRejection ? "reject" : "error"}-${Date.now()}`,
                type: "human" as const,
                content: isRejection ? "Transaction rejected by user" : `Transaction failed: ${msg}`,
              }],
              ...(walletAddress ? { wallet_address: walletAddress } : {}),
              signed_txs: { [toolCallId]: { success: false, error: cardResult.message, operation, timestamp: Date.now() } },
            },
            { streamMode: ["values"], streamSubgraphs: false, streamResumable: true },
          );
        }

        respond?.({ success: false, error: cardResult.message });
        return { success: false, error: cardResult.message };
      } finally {
        setSigning(false);
      }
    },
    [mode, signTransaction, walletAddress, stream, toolCallId, operation, respond, cacheTxResult],
  );

  return { sign, signing, txResult, txError, resetResult };
}
