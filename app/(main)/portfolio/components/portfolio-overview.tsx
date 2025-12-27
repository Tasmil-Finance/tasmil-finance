import { Card, CardContent } from "@/components/ui/card";
import { PortfolioStats, RiskProfile } from "@/types/portfolio";
import { RefreshCw, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatPercentage } from "@/lib/number-utils";

interface PortfolioStatsCardProps {
  stats: PortfolioStats;
  riskProfile: RiskProfile;
  fetchPortfolioData: () => void;
  isLoading: boolean;
  isFetchingPrices?: boolean;
}

const DISTRIBUTION = [
  {
    key: "largeCap",
    label: "ETH/BNB",
    color: "from-[#52e5ff] to-[#36b1ff]",
    getValue: (r: RiskProfile) => r.largeCap,
    legend: (v: number) => `ETH/BNB ${v.toFixed(1)}%`,
  },
  {
    key: "stablecoins",
    label: "Stablecoins",
    color: "from-[#10b981] to-[#059669]",
    getValue: (r: RiskProfile) => r.stablecoins,
    legend: (v: number) => `Stablecoins ${v.toFixed(1)}%`,
  },
  {
    key: "smallCap",
    label: "U2U",
    color: "from-[#b5eaff] to-[#00bfff]",
    getValue: (r: RiskProfile) => r.smallCap,
    legend: (v: number) => `U2U ${v.toFixed(1)}%`,
  },
];

export function PortfolioStatsCard({
  stats,
  riskProfile,
  fetchPortfolioData,
  isLoading,
  isFetchingPrices = false,
}: PortfolioStatsCardProps) {
  const segments = DISTRIBUTION.filter((d) => d.getValue(riskProfile) > 0);
  const isRefreshing = isLoading || isFetchingPrices;

  return (
    <Card className="border-border/50 bg-card rounded-xl">
      <CardContent className="p-4 sm:p-5">
        {/* Header with Refresh */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Wallet className="w-4 h-4 text-blue-500" />
            </div>
            <div>
              <span className="text-sm text-muted-foreground font-medium">Portfolio</span>
              {isFetchingPrices && (
                <span className="text-xs text-muted-foreground/70 ml-2 animate-pulse">
                  Updating...
                </span>
              )}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchPortfolioData}
            disabled={isRefreshing}
            className="gap-2 h-8"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin")} />
          </Button>
        </div>

        {/* Net Worth */}
        <div className="mb-6">
          <div className="text-xs text-muted-foreground mb-1">Net Worth</div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-foreground">
              {formatCurrency(stats.netWorth)}
            </span>
            {stats.netWorthChangePercent !== 0 && (
              <div
                className={cn(
                  "flex items-center gap-1 text-sm font-medium",
                  stats.netWorthChangePercent > 0 ? "text-green-500" : "text-red-500"
                )}
              >
                {stats.netWorthChangePercent > 0 ? (
                  <TrendingUp className="w-3.5 h-3.5" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5" />
                )}
                {formatPercentage(stats.netWorthChangePercent)}
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats - Compact */}
        <div className="grid grid-cols-2 gap-3 mb-6 pb-6 border-b border-border/50">
          <QuickStat label="Assets" value={formatCurrency(stats.totalAssets)} />
          <QuickStat
            label="Claimable"
            value={formatCurrency(stats.claimable)}
            highlight={stats.claimable > 0}
          />
        </div>

        {/* Distribution Bar */}
        {segments.length > 0 && (
          <div className="space-y-3">
            <div className="text-xs font-medium text-muted-foreground">Distribution</div>
            <div className="h-2 bg-muted rounded-full overflow-hidden flex">
              {segments.map(({ key, color, getValue }) => (
                <div
                  key={key}
                  className={`bg-gradient-to-r ${color} h-full transition-all duration-300`}
                  style={{ width: `${getValue(riskProfile)}%` }}
                />
              ))}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {segments.map(({ key, color, legend, getValue }) => (
                <div key={key} className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 bg-gradient-to-r ${color} rounded-full`} />
                  <span className="text-xs text-muted-foreground">
                    {legend(getValue(riskProfile))}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function QuickStat({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div>
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div
        className={cn("text-sm font-semibold", highlight ? "text-green-500" : "text-foreground")}
      >
        {value}
      </div>
    </div>
  );
}
