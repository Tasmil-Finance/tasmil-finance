"use client";

import { useState, useCallback } from "react";
import { Zap, Check, Loader2, ArrowRight, Copy } from "lucide-react";
import type { CardMode } from "../../schemas/common.schema";
import type { AllbridgeTxCardProps } from "../../schemas/allbridge.schema";
import { ProtocolCard } from "../base/protocol-card";
import { MetricBox, Row } from "../base/indicators";
import { trunc } from "../../lib/formatting";
import { useTxSigning } from "../../hooks/use-tx-signing";

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
  const { sign, signing, txResult, txError } = useTxSigning({ mode, stream, toolCallId, respond });
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
      <ProtocolCard mode={mode} title={label} icon={Check} iconColor="text-emerald-500" iconBg="bg-emerald-500/10">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-500" />
            <span className="text-sm font-medium text-emerald-400">Transaction confirmed</span>
          </div>
          {txResult.hash && (
            <p className="text-[11px] text-muted-foreground font-mono">{trunc(txResult.hash, 12, 8)}</p>
          )}
        </div>
      </ProtocolCard>
    );
  }

  if (isChat) {
    return (
      <ProtocolCard mode="chat" title={label} icon={Zap} iconColor="text-blue-500" iconBg="bg-blue-500/10">
        <div className="space-y-2">
          {isBridge ? (
            <>
              {tx.fromChain && tx.toChain && (
                <div className="flex items-center gap-1.5 text-sm">
                  <span className="capitalize font-medium">{tx.fromChain}</span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground/40" />
                  <span className="capitalize font-medium">{tx.toChain}</span>
                </div>
              )}
              {tx.amount && <p className="text-sm">{tx.amount} {tx.asset ?? tx.symbol ?? ""}</p>}
            </>
          ) : (
            <>
              {tx.amount && <p className="text-sm">{tx.amount} {tx.symbol ?? ""}</p>}
              {tx.chain && <p className="text-xs text-muted-foreground capitalize">Chain: {tx.chain}</p>}
            </>
          )}
          {tx.xdr && (
            <p className="text-[10px] text-muted-foreground font-mono truncate">{tx.xdr.slice(0, 120)}...</p>
          )}
          {txError && <p className="text-xs text-red-400">{txError}</p>}
          {tx.xdr && (
            <button
              type="button"
              onClick={handleSign}
              disabled={signing}
              className="w-full rounded-lg py-2 text-sm font-semibold bg-gradient-to-b from-[#B5EAFF] to-[#00BFFF] text-black hover:from-[#C5F0FF] hover:to-[#1CCFFF] transition-all active:scale-[0.98] disabled:opacity-40 flex items-center justify-center gap-1.5"
            >
              {signing ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing...</> : `Sign & ${label}`}
            </button>
          )}
        </div>
      </ProtocolCard>
    );
  }

  // Playground mode
  return (
    <ProtocolCard mode="playground">
      <div className="px-4 py-3 border-b border-border">
        <p className="text-sm font-medium text-foreground">{label}</p>
      </div>
      <div className="p-4 space-y-3">
        {/* Summary */}
        {isBridge ? (
          <>
            {tx.fromChain && tx.toChain && (
              <div className="flex items-center justify-center gap-2 py-1">
                <span className="rounded-lg bg-secondary px-3 py-1.5 text-sm font-medium capitalize">{tx.fromChain}</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground/40" />
                <span className="rounded-lg bg-secondary px-3 py-1.5 text-sm font-medium capitalize">{tx.toChain}</span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              {tx.amount && <MetricBox label="Amount" value={`${tx.amount} ${tx.asset ?? ""}`} />}
              {tx.provider && <MetricBox label="Provider" value={tx.provider} />}
            </div>
            <div className="text-xs space-y-1">
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
            <div className="text-xs space-y-1">
              {tx.poolAddress && <Row label="Pool" value={trunc(tx.poolAddress, 8, 6)} />}
              {tx.earnedRewards && <Row label="Rewards" value={`${tx.earnedRewards} ${tx.symbol ?? ""}`} />}
            </div>
          </>
        )}

        {tx.note && (
          <p className="text-[10px] text-muted-foreground/70 italic">{tx.note}</p>
        )}

        {/* XDR toggle */}
        {tx.xdr && (
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => setShowXdr(!showXdr)}
              className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
            >
              {showXdr ? "Hide" : "Show"} XDR
            </button>
            {showXdr && (
              <div className="relative">
                <pre className="max-h-[100px] overflow-auto rounded-lg bg-muted/30 p-2 text-[10px] text-muted-foreground font-mono break-all">
                  {tx.xdr}
                </pre>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(tx.xdr!)}
                  className="absolute top-1 right-1 p-1 rounded bg-secondary hover:bg-muted"
                >
                  <Copy className="h-3 w-3 text-muted-foreground" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {txError && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-2 text-xs text-red-400">{txError}</div>
        )}

        {/* Sign button */}
        {tx.xdr && (
          <button
            type="button"
            onClick={handleSign}
            disabled={signing}
            className="w-full rounded-xl py-2.5 text-sm font-semibold bg-gradient-to-b from-[#B5EAFF] to-[#00BFFF] text-black hover:from-[#C5F0FF] hover:to-[#1CCFFF] transition-all active:scale-[0.98] disabled:opacity-40 flex items-center justify-center gap-1.5"
          >
            {signing ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing...</> : `Sign & ${label}`}
          </button>
        )}

        {/* Non-XDR transactions (e.g., NEAR Intents deposit-to-address) */}
        {!tx.xdr && tx.transaction && (
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 space-y-1">
            <p className="text-xs font-medium text-amber-400">Manual Transaction Required</p>
            {tx.transaction.depositAddress && (
              <div className="text-xs space-y-1">
                <Row label="Deposit to" value={trunc(tx.transaction.depositAddress, 10, 8)} />
                {tx.transaction.instruction && <p className="text-[10px] text-muted-foreground">{tx.transaction.instruction}</p>}
              </div>
            )}
          </div>
        )}
      </div>
    </ProtocolCard>
  );
}
