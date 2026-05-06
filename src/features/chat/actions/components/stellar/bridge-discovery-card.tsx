"use client";

import { ArrowRight, Clock, Crown, Globe } from "lucide-react";
import { memo } from "react";
import { MetricBox, Stat } from "@/features/protocols/cards/base/indicators";
import { EmptyState, ProtocolCard } from "@/features/protocols/cards/base/protocol-card";
import { useResultData } from "../../hooks/use-result-data";
import { formatEstimatedTime } from "../../lib/formatting";
import { ScrollableList } from "../base/indicators";

interface BridgeQuote {
  provider: string;
  amountIn: string;
  amountOut: string;
  fee: string;
  feePercent: string;
  estimatedTime: string;
  crossChainSwap: boolean;
  depositAddress?: string;
  depositMemo?: string;
  status: string;
  error?: string;
}

interface BridgeData {
  quotes: BridgeQuote[];
  best: string;
}

interface BridgeDiscoveryCardProps {
  type?: string;
  toolName?: string;
  args?: Record<string, any>;
  result: any;
  toolCallId?: string;
  status?: string;
}

function BridgeDiscoveryCardComponent({
  args,
  result,
  toolCallId,
  status,
}: BridgeDiscoveryCardProps) {
  const { data, isLoading, hasError, errorMessage } = useResultData<BridgeData>(result, status);

  const fromChain = args?.fromChain ?? "?";
  const toChain = args?.toChain ?? "?";
  const tokenIn = args?.tokenIn ?? "";
  const availableQuotes = data?.quotes?.filter((q) => q.status === "ok") ?? [];

  return (
    <ProtocolCard
      data-testid="card-bridge-discovery"
      mode="chat"
      title="Bridge Quotes"
      subtitle={`${fromChain} \u2192 ${toChain}${tokenIn ? ` (${tokenIn})` : ""}`}
      icon={Globe}
      iconColor="text-primary"
      iconBg="bg-primary/10"
      isLoading={isLoading}
      error={hasError ? errorMessage : undefined}
    >
      {data?.quotes && data.quotes.length > 0 ? (
        <>
          {/* Summary metrics */}
          <div className="mb-3 grid grid-cols-3 gap-1.5">
            <MetricBox label="Routes" value={String(data.quotes.length)} />
            <MetricBox label="Best" value={data.best || "\u2014"} />
            <MetricBox
              label="Best Fee"
              value={
                availableQuotes.length > 0
                  ? `${Math.min(...availableQuotes.map((q) => Number.parseFloat(q.feePercent) || 0)).toFixed(1)}%`
                  : "\u2014"
              }
            />
          </div>

          {/* Route direction */}
          <div className="mb-2 flex items-center gap-2 px-0.5">
            <span className="font-medium text-[10px] text-muted-foreground uppercase tracking-wider">
              {fromChain}
            </span>
            <ArrowRight className="h-3 w-3 text-muted-foreground/40" />
            <span className="font-medium text-[10px] text-muted-foreground uppercase tracking-wider">
              {toChain}
            </span>
          </div>

          <ScrollableList id={`bridge-quotes-${toolCallId}`} maxHeight={300}>
            {data.quotes.map((quote, idx) => {
              const isBest = quote.provider === data.best;
              const isAvailable = quote.status === "ok";

              return (
                <div
                  key={`${quote.provider}-${idx}`}
                  className={`space-y-2 rounded-lg border p-3 transition-colors ${
                    isBest ? "border-primary/30 bg-primary/5" : "border-border hover:bg-muted/20"
                  } ${!isAvailable ? "opacity-50" : ""}`}
                >
                  {/* Provider header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="rounded-md bg-muted px-1.5 py-px font-medium text-[10px] text-foreground">
                        {quote.provider}
                      </span>
                      {isBest && (
                        <span className="flex items-center gap-0.5 font-medium text-[10px] text-primary">
                          <Crown className="h-3 w-3" /> Best
                        </span>
                      )}
                      {quote.crossChainSwap && (
                        <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                          cross-chain
                        </span>
                      )}
                    </div>
                    <span
                      className={`font-medium text-[10px] ${isAvailable ? "text-foreground" : "text-muted-foreground"}`}
                    >
                      {isAvailable ? "Available" : quote.status}
                    </span>
                  </div>

                  {isAvailable && (
                    <>
                      {/* Send / Receive stats */}
                      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                        <Stat label="Send" value={quote.amountIn} />
                        <Stat label="Receive" value={quote.amountOut} />
                      </div>

                      {/* Fee + time */}
                      <div className="flex justify-between px-0.5 text-[10px] text-muted-foreground">
                        <span>
                          Fee: {quote.fee} ({quote.feePercent}%)
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatEstimatedTime(quote.estimatedTime)}
                        </span>
                      </div>

                      {quote.depositAddress && (
                        <div className="border-border border-t px-0.5 pt-1.5 text-[10px] text-muted-foreground">
                          Deposit: <span className="font-mono">{quote.depositAddress}</span>
                          {quote.depositMemo && (
                            <>
                              {" "}
                              | Memo: <span className="font-mono">{quote.depositMemo}</span>
                            </>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {!isAvailable && quote.error && (
                    <div className="text-destructive text-xs">{quote.error}</div>
                  )}
                </div>
              );
            })}
          </ScrollableList>
        </>
      ) : (
        <EmptyState
          icon={Globe}
          text="No direct bridge routes found \u2014 try a different token pair"
        />
      )}
    </ProtocolCard>
  );
}

export const BridgeDiscoveryCard = memo(BridgeDiscoveryCardComponent);
