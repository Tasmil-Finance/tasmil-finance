"use client";

import { Crown, Globe } from "lucide-react";
import { memo } from "react";
import { BaseInfoCard } from "../base/info-card";
import { useResultData } from "../../hooks/use-result-data";
import { ScrollableList, StatusBadge, ProtocolBadge, DetailRow } from "../base/indicators";
import { formatEstimatedTime } from "../../lib/formatting";

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

  const fromChain = args?.["fromChain"] ?? "?";
  const toChain = args?.["toChain"] ?? "?";
  const tokenIn = args?.["tokenIn"] ?? "";

  return (
    <BaseInfoCard
      title="Bridge Quotes"
      subtitle={`${fromChain} → ${toChain}${tokenIn ? ` (${tokenIn})` : ""}`}
      icon={Globe}
      iconColor="text-purple-500"
      iconBg="bg-purple-500/10"
      isLoading={isLoading}
      error={hasError ? errorMessage : null}
    >
      {data?.quotes && data.quotes.length > 0 ? (
        <ScrollableList id={`bridge-quotes-${toolCallId}`} maxHeight={300}>
          {data.quotes.map((quote, idx) => {
            const isBest = quote.provider === data.best;
            const isAvailable = quote.status === "ok";

            return (
              <div
                key={`${quote.provider}-${idx}`}
                className={`rounded-lg border p-3 space-y-2 ${
                  isBest ? "border-green-500/40 bg-green-500/5" : "border-border"
                } ${!isAvailable ? "opacity-50" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ProtocolBadge name={quote.provider} />
                    {isBest && (
                      <span className="flex items-center gap-1 text-xs text-green-500 font-medium">
                        <Crown className="h-3 w-3" /> Best
                      </span>
                    )}
                    {quote.crossChainSwap && (
                      <span className="text-xs bg-blue-500/10 text-blue-500 rounded-full px-1.5 py-0.5">
                        cross-chain
                      </span>
                    )}
                  </div>
                  <StatusBadge status={quote.status} />
                </div>

                {isAvailable && (
                  <>
                    <div className="space-y-1">
                      <DetailRow label="Send" value={quote.amountIn} />
                      <DetailRow
                        label="Receive"
                        value={<span className="font-semibold">{quote.amountOut}</span>}
                      />
                      <DetailRow label="Fee" value={`${quote.fee} (${quote.feePercent}%)`} />
                      <DetailRow
                        label="Est. Time"
                        value={formatEstimatedTime(quote.estimatedTime)}
                      />
                    </div>

                    {quote.depositAddress && (
                      <div className="text-xs text-muted-foreground border-t pt-2 mt-2">
                        Deposit to: <span className="font-mono">{quote.depositAddress}</span>
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
                  <div className="text-xs text-red-500">{quote.error}</div>
                )}
              </div>
            );
          })}
        </ScrollableList>
      ) : (
        <div className="text-sm text-muted-foreground">No bridge routes available.</div>
      )}
    </BaseInfoCard>
  );
}

export const BridgeDiscoveryCard = memo(BridgeDiscoveryCardComponent);
