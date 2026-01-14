"use client";

import { ArrowLeft, Share2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { useStrategy } from "../hooks";
import { AllActivitiesTab } from "./all-activities-tab";
import { ExecutionPanelComponent } from "./execution-panel";
import { MyActivitiesTab } from "./my-activities-tab";
import { StrategyOverviewTab } from "./strategy-overview-tab";
import { StrategyPromptTab } from "./strategy-prompt-tab";

interface StrategyDetailPageProps {
  strategyId: string;
  className?: string;
}

export function StrategyDetailPage({ strategyId, className }: StrategyDetailPageProps) {
  const router = useRouter();
  const { data: strategy, isLoading, error } = useStrategy(strategyId);
  const [activeTab, setActiveTab] = useState("overview");

  if (isLoading) {
    return (
      <div className={cn("space-y-6 p-6", className)}>
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <Skeleton className="h-[600px] w-full" />
          </div>
          <div className="lg:col-span-2">
            <Skeleton className="h-[600px] w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !strategy) {
    return (
      <div className={cn("flex flex-col items-center justify-center p-12", className)}>
        <p className="text-destructive text-lg">Failed to load strategy</p>
        <Button variant="outline" onClick={() => router.back()} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  const handleShare = () => {
    // TODO: Implement share functionality
    if (navigator.share) {
      navigator.share({
        title: strategy.strategy_metadata.title,
        text: `Check out this strategy: ${strategy.strategy_metadata.title}`,
        url: window.location.href,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <div className={cn("space-y-6 p-6", className)}>
      {/* Header */}
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Go back
        </Button>

        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="font-bold text-3xl">{strategy.strategy_metadata.title}</h1>
              <Badge
                variant={
                  strategy.strategy_metadata.status === "Active"
                    ? "default"
                    : strategy.strategy_metadata.status === "Paused"
                      ? "secondary"
                      : "outline"
                }
                className={
                  strategy.strategy_metadata.status === "Active"
                    ? "bg-green-500/20 text-green-500 border-green-500/30"
                    : ""
                }
              >
                {strategy.strategy_metadata.status}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm">
              {strategy.strategy_metadata.creator.name} {strategy.strategy_metadata.creator.handle}{" "}
              • Created on {strategy.strategy_metadata.creator.created_at}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleShare}>
            <Share2 className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Panel - Execution Panel */}
        <div className="lg:col-span-1">
          <ExecutionPanelComponent
            executionPanel={strategy.execution_panel}
            currentApy={strategy.strategy_metadata.current_apy}
          />
        </div>

        {/* Right Panel - Tabs */}
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="strategy-prompt">Strategy Prompt</TabsTrigger>
              <TabsTrigger value="my-activities">My Activities</TabsTrigger>
              <TabsTrigger value="all-activities">All Activities</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <StrategyOverviewTab
                overview={strategy.tabs.overview}
                executionSteps={strategy.tabs.strategy_prompt.execution_steps}
              />
            </TabsContent>

            <TabsContent value="strategy-prompt" className="mt-6">
              <StrategyPromptTab
                strategyPrompt={strategy.tabs.strategy_prompt}
                creatorName={strategy.strategy_metadata.creator.name}
                creatorHandle={strategy.strategy_metadata.creator.handle}
                createdAt={strategy.strategy_metadata.creator.created_at}
              />
            </TabsContent>

            <TabsContent value="my-activities" className="mt-6">
              <MyActivitiesTab myActivities={strategy.tabs.my_activities} />
            </TabsContent>

            <TabsContent value="all-activities" className="mt-6">
              <AllActivitiesTab allActivities={strategy.tabs.all_activities} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
