"use client";

import { BarChart3 } from "lucide-react";
import { memo } from "react";
import { Bar, MetricBox } from "@/features/protocols/cards/base/indicators";
import { EmptyState, ProtocolCard } from "@/features/protocols/cards/base/protocol-card";
import { useResultData } from "../../hooks/use-result-data";
import { APYDisplay, ProtocolBadge, RiskBadge } from "../base/indicators";

interface AccountPosition {
  poolName?: string;
  pool_name?: string;
  protocol: string;
  valueUsd?: number;
  value_usd?: number;
  apy: number;
  allocationPercent?: number;
  allocation_percent?: number;
}

interface AccountStrategyData {
  has_account?: boolean;
  hasAccount?: boolean;
  status?: string;
  preset?: string;
  baseAsset?: string;
  base_asset?: string;
  activeAssets?: string[];
  active_assets?: string[];
  totalValueUsd?: number;
  total_value_usd?: number;
  totalDepositedUsd?: number;
  total_deposited_usd?: number;
  currentApy?: number;
  current_apy?: number;
  profitUsd?: number;
  profit_usd?: number;
  profitPercent?: number;
  profit_percent?: number;
  positions?: AccountPosition[];
  next_step?: string;
  nextStep?: string;
  position_count?: number;
  positionCount?: number;
  message?: string;
  error?: string;
}

interface AccountStrategyCardProps {
  type?: string;
  toolName?: string;
  args?: Record<string, any>;
  result: any;
  toolCallId?: string;
  status?: string;
}

const PRESET_RISK: Record<string, "low" | "medium" | "high"> = {
  SAFE: "low",
  BALANCED: "medium",
  AGGRESSIVE: "high",
};

function AccountStrategyCardComponent({ result, status }: AccountStrategyCardProps) {
  const { data, isLoading, hasError, errorMessage } = useResultData<AccountStrategyData>(
    result,
    status
  );

  const hasAccount = data?.has_account ?? data?.hasAccount ?? false;
  const preset = (data?.preset ?? "BALANCED").toUpperCase();
  const totalValue = data?.totalValueUsd ?? data?.total_value_usd;
  const currentApy = data?.currentApy ?? data?.current_apy;
  const profitUsd = data?.profitUsd ?? data?.profit_usd;
  const profitPercent = data?.profitPercent ?? data?.profit_percent;
  const positions = data?.positions ?? [];

  if (!hasAccount) {
    return (
      <ProtocolCard
        data-testid="card-account-strategy"
        mode="chat"
        title="No Smart Account Found"
        subtitle="Create one to start earning yield"
        icon={BarChart3}
        iconColor="text-muted-foreground"
        iconBg="bg-muted/30"
        isLoading={isLoading}
        error={hasError ? errorMessage : undefined}
      >
        <EmptyState
          icon={BarChart3}
          text="Deploy a smart account to access auto-rebalancing strategies"
        />
      </ProtocolCard>
    );
  }

  return (
    <ProtocolCard
      data-testid="card-account-strategy"
      mode="chat"
      title="Your Smart Account"
      subtitle={`${preset} \u00B7 ${data?.status ?? "ACTIVE"}`}
      icon={BarChart3}
      iconColor="text-violet-500"
      iconBg="bg-violet-500/10"
      isLoading={isLoading}
      error={hasError ? errorMessage : undefined}
    >
      {/* Overview metrics */}
      <div className="mb-3 grid grid-cols-2 gap-1.5">
        {totalValue != null && (
          <MetricBox label="Total Value" value={`$${totalValue.toLocaleString()}`} />
        )}
        {currentApy != null && (
          <div className="rounded-lg bg-secondary px-2.5 py-2">
            <p className="mb-0.5 text-[10px] text-muted-foreground">Current APY</p>
            <p className="font-semibold text-sm">
              <APYDisplay value={currentApy} />
            </p>
          </div>
        )}
        {profitUsd != null && (
          <div className="rounded-lg bg-secondary px-2.5 py-2">
            <p className="mb-0.5 text-[10px] text-muted-foreground">P&L</p>
            <p
              className={`font-semibold text-sm ${profitUsd >= 0 ? "text-emerald-400" : "text-red-400"}`}
            >
              {profitUsd >= 0 ? "+" : ""}${profitUsd.toLocaleString()}
              {profitPercent != null && ` (${profitPercent.toFixed(1)}%)`}
            </p>
          </div>
        )}
        <div className="rounded-lg bg-secondary px-2.5 py-2">
          <p className="mb-0.5 text-[10px] text-muted-foreground">Preset</p>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-sm">{preset}</span>
            <RiskBadge risk={PRESET_RISK[preset] ?? "medium"} />
          </div>
        </div>
      </div>

      {/* Positions */}
      {positions.length > 0 && (
        <div className="border-border border-t pt-2">
          <p className="mb-1.5 px-0.5 font-medium text-[9px] text-muted-foreground uppercase tracking-wider">
            Positions ({positions.length})
          </p>
          <div className="space-y-1">
            {positions.map((pos, idx) => {
              const poolName = pos.poolName ?? pos.pool_name ?? "Unknown Pool";
              const valueUsd = pos.valueUsd ?? pos.value_usd ?? 0;
              const allocation = pos.allocationPercent ?? pos.allocation_percent ?? 0;

              return (
                <div
                  key={idx}
                  className="rounded-lg border border-border p-2.5 transition-colors hover:bg-muted/20"
                >
                  <div className="mb-1 flex items-center justify-between">
                    <div className="flex min-w-0 items-center gap-1.5">
                      <ProtocolBadge name={pos.protocol} />
                      <span className="truncate font-medium text-xs">{poolName}</span>
                    </div>
                    <div className="ml-2 text-right">
                      <div className="font-semibold text-xs tabular-nums">
                        ${valueUsd.toLocaleString()}
                      </div>
                      <div className="text-[10px]">
                        <APYDisplay value={pos.apy} />
                      </div>
                    </div>
                  </div>
                  {allocation > 0 && (
                    <div className="space-y-0.5">
                      <div className="flex justify-between text-[9px] text-muted-foreground">
                        <span>Allocation</span>
                        <span className="tabular-nums">{allocation}%</span>
                      </div>
                      <Bar value={allocation / 100} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {data?.message && (
        <div className="mt-2 rounded-lg bg-secondary p-2.5 text-[10px] text-muted-foreground">
          {data.message}
        </div>
      )}
    </ProtocolCard>
  );
}

export const AccountStrategyCard = memo(AccountStrategyCardComponent);
