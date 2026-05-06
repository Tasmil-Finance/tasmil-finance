"use client";

import { ShieldCheck } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useStreamContext } from "@/features/chat/hooks";
import type { SignedTxRecord } from "@/features/chat/types/stream.types";
import { checkWalletNetwork, parseSigningError } from "@/lib/stellar-network-check";
import { activeNetwork, truncateAddress } from "@/shared/config/stellar";
import { useWallet } from "@/shared/context/wallet-context";
import { DetailRow } from "../base/indicators";
import { BaseOperationCard } from "../base/operation-card";

// Module-level session cache — survives React remounts within the same browser session
type TxCacheEntry = { success: boolean; hash?: string; message: string };
const sessionTxCache = new Map<string, TxCacheEntry>();

function toCardResult(rec: SignedTxRecord): TxCacheEntry {
  return {
    success: rec.success,
    hash: rec.hash,
    message: rec.error ?? (rec.success ? "Trustline added successfully!" : "Trustline failed"),
  };
}

interface TrustlineExecuteCardProps {
  operation?: string;
  args?: Record<string, any>;
  result?: unknown;
  toolCallId?: string;
  status?: "pending" | "executing" | "complete" | "error" | "inProgress";
  respond?: (result: Record<string, unknown>) => void;
}

export function TrustlineExecuteCard({
  args,
  result,
  status: initialStatus = "executing",
  respond,
  toolCallId,
}: TrustlineExecuteCardProps) {
  const stream = useStreamContext();
  const { address: walletAddress } = useWallet();

  // Persisted state from LangGraph thread (PostgreSQL checkpointer)
  const persistedTx = toolCallId
    ? ((stream.values as any)?.signed_txs?.[toolCallId] as SignedTxRecord | undefined)
    : undefined;

  // Local state — initialised from session cache to survive remounts
  const [localTxResult, setLocalTxResult] = useState<TxCacheEntry | null>(() => {
    if (toolCallId) {
      const cached = sessionTxCache.get(toolCallId);
      if (cached) return cached;
      if (persistedTx) return toCardResult(persistedTx);
    }
    return null;
  });

  const cacheTxResult = useCallback(
    (entry: TxCacheEntry) => {
      if (toolCallId) sessionTxCache.set(toolCallId, entry);
      setLocalTxResult(entry);
    },
    [toolCallId]
  );

  // Parse MCP result — may arrive as [{type:"text",text:"..."}] arrays
  const normalizedResult = Array.isArray(result)
    ? (() => {
        const block = (result as any[]).find(
          (b) => b?.type === "text" && typeof b?.text === "string"
        );
        if (!block) return result;
        try {
          return JSON.parse(block.text);
        } catch {
          return block.text;
        }
      })()
    : result;

  let execResult: any = null;
  if (normalizedResult && typeof normalizedResult === "object") {
    execResult = normalizedResult;
  } else if (typeof normalizedResult === "string") {
    try {
      execResult = JSON.parse(normalizedResult);
    } catch {
      /* ignore */
    }
  }

  const xdr = execResult?.xdr ?? args?.xdr;
  const assetCode = execResult?.assetCode ?? args?.assetCode;
  const assetIssuer = execResult?.assetIssuer ?? args?.assetIssuer;
  const action = execResult?.action ?? args?.action ?? "add_trustline";

  const isAdd = action !== "remove_trustline";
  const title = isAdd
    ? `Add Trustline: ${assetCode ?? "Token"}`
    : `Remove Trustline: ${assetCode ?? "Token"}`;
  const buttonText = isAdd ? "Sign & Add Trustline" : "Sign & Remove Trustline";

  const effectiveResult = localTxResult ?? (persistedTx ? toCardResult(persistedTx) : null);
  const cardStatus = effectiveResult
    ? effectiveResult.success
      ? "complete"
      : "error"
    : initialStatus;

  const handleExecute = useCallback(
    async (address: string) => {
      if (!xdr) return { success: false, error: "No transaction XDR available" };

      try {
        await checkWalletNetwork();
        const { StellarWalletsKit } = await import("@creit.tech/stellar-wallets-kit/sdk");
        try {
          StellarWalletsKit.setWallet(address);
        } catch {
          // ignore
        }

        const signingResult = await StellarWalletsKit.signTransaction(xdr, {
          address,
          networkPassphrase: activeNetwork.networkPassphrase,
        });

        const signedTxXdr = signingResult.signedTxXdr || signingResult;
        if (!signedTxXdr || typeof signedTxXdr !== "string") {
          throw new Error("Invalid signed transaction format");
        }

        toast.info("Submitting trustline transaction...");

        // ChangeTrust is a classic Stellar operation — submit via Horizon, not Soroban RPC
        const { Horizon, TransactionBuilder } = await import("@stellar/stellar-sdk");
        const horizon = new Horizon.Server(activeNetwork.horizonUrl, {
          allowHttp: activeNetwork.horizonUrl.startsWith("http://"),
        });
        const signedTx = TransactionBuilder.fromXDR(signedTxXdr, activeNetwork.networkPassphrase);
        const response = await horizon.submitTransaction(signedTx as any);

        const hash = response.hash;
        const cardResult: TxCacheEntry = {
          success: true,
          hash,
          message: `${isAdd ? "Trustline added" : "Trustline removed"} successfully!`,
        };
        cacheTxResult(cardResult);

        toast.success(cardResult.message, {
          description: `Hash: ${hash.slice(0, 8)}...`,
          duration: 5000,
        });

        const successMessage = {
          id: `__hidden__tx-success-${Date.now()}`,
          type: "human" as const,
          content: `Trustline ${action} for ${assetCode} completed. Transaction hash: ${hash}. Now proceed with the original operation.`,
        };

        const txRecord: SignedTxRecord = {
          success: true,
          hash,
          operation: action,
          timestamp: Date.now(),
        };

        await stream.submit(
          {
            messages: [successMessage],
            ...(walletAddress ? { wallet_address: walletAddress } : {}),
            ...(toolCallId ? { signed_txs: { [toolCallId]: txRecord } } : {}),
          },
          {
            streamMode: ["values"],
            streamSubgraphs: false,
            streamResumable: true,
          }
        );

        respond?.({ success: true, hash });
        return { success: true, hash };
      } catch (error) {
        const msg = parseSigningError(error);
        const isRejection =
          msg.toLowerCase().includes("rejected") ||
          msg.toLowerCase().includes("denied") ||
          msg.toLowerCase().includes("cancel");

        const cardResult: TxCacheEntry = {
          success: false,
          message: isRejection ? "Transaction rejected by user" : msg,
        };
        cacheTxResult(cardResult);

        const hiddenMsg = {
          id: `__hidden__tx-${isRejection ? "reject" : "error"}-${Date.now()}`,
          type: "human" as const,
          content: isRejection
            ? `Trustline transaction rejected by user`
            : `Trustline transaction failed: ${msg}`,
        };

        if (isRejection) {
          toast.error("Rejected", { description: "You cancelled the transaction" });
        } else {
          toast.error("Trustline failed", { description: msg });
        }

        const txRecord: SignedTxRecord = {
          success: false,
          error: cardResult.message,
          operation: action,
          timestamp: Date.now(),
        };

        await stream.submit(
          {
            messages: [hiddenMsg],
            ...(walletAddress ? { wallet_address: walletAddress } : {}),
            ...(toolCallId ? { signed_txs: { [toolCallId]: txRecord } } : {}),
          },
          {
            streamMode: ["values"],
            streamSubgraphs: false,
            streamResumable: true,
          }
        );

        respond?.({ success: false, error: cardResult.message });
        return { success: false, error: cardResult.message };
      }
    },
    [xdr, stream, action, assetCode, isAdd, toolCallId, respond, cacheTxResult, walletAddress]
  );

  const renderDetails = () => (
    <div className="mb-2 space-y-2">
      {assetCode && (
        <DetailRow label="Asset" value={<span className="font-semibold">{assetCode}</span>} />
      )}
      {assetIssuer && (
        <DetailRow label="Issuer" value={truncateAddress(String(assetIssuer))} mono />
      )}
      {xdr && (
        <div className="mt-2 border-t pt-2">
          <div className="mb-1 text-muted-foreground text-xs">Transaction XDR</div>
          <div className="max-h-[60px] overflow-y-auto break-all rounded bg-muted/30 p-2 font-mono text-[10px] text-muted-foreground">
            {xdr.slice(0, 200)}
            {xdr.length > 200 ? "..." : ""}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <BaseOperationCard
      data-testid="card-trustline"
      title={title}
      icon={ShieldCheck}
      iconColor="text-cyan-500"
      iconBg="bg-cyan-500/10"
      buttonText={buttonText}
      status={cardStatus}
      result={effectiveResult}
      onExecute={handleExecute}
      renderDetails={renderDetails}
    />
  );
}
