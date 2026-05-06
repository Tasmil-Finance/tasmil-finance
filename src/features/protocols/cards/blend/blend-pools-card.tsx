"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Database, Layers } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { TokenImage } from "@/shared/components/token-image";
import type { PoolCardProps } from "../../schemas/blend.schema";
import type { CardMode } from "../../schemas/common.schema";
import { Apy, CardHeader, Tag } from "../base/indicators";
import { EmptyState, ProtocolCard } from "../base/protocol-card";

// import { fmt, formatPercent } from "../../lib/formatting";

interface BlendPoolsCardProps {
  pools: PoolCardProps[];
  mode?: CardMode;
}

export function BlendPoolsCard({ pools, mode = "playground" }: BlendPoolsCardProps) {
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
      <ProtocolCard mode={mode} title="Blend Pools" icon={Database}>
        <EmptyState icon={Layers} text="No pools found" />
      </ProtocolCard>
    );
  }

  return (
    <ProtocolCard
      data-testid="card-blend-pools"
      mode={mode}
      title={mode === "chat" ? "Blend Pools" : undefined}
      icon={mode === "chat" ? Database : undefined}
    >
      {mode === "playground" && (
        <CardHeader
          icon={<Database className="h-3.5 w-3.5" />}
          title="Blend Pools"
          right={<span className="text-muted-foreground text-xs">{pools.length}</span>}
        />
      )}
      {pools.map((pool, i) => {
        const isOpen = open.has(i);
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
                {pool.name}
              </span>
              <Tag type={pool.status} />
            </button>
            {mode === "playground" ? (
              <AnimatePresence>
                {isOpen && pool.reserves.length > 0 && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <ReserveList reserves={pool.reserves} />
                  </motion.div>
                )}
              </AnimatePresence>
            ) : (
              isOpen && pool.reserves.length > 0 && <ReserveList reserves={pool.reserves} />
            )}
          </div>
        );
      })}
    </ProtocolCard>
  );
}

function ReserveList({ reserves }: { reserves: PoolCardProps["reserves"] }) {
  return (
    <div className="space-y-1 px-4 pb-2">
      <div className="grid grid-cols-[120px_1fr_1fr] items-center gap-2 py-1 pl-5 text-[10px] text-muted-foreground/50">
        <span>Asset</span>
        <span>Supply APY</span>
        <span>Borrow APY</span>
      </div>
      {reserves.map((r, j) => (
        <div
          key={r.assetAddress || j}
          className="grid grid-cols-[120px_1fr_1fr] items-center gap-2 py-1.5 pl-5"
        >
          <div className="flex items-center gap-1.5">
            <TokenImage src={null} alt={r.symbol} className="h-5 w-5 shrink-0 rounded-full" />
            <span className="font-medium text-foreground text-xs">{r.symbol}</span>
          </div>
          <span className="text-[11px] text-muted-foreground">
            <Apy value={r.supplyApy} />
          </span>
          <span className="text-[11px] text-muted-foreground">
            <Apy value={r.borrowApy} />
          </span>
        </div>
      ))}
    </div>
  );
}
