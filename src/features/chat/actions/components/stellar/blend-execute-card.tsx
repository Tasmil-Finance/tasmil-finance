"use client";

import type { LucideIcon } from "lucide-react";
import { ArrowRightLeft, Coins } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useStreamContext } from "@/features/chat/hooks";
import { activeNetwork, truncateAddress } from "@/shared/config/stellar";
import { DetailRow } from "../base/indicators";
import { BaseOperationCard } from "../base/operation-card";

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

export function BlendExecuteCard({
  operation,
  args,
  result,
  status: initialStatus = "executing",
  respond,
  toolCallId,
}: BlendExecuteCardProps) {
  const stream = useStreamContext();

  const storageKey = toolCallId ? `blend-tx-${toolCallId}` : null;

  const [localStatus, setLocalStatus] = useState(() => {
    if (storageKey) {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          return parsed.status || initialStatus;
        } catch {
          // Ignore
        }
      }
    }
    return initialStatus;
  });

  const [localResult, setLocalResult] = useState<ExecuteResult | null>(() => {
    if (storageKey) {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          return parsed.result || null;
        } catch {
          // Ignore
        }
      }
    }
    return null;
  });

  const updatePersisted = useCallback(
    (status: string, result: ExecuteResult | null) => {
      if (storageKey) {
        localStorage.setItem(storageKey, JSON.stringify({ status, result }));
      }
      setLocalStatus(status as any);
      setLocalResult(result);
    },
    [storageKey]
  );

  const config = OPERATION_CONFIG[operation ?? ""] ?? DEFAULT_CONFIG;

  let execResult: ExecuteResult | null = null;
  if (result && typeof result === "object") {
    execResult = result as ExecuteResult;
  } else if (typeof result === "string") {
    try {
      execResult = JSON.parse(result);
    } catch {
      /* ignore */
    }
  }

  const xdr = execResult?.xdr ?? args?.["xdr"];
  const estimatedFee = execResult?.estimatedFee ?? args?.["estimatedFee"];
  const action = args?.["action"];

  const handleExecute = useCallback(
    async (address: string) => {
      if (!xdr) {
        return { success: false, error: "No transaction XDR available" };
      }

      try {
        updatePersisted("inProgress", null);

        const { StellarWalletsKit } = await import("@creit.tech/stellar-wallets-kit/sdk");

        try {
          StellarWalletsKit.setWallet(address);
        } catch {
          // Ignore
        }

        const result = await StellarWalletsKit.signTransaction(xdr, {
          address,
          networkPassphrase: activeNetwork.networkPassphrase,
        });

        const signedTxXdr = result.signedTxXdr || result;

        if (!signedTxXdr || typeof signedTxXdr !== "string") {
          throw new Error("Invalid signed transaction format");
        }

        updatePersisted("inProgress", null);
        toast.info("Submitting to network...");

        const { TransactionBuilder } = await import("@stellar/stellar-sdk");
        const { getSorobanClient } = await import("@/lib/stellar-client");

        const soroban = getSorobanClient();
        const networkPassphrase = activeNetwork.networkPassphrase;

        const signedTx = TransactionBuilder.fromXDR(signedTxXdr, networkPassphrase);
        const response = await soroban.sendTransaction(signedTx as any);

        if (response.status === "PENDING") {
          const hash = response.hash;
          const explorerUrl = `https://stellar.expert/explorer/public/tx/${hash}`;

          const successResult = {
            success: true,
            hash,
            signedXdr: signedTxXdr,
          };

          updatePersisted("complete", successResult);

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

          await stream.submit(
            { messages: [successMessage] },
            {
              // @ts-expect-error
              streamMode: ["values"],
              streamSubgraphs: false,
              streamResumable: true,
            }
          );

          return successResult;
        } else {
          throw new Error(`Transaction failed with status: ${response.status}`);
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Signing failed";
        const errorResult = { success: false, error: msg };

        updatePersisted("error", errorResult);

        if (msg.includes("rejected") || msg.includes("denied") || msg.includes("cancel")) {
          toast.error("Transaction rejected", {
            description: "You cancelled the transaction",
          });

          const rejectionMessage = {
            id: `__hidden__tx-reject-${Date.now()}`,
            type: "human" as const,
            content: "Transaction rejected by user",
          };

          await stream.submit(
            { messages: [rejectionMessage] },
            {
              // @ts-expect-error
              streamMode: ["values"],
              streamSubgraphs: false,
              streamResumable: true,
            }
          );

          return { success: false, error: "Transaction rejected by user" };
        }

        toast.error("Transaction failed", {
          description: msg,
        });

        // Send hidden error message to trigger AI response
        const errorMessage = {
          id: `__hidden__tx-error-${Date.now()}`,
          type: "human" as const,
          content: `Transaction failed: ${msg}`,
        };

        await stream.submit(
          { messages: [errorMessage] },
          {
            // @ts-expect-error
            streamMode: ["values"],
            streamSubgraphs: false,
            streamResumable: true,
          }
        );

        return errorResult;
      }
    },
    [xdr, stream, respond, updatePersisted]
  );

  const renderDetails = () => (
    <div className="space-y-2 mb-2">
      {action && (
        <DetailRow
          label="Action"
          value={<span className="capitalize">{action.replace(/_/g, " ")}</span>}
        />
      )}
      {estimatedFee && <DetailRow label="Est. Fee" value={estimatedFee} />}
      {args?.["amount"] && <DetailRow label="Amount" value={args["amount"] as string} />}
      {args?.["from"] && (
        <DetailRow label="From" value={truncateAddress(String(args["from"]))} mono />
      )}
      {args?.["poolAddress"] && (
        <DetailRow label="Pool" value={truncateAddress(String(args["poolAddress"]))} mono />
      )}
      {args?.["asset"] && (
        <DetailRow label="Asset" value={truncateAddress(String(args["asset"]))} mono />
      )}
      {xdr && (
        <div className="border-t pt-2 mt-2">
          <div className="text-xs text-muted-foreground mb-1">Transaction XDR</div>
          <div className="font-mono text-[10px] text-muted-foreground bg-muted/30 rounded p-2 break-all max-h-[60px] overflow-y-auto">
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
      status={localStatus}
      result={localResult || result}
      onExecute={handleExecute}
      renderDetails={renderDetails}
    />
  );
}
