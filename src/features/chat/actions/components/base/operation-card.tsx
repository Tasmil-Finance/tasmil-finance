"use client";

import type { LucideIcon } from "lucide-react";
import { AlertCircle, ArrowUpRight, CheckCircle, Loader2, Wallet } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { getExplorerUrl, truncateAddress } from "@/shared/config/stellar";
import { useWallet } from "@/shared/context/wallet-context";
import { Button } from "@/shared/ui/button";

export interface OperationCardProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  buttonText?: string;
  status: "pending" | "executing" | "complete" | "error" | "inProgress";
  result?: unknown;
  respond?: (result: Record<string, unknown>) => void;
  /** Called when user clicks the execute button. Should return { success, hash?, error? } */
  onExecute: (address: string) => Promise<{ success: boolean; hash?: string; error?: string }>;
  /** Render operation details before execution. */
  renderDetails?: () => React.ReactNode;
  className?: string;
}

export function BaseOperationCard({
  title,
  subtitle,
  icon: Icon = Wallet,
  iconColor = "text-primary",
  iconBg = "bg-primary/10",
  buttonText = "Sign & Submit",
  status,
  result,
  respond,
  onExecute,
  renderDetails,
  className,
}: OperationCardProps) {
  const { address, isConnected } = useWallet();
  const [isExecuting, setIsExecuting] = useState(false);
  const [txResult, setTxResult] = useState<{
    success: boolean;
    hash?: string;
    message: string;
  } | null>(null);

  // Merge persisted result with local state
  const persistedResult = result as Record<string, unknown> | undefined;
  const hasPersistedResult = persistedResult?.["success"] !== undefined;
  const effectiveResult =
    txResult ??
    (hasPersistedResult
      ? {
          success: Boolean(persistedResult?.["success"]),
          hash: persistedResult?.["hash"] as string | undefined,
          message: String(
            persistedResult?.["message"] ??
              (persistedResult?.["success"] ? "Transaction successful!" : "Transaction failed")
          ),
        }
      : null);

  const cardClass = cn("w-full max-w-[360px] min-w-[280px] rounded-lg border bg-card p-5 shadow-sm", className);

  const handleExecute = async () => {
    if (!isConnected || !address) {
      const err = { success: false, error: "Wallet not connected" };
      setTxResult({ success: false, message: err.error });
      respond?.(err);
      return;
    }

    setIsExecuting(true);
    try {
      const res = await onExecute(address);
      setTxResult({
        success: res.success,
        hash: res.hash,
        message: res.success ? "Transaction successful!" : (res.error ?? "Transaction failed"),
      });
      respond?.({
        success: res.success,
        ...(res.hash && { hash: res.hash }),
        ...(res.error && { error: res.error }),
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Transaction failed";
      setTxResult({ success: false, message: msg });
      respond?.({ success: false, error: msg });
    } finally {
      setIsExecuting(false);
    }
  };

  // Loading / pending state
  if (status === "pending") {
    return (
      <div className={cn(cardClass, "bg-card/40")}>
        <div className="flex items-center gap-3">
          <div className={cn("flex h-10 w-10 items-center justify-center rounded-full", iconBg)}>
            <Loader2 className={cn("h-5 w-5 animate-spin", iconColor)} />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-base">{title}</h3>
            <p className="text-muted-foreground text-sm">Preparing transaction...</p>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (effectiveResult?.success && effectiveResult.hash) {
    const hash = effectiveResult.hash;
    const explorerUrl = getExplorerUrl("tx", hash);

    return (
      <div className={cn(cardClass, "bg-card/40")}>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-500/10">
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
          <div className="min-w-0 space-y-1">
            <h3 className="font-semibold text-base">Transaction Completed</h3>
            <p className="text-muted-foreground text-sm">{title} was successful</p>
          </div>
        </div>

        {renderDetails?.()}

        <div className="mt-2 mb-4 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">TX Hash</span>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs">{truncateAddress(hash)}</span>
            <a
              className="flex h-6 w-6 items-center justify-center rounded-full bg-background/30 transition-colors hover:text-foreground"
              href={explorerUrl}
              rel="noopener noreferrer"
              target="_blank"
              title="View on Stellar Expert"
            >
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div className="rounded-md border border-green-500/30 bg-green-500/20 p-3">
          <p className="text-green-700 text-sm dark:text-green-300">{effectiveResult.message}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (effectiveResult?.success === false) {
    return (
      <div className={cardClass}>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-5 w-5 text-destructive" />
          </div>
          <div className="min-w-0 space-y-1">
            <h3 className="font-semibold text-base">Transaction Failed</h3>
            <p className="text-muted-foreground text-sm">{title}</p>
          </div>
        </div>

        {renderDetails?.()}

        <div className="mt-2 rounded-md border border-destructive/30 bg-destructive/10 p-3">
          <p className="text-destructive text-sm">{effectiveResult.message}</p>
        </div>
      </div>
    );
  }

  // Ready state - show details + execute button
  return (
    <div className={cardClass}>
      <div className="mb-4 flex items-center gap-3">
        <div
          className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", iconBg)}
        >
          <Icon className={cn("h-5 w-5", iconColor)} />
        </div>
        <div className="min-w-0 space-y-1">
          <h3 className="font-semibold text-base">{title}</h3>
          <p className="text-muted-foreground text-sm">
            {subtitle ?? "Review details and sign the transaction"}
          </p>
        </div>
      </div>

      {renderDetails?.()}

      {!isConnected && (
        <div className="my-3 rounded-md border border-yellow-500/30 bg-yellow-500/10 p-3">
          <div className="flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-400">
            <AlertCircle className="h-4 w-4" />
            <span>Please connect your wallet to proceed.</span>
          </div>
        </div>
      )}

      <Button
        onClick={handleExecute}
        disabled={!isConnected || isExecuting}
        className="mt-3 h-10 w-full rounded-lg"
        variant="default"
      >
        {isExecuting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing...
          </>
        ) : (
          buttonText
        )}
      </Button>
    </div>
  );
}
