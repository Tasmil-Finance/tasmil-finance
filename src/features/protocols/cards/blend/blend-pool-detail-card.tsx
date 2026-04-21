"use client";

import { Database } from "lucide-react";
import { TokenImage } from "@/shared/components/token-image";
import type { CardMode } from "../../schemas/common.schema";
import type { PoolCardProps } from "../../schemas/blend.schema";
import { ProtocolCard, EmptyState } from "../base/protocol-card";
import { Tag, Bar, Stat } from "../base/indicators";
import { pct, fmt, trunc } from "../../lib/formatting";

interface BlendPoolDetailCardProps {
  pool: PoolCardProps;
  mode?: CardMode;
}

export function BlendPoolDetailCard({ pool, mode = "playground" }: BlendPoolDetailCardProps) {
  const isChat = mode === "chat";

  return (
    <ProtocolCard mode={mode} title={isChat ? pool.name : undefined} icon={isChat ? Database : undefined}>
      {!isChat && (
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-[13px] font-medium text-foreground">{pool.name}</p>
              <p className="text-[10px] text-muted-foreground font-mono">
                {trunc(pool.address)}
              </p>
            </div>
          </div>
          <Tag type={pool.status} />
        </div>
      )}
      {isChat && (
        <div className="mb-2 space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Address</span>
            <span className="font-mono text-xs">{trunc(pool.address)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Status</span>
            <Tag type={pool.status} />
          </div>
          {pool.reserves.length > 0 && (
            <div className="mt-2 space-y-1 border-t pt-2">
              <div className="text-muted-foreground text-xs">
                Reserves ({pool.reserves.length})
              </div>
              {pool.reserves.map((r, i) => (
                <div key={r.assetAddress || i} className="grid grid-cols-3 gap-1 text-xs">
                  <span className="font-medium">{r.symbol}</span>
                  <span className="text-muted-foreground">Supply: {fmt(r.totalSupplied)}</span>
                  <span className="text-muted-foreground">Borrow: {fmt(r.totalBorrowed)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {!isChat &&
        (pool.reserves.length > 0 ? (
          <div className="divide-y divide-border/50">
            {pool.reserves.map((r, i) => (
              <div
                key={r.assetAddress || i}
                className="px-4 py-3 hover:bg-muted/20 transition-colors"
              >
                <div className="flex items-center gap-2.5 mb-2">
                  <TokenImage src={null} alt={r.symbol} className="h-6 w-6 rounded-full" />
                  <span className="text-sm font-medium text-foreground flex-1">{r.symbol}</span>
                  <div className="w-20">
                    <Bar value={r.utilization} />
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-3 pl-8">
                  <Stat label="Supply APY" value={pct(r.supplyApy)} />
                  <Stat label="Borrow APY" value={pct(r.borrowApy)} />
                  <Stat label="Supplied" value={fmt(r.totalSupplied)} />
                  <Stat label="Borrowed" value={fmt(r.totalBorrowed)} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon={Database} text="No reserves" />
        ))}
    </ProtocolCard>
  );
}
