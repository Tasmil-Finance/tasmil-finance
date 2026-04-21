"use client";

import { Lock, Snowflake, Calendar } from "lucide-react";
import type { CardMode } from "../../schemas/common.schema";
import type { AquaLockInfo } from "../../schemas/aquarius.schema";
import { ProtocolCard } from "../base/protocol-card";
import { MetricBox, Row, DetailRow } from "../base/indicators";

interface AquaLockInfoCardProps {
  data: AquaLockInfo;
  mode?: CardMode;
}

export function AquaLockInfoCard({ data, mode = "playground" }: AquaLockInfoCardProps) {
  const isChat = mode === "chat";

  if (isChat) {
    return (
      <ProtocolCard mode="chat" title="Lock AQUA for ICE" icon={Lock} iconColor="text-blue-500" iconBg="bg-blue-500/10">
        <div className="space-y-1.5">
          <DetailRow label="AQUA Amount" value={data.amount} />
          <DetailRow label="Lock Period" value={`${data.lockPeriodDays} days`} />
          <DetailRow label="ICE Multiplier" value={`${data.iceMultiplier.toFixed(2)}x`} />
          <DetailRow label="Estimated ICE" value={data.estimatedIce} />
          <DetailRow label="Unlock Date" value={data.unlockDate} />
        </div>
      </ProtocolCard>
    );
  }

  // Playground mode
  return (
    <ProtocolCard mode="playground">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500/10">
          <Snowflake className="h-4 w-4 text-blue-500" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">Lock AQUA for ICE</p>
          <p className="text-[10px] text-muted-foreground">Governance Power</p>
        </div>
      </div>
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <MetricBox label="ICE Multiplier" value={`${data.iceMultiplier.toFixed(2)}x`} />
          <MetricBox label="Est. ICE Received" value={data.estimatedIce} />
        </div>
        <div className="grid grid-cols-2 gap-y-1.5 text-xs">
          <Row label="AQUA Amount" value={data.amount} />
          <Row label="Lock Period" value={`${data.lockPeriodDays} days`} />
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/5 border border-blue-500/15">
          <Calendar className="h-3.5 w-3.5 text-blue-400" />
          <span className="text-xs text-blue-400">Unlocks: {data.unlockDate}</span>
        </div>
        {data.instruction && (
          <p className="text-[10px] text-muted-foreground leading-relaxed">{data.instruction}</p>
        )}
      </div>
    </ProtocolCard>
  );
}
