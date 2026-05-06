"use client";

import { Calendar, Lock, Snowflake } from "lucide-react";
import type { AquaLockInfo } from "../../schemas/aquarius.schema";
import type { CardMode } from "../../schemas/common.schema";
import { DetailRow, MetricBox, Row } from "../base/indicators";
import { ProtocolCard } from "../base/protocol-card";

interface AquaLockInfoCardProps {
  data: AquaLockInfo;
  mode?: CardMode;
}

export function AquaLockInfoCard({ data, mode = "playground" }: AquaLockInfoCardProps) {
  const isChat = mode === "chat";

  if (isChat) {
    return (
      <ProtocolCard
        mode="chat"
        title="Lock AQUA for ICE"
        icon={Lock}
        iconColor="text-blue-500"
        iconBg="bg-blue-500/10"
      >
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
      <div className="flex items-center gap-3 border-border border-b px-4 py-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500/10">
          <Snowflake className="h-4 w-4 text-blue-500" />
        </div>
        <div>
          <p className="font-medium text-foreground text-sm">Lock AQUA for ICE</p>
          <p className="text-[10px] text-muted-foreground">Governance Power</p>
        </div>
      </div>
      <div className="space-y-3 p-4">
        <div className="grid grid-cols-2 gap-2">
          <MetricBox label="ICE Multiplier" value={`${data.iceMultiplier.toFixed(2)}x`} />
          <MetricBox label="Est. ICE Received" value={data.estimatedIce} />
        </div>
        <div className="grid grid-cols-2 gap-y-1.5 text-xs">
          <Row label="AQUA Amount" value={data.amount} />
          <Row label="Lock Period" value={`${data.lockPeriodDays} days`} />
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-blue-500/15 bg-blue-500/5 px-3 py-2">
          <Calendar className="h-3.5 w-3.5 text-blue-400" />
          <span className="text-blue-400 text-xs">Unlocks: {data.unlockDate}</span>
        </div>
        {data.instruction && (
          <p className="text-[10px] text-muted-foreground leading-relaxed">{data.instruction}</p>
        )}
      </div>
    </ProtocolCard>
  );
}
