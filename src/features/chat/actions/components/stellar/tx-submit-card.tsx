"use client";

import { AlertCircle, ArrowUpRight, CheckCircle } from "lucide-react";
import { memo, useEffect, useRef } from "react";
import { useWelcomeReward } from "@/features/welcome-reward/hooks/use-welcome-reward";
import { getExplorerUrl, truncateAddress } from "@/shared/config/stellar";
import { useResultData } from "../../hooks/use-result-data";
import { BaseInfoCard } from "../base/info-card";

interface TxSubmitCardProps {
  operation?: string;
  args?: Record<string, any>;
  result?: unknown;
  toolCallId?: string;
  status?: string;
  respond?: (result: Record<string, unknown>) => void;
}

function TxSubmitCardComponent({ result, status }: TxSubmitCardProps) {
  const { data, isLoading, hasError, errorMessage } = useResultData(result, status);
  const { reportTransaction } = useWelcomeReward();
  const reportedTxHashes = useRef(new Set<string>());

  const txResult = data?.result ?? data;
  const txHash = txResult?.id ?? txResult?.hash ?? txResult?.transactionHash;
  const isSuccess = data?.success !== false && txHash;

  useEffect(() => {
    if (!isSuccess || !txHash || reportedTxHashes.current.has(txHash)) {
      return;
    }

    reportedTxHashes.current.add(txHash);
    reportTransaction(txHash);
  }, [isSuccess, reportTransaction, txHash]);

  if (isSuccess) {
    const explorerUrl = getExplorerUrl("tx", txHash);

    return (
      <BaseInfoCard
        title="Transaction Submitted"
        icon={CheckCircle}
        iconColor="text-green-600"
        iconBg="bg-green-500/10"
        isLoading={isLoading}
      >
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">TX Hash</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs">{truncateAddress(txHash)}</span>
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
            <p className="text-green-700 text-sm dark:text-green-300">
              Transaction submitted successfully!
            </p>
          </div>
        </div>
      </BaseInfoCard>
    );
  }

  return (
    <BaseInfoCard
      title="Transaction Failed"
      icon={AlertCircle}
      iconColor="text-destructive"
      iconBg="bg-destructive/10"
      isLoading={isLoading}
      error={hasError ? errorMessage : null}
    >
      <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3">
        <p className="text-destructive text-sm">
          {data?.error ?? "Transaction submission failed."}
        </p>
      </div>
    </BaseInfoCard>
  );
}

export const TxSubmitCard = memo(TxSubmitCardComponent);
