"use client";

import { TrendingUp } from "lucide-react";
import { memo } from "react";
import { useResultData } from "../../hooks/use-result-data";
import { formatNumber, formatPercent } from "../../lib/formatting";
import {
  APYDisplay,
  DetailRow,
  ProtocolBadge,
  RiskBadge,
  ScrollableList,
} from "../base/indicators";
import { BaseInfoCard } from "../base/info-card";

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
  // lending format
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

  // Normalize: lending markets → opportunities format
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

  return (
    <BaseInfoCard
      title={title}
      subtitle={`${items.length} result${items.length !== 1 ? "s" : ""} found`}
      icon={TrendingUp}
      iconColor="text-green-500"
      iconBg="bg-green-500/10"
      isLoading={isLoading}
      error={hasError ? errorMessage : null}
    >
      {/* Stats overview */}
      {items.length > 0 && (
        <div className="mb-3 grid grid-cols-3 gap-2">
          <div className="rounded bg-muted/30 p-2 text-center">
            <div className="text-[10px] text-muted-foreground">Count</div>
            <div className="font-semibold text-sm">{items.length}</div>
          </div>
          <div className="rounded bg-muted/30 p-2 text-center">
            <div className="text-[10px] text-muted-foreground">Best APY</div>
            <div className="font-semibold text-green-500 text-sm">
              {Math.max(...items.map((o) => o.apy ?? 0)).toFixed(1)}%
            </div>
          </div>
          <div className="rounded bg-muted/30 p-2 text-center">
            <div className="text-[10px] text-muted-foreground">Protocols</div>
            <div className="font-semibold text-sm">
              {new Set(items.map((o) => o.protocol)).size}
            </div>
          </div>
        </div>
      )}

      {items.length > 0 ? (
        <ScrollableList id={`earn-${toolCallId}`} maxHeight={350}>
          {items
            .filter((o) => o.status === "ok")
            .sort((a, b) => (b.apy ?? 0) - (a.apy ?? 0))
            .map((opp, idx) => (
              <div
                key={`${opp.protocol}-${opp.name}-${idx}`}
                className="space-y-2 rounded-lg border p-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex min-w-0 items-center gap-2">
                    <ProtocolBadge name={opp.protocol} />
                    <span className="rounded-full bg-muted/50 px-1.5 py-0.5 text-muted-foreground text-xs">
                      {opp.type}
                    </span>
                  </div>
                  <RiskBadge risk={opp.risk} />
                </div>

                <div className="truncate font-medium text-sm">{opp.name}</div>

                <div className="flex flex-wrap items-center gap-1">
                  {opp.assets.map((a) => (
                    <span key={a} className="rounded bg-muted/40 px-1.5 py-0.5 text-xs">
                      {a}
                    </span>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <DetailRow label="APY" value={<span className="font-semibold"><APYDisplay value={opp.apy} /></span>} />
                  {opp.tvl && <DetailRow label="TVL" value={`$${formatNumber(opp.tvl)}`} />}
                  {opp.supplyApy != null && (
                    <DetailRow label="Supply" value={<span className="font-semibold">{formatPercent(opp.supplyApy)}</span>} />
                  )}
                  {opp.borrowApy != null && (
                    <DetailRow
                      label="Borrow"
                      value={<span className="text-orange-500">{formatPercent(opp.borrowApy)}</span>}
                    />
                  )}
                  {opp.utilization != null && typeof opp.utilization === "number" && (
                    <DetailRow label="Util." value={`${opp.utilization.toFixed(1)}%`} />
                  )}
                  {opp.collateralFactor != null && typeof opp.collateralFactor === "number" && (
                    <DetailRow
                      label="CF"
                      value={`${(opp.collateralFactor * 100).toFixed(0)}%`}
                    />
                  )}
                </div>

                {opp.reserves && opp.reserves.length > 0 && (
                  <div className="mt-1 border-t pt-1 text-muted-foreground text-xs">
                    Reserves: {opp.reserves.map((r) => `${r.amount} ${r.symbol}`).join(", ")}
                  </div>
                )}
              </div>
            ))}
        </ScrollableList>
      ) : (
        <div className="text-muted-foreground text-sm">No opportunities found.</div>
      )}
    </BaseInfoCard>
  );
}

export const EarnDiscoveryCard = memo(EarnDiscoveryCardComponent);
