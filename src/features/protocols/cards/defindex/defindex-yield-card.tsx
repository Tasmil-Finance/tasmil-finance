"use client";

import { Layers, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { TokenImage } from "@/shared/components/token-image";
import { cleanVaultName, fmt } from "../../lib/formatting";
import type { CardMode } from "../../schemas/common.schema";
import { CardHeader } from "../base/indicators";
import { EmptyState, ProtocolCard } from "../base/protocol-card";

interface YieldOpportunity {
  protocol: string;
  protocolType?: string;
  type?: string;
  pool?: string;
  poolAddress?: string;
  name?: string;
  symbol?: string;
  poolName?: string;
  assets: string[];
  apy: number | { base?: number; reward?: number | null; total?: number } | null;
  tvl: number | string | null;
  risk?: string;
  riskLevel?: string;
  status?: string;
}

interface Props {
  opportunities: YieldOpportunity[];
  mode?: CardMode;
}

export function DefindexYieldCard({ opportunities, mode = "playground" }: Props) {
  if (!opportunities.length) {
    return (
      <ProtocolCard mode={mode} title="Yield Opportunities" icon={TrendingUp}>
        <EmptyState icon={Layers} text="No yield opportunities found" />
      </ProtocolCard>
    );
  }

  return (
    <ProtocolCard
      mode={mode}
      title={mode === "chat" ? "DeFindex Vaults" : undefined}
      icon={mode === "chat" ? TrendingUp : undefined}
    >
      {mode === "playground" && (
        <CardHeader
          icon={<TrendingUp className="h-3.5 w-3.5" />}
          title="DeFindex Vaults"
          right={<span className="text-muted-foreground text-xs">{opportunities.length}</span>}
        />
      )}

      {/* Table header */}
      <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-x-4 border-border border-b px-4 py-2 font-semibold text-[10px] text-muted-foreground/60 uppercase tracking-wider">
        <span>Vault</span>
        <span className="w-24 text-right">TVL</span>
        <span className="w-16 text-center">Exposure</span>
        <span className="w-16 text-right">APY</span>
      </div>

      {/* Rows */}
      <div className="divide-y divide-border/50">
        {opportunities.map((opp, i) => {
          const tvlNum = opp.tvl != null ? Number(opp.tvl) / 1e7 : null;
          const apyRaw = opp.apy;
          const apyNum =
            typeof apyRaw === "object" && apyRaw !== null
              ? (apyRaw.total ?? apyRaw.base ?? null)
              : apyRaw;
          const rawName = opp.name ?? opp.poolName ?? "Vault";
          const displayName = cleanVaultName(rawName);
          const symbol = opp.symbol || "";
          const asset = opp.assets[0] ?? "—";

          return (
            <div
              key={opp.poolAddress ?? opp.pool ?? i}
              className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-x-4 px-4 py-3 transition-colors hover:bg-muted/20"
            >
              {/* Vault name + symbol */}
              <div className="min-w-0">
                <p className="truncate font-medium text-[13px] text-foreground">{displayName}</p>
                {symbol && (
                  <p className="text-[10px] text-muted-foreground/60 uppercase">{symbol}</p>
                )}
              </div>

              {/* TVL */}
              <div className="w-24 text-right">
                <p className="font-medium text-foreground text-xs tabular-nums">
                  {tvlNum != null ? `${fmt(tvlNum)} ${asset}` : "—"}
                </p>
                <p className="text-[10px] text-muted-foreground/60">{asset}</p>
              </div>

              {/* Exposure */}
              <div className="flex w-16 items-center justify-center gap-1.5">
                <TokenImage src={null} alt={asset} className="h-4 w-4 shrink-0 rounded-full" />
                <span className="text-[11px] text-muted-foreground">{asset}</span>
              </div>

              {/* APY */}
              <div className="w-16 text-right">
                <span
                  className={cn(
                    "font-semibold text-sm tabular-nums",
                    apyNum != null && apyNum > 0 ? "text-emerald-400" : "text-muted-foreground"
                  )}
                >
                  {apyNum != null ? `${apyNum.toFixed(2)}%` : "—"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </ProtocolCard>
  );
}
