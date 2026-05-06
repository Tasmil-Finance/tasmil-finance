"use client";

import { Layers, Wallet } from "lucide-react";
import { fmt } from "../../lib/formatting";
import type { CardMode } from "../../schemas/common.schema";
import type { SoroswapPositionsCardProps } from "../../schemas/soroswap.schema";
import { CardHeader } from "../base/indicators";
import { EmptyState, ProtocolCard } from "../base/protocol-card";

interface Props {
  data: SoroswapPositionsCardProps;
  mode?: CardMode;
}

export function SoroswapPositionsCard({ data, mode = "playground" }: Props) {
  const positions = data.positions ?? [];

  if (!data.hasPosition || !positions.length) {
    return (
      <ProtocolCard
        mode={mode}
        title="LP Positions"
        icon={Wallet}
        iconColor="text-violet-500"
        iconBg="bg-violet-500/10"
      >
        <EmptyState icon={Layers} text="No LP positions found" />
      </ProtocolCard>
    );
  }

  if (mode === "chat") {
    return (
      <ProtocolCard
        mode="chat"
        title="Soroswap LP Positions"
        icon={Wallet}
        iconColor="text-violet-500"
        iconBg="bg-violet-500/10"
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
                  <span className="font-medium">
                    {pos.tokenA} / {pos.tokenB}
                  </span>
                  {pos.valueUsd != null && <span>${fmt(pos.valueUsd)}</span>}
                </div>
                <div className="flex gap-3 text-muted-foreground text-xs">
                  {pos.amountA != null && (
                    <span>
                      {pos.tokenA}: {fmt(Number(pos.amountA) / 1e7)}
                    </span>
                  )}
                  {pos.amountB != null && (
                    <span>
                      {pos.tokenB}: {fmt(Number(pos.amountB) / 1e7)}
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

  return (
    <ProtocolCard mode="playground">
      <CardHeader
        icon={<Wallet className="h-3.5 w-3.5" />}
        title="Soroswap LP Positions"
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
                {pos.tokenA} / {pos.tokenB}
              </span>
              <span className="rounded-md bg-muted px-1.5 py-px font-medium text-[10px] text-muted-foreground capitalize">
                {pos.protocol ?? "soroswap"}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2 text-[11px]">
              <div>
                <p className="text-muted-foreground/60">{pos.tokenA}</p>
                <p className="text-foreground tabular-nums">
                  {pos.amountA != null ? fmt(Number(pos.amountA) / 1e7) : "—"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground/60">{pos.tokenB}</p>
                <p className="text-foreground tabular-nums">
                  {pos.amountB != null ? fmt(Number(pos.amountB) / 1e7) : "—"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground/60">LP Tokens</p>
                <p className="text-foreground tabular-nums">
                  {pos.liquidityTokens != null ? fmt(Number(pos.liquidityTokens) / 1e7) : "—"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground/60">Value</p>
                <p className="text-foreground tabular-nums">
                  {pos.valueUsd != null ? `$${fmt(pos.valueUsd)}` : "—"}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </ProtocolCard>
  );
}
