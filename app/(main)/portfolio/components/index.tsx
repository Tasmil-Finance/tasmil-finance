"use client";

import { useAccount } from "wagmi";
import { usePortfolio } from "@/hooks/use-portfolio";
import { PerformanceAnalytics } from "./performance-analytics";
import { PortfolioInsights } from "./portfolio-insights";
import { PortfolioStatsCard } from "./portfolio-overview";
import { EmptyPortfolioState } from "./state/empty";
import { ErrorState } from "./state/error";
import { LoadingState } from "./state/loading";
import { NoWalletState } from "./state/no-wallet";
import TokenBreakdown from "./token-breakdown/token-breakdown";

const Portfolio = () => {
  const { isConnected } = useAccount();
  const {
    tokens,
    portfolioStats,
    riskProfile,
    isLoading,
    isFetchingPrices,
    hasData,
    error,
    refetch,
  } = usePortfolio();

  if (isLoading) {
    return <LoadingState />;
  }

  if (!isConnected) {
    return <NoWalletState />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={refetch} />;
  }

  if (!hasData || tokens.length === 0) {
    return <EmptyPortfolioState isLoading={isLoading} onRefresh={refetch} />;
  }

  return (
    <div className="mx-auto w-full max-w-7xl">
      <div className="h-[calc(100vh-70px)] overflow-y-auto px-4 py-6 md:px-6">
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <PortfolioStatsCard
              fetchPortfolioData={refetch}
              isFetchingPrices={isFetchingPrices}
              isLoading={isLoading}
              riskProfile={riskProfile}
              stats={portfolioStats}
            />

            {/* Analytics Row */}
            <div className="flex flex-col gap-4">
              <PerformanceAnalytics tokens={tokens} />
              <PortfolioInsights riskProfile={riskProfile} tokens={tokens} />
            </div>
          </div>
          {/* Main Portfolio Stats */}

          {/* Token Breakdown Table */}
          <TokenBreakdown tokens={tokens} />
        </div>
      </div>
    </div>
  );
};

export default Portfolio;
