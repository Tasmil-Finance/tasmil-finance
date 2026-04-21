"use client";

import { Wallet, Layers } from "lucide-react";
import type { CardMode } from "../../schemas/common.schema";
import type { AquaPositionsCardProps, AquaPositionItem } from "../../schemas/aquarius.schema";
import { ProtocolCard, EmptyState } from "../base/protocol-card";
import { APYDisplay, CardHeader } from "../base/indicators";
import { fmt, pct } from "../../lib/formatting";

interface AquaPositionsCardComponentProps {
  data: AquaPositionsCardProps;
  mode?: CardMode;
}

function resolvePositionLabel(pos: AquaPositionItem): string {
  if (pos.tokens?.length) return pos.tokens.join(" / ");
  const ts = Array.isArray(pos.tokensStr) ? pos.tokensStr : pos.tokensStr?.split("-") ?? [];
  return ts.length ? ts.join(" / ") : pos.poolAddress.slice(0, 10);
}

export function AquaPositionsCard({ data, mode = "playground" }: AquaPositionsCardComponentProps) {
  const isChat = mode === "chat";
  const positions = data.positions ?? [];

  if (!data.hasPosition || positions.length === 0) {
    return (
      <ProtocolCard
        mode={mode}
        title="LP Positions"
        icon={Wallet}
        iconColor="text-cyan-500"
        iconBg="bg-cyan-500/10"
      >
        <EmptyState icon={Layers} text="No LP positions found" />
      </ProtocolCard>
    );
  }

  if (isChat) {
    return (
      <ProtocolCard mode="chat" title="Aquarius LP Positions" icon={Wallet} iconColor="text-cyan-500" iconBg="bg-cyan-500/10">
        <div className="space-y-2">
          {data.totalValueUsd != null && (
            <div className="flex justify-between text-sm font-medium">
              <span className="text-muted-foreground">Total Value</span>
              <span>${fmt(data.totalValueUsd)}</span>
            </div>
          )}
          <div className="border-t pt-2 space-y-2">
            {positions.map((pos, i) => (
              <div key={pos.poolAddress || i} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{resolvePositionLabel(pos)}</span>
                  {pos.valueUsd != null && <span>${fmt(pos.valueUsd)}</span>}
                </div>
                <div className="flex gap-3 text-xs text-muted-foreground">
                  {pos.shares != null && <span>Shares: {fmt(pos.shares)}</span>}
                  {pos.feeApy != null && <span>Fee: <APYDisplay value={pos.feeApy} /></span>}
                  {pos.rewardApy != null && <span>Reward: <APYDisplay value={pos.rewardApy} /></span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </ProtocolCard>
    );
  }

  // Playground mode
  return (
    <ProtocolCard mode="playground">
      <CardHeader
        icon={<Wallet className="h-3.5 w-3.5" />}
        title="Aquarius LP Positions"
        right={
          data.totalValueUsd != null ? (
            <span className="text-xs font-medium text-foreground">${fmt(data.totalValueUsd)}</span>
          ) : undefined
        }
      />
      <div className="divide-y divide-border">
        {positions.map((pos, i) => (
          <div key={pos.poolAddress || i} className="px-4 py-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">
                {resolvePositionLabel(pos)}
              </span>
              {pos.poolType && (
                <span className="rounded-md px-1.5 py-px text-[10px] font-medium text-muted-foreground bg-muted capitalize">
                  {pos.poolType.replace(/_/g, " ")}
                </span>
              )}
            </div>
            <div className="grid grid-cols-4 gap-2 text-[11px]">
              <div>
                <p className="text-muted-foreground/60">Shares</p>
                <p className="text-foreground tabular-nums">{fmt(pos.shares)}</p>
              </div>
              <div>
                <p className="text-muted-foreground/60">Value</p>
                <p className="text-foreground tabular-nums">
                  {pos.valueUsd != null ? `$${fmt(pos.valueUsd)}` : "\u2014"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground/60">Fee APY</p>
                <p className="text-foreground tabular-nums">{pct(pos.feeApy)}</p>
              </div>
              <div>
                <p className="text-muted-foreground/60">Reward APY</p>
                <p className="text-emerald-400 tabular-nums">{pct(pos.rewardApy)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </ProtocolCard>
  );
}
