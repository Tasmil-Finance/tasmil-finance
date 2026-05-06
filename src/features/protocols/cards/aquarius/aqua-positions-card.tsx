"use client";

import { Layers, Wallet } from "lucide-react";
import { fmt, pct } from "../../lib/formatting";
import type { AquaPositionItem, AquaPositionsCardProps } from "../../schemas/aquarius.schema";
import type { CardMode } from "../../schemas/common.schema";
import { APYDisplay, CardHeader } from "../base/indicators";
import { EmptyState, ProtocolCard } from "../base/protocol-card";

interface AquaPositionsCardComponentProps {
  data: AquaPositionsCardProps;
  mode?: CardMode;
}

function resolvePositionLabel(pos: AquaPositionItem): string {
  if (pos.tokens?.length) return pos.tokens.join(" / ");
  const ts = Array.isArray(pos.tokensStr) ? pos.tokensStr : (pos.tokensStr?.split("-") ?? []);
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
      <ProtocolCard
        mode="chat"
        title="Aquarius LP Positions"
        icon={Wallet}
        iconColor="text-cyan-500"
        iconBg="bg-cyan-500/10"
      >
        <div className="space-y-2">
          {data.totalValueUsd != null && (
            <div className="flex justify-between font-medium text-sm">
              <span className="text-muted-foreground">Total Value</span>
              <span>${fmt(data.totalValueUsd)}</span>
            </div>
          )}
          <div className="space-y-2 border-t pt-2">
            {positions.map((pos, i) => (
              <div key={pos.poolAddress || i} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{resolvePositionLabel(pos)}</span>
                  {pos.valueUsd != null && <span>${fmt(pos.valueUsd)}</span>}
                </div>
                <div className="flex gap-3 text-muted-foreground text-xs">
                  {pos.shares != null && <span>Shares: {fmt(pos.shares)}</span>}
                  {pos.feeApy != null && (
                    <span>
                      Fee: <APYDisplay value={pos.feeApy} />
                    </span>
                  )}
                  {pos.rewardApy != null && (
                    <span>
                      Reward: <APYDisplay value={pos.rewardApy} />
                    </span>
                  )}
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
            <span className="font-medium text-foreground text-xs">${fmt(data.totalValueUsd)}</span>
          ) : undefined
        }
      />
      <div className="divide-y divide-border">
        {positions.map((pos, i) => (
          <div key={pos.poolAddress || i} className="space-y-1.5 px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="font-medium text-foreground text-sm">
                {resolvePositionLabel(pos)}
              </span>
              {pos.poolType && (
                <span className="rounded-md bg-muted px-1.5 py-px font-medium text-[10px] text-muted-foreground capitalize">
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
