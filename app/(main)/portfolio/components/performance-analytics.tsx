"use client";

import { Card, CardContent } from "@/components/ui/card";
import { TokenData } from "@/types/portfolio";
import { TrendingUp, TrendingDown } from "lucide-react";
import { formatPercentage } from "@/lib/number-utils";

interface PerformanceAnalyticsProps {
  tokens: TokenData[];
}

export function PerformanceAnalytics({ tokens }: PerformanceAnalyticsProps) {
  // Sort tokens by 24h change
  const sortedByChange = [...tokens].sort(
    (a, b) => b.change24h - a.change24h
  );

  const topGainer = sortedByChange[0];
  const topLoser = sortedByChange[sortedByChange.length - 1];

  const gainersCount = tokens.filter((t) => t.change24h > 0).length;
  const losersCount = tokens.filter((t) => t.change24h < 0).length;
  const winRate = tokens.length > 0 ? ((gainersCount / tokens.length) * 100).toFixed(0) : 0;

  return (
    <Card className="border-border/50">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-base">24h Performance</h3>
            <p className="text-xs text-muted-foreground">
              {gainersCount} up, {losersCount} down • {winRate}% win rate
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Top Gainer */}
          <div className="p-3 rounded-lg border border-green-500/20 bg-green-500/5">
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingUp className="w-3.5 h-3.5 text-green-500" />
              <span className="text-xs text-muted-foreground">Top Gainer</span>
            </div>
            {topGainer && topGainer.change24h > 0 ? (
              <>
                <div className="text-sm font-semibold text-foreground mb-0.5">
                  {topGainer.symbol}
                </div>
                <div className="text-lg font-bold text-green-500">
                  {formatPercentage(topGainer.change24h)}
                </div>
              </>
            ) : (
              <span className="text-xs text-muted-foreground">No gainers</span>
            )}
          </div>

          {/* Top Loser */}
          <div className="p-3 rounded-lg border border-red-500/20 bg-red-500/5">
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingDown className="w-3.5 h-3.5 text-red-500" />
              <span className="text-xs text-muted-foreground">Top Loser</span>
            </div>
            {topLoser && topLoser.change24h < 0 ? (
              <>
                <div className="text-sm font-semibold text-foreground mb-0.5">
                  {topLoser.symbol}
                </div>
                <div className="text-lg font-bold text-red-500">
                  {formatPercentage(topLoser.change24h)}
                </div>
              </>
            ) : (
              <span className="text-xs text-muted-foreground">No losers</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
