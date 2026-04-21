"use client";

import { useState } from "react";
import { ChevronDown, Database, Layers } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { TokenImage } from "@/shared/components/token-image";
import type { CardMode } from "../../schemas/common.schema";
import type { PoolCardProps } from "../../schemas/blend.schema";
import { ProtocolCard, EmptyState } from "../base/protocol-card";
import { Tag, CardHeader } from "../base/indicators";
import { fmt,  formatPercent } from "../../lib/formatting";

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
    <ProtocolCard mode={mode} title={mode === "chat" ? "Blend Pools" : undefined} icon={mode === "chat" ? Database : undefined}>
      {mode === "playground" && (
        <CardHeader
          icon={<Database className="h-3.5 w-3.5" />}
          title="Blend Pools"
          right={<span className="text-xs text-muted-foreground">{pools.length}</span>}
        />
      )}
      {pools.map((pool, i) => {
        const isOpen = open.has(i);
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
              isOpen &&
              pool.reserves.length > 0 && <ReserveList reserves={pool.reserves} />
            )}
          </div>
        );
      })}
    </ProtocolCard>
  );
}

function ReserveList({ reserves }: { reserves: PoolCardProps["reserves"] }) {
  return (
    <div className="pb-2 px-4 space-y-1">
      <div className="grid grid-cols-[120px_1fr_1fr] items-center gap-2 py-1 pl-5 text-[10px] text-muted-foreground/50">
        <span>Asset</span>
        <span>Supply APY</span>
        <span>Borrow APY</span>
      </div>
      {reserves.map((r, j) => (
        <div key={r.assetAddress || j} className="grid grid-cols-[120px_1fr_1fr] items-center gap-2 py-1.5 pl-5">
          <div className="flex items-center gap-1.5">
            <TokenImage src={null} alt={r.symbol} className="h-5 w-5 rounded-full shrink-0" />
            <span className="text-xs font-medium text-foreground">{r.symbol}</span>
          </div>
          <span className="text-[11px] text-muted-foreground"><Apy value={r.supplyApy} /></span>
          <span className="text-[11px] text-muted-foreground"><Apy value={r.borrowApy} /></span>
        </div>
      ))}
    </div>
  );
}
