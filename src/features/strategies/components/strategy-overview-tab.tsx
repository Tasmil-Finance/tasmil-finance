"use client";

import { ExternalLink, Info } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Alert } from "@/shared/ui/alert";
import { cn } from "@/lib/utils";
import { ExecutionPanelFlow } from "./execution-panel-flow";
import type { StrategyOverview, ExecutionStep } from "../types";

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
      <Alert className="bg-muted/50">
        <Info className="h-4 w-4" />
        <p className="text-sm">{overview.disclaimer}</p>
      </Alert>

      {/* Description Section */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-lg">Description</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Executed by Agents */}
          <div>
            <p className="mb-2 text-muted-foreground text-sm">Executed by Agents:</p>
            <div className="flex flex-wrap gap-2">
              {overview.agents.map((agent) => (
                <Badge
                  key={agent}
                  variant="outline"
                  className="cursor-pointer hover:bg-accent"
                >
                  {agent}
                  <ExternalLink className="ml-1 h-3 w-3" />
                </Badge>
              ))}
            </div>
          </div>

          {/* Description Text */}
          <p className="text-foreground">{overview.description}</p>

          {/* Assets / Pools */}
          <div>
            <p className="mb-2 text-muted-foreground text-sm">Assets / Pools:</p>
            <div className="flex flex-wrap gap-2">
              {overview.assets_pools.map((asset) => (
                <Badge
                  key={asset}
                  variant="outline"
                  className="cursor-pointer hover:bg-accent"
                >
                  {asset}
                  <ExternalLink className="ml-1 h-3 w-3" />
                </Badge>
              ))}
            </div>
          </div>

          {/* Rewards */}
          <div>
            <p className="mb-2 text-muted-foreground text-sm">Rewards:</p>
            <div className="flex flex-wrap gap-2">
              {overview.rewards.map((reward) => (
                <Badge key={reward} variant="secondary">
                  {reward}
                </Badge>
              ))}
            </div>
          </div>

          {/* Risks */}
          <div>
            <p className="mb-2 text-muted-foreground text-sm">Risks:</p>
            <div className="flex flex-wrap gap-2">
              {overview.risks.map((risk) => (
                <Badge key={risk} variant="destructive">
                  {risk}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Strategy Flow Summary */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-lg">Strategy Flow</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">
            Click &apos;Simulate&apos; to preview the amount used in each steps of the strategy.
          </p>
          {executionSteps && executionSteps.length > 0 ? (
            <div className="rounded-lg border border-dashed border-input bg-muted/30 p-4">
              <ExecutionPanelFlow executionSteps={executionSteps} className="h-[400px]" />
              <div className="mt-4 flex items-center justify-between">
                <span className="font-semibold">
                  {overview.strategy_flow_summary.total_steps} Steps
                </span>
                <div className="flex flex-wrap gap-2">
                  {overview.strategy_flow_summary.actions.map((action, index) => (
                    <Badge key={index} variant="outline">
                      {action.type} x {action.count}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-input bg-muted/30 p-4">
              <div className="mb-4 flex items-center justify-between">
                <span className="font-semibold">
                  {overview.strategy_flow_summary.total_steps} Steps
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {overview.strategy_flow_summary.actions.map((action, index) => (
                  <Badge key={index} variant="outline">
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
