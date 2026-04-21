"use client";

import { Database } from "lucide-react";
import type { CardMode } from "../../schemas/common.schema";
import type { AllbridgePoolInfoProps } from "../../schemas/allbridge.schema";
import { ProtocolCard } from "../base/protocol-card";
import { DetailRow, MetricBox, Row } from "../base/indicators";
import { fmt, trunc } from "../../lib/formatting";

interface Props {
  data: AllbridgePoolInfoProps;
  mode?: CardMode;
}

export function AllbridgePoolInfoCard({ data, mode = "playground" }: Props) {
  const isChat = mode === "chat";
  const pool = data.poolInfo;

  if (isChat) {
    return (
      <ProtocolCard mode="chat" title={`${data.symbol} Pool (${data.chain})`} icon={Database} iconColor="text-blue-500" iconBg="bg-blue-500/10">
        <div className="space-y-1.5">
          {pool?.tokenBalance && <DetailRow label="Token Balance" value={fmt(pool.tokenBalance)} />}
          {pool?.vUsdBalance && <DetailRow label="vUSD Balance" value={fmt(pool.vUsdBalance)} />}
          {pool?.totalLpAmount && <DetailRow label="Total LP" value={fmt(pool.totalLpAmount)} />}
          {data.apr7d != null && <DetailRow label="APR (7d)" value={String(data.apr7d)} />}
          {data.apr30d != null && <DetailRow label="APR (30d)" value={String(data.apr30d)} />}
        </div>
      </ProtocolCard>
    );
  }

  return (
    <ProtocolCard mode="playground">
      <div className="px-4 py-3 border-b border-border">
        <p className="text-sm font-medium text-foreground">{data.symbol} Pool — <span className="capitalize">{data.chain}</span></p>
        {data.poolAddress && <p className="text-[10px] text-muted-foreground/60 font-mono mt-0.5">{trunc(data.poolAddress, 10, 6)}</p>}
      </div>
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <MetricBox label="APR (7d)" value={data.apr7d != null ? String(data.apr7d) : "N/A"} />
          <MetricBox label="APR (30d)" value={data.apr30d != null ? String(data.apr30d) : "N/A"} />
        </div>
        {pool && (
          <div className="space-y-1 text-xs">
            {pool.tokenBalance && <Row label="Token Balance" value={fmt(pool.tokenBalance)} />}
            {pool.vUsdBalance && <Row label="vUSD Balance" value={fmt(pool.vUsdBalance)} />}
            {pool.totalLpAmount && <Row label="Total LP" value={fmt(pool.totalLpAmount)} />}
            {pool.aValue && <Row label="A Value" value={pool.aValue} />}
            {pool.dValue && <Row label="D Value" value={pool.dValue} />}
            {pool.imbalance != null && <Row label="Imbalance" value={String(pool.imbalance)} />}
          </div>
        )}
        {data.feeShare != null && (
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Fee Share</span>
            <span className="text-foreground tabular-nums">{String(data.feeShare)}</span>
          </div>
        )}
      </div>
    </ProtocolCard>
  );
}
