"use client";

import { Layers } from "lucide-react";
import type { AllbridgePoolCardProps } from "../../schemas/allbridge.schema";
import type { CardMode } from "../../schemas/common.schema";
import { DetailRow, MetricBox } from "../base/indicators";
import { ProtocolCard } from "../base/protocol-card";

interface Props {
  pools: AllbridgePoolCardProps[];
  mode?: CardMode;
}

function fmtApr(v: string | number | null | undefined): string {
  if (v == null) return "N/A";
  const s = String(v);
  return s.includes("%") ? s : `${Number.parseFloat(s).toFixed(2)}%`;
}

export function AllbridgePoolsCard({ pools, mode = "playground" }: Props) {
  const isChat = mode === "chat";

  if (!pools.length) {
    return (
      <ProtocolCard
        mode={mode}
        title="Allbridge Pools"
        icon={Layers}
        iconColor="text-blue-500"
        iconBg="bg-blue-500/10"
      >
        <p className="text-muted-foreground text-xs">No pools found.</p>
      </ProtocolCard>
    );
  }

  if (isChat) {
    return (
      <ProtocolCard
        mode="chat"
        title="Allbridge LP Pools"
        icon={Layers}
        iconColor="text-blue-500"
        iconBg="bg-blue-500/10"
        subtitle={`${pools.length} pools`}
      >
        <div className="max-h-[300px] space-y-2 overflow-auto">
          {pools.slice(0, 10).map((p) => (
            <div
              key={`${p.chain}-${p.symbol}`}
              className="space-y-1 rounded-lg border border-border/50 p-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{p.symbol}</span>
                <span className="text-[10px] text-muted-foreground capitalize">{p.chain}</span>
              </div>
              <DetailRow label="APR (7d)" value={fmtApr(p.apr7d)} />
              <DetailRow label="APR (30d)" value={fmtApr(p.apr30d)} />
            </div>
          ))}
        </div>
      </ProtocolCard>
    );
  }

  // Playground — group by chain
  const byChain = new Map<string, AllbridgePoolCardProps[]>();
  for (const p of pools) {
    const arr = byChain.get(p.chain) ?? [];
    arr.push(p);
    byChain.set(p.chain, arr);
  }

  return (
    <ProtocolCard mode="playground">
      <div className="flex items-center justify-between border-border border-b px-4 py-3">
        <p className="font-medium text-foreground text-sm">Allbridge LP Pools</p>
        <span className="text-[10px] text-muted-foreground">{pools.length} pools</span>
      </div>
      <div className="max-h-[400px] space-y-4 overflow-auto p-4">
        {Array.from(byChain.entries()).map(([chain, chainPools]) => (
          <div key={chain}>
            <p className="mb-2 font-semibold text-[10px] text-muted-foreground/60 uppercase capitalize tracking-wider">
              {chain}
            </p>
            <div className="space-y-2">
              {chainPools.map((p) => (
                <div
                  key={`${p.chain}-${p.symbol}`}
                  className="space-y-1.5 rounded-lg border border-border/50 bg-secondary/30 p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground text-sm">{p.symbol}</span>
                    {p.poolAddress && (
                      <span className="font-mono text-[9px] text-muted-foreground/60">
                        {p.poolAddress.slice(0, 8)}...
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <MetricBox label="APR (7d)" value={fmtApr(p.apr7d)} />
                    <MetricBox label="APR (30d)" value={fmtApr(p.apr30d)} />
                  </div>
                  {p.feeShare != null && (
                    <div className="flex justify-between text-[11px]">
                      <span className="text-muted-foreground">Fee Share</span>
                      <span className="text-foreground tabular-nums">{fmtApr(p.feeShare)}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </ProtocolCard>
  );
}
