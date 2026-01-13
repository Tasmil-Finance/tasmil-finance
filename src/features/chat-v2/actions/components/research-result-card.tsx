"use client";

import { memo, useRef, useEffect, useCallback } from "react";
import { TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ResearchResultCardProps {
  toolName: string;
  args?: Record<string, any>;
  result: string | null;
  status: "pending" | "executing" | "complete" | "error";
}

// Format large numbers
const formatNumber = (num: number | undefined | null): string => {
  if (num === undefined || num === null) return "N/A";
  if (num >= 1e12) return `${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
  return `${num.toFixed(2)}`;
};

// Price change indicator
const PriceChange = ({ value }: { value: number | undefined | null }) => {
  if (value === undefined || value === null) return <span className="text-muted-foreground">N/A</span>;
  
  const isPositive = value >= 0;
  const Icon = isPositive ? TrendingUp : TrendingDown;
  
  return (
    <span className={cn("flex items-center gap-1", isPositive ? "text-green-500" : "text-red-500")}>
      <Icon className="h-3 w-3" />
      {value >= 0 ? "+" : ""}{value.toFixed(2)}%
    </span>
  );
};

// Global scroll position store - persists across re-renders
const scrollPositions = new Map<string, number>();

// Custom hook for scroll preservation with global store
function useScrollPreservation(id: string) {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Restore scroll position on mount
  useEffect(() => {
    const el = scrollRef.current;
    const savedPos = scrollPositions.get(id);
    if (el && savedPos !== undefined && savedPos > 0) {
      requestAnimationFrame(() => {
        el.scrollTop = savedPos;
      });
    }
  }, [id]);
  
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    scrollPositions.set(id, e.currentTarget.scrollTop);
  }, [id]);
  
  return { scrollRef, handleScroll };
}

// Crypto Price Result
const CryptoPriceResult = memo(({ data }: { data: any }) => {
  const coin = data.coin || data;
  
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <span className="font-semibold text-lg">{coin.name}</span>
          <span className="text-muted-foreground ml-2">({coin.symbol})</span>
        </div>
        <span className="text-xl font-bold">${coin.currentPrice?.toLocaleString()}</span>
      </div>
      
      <div className="grid grid-cols-3 gap-2 text-sm">
        <div className="bg-muted/30 rounded p-2">
          <div className="text-muted-foreground text-xs">24h</div>
          <PriceChange value={coin.priceChange24h} />
        </div>
        <div className="bg-muted/30 rounded p-2">
          <div className="text-muted-foreground text-xs">7d</div>
          <PriceChange value={coin.priceChange7d} />
        </div>
        <div className="bg-muted/30 rounded p-2">
          <div className="text-muted-foreground text-xs">30d</div>
          <PriceChange value={coin.priceChange30d} />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-muted-foreground">Market Cap:</span>
          <span className="ml-2 font-medium">{formatNumber(coin.marketCap)}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Rank:</span>
          <span className="ml-2 font-medium">#{coin.marketCapRank}</span>
        </div>
      </div>
    </div>
  );
});
CryptoPriceResult.displayName = 'CryptoPriceResult';

// Format price with proper handling
const formatPrice = (price: number | string | undefined | null): string => {
  if (price === undefined || price === null) return "N/A";
  const numPrice = typeof price === "string" ? parseFloat(price) : price;
  if (isNaN(numPrice)) return "N/A";
  if (numPrice < 0.01) return `${numPrice.toFixed(6)}`;
  if (numPrice < 1) return `${numPrice.toFixed(4)}`;
  return `${numPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Top Coins Result
const TopCoinsResult = memo(({ data, scrollId }: { data: any; scrollId: string }) => {
  const coins = data.topCoins || data.trendingCoins || data.coins || data.results || [];
  const { scrollRef, handleScroll } = useScrollPreservation(scrollId);
  
  return (
    <div className="space-y-2">
      <div className="text-sm text-muted-foreground mb-2">
        Showing top {coins.length} coins by market cap
      </div>
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="max-h-[300px] overflow-y-auto space-y-1" 
        data-scrollable="true"
      >
        {coins.slice(0, 15).map((coin: any, index: number) => (
          <div key={`coin-${coin.id || index}-${coin.symbol}`} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground w-6 text-xs">#{coin.rank || coin.marketCapRank || index + 1}</span>
              <span className="font-medium">{coin.symbol?.toUpperCase()}</span>
              <span className="text-muted-foreground text-xs hidden sm:inline">{coin.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-medium">{formatPrice(coin.currentPrice || coin.current_price || coin.price)}</span>
              <PriceChange value={coin.priceChange24h || coin.price_change_percentage_24h || coin.priceChange} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});
TopCoinsResult.displayName = 'TopCoinsResult';

// Global Market Data Result
const GlobalMarketResult = memo(({ data }: { data: any }) => {
  const market = data.globalMarket || data;
  
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="bg-muted/30 rounded p-3">
          <div className="text-muted-foreground text-xs">Total Market Cap</div>
          <div className="font-bold text-lg">${formatNumber(market.totalMarketCap)}</div>
        </div>
        <div className="bg-muted/30 rounded p-3">
          <div className="text-muted-foreground text-xs">24h Volume</div>
          <div className="font-bold text-lg">${formatNumber(market.totalVolume24h)}</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-muted-foreground">BTC Dominance:</span>
          <span className="ml-2 font-medium">{market.btcDominance?.toFixed(1)}%</span>
        </div>
        <div>
          <span className="text-muted-foreground">ETH Dominance:</span>
          <span className="ml-2 font-medium">{market.ethDominance?.toFixed(1)}%</span>
        </div>
      </div>
      <div className="text-sm">
        <span className="text-muted-foreground">24h Change:</span>
        <PriceChange value={market.marketCapChange24h} />
      </div>
    </div>
  );
});
GlobalMarketResult.displayName = 'GlobalMarketResult';

// Loading state
const LoadingState = ({ toolName }: { toolName: string }) => (
  <div className="flex items-center gap-2 text-muted-foreground">
    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    <span>Fetching {toolName.replace(/_/g, " ")}...</span>
  </div>
);

// Error state
const ErrorState = ({ error }: { error: string }) => (
  <div className="flex items-center gap-2 text-red-500">
    <AlertCircle className="h-4 w-4" />
    <span>{error}</span>
  </div>
);

// Generic Result (fallback)
const GenericResult = ({ data }: { data: any }) => {
  const summary = data.success !== undefined ? (
    <div className="text-sm">
      <span className={data.success ? "text-green-500" : "text-red-500"}>
        {data.success ? "✓ Success" : "✗ Failed"}
      </span>
      {data.error && <span className="text-red-500 ml-2">{data.error}</span>}
    </div>
  ) : null;
  
  return (
    <div className="space-y-2">
      {summary}
      <div className="text-xs text-muted-foreground">
        Data received. Check AI response for details.
      </div>
    </div>
  );
};

function ResearchResultCardComponent({ toolName, result, status }: ResearchResultCardProps) {
  if (status === "executing" || status === "pending") {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <LoadingState toolName={toolName} />
      </div>
    );
  }

  if (!result) return null;

  // Parse result if it's a string
  let data: any;
  try {
    data = typeof result === "string" ? JSON.parse(result) : result;
  } catch {
    data = { raw: result };
  }

  if (data.error || data.success === false) {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-4">
        <ErrorState error={data.error || "Operation failed"} />
      </div>
    );
  }

  const renderContent = () => {
    const dataHash = JSON.stringify(data).slice(0, 50);
    const scrollId = `${toolName}-${dataHash}`;
    
    switch (toolName) {
      case "research_get_crypto_price":
        return <CryptoPriceResult data={data} />;
      case "research_get_top_coins":
      case "research_get_trending_coins":
        return <TopCoinsResult data={data} scrollId={scrollId} />;
      case "research_get_global_market_data":
        return <GlobalMarketResult data={data} />;
      case "research_search_coins":
        return <TopCoinsResult data={data} scrollId={scrollId} />;
      case "research_get_defi_tvl":
      case "research_get_crypto_news":
        return <GenericResult data={data} />;
      default:
        return <GenericResult data={data} />;
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      {renderContent()}
    </div>
  );
}

export const ResearchResultCard = memo(ResearchResultCardComponent);
