"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { useWallet } from "@/shared/context/wallet-context";
import { activeNetwork } from "@/shared/config/stellar";
import { checkWalletNetwork, parseSigningError } from "@/lib/stellar-network-check";
import { getExplorerUrl } from "@/shared/config/stellar";
import { useWelcomeReward, type TrackVolumeContext } from "@/features/welcome-reward/hooks/use-welcome-reward";
import type { CardMode } from "../schemas/common.schema";

// Persisted cache: survives component remounts AND page reloads (same tab).
type TxCacheEntry = { success: boolean; hash?: string; message: string };
const TX_CACHE_PREFIX = "tasmil.tx-cache.";
const sessionTxCache = {
  get(key: string): TxCacheEntry | undefined {
    try {
      const raw = sessionStorage.getItem(`${TX_CACHE_PREFIX}${key}`);
      return raw ? (JSON.parse(raw) as TxCacheEntry) : undefined;
    } catch {
      return undefined;
    }
  },
  set(key: string, value: TxCacheEntry) {
    try {
      sessionStorage.setItem(`${TX_CACHE_PREFIX}${key}`, JSON.stringify(value));
    } catch {
      /* sessionStorage full or unavailable — degrade silently */
    }
  },
  has(key: string): boolean {
    return sessionStorage.getItem(`${TX_CACHE_PREFIX}${key}`) !== null;
  },
};

interface TxSigningOptions {
  mode: CardMode;
  /** LangGraph stream context (chat mode only). */
  stream?: any;
  /** Tool call ID for LangGraph state persistence (chat mode only). */
  toolCallId?: string;
  /** Operation name for logging/persistence. */
  operation?: string;
  /** Respond callback for chat mode (notifies the agent of TX result). */
  respond?: (result: Record<string, unknown>) => void;
  /** Volume tracking context — protocol, asset, amount for reward tracking. */
  volumeContext?: TrackVolumeContext;
}

interface TxSigningResult {
  sign: (xdr: string) => Promise<{ success: boolean; hash?: string; error?: string }>;
  cancel: () => void;
  signing: boolean;
  txResult: TxCacheEntry | null;
  txError: string | null;
  resetResult: () => void;
}

export function useTxSigning(options: TxSigningOptions): TxSigningResult {
  const { mode, stream, toolCallId, operation, respond, volumeContext } = options;
  const { signTransaction, address: walletAddress } = useWallet();
  const { reportTransaction } = useWelcomeReward();

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

  const cancel = useCallback(() => {
    cacheTxResult({ success: false, message: "Transaction cancelled" });
    respond?.({ success: false, cancelled: true, reason: "User cancelled the operation" });
  }, [cacheTxResult, respond]);

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
            reportTransaction(hash, volumeContext);
            // Notify the agent that the TX was already submitted (prevents agent re-submit)
            respond?.({ success: true, hash });
            return { success: true, hash };
          }

          const e = submitData.error ?? submitData.detail ?? submitData.message ?? "Submission failed";
          const errMsg = typeof e === "string" ? e : JSON.stringify(e);
          setTxError(errMsg);
          cacheTxResult({ success: false, message: errMsg });
          respond?.({ success: false, error: errMsg });
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
          reportTransaction(hash, volumeContext);

          toast.success("Transaction submitted successfully!", {
            description: hash.slice(0, 8) + "...",
            action: {
              label: "View on Explorer",
              onClick: () => window.open(getExplorerUrl("tx", hash), "_blank"),
            },
            duration: 5000,
          });

          // Persist to LangGraph thread state
          if (stream && !respond) {
            // Only submit directly if there's no respond callback (non-HITL path)
            await stream.submit(
              {
                messages: [{ id: `__hidden__tx-success-${Date.now()}`, type: "human" as const, content: `Transaction ${hash} submitted successfully` }],
                ...(walletAddress ? { wallet_address: walletAddress } : {}),
                ...(toolCallId ? { signed_txs: { [toolCallId]: { success: true, hash, operation, timestamp: Date.now() } } } : {}),
              },
            { streamMode: ["values", "custom"], streamSubgraphs: false, streamResumable: true },
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
        if (mode === "chat" && stream && !respond) {
          await stream.submit(
            {
              messages: [{
                id: `__hidden__tx-${isRejection ? "cancel" : "error"}-${Date.now()}`,
                type: "human" as const,
                content: isRejection ? "Transaction rejected by user" : `Transaction failed: ${msg}`,
              }],
              ...(walletAddress ? { wallet_address: walletAddress } : {}),
              ...(toolCallId ? { signed_txs: { [toolCallId]: { success: false, error: cardResult.message, operation, timestamp: Date.now() } } } : {}),
            },
            { streamMode: ["values", "custom"], streamSubgraphs: false, streamResumable: true },
          );
        }

        respond?.({ success: false, error: cardResult.message });
        return { success: false, error: cardResult.message };
      } finally {
        setSigning(false);
      }
    },
    [mode, signTransaction, walletAddress, stream, toolCallId, operation, respond, cacheTxResult, reportTransaction, volumeContext],
  );

  return { sign, cancel, signing, txResult, txError, resetResult };
}
