"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRightLeft, ChevronDown, Layers } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { TokenImage } from "@/shared/components/token-image";
import { fmt } from "../../lib/formatting";
import type { CardMode } from "../../schemas/common.schema";
import type { SoroswapPoolCardProps } from "../../schemas/soroswap.schema";
import { CardHeader, Tag } from "../base/indicators";
import { EmptyState, ProtocolCard } from "../base/protocol-card";

interface SoroswapPoolsCardComponentProps {
  pools: SoroswapPoolCardProps[];
  mode?: CardMode;
}

export function SoroswapPoolsCard({ pools, mode = "playground" }: SoroswapPoolsCardComponentProps) {
  const [open, setOpen] = useState<Set<number>>(new Set(mode === "playground" ? [0] : []));
  const flip = (i: number) =>
    setOpen((s) => {
      const n = new Set(s);
      n.has(i) ? n.delete(i) : n.add(i);
      return n;
    });

  if (!pools.length) {
    return (
      <ProtocolCard mode={mode} title="Soroswap Pools" icon={ArrowRightLeft}>
        <EmptyState icon={Layers} text="No pools found" />
      </ProtocolCard>
    );
  }

  return (
    <ProtocolCard
      mode={mode}
      title={mode === "chat" ? "Soroswap Pools" : undefined}
      icon={mode === "chat" ? ArrowRightLeft : undefined}
      iconColor="text-violet-500"
      iconBg="bg-violet-500/10"
    >
      {mode === "playground" && (
        <CardHeader
          icon={<ArrowRightLeft className="h-3.5 w-3.5" />}
          title="Soroswap Pools"
          right={<span className="text-muted-foreground text-xs">{pools.length}</span>}
        />
      )}
      {pools.map((pool, i) => {
        const isOpen = open.has(i);
        const label = `${pool.tokenA} / ${pool.tokenB}`;
        return (
          <div key={pool.address || i} className={cn(i > 0 && "border-border border-t")}>
            <button
              type="button"
              onClick={() => flip(i)}
              className="flex w-full items-center gap-2 px-4 py-2.5 transition-colors hover:bg-muted/30"
            >
              <ChevronDown
                className={cn(
                  "h-3 w-3 text-muted-foreground transition-transform",
                  isOpen && "rotate-180"
                )}
              />
              <span className="flex-1 truncate text-left font-medium text-[13px] text-foreground">
                {label}
              </span>
              {pool.protocol && <Tag type={pool.protocol} />}
            </button>
            {mode === "playground" ? (
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <PoolDetail pool={pool} />
                  </motion.div>
                )}
              </AnimatePresence>
            ) : (
              isOpen && <PoolDetail pool={pool} />
            )}
          </div>
        );
      })}
    </ProtocolCard>
  );
}

function PoolDetail({ pool }: { pool: SoroswapPoolCardProps }) {
  return (
    <div className="space-y-1.5 px-4 pb-2">
      <div className="space-y-1">
        {[
          { sym: pool.tokenA, reserve: pool.reserveA },
          { sym: pool.tokenB, reserve: pool.reserveB },
        ].map((t) => (
          <div key={t.sym} className="flex items-center gap-2.5 py-1 pl-5">
            <TokenImage src={null} alt={t.sym} className="h-5 w-5 rounded-full" />
            <span className="w-14 font-medium text-foreground text-xs">{t.sym}</span>
            {t.reserve != null && (
              <span className="text-[11px] text-muted-foreground tabular-nums">
                {fmt(Number(t.reserve) / 1e7)}
              </span>
            )}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-4 gap-1 pl-5 text-[11px]">
        <span className="text-muted-foreground">
          <span className="text-muted-foreground/50">TVL </span>
          <span className="text-foreground tabular-nums">
            {pool.tvl != null && Number(pool.tvl) > 0 ? `$${fmt(pool.tvl)}` : "$0"}
          </span>
        </span>
        <span className="text-muted-foreground">
          <span className="text-muted-foreground/50">Vol </span>
          <span className="text-foreground tabular-nums">
            {pool.volume24h != null && Number(pool.volume24h) > 0
              ? `$${fmt(pool.volume24h)}`
              : "$0"}
          </span>
        </span>
        <span className="text-muted-foreground">
          <span className="text-muted-foreground/50">Fee </span>
          <span className="text-foreground tabular-nums">{pool.fee ?? "—"}</span>
        </span>
        <span className="text-muted-foreground">
          <span className="text-muted-foreground/50">Src </span>
          <span className="text-foreground capitalize">{pool.protocol ?? "—"}</span>
        </span>
      </div>
    </div>
  );
}
