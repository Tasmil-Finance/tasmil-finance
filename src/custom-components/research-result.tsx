"use client";

import { TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ResearchResultProps {
  result: any;
  toolType: string;
}

const formatNumber = (num: number | undefined | null): string => {
  if (num === undefined || num === null) return "N/A";
  if (num >= 1e12) return `${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
  return `${num.toFixed(2)}`;
};

const formatPercent = (num: number | undefined | null): string => {
  if (num === undefined || num === null) return "N/A";
  return `${num >= 0 ? "+" : ""}${num.toFixed(2)}%`;
};

const PriceChange = ({ value }: { value: number | undefined | null }) => {
  if (value === undefined || value === null) return <span className="text-muted-foreground">N/A</span>;
  
  const isPositive = value >= 0;
  const Icon = isPositive ? TrendingUp : TrendingDown;
  
  return (
    <span className={cn("flex items-center gap-1", isPositive ? "text-green-500" : "text-red-500")}>
      <Icon className="h-3 w-3" />
      {formatPercent(value)}
    </span>
  );
};

const CryptoPriceResult = ({ data }: { data: any }) => {
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
          <span className="ml-2 font-medium">${formatNumber(coin.marketCap)}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Rank:</span>
          <span className="ml-2 font-medium">#{coin.marketCapRank}</span>
        </div>
      </div>
    </div>
  );
};

const TopCoinsResult = ({ data }: { data: any }) => {
  const coins = data.topCoins || data.coins || [];
  
  return (
    <div className="space-y-2">
      <div className="text-sm text-muted-foreground mb-2">
        Showing top {coins.length} coins by market cap
      </div>
      <div className="max-h-[300px] overflow-y-auto space-y-1">
        {coins.slice(0, 10).map((coin: any, index: number) => (
          <div key={coin.id || index} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground w-6 text-xs">#{coin.rank || index + 1}</span>
              <span className="font-medium">{coin.symbol}</span>
              <span className="text-muted-foreground text-xs hidden sm:inline">{coin.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-medium">${coin.currentPrice?.toLocaleString()}</span>
              <PriceChange value={coin.priceChange24h} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const InvestmentScoreResult = ({ data }: { data: any }) => {
  const score = data.score || data;
  
  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case "strong_buy": return "text-green-500 bg-green-500/10";
      case "buy": return "text-green-400 bg-green-400/10";
      case "hold": return "text-yellow-500 bg-yellow-500/10";
      case "sell": return "text-red-400 bg-red-400/10";
      case "strong_sell": return "text-red-500 bg-red-500/10";
      default: return "text-muted-foreground bg-muted";
    }
  };
  
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <span className="font-semibold">{score.coinName || score.coinId}</span>
          <span className="text-muted-foreground ml-2">${score.currentPrice?.toLocaleString()}</span>
        </div>
        <div className={cn("px-3 py-1 rounded-full font-medium text-sm", getRecommendationColor(score.recommendation))}>
          {score.recommendation?.replace("_", " ").toUpperCase()}
        </div>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
        <div className="bg-muted/30 rounded p-2 text-center">
          <div className="text-muted-foreground text-xs">Overall</div>
          <div className="font-bold text-lg">{score.overallScore}</div>
        </div>
        <div className="bg-muted/30 rounded p-2 text-center">
          <div className="text-muted-foreground text-xs">Technical</div>
          <div className="font-medium">{score.technicalScore}</div>
        </div>
        <div className="bg-muted/30 rounded p-2 text-center">
          <div className="text-muted-foreground text-xs">Momentum</div>
          <div className="font-medium">{score.momentumScore}</div>
        </div>
        <div className="bg-muted/30 rounded p-2 text-center">
          <div className="text-muted-foreground text-xs">Risk</div>
          <div className="font-medium">{score.riskScore}</div>
        </div>
      </div>
      
      {score.reasoning && score.reasoning.length > 0 && (
        <div className="text-sm">
          <div className="text-muted-foreground text-xs mb-1">Key Insights:</div>
          <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
            {score.reasoning.slice(0, 3).map((reason: string, i: number) => (
              <li key={i}>{reason}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const ErrorResult = ({ error }: { error: string }) => (
  <div className="flex items-center gap-2 text-red-500">
    <AlertCircle className="h-4 w-4" />
    <span>{error}</span>
  </div>
);

export default function ResearchResult({ result, toolType }: ResearchResultProps) {
  if (!result) return null;
  
  if (result.error || result.success === false) {
    return (
        <ErrorResult error={result.error || "Operation failed"} />
    );
  }
  
  switch (toolType) {
    case "tool-getCryptoPrice":
      return (
          <CryptoPriceResult data={result} />
      );
    
    case "tool-getTopCoins":
    case "tool-getMultiplePrices":
    case "tool-getTrendingCoins":
      return (
          <TopCoinsResult data={result} />
      );
    
    case "tool-calculateInvestmentScore":
      return (
          <InvestmentScoreResult data={result} />
      );
    
    default:
      return (
        <div className="p-4 text-sm text-muted-foreground">
          Research data received. Check AI response for details.
        </div>
      );
  }
}
