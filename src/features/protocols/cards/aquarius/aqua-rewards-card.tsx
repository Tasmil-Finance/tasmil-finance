"use client";

import { Gift } from "lucide-react";
import type { CardMode } from "../../schemas/common.schema";
import type { AquaRewardsCardProps } from "../../schemas/aquarius.schema";
import { ProtocolCard, EmptyState } from "../base/protocol-card";
import { CardHeader } from "../base/indicators";
import { fmt } from "../../lib/formatting";

interface AquaRewardsCardComponentProps {
  data: AquaRewardsCardProps;
  mode?: CardMode;
}

export function AquaRewardsCard({ data, mode = "playground" }: AquaRewardsCardComponentProps) {
  const isChat = mode === "chat";
  const rewards = data.rewards ?? [];

  if (!rewards.length) {
    return (
      <ProtocolCard
        mode={mode}
        title="AQUA Rewards"
        icon={Gift}
        iconColor="text-emerald-500"
        iconBg="bg-emerald-500/10"
      >
        <EmptyState icon={Gift} text="No reward data available" />
      </ProtocolCard>
    );
  }

  if (isChat) {
    return (
      <ProtocolCard mode="chat" title="AQUA Daily Rewards" icon={Gift} iconColor="text-emerald-500" iconBg="bg-emerald-500/10">
        <div className="space-y-1.5">
          {data.totalDailyReward != null && (
            <div className="flex justify-between text-sm font-medium mb-2">
              <span className="text-muted-foreground">Total Daily</span>
              <span className="text-emerald-400">{fmt(data.totalDailyReward)} AQUA</span>
            </div>
          )}
          {rewards.slice(0, 5).map((r) => (
            <div key={r.pair} className="flex justify-between text-xs">
              <span className="text-muted-foreground">{r.pair}</span>
              <span className="text-foreground tabular-nums">{fmt(r.dailyTotalReward)} AQUA/day</span>
            </div>
          ))}
          {rewards.length > 5 && (
            <p className="text-[10px] text-muted-foreground/60">+{rewards.length - 5} more pairs</p>
          )}
        </div>
      </ProtocolCard>
    );
  }

  // Playground mode
  return (
    <ProtocolCard mode="playground">
      <CardHeader
        icon={<Gift className="h-3.5 w-3.5" />}
        title="AQUA Daily Rewards"
        right={
          data.totalDailyReward != null ? (
            <span className="text-xs font-medium text-emerald-400">{fmt(data.totalDailyReward)} AQUA/day</span>
          ) : undefined
        }
      />
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-muted-foreground/60 border-b border-border">
              <th className="text-left py-1.5 px-4 font-medium">Pair</th>
              <th className="text-right py-1.5 px-2 font-medium">AMM</th>
              <th className="text-right py-1.5 px-2 font-medium">SDEX</th>
              <th className="text-right py-1.5 px-4 font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {rewards.slice(0, 20).map((r) => (
              <tr key={r.pair} className="border-b border-border/50 hover:bg-muted/20">
                <td className="py-1.5 px-4 text-foreground font-medium">{r.pair}</td>
                <td className="py-1.5 px-2 text-right tabular-nums text-muted-foreground">{fmt(r.dailyAmmReward)}</td>
                <td className="py-1.5 px-2 text-right tabular-nums text-muted-foreground">{fmt(r.dailySdexReward)}</td>
                <td className="py-1.5 px-4 text-right tabular-nums text-emerald-400 font-medium">{fmt(r.dailyTotalReward)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ProtocolCard>
  );
}
