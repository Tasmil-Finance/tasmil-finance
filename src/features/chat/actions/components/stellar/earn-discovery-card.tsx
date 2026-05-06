"use client";

import { TrendingUp } from "lucide-react";
import { memo } from "react";
import { Bar, MetricBox, Stat } from "@/features/protocols/cards/base/indicators";
import { EmptyState, ProtocolCard } from "@/features/protocols/cards/base/protocol-card";
import { fmt } from "@/features/protocols/lib/formatting";
import { TokenImage } from "@/shared/components/token-image";
import { useResultData } from "../../hooks/use-result-data";
import { ScrollableList } from "../base/indicators";

interface EarnOpportunity {
  protocol: string;
  type: string;
  name: string;
  apy: number | null;
  tvl: string | null;
  assets: string[];
  risk: string;
  poolAddress?: string;
  status: string;
  fee?: string;
  poolType?: string;
  reserves?: Array<{ symbol: string; amount: string }>;
  supplyApy?: number | null;
  borrowApy?: number | null;
  utilization?: number | null;
  collateralFactor?: number | null;
  rewardToken?: string;
}

interface EarnData {
  opportunities: EarnOpportunity[];
  count: number;
  totalScanned: number;
  markets?: Array<{
    protocol: string;
    asset: string;
    supplyApy: number | null;
    borrowApy: number | null;
    collateralFactor: number | null;
    utilization: number | null;
    available: string | null;
    poolAddress?: string;
    status: string;
  }>;
}

interface EarnDiscoveryCardProps {
  type?: string;
  toolName?: string;
  args?: Record<string, any>;
  result: any;
  toolCallId?: string;
  status?: string;
}

function EarnDiscoveryCardComponent({ type, result, toolCallId, status }: EarnDiscoveryCardProps) {
  const { data, isLoading, hasError, errorMessage } = useResultData<EarnData>(result, status);

  const isLending = type === "staking_discovery" || data?.markets != null;
  const title = isLending ? "Lending Markets" : "Earn Opportunities";

  const items: EarnOpportunity[] =
    data?.opportunities ??
    data?.markets?.map((m) => ({
      protocol: m.protocol,
      type: "lending",
      name: `${m.asset} on ${m.protocol}`,
      apy: m.supplyApy,
      tvl: m.available,
      assets: [m.asset],
      risk: "medium",
      poolAddress: m.poolAddress,
      status: m.status,
      supplyApy: m.supplyApy,
      borrowApy: m.borrowApy,
      utilization: m.utilization,
      collateralFactor: m.collateralFactor,
    })) ??
    [];

  const validApys = items
    .map((o) => o.apy)
    .filter((v): v is number => v != null && Number.isFinite(v));
  const bestApy = validApys.length > 0 ? Math.max(...validApys) : null;
  const protocols = new Set(items.map((o) => o.protocol));

  return (
    <ProtocolCard
      data-testid="card-earn-discovery"
      mode="chat"
      title={title}
      subtitle={`${items.length} result${items.length !== 1 ? "s" : ""} found`}
      icon={TrendingUp}
      iconColor="text-primary"
      iconBg="bg-primary/10"
      isLoading={isLoading}
      error={hasError ? errorMessage : undefined}
    >
      {/* Stats grid */}
      <div className="mb-3 grid grid-cols-3 gap-1.5">
        <MetricBox label="Count" value={String(items.length)} />
        <MetricBox label="Best APY" value={bestApy != null ? `${bestApy.toFixed(1)}%` : "N/A"} />
        <MetricBox label="Protocols" value={String(protocols.size)} />
      </div>

      {items.length > 0 ? (
        <ScrollableList id={`earn-${toolCallId}`} maxHeight={350}>
          {items
            .filter((o) => o.status === "ok")
            .sort((a, b) => (b.apy ?? 0) - (a.apy ?? 0))
            .map((opp, idx) => (
              <div
                key={`${opp.protocol}-${opp.name}-${idx}`}
                className="space-y-2 rounded-lg border border-border p-3 transition-colors hover:bg-muted/20"
              >
                {/* Header row: protocol + type tags */}
                <div className="flex items-center gap-1.5">
                  <span className="rounded-md bg-muted px-1.5 py-px font-medium text-[10px] text-foreground">
                    {opp.protocol}
                  </span>
                  <span className="rounded-md bg-muted px-1.5 py-px font-medium text-[10px] text-muted-foreground">
                    {opp.type}
                  </span>
                  <span className="rounded-md bg-muted px-1.5 py-px font-medium text-[10px] text-muted-foreground">
                    {opp.risk}
                  </span>
                </div>

                {/* Pool name */}
                <div className="truncate font-medium text-sm">{opp.name}</div>

                {/* Asset tokens with images */}
                <div className="flex items-center gap-1.5">
                  {opp.assets.map((a) => (
                    <div key={a} className="flex items-center gap-1">
                      <TokenImage src={null} alt={a} className="h-4 w-4 rounded-full" />
                      <span className="text-foreground text-xs">{a}</span>
                    </div>
                  ))}
                </div>

                {/* Stats: compact grid */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                  <Stat
                    label="APY"
                    value={
                      opp.apy != null && Number.isFinite(opp.apy) ? `${opp.apy.toFixed(2)}%` : "N/A"
                    }
                  />
                  {opp.tvl && <Stat label="TVL" value={`$${fmt(opp.tvl)}`} />}
                  {opp.supplyApy != null && (
                    <Stat label="Supply" value={`${opp.supplyApy.toFixed(2)}%`} />
                  )}
                  {opp.borrowApy != null && (
                    <Stat label="Borrow" value={`${opp.borrowApy.toFixed(2)}%`} />
                  )}
                </div>

                {/* Utilization bar */}
                {opp.utilization != null && typeof opp.utilization === "number" && (
                  <div className="space-y-0.5">
                    <div className="flex justify-between text-[9px] text-muted-foreground">
                      <span>Utilization</span>
                      <span className="tabular-nums">{opp.utilization.toFixed(1)}%</span>
                    </div>
                    <Bar value={opp.utilization / 100} />
                  </div>
                )}

                {/* Collateral factor */}
                {opp.collateralFactor != null && typeof opp.collateralFactor === "number" && (
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>C-Factor</span>
                    <span className="tabular-nums">{(opp.collateralFactor * 100).toFixed(0)}%</span>
                  </div>
                )}
              </div>
            ))}
        </ScrollableList>
      ) : (
        <EmptyState icon={TrendingUp} text="No opportunities found \u2014 try a different asset" />
      )}
    </ProtocolCard>
  );
}

export const EarnDiscoveryCard = memo(EarnDiscoveryCardComponent);
