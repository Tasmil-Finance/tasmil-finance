"use client";

import { ArrowLeftRight, ArrowUpDown, Clock, Info, Loader2 } from "lucide-react";
import { useState } from "react";
import { useStreamContext } from "@/features/chat/hooks/use-stream";
import { TokenImage } from "@/shared/components/token-image";
import { getExplorerUrl } from "@/shared/config/stellar";
import { useTxSigning } from "../../hooks/use-tx-signing";
import { trunc } from "../../lib/formatting";
import type { CardMode } from "../../schemas/common.schema";
import type { SwapBridgeCardProps } from "../../schemas/shared.schema";
import { ProtocolCard } from "../base/protocol-card";

// ─── Operation config ───────────────────────────────────────────

const OP_LABELS: Record<string, { label: string; icon: typeof ArrowLeftRight }> = {
  swap: { label: "Swap", icon: ArrowLeftRight },
  bridge: { label: "Bridge", icon: ArrowLeftRight },
  add_liquidity: { label: "Add Liquidity", icon: ArrowUpDown },
  remove_liquidity: { label: "Remove Liquidity", icon: ArrowUpDown },
};

// ─── Props ──────────────────────────────────────────────────────

interface SwapBridgeCardComponentProps {
  data: SwapBridgeCardProps;
  mode?: CardMode;
  stream?: any;
  toolCallId?: string;
  respond?: (result: Record<string, unknown>) => void;
}

// ─── Component ──────────────────────────────────────────────────

