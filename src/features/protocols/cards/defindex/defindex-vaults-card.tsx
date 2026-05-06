"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Layers, Vault } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { cleanVaultName, fmt, trunc } from "../../lib/formatting";
import type { CardMode } from "../../schemas/common.schema";
import type { DefindexVaultCardProps } from "../../schemas/defindex.schema";
import { CardHeader } from "../base/indicators";
import { EmptyState, ProtocolCard } from "../base/protocol-card";

interface DefindexVaultsCardProps {
  vaults: DefindexVaultCardProps[];
  mode?: CardMode;
}

export function DefindexVaultsCard({ vaults, mode = "playground" }: DefindexVaultsCardProps) {
  const [open, setOpen] = useState<Set<number>>(new Set(mode === "playground" ? [0] : []));
  const flip = (i: number) =>
    setOpen((s) => {
      const n = new Set(s);
      if (n.has(i)) n.delete(i);
      else n.add(i);
      return n;
    });

  if (!vaults.length) {
    return (
      <ProtocolCard mode={mode} title="DeFindex Vaults" icon={Vault}>
        <EmptyState icon={Layers} text="No vaults found" />
      </ProtocolCard>
    );
  }

  return (
    <ProtocolCard
      mode={mode}
      title={mode === "chat" ? "DeFindex Vaults" : undefined}
      icon={mode === "chat" ? Vault : undefined}
    >
      {mode === "playground" && (
        <CardHeader
          icon={<Vault className="h-3.5 w-3.5" />}
          title="DeFindex Vaults"
          right={<span className="text-muted-foreground text-xs">{vaults.length}</span>}
        />
      )}
      {vaults.map((vault, i) => {
        const isOpen = open.has(i);
        return (
          <div key={vault.address || i} className={cn(i > 0 && "border-border border-t")}>
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
                {cleanVaultName(vault.name) || trunc(vault.address)}
              </span>
              <StatusBadge status={vault.status} />
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
                    <VaultMeta vault={vault} />
                  </motion.div>
                )}
              </AnimatePresence>
            ) : (
              isOpen && <VaultMeta vault={vault} />
            )}
          </div>
        );
      })}
    </ProtocolCard>
  );
}

function StatusBadge({ status }: { status: string }) {
  const isOk = status === "ok";
  return (
    <span
      className={cn(
        "rounded-md px-1.5 py-px font-medium text-[10px]",
        isOk ? "bg-emerald-400/10 text-emerald-400" : "bg-amber-400/10 text-amber-400"
      )}
    >
      {isOk ? "Active" : "Unavailable"}
    </span>
  );
}

function VaultMeta({ vault }: { vault: DefindexVaultCardProps }) {
  const tvl = vault.tvl != null ? Number(vault.tvl) / 1e7 : null;
  const supply = vault.totalSupply != null ? Number(vault.totalSupply) / 1e7 : null;
  const apy = vault.apy;

  return (
    <div className="space-y-2 px-4 pb-3 pl-9">
      <div className="grid grid-cols-3 gap-3">
        <MetricMini label="Asset" value={vault.asset ?? "—"} />
        <MetricMini label="TVL" value={tvl != null ? `$${fmt(tvl)}` : "—"} />
        <MetricMini
          label="APY"
          value={apy != null ? `${apy.toFixed(2)}%` : "—"}
          valueClass={apy != null && apy > 0 ? "text-emerald-400" : undefined}
        />
      </div>
      {supply != null && (
        <div className="text-[10px] text-muted-foreground/60">
          Total Supply: {fmt(supply)} dfTokens
        </div>
      )}
      <span className="block truncate font-mono text-[10px] text-muted-foreground/50">
        {vault.address}
      </span>
    </div>
  );
}

function MetricMini({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div>
      <p className="text-[9px] text-muted-foreground/50 uppercase">{label}</p>
      <p className={cn("font-medium text-foreground text-xs tabular-nums", valueClass)}>{value}</p>
    </div>
  );
}
