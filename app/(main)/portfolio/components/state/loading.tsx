import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface LoadingStateProps {
  message?: string;
}

function PortfolioStatsSkeleton() {
  return (
    <Card className="border-border/50">
      <CardContent className="p-3 sm:p-4 md:p-5 lg:p-6">
        {/* Header with title and refresh button */}
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <Skeleton className="h-4 sm:h-5 w-24 sm:w-28" />
          <Skeleton className="h-8 w-8 sm:h-9 sm:w-9 rounded-md" />
        </div>

        {/* Net Worth Value */}
        <div className="flex items-baseline gap-2 mb-1">
          <Skeleton className="h-6 sm:h-7 md:h-8 w-32 sm:w-40 md:w-48" />
        </div>
        <div className="flex items-center gap-2 mb-4 sm:mb-6">
          <Skeleton className="h-4 sm:h-5 w-20 sm:w-24" />
          <Skeleton className="h-4 sm:h-5 w-12 sm:w-16" />
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pb-4 sm:pb-6 border-b border-border">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-1 sm:space-y-1.5">
              <Skeleton className="h-3 sm:h-4 w-16 sm:w-20" />
              <Skeleton className="h-5 sm:h-6 w-24 sm:w-28" />
              <Skeleton className="h-2.5 sm:h-3 w-14 sm:w-16" />
            </div>
          ))}
        </div>

        {/* Risk Distribution */}
        <div className="mt-4 sm:mt-6">
          <Skeleton className="h-4 sm:h-5 w-28 sm:w-36 mb-3 sm:mb-4" />

          {/* Distribution Bar */}
          <Skeleton className="h-2.5 sm:h-3 w-full rounded-full mb-3 sm:mb-4" />

          {/* Legend */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-1.5 sm:gap-2">
                <Skeleton className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <Skeleton className="h-2.5 sm:h-3 w-12 sm:w-16 mb-0.5 sm:mb-1" />
                  <Skeleton className="h-3 sm:h-4 w-10 sm:w-12" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AnalyticsCardSkeleton() {
  return (
    <Card className="border-border/50">
      <CardContent className="p-3 sm:p-4 md:p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <Skeleton className="h-4 sm:h-5 w-28 sm:w-36" />
          <Skeleton className="h-3.5 w-3.5 sm:h-4 sm:w-4 rounded" />
        </div>

        {/* Content */}
        <div className="space-y-4 sm:space-y-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="space-y-1 sm:space-y-1.5">
                <Skeleton className="h-2.5 sm:h-3 w-16 sm:w-20" />
                <Skeleton className="h-4 sm:h-5 w-24 sm:w-28" />
              </div>
              <Skeleton className="h-7 w-14 sm:h-8 sm:w-16 rounded-md" />
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 sm:h-4 w-20 sm:w-24" />
            <Skeleton className="h-3 sm:h-4 w-24 sm:w-32" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TokenBreakdownSkeleton() {
  return (
    <Card className="border-border/50">
      <CardContent className="p-3 sm:p-4 md:p-5">
        {/* Tabs */}
        <div className="mb-8 sm:mb-10 md:mb-14">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-1 bg-muted/50 p-1 rounded-lg">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-0.5 py-1 px-1 sm:px-2">
                <Skeleton className="h-3 sm:h-4 w-12 sm:w-16" />
                <Skeleton className="h-2 sm:h-3 w-16 sm:w-24" />
              </div>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-lg border border-border bg-card max-h-[150px] sm:max-h-[200px]">
          <table className="w-full border-collapse min-w-[500px] sm:min-w-full">
            <thead className="sticky top-0 bg-card z-10">
              <tr className="border-b border-border">
                {["Token", "Price / 24h", "Holdings / Value"].map((col, idx) => (
                  <th
                    key={col}
                    className={`py-2 sm:py-2.5 px-2 sm:px-3 text-[10px] sm:text-xs font-medium ${
                      idx === 0 ? "text-left" : "text-right"
                    }`}
                    scope="col"
                  >
                    <div className={`flex ${idx === 0 ? "" : "justify-end"}`}>
                      <Skeleton className="h-3 sm:h-4 w-16 sm:w-20" />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="hover:bg-muted/50 transition-colors">
                  <td className="py-2 px-2 sm:px-3">
                    <div className="flex items-center gap-1.5 sm:gap-2.5">
                      <div className="flex flex-col gap-1 min-w-0">
                        <div className="flex items-center gap-1 sm:gap-1.5">
                          <Skeleton className="h-3 sm:h-4 w-10 sm:w-12" />
                          <Skeleton className="h-3 sm:h-4 w-12 sm:w-14 rounded-full" />
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-2 px-2 sm:px-3">
                    <div className="flex flex-col items-end gap-1">
                      <Skeleton className="h-3 sm:h-4 w-12 sm:w-16" />
                      <Skeleton className="h-2 sm:h-3 w-10 sm:w-12" />
                    </div>
                  </td>
                  <td className="py-2 px-2 sm:px-3">
                    <div className="flex flex-col items-end gap-1">
                      <Skeleton className="h-3 sm:h-4 w-16 sm:w-20" />
                      <Skeleton className="h-2 sm:h-3 w-12 sm:w-16" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

export function LoadingState({ message = "Loading portfolio data..." }: LoadingStateProps) {
  return (
    <div className="mx-auto w-full max-w-7xl">
      <div className="h-[calc(100vh-70px)] overflow-y-auto px-4 py-6 md:px-6">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Main Portfolio Stats */}
            <PortfolioStatsSkeleton />

            {/* Analytics Row */}
            <div className="flex flex-col gap-4">
              <AnalyticsCardSkeleton />
              <AnalyticsCardSkeleton />
            </div>
          </div>

          {/* Token Breakdown Table */}
          <TokenBreakdownSkeleton />

          <p className="text-center text-muted-foreground text-sm animate-pulse" role="status">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}
