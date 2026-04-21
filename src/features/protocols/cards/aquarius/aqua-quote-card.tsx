"use client";

import { ArrowRightLeft, ArrowRight } from "lucide-react";
import type { CardMode } from "../../schemas/common.schema";
import type { AquaQuoteCardProps } from "../../schemas/aquarius.schema";
import { ProtocolCard } from "../base/protocol-card";
import { MetricBox, Row, DetailRow } from "../base/indicators";
import { fmt } from "../../lib/formatting";

interface AquaQuoteCardComponentProps {
  quote: AquaQuoteCardProps;
  mode?: CardMode;
}

export function AquaQuoteCard({ quote, mode = "playground" }: AquaQuoteCardComponentProps) {
  const isChat = mode === "chat";
  const route = quote.route ?? [];
  const noRoute = quote.status === "no_route";

  if (isChat) {
    return (
      <ProtocolCard mode="chat" title="Aquarius Swap Quote" icon={ArrowRightLeft} iconColor="text-cyan-500" iconBg="bg-cyan-500/10">
        {noRoute ? (
          <p className="text-sm text-muted-foreground">No swap route found for this pair.</p>
        ) : (
          <div className="space-y-1.5">
            <DetailRow label="Amount In" value={fmt(quote.amountIn)} />
            <DetailRow label="Amount Out" value={fmt(quote.amountOut)} />
            {quote.feePercent && <DetailRow label="Fee" value={quote.feePercent} />}
            {quote.estimatedTime && <DetailRow label="Est. Time" value={quote.estimatedTime} />}
            {route.length > 0 && (
              <div className="flex items-center gap-1.5 pt-1 text-xs text-muted-foreground">
                <span>Route:</span>
                {route.map((hop, i) => (
                  <span key={hop} className="flex items-center gap-1">
                    <span className="font-medium text-foreground">{hop}</span>
                    {i < route.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground/40" />}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </ProtocolCard>
    );
  }

  // Playground mode
  if (noRoute) {
    return (
      <ProtocolCard mode="playground">
        <div className="px-4 py-3 border-b border-border">
          <p className="text-sm font-medium text-foreground">Swap Quote</p>
        </div>
        <div className="flex flex-col items-center gap-1.5 py-8 text-muted-foreground">
          <ArrowRightLeft className="h-5 w-5 opacity-30" />
          <p className="text-xs">No swap route available</p>
        </div>
      </ProtocolCard>
    );
  }

  return (
    <ProtocolCard mode="playground">
      <div className="px-4 py-3 border-b border-border">
        <p className="text-sm font-medium text-foreground">Swap Quote</p>
      </div>
      <div className="p-4 space-y-3">
        {/* Route visualization */}
        {route.length > 0 && (
          <div className="flex items-center justify-center gap-2 py-2">
            {route.map((hop, i) => (
              <span key={hop} className="flex items-center gap-2">
                <span className="rounded-lg bg-secondary px-3 py-1.5 text-sm font-medium text-foreground">
                  {hop}
                </span>
                {i < route.length - 1 && (
                  <ArrowRight className="h-4 w-4 text-muted-foreground/40" />
                )}
              </span>
            ))}
          </div>
        )}
        <div className="grid grid-cols-2 gap-2">
          <MetricBox label="Amount In" value={fmt(quote.amountIn)} />
          <MetricBox label="Amount Out" value={fmt(quote.amountOut)} />
        </div>
        <div className="grid grid-cols-2 gap-y-1.5 text-xs">
          {quote.feePercent && <Row label="Fee" value={quote.feePercent} />}
          {quote.estimatedTime && <Row label="Est. Time" value={quote.estimatedTime} />}
        </div>
      </div>
    </ProtocolCard>
  );
}