export function SwapBridgeCard({
  data,
  mode = "playground",
  stream: streamProp,
  toolCallId,
  respond,
}: SwapBridgeCardComponentProps) {
  const operation = data.operation ?? "swap";
  const opCfg = OP_LABELS[operation] ?? OP_LABELS.swap ?? { label: "Swap", icon: ArrowLeftRight };
  const protocolLabel = data.protocol.charAt(0).toUpperCase() + data.protocol.slice(1);

  const chatStream = useStreamContext();
  const stream = mode === "chat" ? chatStream : streamProp;

  const { sign, cancel, signing, txResult, txError } = useTxSigning({
    mode,
    stream,
    toolCallId,
    operation,
    respond,
    volumeContext: {
      protocol: data.protocol,
      operation,
      asset: data.tokenIn,
      amount: data.amountIn,
    },
  });

  const [showXdr, setShowXdr] = useState(false);
  const cancelled =
    txResult !== null && !txResult.success && txResult.message === "Transaction cancelled";

  const handleSign = () => sign(data.xdr);
  const handleCancel = () => cancel();

  const isBridge = operation === "bridge";

  // ─── Chat mode (compact) ───────────────────────────────────────

  if (mode === "chat") {
    return (
      <ProtocolCard
        mode="chat"
        title={`${opCfg.label} via ${protocolLabel}`}
        icon={opCfg.icon}
        iconColor="text-blue-500"
        iconBg="bg-blue-500/10"
      >
        <div className="space-y-3">
          {/* You pay */}
          <div>
            <p className="mb-1 text-muted-foreground text-xs">You pay</p>
            <div className="flex items-center gap-2 rounded-lg bg-secondary/60 px-3 py-2">
              <TokenImage src={null} alt={data.tokenIn} className="h-6 w-6 rounded-full" />
              <span className="font-semibold text-foreground text-lg tabular-nums">
                {data.amountIn}
              </span>
              <span className="text-muted-foreground text-sm">{data.tokenIn}</span>
              {isBridge && data.sourceChain && (
                <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                  {data.sourceChain}
                </span>
              )}
            </div>
          </div>

          {/* Arrow */}
          <div className="flex justify-center">
            <div className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-card">
              <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </div>

          {/* You receive */}
          <div>
            <p className="mb-1 text-muted-foreground text-xs">You receive</p>
            <div className="flex items-center gap-2 rounded-lg bg-secondary/60 px-3 py-2">
              <TokenImage src={null} alt={data.tokenOut} className="h-6 w-6 rounded-full" />
              <span className="font-semibold text-foreground text-lg tabular-nums">
                {data.amountOut}
              </span>
              <span className="text-muted-foreground text-sm">{data.tokenOut}</span>
              {isBridge && data.destChain && (
                <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                  {data.destChain}
                </span>
              )}
            </div>
          </div>

          {/* Fee / Gas / Time */}
          <div className="space-y-1 pt-1">
            {(data.fee || data.feeAmount) && (
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                <Info className="h-3 w-3 shrink-0" />
                <span>
                  Fee {data.fee ?? ""}
                  {data.feeAmount ? ` (${data.feeAmount})` : ""}
                </span>
                {data.gasEstimate && (
                  <span className="ml-1">
                    {"\u00B7"} Gas ~{data.gasEstimate}
                  </span>
                )}
              </div>
            )}
            {data.estimatedTime && (
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                <Clock className="h-3 w-3 shrink-0" />
                <span>Est. time ~{data.estimatedTime}</span>
              </div>
            )}
            {data.route && data.route.length > 1 && (
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                <ArrowLeftRight className="h-3 w-3 shrink-0" />
                <span>Route: {data.route.join(" \u2192 ")}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          {txResult?.success ? (
            <a
              href={getExplorerUrl("tx", txResult.hash ?? "")}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full rounded-lg border border-emerald-500/20 bg-emerald-500/10 py-2 text-center font-semibold text-emerald-400 text-xs transition-colors hover:bg-emerald-500/15"
            >
              Transaction confirmed {"\u00B7"} {trunc(txResult.hash ?? "")}
            </a>
          ) : txError ? (
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-center text-destructive text-xs">
              Failed {"\u00B7"} {txError.length > 80 ? `${txError.slice(0, 80)}\u2026` : txError}
            </div>
          ) : cancelled ? (
            <div className="rounded-lg border border-border bg-muted px-3 py-2 text-center text-muted-foreground text-xs">
              Transaction cancelled
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="flex-1 rounded-lg border border-border py-2 font-semibold text-muted-foreground text-xs transition-all hover:bg-secondary hover:text-foreground active:scale-[0.98]"
                onClick={handleCancel}
                disabled={signing}
              >
                Cancel
              </button>
              <button
                type="button"
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-gradient-to-b from-[#B5EAFF] to-[#00BFFF] py-2 font-semibold text-black text-xs transition-all hover:from-[#C5F0FF] hover:to-[#1CCFFF] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                onClick={handleSign}
                disabled={signing || !data.xdr}
              >
                {signing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Signing...
                  </>
                ) : (
                  "Confirm & Sign"
                )}
              </button>
            </div>
          )}
        </div>
      </ProtocolCard>
    );
  }

  // ─── Playground mode ───────────────────────────────────────────

  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-card">
      {/* Header */}
      <div className="flex items-center gap-2 px-5 pt-5 pb-2">
        <opCfg.icon className="h-5 w-5 text-blue-500" />
        <div>
          <p className="font-semibold text-foreground text-lg">
            {opCfg.label} via {protocolLabel}
          </p>
          <p className="text-muted-foreground text-xs">Review details before signing</p>
        </div>
      </div>

      {/* You pay */}
      <div className="px-5 pb-1">
        <p className="mb-1.5 text-muted-foreground text-sm">You pay</p>
        <div className="flex items-center gap-2.5 rounded-2xl bg-secondary/60 px-4 py-3">
          <TokenImage src={null} alt={data.tokenIn} className="h-8 w-8 rounded-full" />
          <div className="min-w-0 flex-1">
            <span className="font-semibold text-foreground text-lg tabular-nums">
              {data.amountIn}
            </span>
            <span className="ml-1.5 text-muted-foreground text-sm">{data.tokenIn}</span>
          </div>
          {isBridge && data.sourceChain && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
              {data.sourceChain}
            </span>
          )}
        </div>
      </div>

      {/* Arrow */}
      <div className="flex justify-center py-1">
        <div className="z-10 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      {/* You receive */}
      <div className="px-5 pb-3">
        <p className="mb-1.5 text-muted-foreground text-sm">You receive</p>
        <div className="flex items-center gap-2.5 rounded-2xl bg-secondary/60 px-4 py-3">
          <TokenImage src={null} alt={data.tokenOut} className="h-8 w-8 rounded-full" />
          <div className="min-w-0 flex-1">
            <span className="font-semibold text-foreground text-lg tabular-nums">
              {data.amountOut}
            </span>
            <span className="ml-1.5 text-muted-foreground text-sm">{data.tokenOut}</span>
          </div>
          {isBridge && data.destChain && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
              {data.destChain}
            </span>
          )}
        </div>
      </div>

      {/* Fee / Gas / Time / Route */}
      <div className="space-y-0 px-5 pb-3">
        {(data.fee || data.feeAmount || data.gasEstimate) && (
          <div className="flex justify-between border-border/30 border-b py-2.5">
            <span className="text-muted-foreground text-sm">Fee</span>
            <span className="text-foreground text-sm tabular-nums">
              {data.fee ?? ""}
              {data.feeAmount ? ` (${data.feeAmount})` : ""}
              {data.gasEstimate ? ` \u00B7 Gas ~${data.gasEstimate}` : ""}
            </span>
          </div>
        )}
        {data.estimatedTime && (
          <div className="flex justify-between border-border/30 border-b py-2.5">
            <span className="text-muted-foreground text-sm">Est. time</span>
            <span className="text-foreground text-sm tabular-nums">~{data.estimatedTime}</span>
          </div>
        )}
        {data.route && data.route.length > 1 && (
          <div className="flex justify-between border-border/30 border-b py-2.5">
            <span className="text-muted-foreground text-sm">Route</span>
            <span className="text-foreground text-sm tabular-nums">
              {data.route.join(" \u2192 ")}
            </span>
          </div>
        )}
      </div>

      {/* XDR toggle */}
      <div className="px-5 pb-2">
        <button
          type="button"
          onClick={() => setShowXdr(!showXdr)}
          className="text-[10px] text-muted-foreground/50 transition-colors hover:text-muted-foreground"
        >
          {showXdr ? "Hide XDR" : "Show XDR"}
        </button>
        {showXdr && (
          <pre className="mt-1 max-h-[100px] overflow-auto break-all rounded-lg bg-secondary p-2 font-mono text-[10px] text-muted-foreground">
            {data.xdr}
          </pre>
        )}
      </div>

      <div className="h-px bg-border" />

      {/* Action area */}
      <div className="px-4 py-3">
        {txResult?.success ? (
          <a
            href={getExplorerUrl("tx", txResult.hash ?? "")}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full rounded-lg border border-emerald-500/20 bg-emerald-500/10 py-2 text-center font-semibold text-emerald-400 text-xs transition-colors hover:bg-emerald-500/15"
          >
            Transaction confirmed {"\u00B7"} {trunc(txResult.hash ?? "")}
          </a>
        ) : txError ? (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-center text-destructive text-xs">
            Failed {"\u00B7"} {txError.length > 80 ? `${txError.slice(0, 80)}\u2026` : txError}
          </div>
        ) : cancelled ? (
          <div className="rounded-lg border border-border bg-muted px-3 py-2 text-center text-muted-foreground text-xs">
            Transaction cancelled
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="flex-1 rounded-lg border border-border py-2 font-semibold text-muted-foreground text-xs transition-all hover:bg-secondary hover:text-foreground active:scale-[0.98]"
              onClick={handleCancel}
              disabled={signing}
            >
              Cancel
            </button>
            <button
              type="button"
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-gradient-to-b from-[#B5EAFF] to-[#00BFFF] py-2 font-semibold text-black text-xs transition-all hover:from-[#C5F0FF] hover:to-[#1CCFFF] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
              onClick={handleSign}
              disabled={signing || !data.xdr}
            >
              {signing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Signing...
                </>
              ) : (
                "Confirm & Sign"
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
