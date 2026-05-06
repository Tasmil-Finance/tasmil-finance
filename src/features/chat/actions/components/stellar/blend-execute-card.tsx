"use client";

import type { LucideIcon } from "lucide-react";
import { ArrowRightLeft, Coins } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useStreamContext } from "@/features/chat/hooks";
import type { SignedTxRecord } from "@/features/chat/types/stream.types";
import { useWelcomeReward } from "@/features/welcome-reward/hooks/use-welcome-reward";
import { checkWalletNetwork, parseSigningError } from "@/lib/stellar-network-check";
import { activeNetwork, truncateAddress } from "@/shared/config/stellar";
import { useWallet } from "@/shared/context/wallet-context";
import { DetailRow } from "../base/indicators";
import { BaseOperationCard } from "../base/operation-card";

// Module-level cache: survives component remounts within the same browser session.
// LangGraph thread state (signed_txs) handles cross-session persistence (page refresh).
type TxCacheEntry = { success: boolean; hash?: string; message: string };
const sessionTxCache = new Map<string, TxCacheEntry>();

interface ExecuteResult {
  success: boolean;
  operation?: string;
  xdr?: string;
  estimatedFee?: string;
  error?: string;
}

interface BlendExecuteCardProps {
  operation?: string;
  args?: Record<string, any>;
  result?: unknown;
  toolCallId?: string;
  status?: "pending" | "executing" | "complete" | "error" | "inProgress";
  respond?: (result: Record<string, unknown>) => void;
}

const OPERATION_CONFIG: Record<
  string,
  { title: string; buttonText: string; icon: LucideIcon; iconColor: string; iconBg: string }
> = {
  blend_supply: {
    title: "Sign Blend Deposit",
    buttonText: "Sign & Deposit",
    icon: Coins,
    iconColor: "text-green-500",
    iconBg: "bg-green-500/10",
  },
  blend_borrow: {
    title: "Sign Blend Borrow",
    buttonText: "Sign & Borrow",
    icon: Coins,
    iconColor: "text-blue-500",
    iconBg: "bg-blue-500/10",
  },
  blend_repay: {
    title: "Sign Blend Repay",
    buttonText: "Sign & Repay",
    icon: Coins,
    iconColor: "text-purple-500",
    iconBg: "bg-purple-500/10",
  },
  blend_withdraw: {
    title: "Sign Blend Withdrawal",
    buttonText: "Sign & Withdraw",
    icon: Coins,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
  },
  blend_toggle_collateral: {
    title: "Sign Collateral Toggle",
    buttonText: "Sign & Toggle",
    icon: Coins,
    iconColor: "text-yellow-500",
    iconBg: "bg-yellow-500/10",
  },
  blend_claim: {
    title: "Sign Emissions Claim",
    buttonText: "Sign & Claim",
    icon: Coins,
    iconColor: "text-green-500",
    iconBg: "bg-green-500/10",
  },
  backstop_deposit: {
    title: "Sign Backstop Deposit",
    buttonText: "Sign & Deposit",
    icon: Coins,
    iconColor: "text-blue-500",
    iconBg: "bg-blue-500/10",
  },
  backstop_queue: {
    title: "Sign Backstop Queue",
    buttonText: "Sign & Queue",
    icon: Coins,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
  },
  backstop_dequeue: {
    title: "Sign Backstop Dequeue",
    buttonText: "Sign & Dequeue",
    icon: Coins,
    iconColor: "text-purple-500",
    iconBg: "bg-purple-500/10",
  },
  backstop_withdraw: {
    title: "Sign Backstop Withdrawal",
    buttonText: "Sign & Withdraw",
    icon: Coins,
    iconColor: "text-green-500",
    iconBg: "bg-green-500/10",
  },
};

const DEFAULT_CONFIG = {
  title: "Sign Transaction",
  buttonText: "Sign & Submit",
  icon: ArrowRightLeft,
  iconColor: "text-primary",
  iconBg: "bg-primary/10",
};

function toCardResult(rec: SignedTxRecord): { success: boolean; hash?: string; message: string } {
  return {
    success: rec.success,
    hash: rec.hash,
    message: rec.error ?? (rec.success ? "Transaction successful!" : "Transaction failed"),
  };
}

