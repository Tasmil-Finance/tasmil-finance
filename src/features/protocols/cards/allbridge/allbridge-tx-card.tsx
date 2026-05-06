"use client";

import { ArrowRight, Check, Copy, Loader2, Zap } from "lucide-react";
import { useCallback, useState } from "react";
import { useTxSigning } from "../../hooks/use-tx-signing";
import { trunc } from "../../lib/formatting";
import type { AllbridgeTxCardProps } from "../../schemas/allbridge.schema";
import type { CardMode } from "../../schemas/common.schema";
import { MetricBox, Row } from "../base/indicators";
import { ProtocolCard } from "../base/protocol-card";

interface Props {
  tx: AllbridgeTxCardProps;
  mode?: CardMode;
  stream?: any;
  toolCallId?: string;
  respond?: (result: any) => void;
}

const OP_LABELS: Record<string, string> = {
  bridge: "Bridge Transfer",
  "pool-deposit": "LP Deposit",
  "pool-withdraw": "LP Withdraw",
  "claim-rewards": "Claim Rewards",
  allbridge_build_transaction: "Bridge Transfer",
  allbridge_pool_deposit: "LP Deposit",
  allbridge_pool_withdraw: "LP Withdraw",
  allbridge_pool_claim_rewards: "Claim Rewards",
};

