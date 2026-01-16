"use client";

import { ExternalLink, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Alert } from "@/shared/ui/alert";
import { Badge } from "@/shared/ui/badge";
import { Card, CardContent, CardHeader } from "@/shared/ui/card";
import type { ExecutionStep, StrategyOverview } from "../types";
import { ExecutionPanelFlow } from "./execution-panel-flow";

interface StrategyOverviewTabProps {
  overview: StrategyOverview;
  executionSteps?: ExecutionStep[];
  className?: string;
}

export function StrategyOverviewTab({
  overview,
  executionSteps,
  className,
}: StrategyOverviewTabProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Disclaimer */}
      <Alert className="border-zinc-800 bg-zinc-900/50">
        <Info className="h-4 w-4 text-zinc-400" />
        <p className="text-sm text-zinc-400">{overview.disclaimer}</p>
      </Alert>

      {/* Description Section */}
      <Card className="border-zinc-800 bg-zinc-950">
        <CardHeader>
          <h3 className="font-semibold text-lg text-white">Description</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Executed by Agents */}
          <div>
            <p className="mb-2 text-sm text-zinc-500">Executed by Agents:</p>
            <div className="flex flex-wrap gap-2">
              {overview.agents.map((agent) => (
                <Badge
                  key={agent}
                  variant="outline"
                  className="cursor-pointer border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-600 hover:bg-zinc-700"
                >
                  {agent}
                  <ExternalLink className="ml-1 h-3 w-3" />
                </Badge>
              ))}
            </div>
          </div>

          {/* Description Text */}
          <p className="text-zinc-300">{overview.description}</p>

          {/* Assets / Pools */}
          <div>
            <p className="mb-2 text-sm text-zinc-500">Assets / Pools:</p>
            <div className="flex flex-wrap gap-2">
              {overview.assets_pools.map((asset) => (
                <Badge
                  key={asset}
                  variant="outline"
                  className="cursor-pointer border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-600 hover:bg-zinc-700"
                >
                  {asset}
                  <ExternalLink className="ml-1 h-3 w-3" />
                </Badge>
              ))}
            </div>
          </div>

          {/* Rewards */}
          <div>
            <p className="mb-2 text-sm text-zinc-500">Rewards:</p>
            <div className="flex flex-wrap gap-2">
              {overview.rewards.map((reward) => (
                <Badge
                  key={reward}
                  className="border-emerald-500/30 bg-emerald-500/20 text-emerald-400"
                >
                  {reward}
                </Badge>
              ))}
            </div>
          </div>

          {/* Risks */}
          <div>
            <p className="mb-2 text-sm text-zinc-500">Risks:</p>
            <div className="flex flex-wrap gap-2">
              {overview.risks.map((risk) => (
                <Badge key={risk} className="border-red-500/30 bg-red-500/20 text-red-400">
                  {risk}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Strategy Flow Summary */}
      <Card className="border-zinc-800 bg-zinc-950">
        <CardHeader>
          <h3 className="font-semibold text-lg text-white">Strategy Flow</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Info Banner */}
          <Alert className="border-zinc-800 bg-zinc-900/50">
            <Info className="h-4 w-4 text-zinc-400" />
            <p className="text-sm text-zinc-400">
              Click &apos;Simulate&apos; to preview the amount used in each steps of the strategy.
            </p>
          </Alert>

          {executionSteps && executionSteps.length > 0 ? (
            <div className="relative rounded-lg border border-zinc-800 bg-zinc-900/30 p-6">
              <ExecutionPanelFlow executionSteps={executionSteps} className="h-[500px]" />

              {/* Steps Summary Sidebar */}
              <div className="absolute top-6 right-6 w-[200px] rounded-lg border border-zinc-800 bg-zinc-900/80 p-4 backdrop-blur-sm">
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-sm text-zinc-500">No. of Steps</span>
                  <span className="font-bold text-2xl text-indigo-400">
                    {overview.strategy_flow_summary.total_steps}
                  </span>
                </div>
                <div className="space-y-2">
                  {overview.strategy_flow_summary.actions.map((action, actionIndex) => (
                    <div
                      key={`action-${actionIndex}-${action.type}`}
                      className="flex items-center justify-between text-sm"
                    >
                      <span
                        className={cn(
                          "flex items-center gap-2",
                          action.type === "Starting Token" && "text-indigo-400",
                          action.type === "Swap" && "text-orange-400",
                          action.type === "Add Liquidity" && "text-emerald-400"
                        )}
                      >
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{
                            backgroundColor:
                              action.type === "Starting Token"
                                ? "#818cf8"
                                : action.type === "Swap"
                                  ? "#fb923c"
                                  : "#34d399",
                          }}
                        />
                        {action.type}
                      </span>
                      <span className="text-zinc-500">x {action.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-6">
              <div className="mb-4 flex items-center justify-between">
                <span className="font-semibold text-white">
                  {overview.strategy_flow_summary.total_steps} Steps
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {overview.strategy_flow_summary.actions.map((action, actionIndex) => (
                  <Badge
                    key={`badge-${actionIndex}-${action.type}`}
                    variant="outline"
                    className="border-zinc-700 bg-zinc-800 text-zinc-300"
                  >
                    {action.type} x {action.count}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
