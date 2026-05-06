"use client";

import { Gift } from "lucide-react";
import { fmt } from "../../lib/formatting";
import type { AquaRewardsCardProps } from "../../schemas/aquarius.schema";
import type { CardMode } from "../../schemas/common.schema";
import { CardHeader } from "../base/indicators";
import { EmptyState, ProtocolCard } from "../base/protocol-card";

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
      <ProtocolCard
        mode="chat"
        title="AQUA Daily Rewards"
        icon={Gift}
        iconColor="text-emerald-500"
        iconBg="bg-emerald-500/10"
      >
        <div className="space-y-1.5">
          {data.totalDailyReward != null && (
            <div className="mb-2 flex justify-between font-medium text-sm">
              <span className="text-muted-foreground">Total Daily</span>
              <span className="text-emerald-400">{fmt(data.totalDailyReward)} AQUA</span>
            </div>
          )}
          {rewards.slice(0, 5).map((r) => (
            <div key={r.pair} className="flex justify-between text-xs">
              <span className="text-muted-foreground">{r.pair}</span>
              <span className="text-foreground tabular-nums">
                {fmt(r.dailyTotalReward)} AQUA/day
              </span>
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
            <span className="font-medium text-emerald-400 text-xs">
              {fmt(data.totalDailyReward)} AQUA/day
            </span>
          ) : undefined
        }
      />
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-border border-b text-muted-foreground/60">
              <th className="px-4 py-1.5 text-left font-medium">Pair</th>
              <th className="px-2 py-1.5 text-right font-medium">AMM</th>
              <th className="px-2 py-1.5 text-right font-medium">SDEX</th>
              <th className="px-4 py-1.5 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {rewards.slice(0, 20).map((r) => (
              <tr key={r.pair} className="border-border/50 border-b hover:bg-muted/20">
                <td className="px-4 py-1.5 font-medium text-foreground">{r.pair}</td>
                <td className="px-2 py-1.5 text-right text-muted-foreground tabular-nums">
                  {fmt(r.dailyAmmReward)}
                </td>
                <td className="px-2 py-1.5 text-right text-muted-foreground tabular-nums">
                  {fmt(r.dailySdexReward)}
                </td>
                <td className="px-4 py-1.5 text-right font-medium text-emerald-400 tabular-nums">
                  {fmt(r.dailyTotalReward)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ProtocolCard>
  );
}
