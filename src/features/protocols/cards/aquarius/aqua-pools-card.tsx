"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Droplets, Layers } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { TokenImage } from "@/shared/components/token-image";
import { fmt } from "../../lib/formatting";
import type { AquaPoolCardProps } from "../../schemas/aquarius.schema";
import type { CardMode } from "../../schemas/common.schema";
import { CardHeader, Tag } from "../base/indicators";
import { EmptyState, ProtocolCard } from "../base/protocol-card";

interface AquaPoolsCardProps {
  pools: AquaPoolCardProps[];
  mode?: CardMode;
}

function resolvePoolLabel(pool: AquaPoolCardProps): string {
  if (pool.tokens?.length) {
    return pool.tokens.map((t) => t.symbol ?? t.address.slice(0, 6)).join(" / ");
  }
  const ts = Array.isArray(pool.tokensStr) ? pool.tokensStr : (pool.tokensStr?.split("-") ?? []);
  return ts.length ? ts.join(" / ") : pool.address.slice(0, 10);
}

function poolTypeTag(type: string | undefined): string {
  if (!type) return "AMM";
  if (type.includes("concentrated")) return "Concentrated";
  if (type.includes("stable")) return "Stable";
  if (type.includes("constant")) return "Volatile";
  return "AMM";
}

export function AquaPoolsCard({ pools, mode = "playground" }: AquaPoolsCardProps) {
  const [open, setOpen] = useState<Set<number>>(new Set(mode === "playground" ? [0] : []));
  const flip = (i: number) =>
    setOpen((s) => {
      const n = new Set(s);
      if (n.has(i)) n.delete(i);
      else n.add(i);
      return n;
    });

  if (!pools.length) {
    return (
      <ProtocolCard mode={mode} title="Aquarius Pools" icon={Droplets}>
        <EmptyState icon={Layers} text="No pools found" />
      </ProtocolCard>
    );
  }

  return (
    <ProtocolCard
      data-testid="card-aqua-pools"
      mode={mode}
      title={mode === "chat" ? "Aquarius Pools" : undefined}
      icon={mode === "chat" ? Droplets : undefined}
      iconColor="text-cyan-500"
      iconBg="bg-cyan-500/10"
    >
      {mode === "playground" && (
        <CardHeader
          icon={<Droplets className="h-3.5 w-3.5" />}
          title="Aquarius Pools"
          right={<span className="text-muted-foreground text-xs">{pools.length}</span>}
        />
      )}
      {pools.map((pool, i) => {
        const isOpen = open.has(i);
        const label = resolvePoolLabel(pool);
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
              <Tag type={poolTypeTag(pool.poolType)} />
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

function PoolDetail({ pool }: { pool: AquaPoolCardProps }) {
  const tokens = pool.tokens ?? [];

  return (
    <div className="space-y-1.5 px-4 pb-2">
      {/* Token list */}
      {tokens.length > 0 && (
        <div className="space-y-1">
          {tokens.map((t, j) => (
            <div key={t.address || j} className="flex items-center gap-2.5 py-1 pl-5">
              <TokenImage src={null} alt={t.symbol ?? "?"} className="h-5 w-5 rounded-full" />
              <span className="font-medium text-foreground text-xs">
                {t.symbol ?? t.address.slice(0, 8)}
              </span>
            </div>
          ))}
        </div>
      )}
      {/* Metrics row — matches Aquarius website: TVL | Volume 24H | Rewards | Total APR */}
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
          <span className="text-muted-foreground/50">Reward </span>
          <span className="text-emerald-400 tabular-nums">
            {pool.rewardApy != null && pool.rewardApy > 0
              ? `${pool.rewardApy.toFixed(2)}%`
              : "\u2014"}
          </span>
        </span>
        <span className="text-muted-foreground">
          <span className="text-muted-foreground/50">APR </span>
          <span className="font-medium text-foreground tabular-nums">
            {pool.totalApy != null && pool.totalApy > 0 ? `${pool.totalApy.toFixed(2)}%` : "0%"}
          </span>
        </span>
      </div>
    </div>
  );
}