export function BlendExecuteCard({
  operation,
  args,
  result,
  status: initialStatus = "executing",
  respond,
  toolCallId,
}: BlendExecuteCardProps) {
  const stream = useStreamContext();
  const { address: walletAddress } = useWallet();
  const { reportTransaction } = useWelcomeReward();

  // Persisted state from LangGraph thread (PostgreSQL checkpointer) — survives page refresh
  const persistedTx = toolCallId
    ? ((stream.values as any)?.signed_txs?.[toolCallId] as SignedTxRecord | undefined)
    : undefined;

  // Local state — initialised from module-level session cache so it survives remounts.
  // Priority on mount: session cache > LangGraph thread state > null
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

  const config = OPERATION_CONFIG[operation ?? ""] ?? DEFAULT_CONFIG;

  // Parse MCP result — tool results may arrive as [{type:"text",text:"..."}] arrays
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

  let execResult: ExecuteResult | null = null;
  if (normalizedResult && typeof normalizedResult === "object") {
    execResult = normalizedResult as ExecuteResult;
  } else if (typeof normalizedResult === "string") {
    try {
      execResult = JSON.parse(normalizedResult);
    } catch {
      /* ignore */
    }
  }

  const xdr = execResult?.xdr ?? args?.xdr;
  const estimatedFee = execResult?.estimatedFee ?? args?.estimatedFee;
  const action = args?.action;

  // Effective result: local (just signed) > persisted (from DB) > null
  const effectiveResult = localTxResult ?? (persistedTx ? toCardResult(persistedTx) : null);

  // Status derived from effective result; fall back to initialStatus while waiting
  const cardStatus = effectiveResult
    ? effectiveResult.success
      ? "complete"
      : "error"
    : initialStatus;

  const handleExecute = useCallback(
    async (address: string) => {
      if (!xdr) {
        return { success: false, error: "No transaction XDR available" };
      }

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

        toast.info("Submitting to network...");

        const { TransactionBuilder } = await import("@stellar/stellar-sdk");
        const { getSorobanClient } = await import("@/lib/stellar-client");

        const soroban = getSorobanClient();
        const signedTx = TransactionBuilder.fromXDR(signedTxXdr, activeNetwork.networkPassphrase);
        const response = await soroban.sendTransaction(signedTx as any);

        if (response.status === "PENDING") {
          const { hash } = response;
          const explorerUrl = `https://stellar.expert/explorer/public/tx/${hash}`;

          const cardResult = { success: true, hash, message: "Transaction successful!" };
          cacheTxResult(cardResult);
          reportTransaction(hash, {
            protocol: "blend",
            operation: operation ?? "supply",
            asset: (args?.asset as string) ?? "XLM",
            amount: (args?.amount as string) ?? "0",
          });

          toast.success("Transaction submitted successfully!", {
            description: (
              <div className="flex flex-col gap-1">
                <div>Hash: {hash.slice(0, 8)}...</div>
                <a
                  href={explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs underline"
                >
                  View on Stellar Expert
                </a>
              </div>
            ),
            duration: 5000,
          });

          const successMessage = {
            id: `__hidden__tx-success-${Date.now()}`,
            type: "human" as const,
            content: `Transaction ${hash} submitted successfully`,
          };

          const txRecord: SignedTxRecord = {
            success: true,
            hash,
            operation,
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

        const hiddenMsg = isRejection
          ? {
              id: `__hidden__tx-reject-${Date.now()}`,
              type: "human" as const,
              content: "Transaction rejected by user",
            }
          : {
              id: `__hidden__tx-error-${Date.now()}`,
              type: "human" as const,
              content: `Transaction failed: ${msg}`,
            };

        if (isRejection) {
          toast.error("Transaction rejected", { description: "You cancelled the transaction" });
        } else {
          toast.error("Transaction failed", { description: msg });
        }

        const txRecord: SignedTxRecord = {
          success: false,
          error: cardResult.message,
          operation,
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
    [
      xdr,
      stream,
      operation,
      toolCallId,
      respond,
      cacheTxResult,
      reportTransaction,
      walletAddress,
      args?.amount,
      args?.asset,
    ]
  );

  const renderDetails = () => (
    <div className="mb-2 space-y-2">
      {action && (
        <DetailRow
          label="Action"
          value={<span className="capitalize">{action.replace(/_/g, " ")}</span>}
        />
      )}
      {estimatedFee && <DetailRow label="Est. Fee" value={estimatedFee} />}
      {args?.amount && <DetailRow label="Amount" value={args.amount as string} />}
      {args?.from && <DetailRow label="From" value={truncateAddress(String(args.from))} mono />}
      {args?.poolAddress && (
        <DetailRow label="Pool" value={truncateAddress(String(args.poolAddress))} mono />
      )}
      {args?.asset && <DetailRow label="Asset" value={truncateAddress(String(args.asset))} mono />}
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
      title={config.title}
      icon={config.icon}
      iconColor={config.iconColor}
      iconBg={config.iconBg}
      buttonText={config.buttonText}
      status={cardStatus}
      result={effectiveResult}
      onExecute={handleExecute}
      renderDetails={renderDetails}
    />
  );
}
