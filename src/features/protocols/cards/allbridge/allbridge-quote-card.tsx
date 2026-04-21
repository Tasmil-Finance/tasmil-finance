"use client";

import { ArrowRightLeft, ArrowRight } from "lucide-react";
import type { CardMode } from "../../schemas/common.schema";
import type { AllbridgeQuoteCardProps } from "../../schemas/allbridge.schema";
import { ProtocolCard } from "../base/protocol-card";
import { DetailRow, MetricBox } from "../base/indicators";

interface Props {
  quote: AllbridgeQuoteCardProps;
  fromChain?: string;
  toChain?: string;
  asset?: string;
  mode?: CardMode;
}

export function AllbridgeQuoteCard({ quote, fromChain, toChain, asset, mode = "playground" }: Props) {
  const isChat = mode === "chat";
  const hasError = quote.status === "unavailable" || !!quote.error;

  if (isChat) {
    return (
      <ProtocolCard mode="chat" title="Bridge Quote" icon={ArrowRightLeft} iconColor="text-blue-500" iconBg="bg-blue-500/10"
        subtitle={fromChain && toChain ? `${fromChain} → ${toChain}` : undefined}>
        {hasError ? (
          <p className="text-sm text-red-400">{quote.error ?? "Quote unavailable"}</p>
        ) : (
          <div className="space-y-1.5">
            <DetailRow label="Send" value={`${quote.amountIn} ${asset ?? ""}`} />
            <DetailRow label="Receive" value={`${quote.amountOut} ${asset ?? ""}`} />
            {quote.feePercent && <DetailRow label="Fee" value={quote.feePercent} />}
            {quote.estimatedTime && <DetailRow label="Est. Time" value={quote.estimatedTime} />}
          </div>
        )}
      </ProtocolCard>
    );
  }

  if (hasError) {
    return (
      <ProtocolCard mode="playground">
        <div className="px-4 py-3 border-b border-border">
          <p className="text-sm font-medium text-foreground">Bridge Quote</p>
        </div>
        <div className="p-4">
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
            <p className="text-xs text-red-400">{quote.error ?? "Quote unavailable"}</p>
          </div>
        </div>
      </ProtocolCard>
    );
  }

  return (
    <ProtocolCard mode="playground">
      <div className="px-4 py-3 border-b border-border">
        <p className="text-sm font-medium text-foreground">Bridge Quote</p>
      </div>
      <div className="p-4 space-y-3">
        {/* Chain direction */}
        {fromChain && toChain && (
          <div className="flex items-center justify-center gap-2 py-1">
            <span className="rounded-lg bg-secondary px-3 py-1.5 text-sm font-medium text-foreground capitalize">{fromChain}</span>
            <ArrowRight className="h-4 w-4 text-muted-foreground/40" />
            <span className="rounded-lg bg-secondary px-3 py-1.5 text-sm font-medium text-foreground capitalize">{toChain}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <MetricBox label={`Send ${asset ?? ""}`} value={quote.amountIn} />
          <MetricBox label={`Receive ${asset ?? ""}`} value={quote.amountOut} />
        </div>
        <div className="grid grid-cols-2 gap-y-1.5 text-xs">
          {quote.fee && (
            <div className="flex justify-between py-0.5">
              <span className="text-muted-foreground">Fee</span>
              <span className="text-foreground tabular-nums">{quote.fee}</span>
            </div>
          )}
          {quote.feePercent && (
            <div className="flex justify-between py-0.5">
              <span className="text-muted-foreground">Fee %</span>
              <span className="text-foreground tabular-nums">{quote.feePercent}</span>
            </div>
          )}
          {quote.estimatedTime && (
            <div className="flex justify-between py-0.5">
              <span className="text-muted-foreground">Est. Time</span>
              <span className="text-foreground tabular-nums">{quote.estimatedTime}</span>
            </div>
          )}
          {quote.provider && (
            <div className="flex justify-between py-0.5">
              <span className="text-muted-foreground">Provider</span>
              <span className="text-foreground capitalize">{quote.provider}</span>
            </div>
          )}
        </div>
      </div>
    </ProtocolCard>
  );
}
