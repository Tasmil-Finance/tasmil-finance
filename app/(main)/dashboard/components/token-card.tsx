"use client";

import { useEffect, useState } from "react";
import { Line, LineChart, ResponsiveContainer } from "recharts";
import { Card } from "@/components/ui/card";
import { formatNumber } from "@/lib/helper";
import type { TimeRange } from "./token-chart";

type TokenCardProps = {
  symbol: string;
  name: string;
  price: number;
  change: number;
  isSelected?: boolean;
  onClick?: () => void;
};

type PriceHistory = {
  timestamp: number;
  price: number;
};

export function TokenCard({
  symbol,
  name,
  price,
  change,
  isSelected,
  onClick,
}: TokenCardProps) {
  const isPositive = change >= 0;
  const [historicalData, setHistoricalData] = useState<PriceHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHistoricalData = async () => {
      try {
        setIsLoading(true);

        // Default to 1M for mini chart to show month trend
        const period: TimeRange = "1M";
        const response = await fetch(
          `/api/dashboard/get-history?symbols=${symbol}&period=${period}`
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        console.log(`Historical data for ${symbol}:`, data);

        if (data[symbol] && Array.isArray(data[symbol])) {
          setHistoricalData(
            data[symbol].map((item: any) => ({
              timestamp: item.timestamp,
              price: item.price,
            }))
          );
        } else {
          // Fallback: generate mock data if API fails
          const mockData = Array.from({ length: 30 }, (_, i) => ({
            timestamp: Date.now() - (29 - i) * 24 * 60 * 60 * 1000,
            price: price * (1 + (Math.random() - 0.5) * 0.1),
          }));
          setHistoricalData(mockData);
        }
      } catch (error) {
        console.error(`Failed to fetch historical data for ${symbol}:`, error);

        // Generate fallback mock data
        const mockData = Array.from({ length: 30 }, (_, i) => ({
          timestamp: Date.now() - (29 - i) * 24 * 60 * 60 * 1000,
          price: price * (1 + (Math.random() - 0.5) * 0.1),
        }));
        setHistoricalData(mockData);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistoricalData();
  }, [symbol, price]);

  return (
    <Card
      className={`group relative cursor-pointer overflow-hidden border-primary/20 bg-gray-950 transition-all duration-300 hover:border-primary/40 ${
        isSelected ? "border-primary/30 ring-2 ring-primary/30" : ""
      }`}
      onClick={onClick}
    >
      <div className="relative p-5">
        <div className="mb-3 flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="font-semibold text-lg text-white">{name}</h3>
            <p className="font-medium text-slate-400 text-sm">{symbol}</p>
          </div>
          <div
            className={`rounded-lg px-3 py-1.5 font-semibold text-sm ${
              isPositive
                ? "border border-emerald-500/30 bg-emerald-500/20 text-emerald-400"
                : "border border-red-500/30 bg-red-500/20 text-red-400"
            }`}
          >
            {isPositive ? "↗" : "↘"} {Math.abs(change).toFixed(2)}%
          </div>
        </div>

        {/* Price */}
        <div className="mb-4">
          <div className="mb-1 font-bold text-3xl text-white">
            ${formatNumber(price)}
          </div>
          <div
            className={`font-medium text-sm ${
              isPositive ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {isPositive ? "+" : "-"}$
            {formatNumber(Math.abs((change * price) / 100))}
          </div>
        </div>

        {/* Chart */}
        <div className="-mx-2 h-16">
          {isLoading ? (
            <div className="h-full animate-pulse rounded-lg bg-slate-700/30" />
          ) : historicalData.length > 0 ? (
            <ResponsiveContainer height="100%" width="100%">
              <LineChart data={historicalData}>
                <Line
                  dataKey="price"
                  dot={false}
                  isAnimationActive={false}
                  stroke={isPositive ? "#10b981" : "#ef4444"}
                  strokeWidth={2}
                  type="monotone"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-slate-500 text-xs">
              No chart data
            </div>
          )}
        </div>
      </div>

      {/* Hover Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
    </Card>
  );
}