export function AllbridgeTxCard({ tx, mode = "playground", stream, toolCallId, respond }: Props) {
  const isChat = mode === "chat";
  const { sign, signing, txResult, txError } = useTxSigning({
    mode,
    stream,
    toolCallId,
    respond,
    volumeContext: {
      protocol: "allbridge",
      operation: tx.operation,
      asset: tx.asset ?? tx.symbol ?? "",
      amount: tx.amount ?? "0",
    },
  });
  const [showXdr, setShowXdr] = useState(false);
  const label = OP_LABELS[tx.operation] ?? tx.operation;
  const isBridge = tx.operation.includes("bridge") || tx.operation === "bridge";

  const handleSign = useCallback(async () => {
    if (!tx.xdr) return;
    await sign(tx.xdr);
  }, [tx.xdr, sign]);

  // Completed state
  if (txResult) {
    return (
      <ProtocolCard
        mode={mode}
        title={label}
        icon={Check}
        iconColor="text-emerald-500"
        iconBg="bg-emerald-500/10"
      >
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-500" />
            <span className="font-medium text-emerald-400 text-sm">Transaction confirmed</span>
          </div>
          {txResult.hash && (
            <p className="font-mono text-[11px] text-muted-foreground">
              {trunc(txResult.hash, 12, 8)}
            </p>
          )}
        </div>
      </ProtocolCard>
    );
  }

  if (isChat) {
    return (
      <ProtocolCard
        mode="chat"
        title={label}
        icon={Zap}
        iconColor="text-blue-500"
        iconBg="bg-blue-500/10"
      >
        <div className="space-y-2">
          {isBridge ? (
            <>
              {tx.fromChain && tx.toChain && (
                <div className="flex items-center gap-1.5 text-sm">
                  <span className="font-medium capitalize">{tx.fromChain}</span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground/40" />
                  <span className="font-medium capitalize">{tx.toChain}</span>
                </div>
              )}
              {tx.amount && (
                <p className="text-sm">
                  {tx.amount} {tx.asset ?? tx.symbol ?? ""}
                </p>
              )}
            </>
          ) : (
            <>
              {tx.amount && (
                <p className="text-sm">
                  {tx.amount} {tx.symbol ?? ""}
                </p>
              )}
              {tx.chain && (
                <p className="text-muted-foreground text-xs capitalize">Chain: {tx.chain}</p>
              )}
            </>
          )}
          {tx.xdr && (
            <p className="truncate font-mono text-[10px] text-muted-foreground">
              {tx.xdr.slice(0, 120)}...
            </p>
          )}
          {txError && <p className="text-red-400 text-xs">{txError}</p>}
          {tx.xdr && (
            <button
              type="button"
              onClick={handleSign}
              disabled={signing}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-gradient-to-b from-[#B5EAFF] to-[#00BFFF] py-2 font-semibold text-black text-sm transition-all hover:from-[#C5F0FF] hover:to-[#1CCFFF] active:scale-[0.98] disabled:opacity-40"
            >
              {signing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Signing...
                </>
              ) : (
                `Sign & ${label}`
              )}
            </button>
          )}
        </div>
      </ProtocolCard>
    );
  }

  // Playground mode
  return (
    <ProtocolCard mode="playground">
      <div className="border-border border-b px-4 py-3">
        <p className="font-medium text-foreground text-sm">{label}</p>
      </div>
      <div className="space-y-3 p-4">
        {/* Summary */}
        {isBridge ? (
          <>
            {tx.fromChain && tx.toChain && (
              <div className="flex items-center justify-center gap-2 py-1">
                <span className="rounded-lg bg-secondary px-3 py-1.5 font-medium text-sm capitalize">
                  {tx.fromChain}
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground/40" />
                <span className="rounded-lg bg-secondary px-3 py-1.5 font-medium text-sm capitalize">
                  {tx.toChain}
                </span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              {tx.amount && <MetricBox label="Amount" value={`${tx.amount} ${tx.asset ?? ""}`} />}
              {tx.provider && <MetricBox label="Provider" value={tx.provider} />}
            </div>
            <div className="space-y-1 text-xs">
              {tx.fromAddress && <Row label="From" value={trunc(tx.fromAddress, 8, 6)} />}
              {tx.toAddress && <Row label="To" value={trunc(tx.toAddress, 8, 6)} />}
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              {tx.amount && <MetricBox label="Amount" value={`${tx.amount} ${tx.symbol ?? ""}`} />}
              {tx.chain && <MetricBox label="Chain" value={tx.chain} />}
            </div>
            <div className="space-y-1 text-xs">
              {tx.poolAddress && <Row label="Pool" value={trunc(tx.poolAddress, 8, 6)} />}
              {tx.earnedRewards && (
                <Row label="Rewards" value={`${tx.earnedRewards} ${tx.symbol ?? ""}`} />
              )}
            </div>
          </>
        )}

        {tx.note && <p className="text-[10px] text-muted-foreground/70 italic">{tx.note}</p>}

        {/* XDR toggle */}
        {tx.xdr && (
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => setShowXdr(!showXdr)}
              className="text-[10px] text-muted-foreground transition-colors hover:text-foreground"
            >
              {showXdr ? "Hide" : "Show"} XDR
            </button>
            {showXdr && (
              <div className="relative">
                <pre className="max-h-[100px] overflow-auto break-all rounded-lg bg-muted/30 p-2 font-mono text-[10px] text-muted-foreground">
                  {tx.xdr}
                </pre>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(tx.xdr!)}
                  className="absolute top-1 right-1 rounded bg-secondary p-1 hover:bg-muted"
                >
                  <Copy className="h-3 w-3 text-muted-foreground" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {txError && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-2 text-red-400 text-xs">
            {txError}
          </div>
        )}

        {/* Sign button */}
        {tx.xdr && (
          <button
            type="button"
            onClick={handleSign}
            disabled={signing}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-b from-[#B5EAFF] to-[#00BFFF] py-2.5 font-semibold text-black text-sm transition-all hover:from-[#C5F0FF] hover:to-[#1CCFFF] active:scale-[0.98] disabled:opacity-40"
          >
            {signing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Signing...
              </>
            ) : (
              `Sign & ${label}`
            )}
          </button>
        )}

        {/* Non-XDR transactions (e.g., NEAR Intents deposit-to-address) */}
        {!tx.xdr && tx.transaction && (
          <div className="space-y-1 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
            <p className="font-medium text-amber-400 text-xs">Manual Transaction Required</p>
            {tx.transaction.depositAddress && (
              <div className="space-y-1 text-xs">
                <Row label="Deposit to" value={trunc(tx.transaction.depositAddress, 10, 8)} />
                {tx.transaction.instruction && (
                  <p className="text-[10px] text-muted-foreground">{tx.transaction.instruction}</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </ProtocolCard>
  );
}
