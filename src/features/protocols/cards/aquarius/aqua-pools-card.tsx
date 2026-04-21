"use client";

import { useState } from "react";
import { ChevronDown, Droplets, Layers } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { TokenImage } from "@/shared/components/token-image";
import type { CardMode } from "../../schemas/common.schema";
import type { AquaPoolCardProps } from "../../schemas/aquarius.schema";
import { ProtocolCard, EmptyState } from "../base/protocol-card";
import { Tag, CardHeader } from "../base/indicators";
import { fmt } from "../../lib/formatting";

interface AquaPoolsCardProps {
  pools: AquaPoolCardProps[];
  mode?: CardMode;
}

function resolvePoolLabel(pool: AquaPoolCardProps): string {
  if (pool.tokens?.length) {
    return pool.tokens.map((t) => t.symbol ?? t.address.slice(0, 6)).join(" / ");
  }
  const ts = Array.isArray(pool.tokensStr) ? pool.tokensStr : pool.tokensStr?.split("-") ?? [];
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
          right={<span className="text-xs text-muted-foreground">{pools.length}</span>}
        />
      )}
      {pools.map((pool, i) => {
        const isOpen = open.has(i);
        const label = resolvePoolLabel(pool);
        return (
          <div key={pool.address || i} className={cn(i > 0 && "border-t border-border")}>
            <button
              type="button"
              onClick={() => flip(i)}
              className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-muted/30 transition-colors"
            >
              <ChevronDown
                className={cn(
                  "h-3 w-3 text-muted-foreground transition-transform",
                  isOpen && "rotate-180",
                )}
              />
              <span className="text-[13px] font-medium text-foreground flex-1 text-left truncate">
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
    <div className="pb-2 px-4 space-y-1.5">
      {/* Token list */}
      {tokens.length > 0 && (
        <div className="space-y-1">
          {tokens.map((t, j) => (
            <div key={t.address || j} className="flex items-center gap-2.5 py-1 pl-5">
              <TokenImage src={null} alt={t.symbol ?? "?"} className="h-5 w-5 rounded-full" />
              <span className="text-xs font-medium text-foreground">{t.symbol ?? t.address.slice(0, 8)}</span>
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
            {pool.volume24h != null && Number(pool.volume24h) > 0 ? `$${fmt(pool.volume24h)}` : "$0"}
          </span>
        </span>
        <span className="text-muted-foreground">
          <span className="text-muted-foreground/50">Reward </span>
          <span className="text-emerald-400 tabular-nums">
            {pool.rewardApy != null && pool.rewardApy > 0 ? `${pool.rewardApy.toFixed(2)}%` : "\u2014"}
          </span>
        </span>
        <span className="text-muted-foreground">
          <span className="text-muted-foreground/50">APR </span>
          <span className="text-foreground tabular-nums font-medium">
            {pool.totalApy != null && pool.totalApy > 0 ? `${pool.totalApy.toFixed(2)}%` : "0%"}
          </span>
        </span>
      </div>
    </div>
  );
}
