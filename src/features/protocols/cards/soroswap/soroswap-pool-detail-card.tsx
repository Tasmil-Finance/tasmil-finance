"use client";

import { ArrowRightLeft } from "lucide-react";
import { TokenImage } from "@/shared/components/token-image";
import type { CardMode } from "../../schemas/common.schema";
import type { SoroswapPoolCardProps } from "../../schemas/soroswap.schema";
import { ProtocolCard } from "../base/protocol-card";
import { MetricBox, Row, DetailRow } from "../base/indicators";
import { fmt } from "../../lib/formatting";

interface Props {
  pool: SoroswapPoolCardProps;
  mode?: CardMode;
}

export function SoroswapPoolDetailCard({ pool, mode = "playground" }: Props) {
  const label = `${pool.tokenA} / ${pool.tokenB}`;

  if (mode === "chat") {
    return (
      <ProtocolCard mode="chat" title={label} icon={ArrowRightLeft} iconColor="text-violet-500" iconBg="bg-violet-500/10">
        <div className="space-y-1.5">
          {pool.tvl != null && <DetailRow label="TVL" value={`$${fmt(pool.tvl)}`} />}
          {pool.volume24h != null && <DetailRow label="Volume 24H" value={`$${fmt(pool.volume24h)}`} />}
          {pool.fee && <DetailRow label="Fee" value={pool.fee} />}
          {pool.protocol && <DetailRow label="Protocol" value={<span className="capitalize">{pool.protocol}</span>} />}
          {pool.reserveA != null && <DetailRow label={`Reserve ${pool.tokenA}`} value={fmt(Number(pool.reserveA) / 1e7)} />}
          {pool.reserveB != null && <DetailRow label={`Reserve ${pool.tokenB}`} value={fmt(Number(pool.reserveB) / 1e7)} />}
        </div>
      </ProtocolCard>
    );
  }

  return (
    <ProtocolCard mode="playground">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <div className="flex -space-x-1.5">
          <TokenImage src={null} alt={pool.tokenA} className="h-6 w-6 rounded-full ring-2 ring-card" />
          <TokenImage src={null} alt={pool.tokenB} className="h-6 w-6 rounded-full ring-2 ring-card" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-[10px] text-muted-foreground capitalize">{pool.protocol ?? "Soroswap"}</p>
        </div>
      </div>
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <MetricBox label="TVL" value={pool.tvl != null ? `$${fmt(pool.tvl)}` : "—"} />
          <MetricBox label="Volume 24H" value={pool.volume24h != null ? `$${fmt(pool.volume24h)}` : "—"} />
          <MetricBox label="Fee" value={pool.fee ?? "—"} />
        </div>
        <div className="grid grid-cols-2 gap-y-1.5 text-xs">
          <Row label={`Reserve ${pool.tokenA}`} value={pool.reserveA != null ? fmt(Number(pool.reserveA) / 1e7) : "—"} />
          <Row label={`Reserve ${pool.tokenB}`} value={pool.reserveB != null ? fmt(Number(pool.reserveB) / 1e7) : "—"} />
        </div>
      </div>
    </ProtocolCard>
  );
}
