"use client";

import { Droplets } from "lucide-react";
import { TokenImage } from "@/shared/components/token-image";
import { fmt, pct } from "../../lib/formatting";
import type { AquaPoolCardProps } from "../../schemas/aquarius.schema";
import type { CardMode } from "../../schemas/common.schema";
import { APYDisplay, MetricBox, Row } from "../base/indicators";
import { ProtocolCard } from "../base/protocol-card";

interface AquaPoolDetailCardProps {
  pool: AquaPoolCardProps;
  mode?: CardMode;
}

function resolvePoolLabel(pool: AquaPoolCardProps): string {
  if (pool.tokens?.length) {
    return pool.tokens.map((t) => t.symbol ?? t.address.slice(0, 6)).join(" / ");
  }
  const ts = Array.isArray(pool.tokensStr) ? pool.tokensStr : (pool.tokensStr?.split("-") ?? []);
  return ts.length ? ts.join(" / ") : pool.address.slice(0, 10);
}

export function AquaPoolDetailCard({ pool, mode = "playground" }: AquaPoolDetailCardProps) {
  const label = resolvePoolLabel(pool);
  const isChat = mode === "chat";

  if (isChat) {
    return (
      <ProtocolCard
        mode="chat"
        title={label}
        icon={Droplets}
        iconColor="text-cyan-500"
        iconBg="bg-cyan-500/10"
      >
        <div className="space-y-1.5">
          {pool.totalApy != null && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total APY</span>
              <APYDisplay value={pool.totalApy} />
            </div>
          )}
          {pool.feeApy != null && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Fee APY</span>
              <APYDisplay value={pool.feeApy} />
            </div>
          )}
          {pool.rewardApy != null && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">AQUA Reward APY</span>
              <APYDisplay value={pool.rewardApy} />
            </div>
          )}
          {pool.tvl != null && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">TVL</span>
              <span>${fmt(pool.tvl)}</span>
            </div>
          )}
          {pool.volume24h != null && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">24h Volume</span>
              <span>${fmt(pool.volume24h)}</span>
            </div>
          )}
          {pool.poolType && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Pool Type</span>
              <span className="capitalize">{pool.poolType.replace(/_/g, " ")}</span>
            </div>
          )}
          {pool.fee && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Fee</span>
              <span>{pool.fee}</span>
            </div>
          )}
        </div>
      </ProtocolCard>
    );
  }

  // Playground mode
  return (
    <ProtocolCard mode="playground">
      <div className="flex items-center gap-3 border-border border-b px-4 py-3">
        <div className="-space-x-1.5 flex">
          {(pool.tokens ?? []).map((t, i) => (
            <TokenImage
              key={t.address || i}
              src={null}
              alt={t.symbol ?? "?"}
              className="h-6 w-6 rounded-full ring-2 ring-card"
            />
          ))}
        </div>
        <div>
          <p className="font-medium text-foreground text-sm">{label}</p>
          <p className="text-[10px] text-muted-foreground capitalize">
            {pool.poolType?.replace(/_/g, " ") ?? "AMM"} Pool
          </p>
        </div>
      </div>
      <div className="space-y-3 p-4">
        <div className="grid grid-cols-3 gap-2">
          <MetricBox label="Fee APY" value={pct(pool.feeApy)} />
          <MetricBox label="Reward APY" value={pct(pool.rewardApy)} />
          <MetricBox label="Total APY" value={pct(pool.totalApy)} />
        </div>
        <div className="grid grid-cols-2 gap-y-1.5 text-xs">
          <Row label="TVL" value={`$${fmt(pool.tvl)}`} />
          <Row label="24h Volume" value={`$${fmt(pool.volume24h)}`} />
          {pool.fee && <Row label="Swap Fee" value={pool.fee} />}
        </div>
      </div>
    </ProtocolCard>
  );
}
