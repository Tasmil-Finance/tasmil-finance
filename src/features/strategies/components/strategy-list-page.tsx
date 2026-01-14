"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/shared/ui/avatar";
import { Badge } from "@/shared/ui/badge";
import { Card, CardContent, CardHeader } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";
import { useStrategies } from "../hooks";
import type { StrategyListItem } from "../types";

interface StrategyCardProps {
  strategy: StrategyListItem;
  onClick: () => void;
}

function StrategyCard({ strategy, onClick }: StrategyCardProps) {
  return (
    <Card
      className="cursor-pointer transition-all hover:border-primary/50 hover:shadow-lg"
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <h3 className="font-semibold text-xl">{strategy.title}</h3>
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  strategy.status === "Active"
                    ? "default"
                    : strategy.status === "Paused"
                      ? "secondary"
                      : "outline"
                }
                className={
                  strategy.status === "Active"
                    ? "bg-green-500/20 text-green-500 border-green-500/30"
                    : ""
                }
              >
                {strategy.status}
              </Badge>
              <span className="text-primary font-bold text-lg">{strategy.current_apy}</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
              {strategy.creator.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-medium text-sm">{strategy.creator.name}</p>
            <p className="text-muted-foreground text-xs">{strategy.creator.handle}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {strategy.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface StrategyListPageProps {
  className?: string;
}

export function StrategyListPage({ className }: StrategyListPageProps) {
  const router = useRouter();
  const { data: strategies, isLoading, error } = useStrategies();

  const handleStrategyClick = (strategyId: string) => {
    router.push(`/strategies/${strategyId}`);
  };

  if (isLoading) {
    return (
      <div className={cn("space-y-6 p-6", className)}>
        <div className="space-y-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-6 w-96" />
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("flex flex-col items-center justify-center p-12", className)}>
        <p className="text-destructive text-lg">Failed to load strategies</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6 p-6", className)}>
      {/* Header */}
      <div className="space-y-2">
        <h1 className="font-bold text-4xl">Strategies</h1>
        <p className="text-muted-foreground text-lg">
          Discover and execute yield strategies powered by AI agents
        </p>
      </div>

      {/* Strategies Grid */}
      {strategies && strategies.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {strategies.map((strategy) => (
            <StrategyCard
              key={strategy.id}
              strategy={strategy}
              onClick={() => handleStrategyClick(strategy.id)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground text-lg">No strategies found</p>
        </div>
      )}
    </div>
  );
}
