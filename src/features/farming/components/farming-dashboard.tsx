"use client";

import type { AgentHistoryEvent } from "./dashboard/agent-history-card";
import { AgentHistoryCard } from "./dashboard/agent-history-card";
import { AprSummaryCard } from "./dashboard/apr-summary-card";
import type { ChartPoint } from "./dashboard/position-value-card";
import { PositionValueCard } from "./dashboard/position-value-card";

interface Props {
  totalBalanceUsd: number;
  totalDepositedUsd: number;
  lifetimeEarningsUsd: number;
  lifetimeEarningsPct: number;
  chartSeries: ChartPoint[];
  agentEvents: AgentHistoryEvent[];
  netApr: number;
  currentPositionApr: number;
  currentMarketName: string;
  rewardsApr?: number;
  activatedAt: string;
  onAddFunds: () => void;
  onDeactivate: () => void;
}

export function FarmingDashboard(props: Props) {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-6 lg:flex-row">
      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <PositionValueCard
          totalBalanceUsd={props.totalBalanceUsd}
          totalDepositedUsd={props.totalDepositedUsd}
          lifetimeEarningsUsd={props.lifetimeEarningsUsd}
          lifetimeEarningsPct={props.lifetimeEarningsPct}
          chartSeries={props.chartSeries}
          onAddFunds={props.onAddFunds}
          onDeactivate={props.onDeactivate}
        />
        <AgentHistoryCard events={props.agentEvents} />
      </div>
      <aside className="flex w-full shrink-0 flex-col gap-6 lg:w-80">
        <AprSummaryCard
          netApr={props.netApr}
          currentPositionApr={props.currentPositionApr}
          currentMarketName={props.currentMarketName}
          rewardsApr={props.rewardsApr}
          activatedAt={props.activatedAt}
          totalDepositsUsd={props.totalDepositedUsd}
        />
      </aside>
    </div>
  );
}
