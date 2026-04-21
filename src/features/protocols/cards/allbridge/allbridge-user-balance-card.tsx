"use client";

import { Wallet } from "lucide-react";
import type { CardMode } from "../../schemas/common.schema";
import type { AllbridgeUserBalanceProps } from "../../schemas/allbridge.schema";
import { ProtocolCard } from "../base/protocol-card";
import { DetailRow, MetricBox } from "../base/indicators";
import { trunc } from "../../lib/formatting";

interface Props {
  data: AllbridgeUserBalanceProps;
  mode?: CardMode;
}

export function AllbridgeUserBalanceCard({ data, mode = "playground" }: Props) {
  const isChat = mode === "chat";
  const hasPosition = data.lpAmount != null && data.lpAmount !== "0";

  if (isChat) {
    return (
      <ProtocolCard mode="chat" title={`${data.symbol} LP Position (${data.chain})`} icon={Wallet} iconColor="text-blue-500" iconBg="bg-blue-500/10">
        {hasPosition ? (
          <div className="space-y-1.5">
            <DetailRow label="LP Amount" value={data.lpAmount ?? "0"} />
            {data.userLiquidity && <DetailRow label="Liquidity" value={data.userLiquidity} />}
            {data.earnedRewards && <DetailRow label="Earned Rewards" value={`${data.earnedRewards} ${data.symbol}`} />}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No LP position found.</p>
        )}
      </ProtocolCard>
    );
  }

  return (
    <ProtocolCard mode="playground">
      <div className="px-4 py-3 border-b border-border">
        <p className="text-sm font-medium text-foreground">{data.symbol} LP Position — <span className="capitalize">{data.chain}</span></p>
        <p className="text-[10px] text-muted-foreground/60 font-mono mt-0.5">{trunc(data.accountAddress, 10, 6)}</p>
      </div>
      <div className="p-4 space-y-3">
        {hasPosition ? (
          <>
            <div className="grid grid-cols-2 gap-2">
              <MetricBox label="LP Tokens" value={data.lpAmount ?? "0"} />
              <MetricBox label="Liquidity" value={data.userLiquidity ?? "0"} />
            </div>
            <div className="rounded-lg bg-secondary/40 p-3 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Earned Rewards</span>
                <span className={`font-semibold tabular-nums ${data.hasRewards ? "text-emerald-400" : "text-foreground"}`}>
                  {data.earnedRewards ?? "0"} {data.symbol}
                </span>
              </div>
              {data.hasRewards && (
                <p className="text-[10px] text-emerald-400/70">{data.note}</p>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-1.5 py-6 text-muted-foreground">
            <Wallet className="h-5 w-5 opacity-30" />
            <p className="text-xs">No LP position found</p>
          </div>
        )}
      </div>
    </ProtocolCard>
  );
}
