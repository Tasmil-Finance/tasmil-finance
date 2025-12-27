"use client";

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/card";
import { formatNumber } from "@/lib/helper";

export type TimeRange = "1D" | "3D" | "5D" | "1W" | "1M" | "3M" | "6M" | "1Y";

const TIME_RANGES: TimeRange[] = [
  "1D",
  "3D",
  "5D",
  "1W",
  "1M",
  "3M",
  "6M",
  "1Y",
];

type TokenChartProps = {
  data: {
    timestamp: number;
    price: number;
  }[];
  symbol: string;
  currentPrice: number;
  priceChange: number;
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
};

export function TokenChart({
  data,
  currentPrice,
  priceChange,
  timeRange,
  onTimeRangeChange,
}: TokenChartProps) {
  const isPositive = priceChange >= 0;

  // Format time based on time range
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);

    switch (timeRange) {
      case "1D":
        return date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
      case "3D":
      case "5D":
        return date.toLocaleDateString([], { month: "short", day: "numeric" });
      case "1W":
        return date.toLocaleDateString([], { month: "short", day: "numeric" });
      case "1M":
      case "3M":
        return date.toLocaleDateString([], { month: "short", day: "numeric" });
      case "6M":
      case "1Y":
        return date.toLocaleDateString([], { month: "short", year: "2-digit" });
      default:
        return date.toLocaleDateString();
    }
  };

  return (
    <Card className="relative overflow-hidden border-slate-700/50 bg-gray-950 backdrop-blur-sm">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(6,182,212,0.1),transparent)] opacity-50" />

      <div className="relative p-8">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div className="space-y-2">
            <h2 className="font-bold text-4xl text-white">
              ${formatNumber(currentPrice)}
            </h2>
            <div className="flex items-center gap-3">
              <span
                className={`font-semibold text-lg ${
                  isPositive ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {isPositive ? "+" : "-"}${formatNumber(Math.abs(priceChange))} (
                {Math.abs((priceChange / currentPrice) * 100).toFixed(2)}%)
              </span>
              <span className="text-slate-400 text-sm">Past {timeRange}</span>
            </div>
          </div>

          {/* Time Range Buttons */}
          <div className="flex gap-1 rounded-lg border border-slate-700/50 bg-slate-800/50 p-1">
            {TIME_RANGES.map((range) => (
              <button
                className={`rounded-md px-3 py-2 font-medium text-sm transition-all duration-200 ${
                  timeRange === range
                    ? "bg-primary text-white shadow-lg shadow-primary/25"
                    : "text-slate-400 hover:bg-slate-700/50 hover:text-white"
                }`}
                key={range}
                onClick={() => onTimeRangeChange(range)}
                type="button"
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {/* Chart */}
        <div className="relative h-[400px]">
          <ResponsiveContainer height="100%" width="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={isPositive ? "#10b981" : "#ef4444"}
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor={isPositive ? "#10b981" : "#ef4444"}
                    stopOpacity={0.01}
                  />
                </linearGradient>
              </defs>
              <XAxis
                axisLine={false}
                dataKey="timestamp"
                domain={["dataMin", "dataMax"]}
                fontSize={12}
                stroke="#64748b"
                tickFormatter={formatTime}
                tickLine={false}
                type="number"
              />
              <YAxis
                axisLine={false}
                domain={["dataMin", "dataMax"]}
                fontSize={12}
                stroke="#64748b"
                tickFormatter={(value) => `$${formatNumber(value)}`}
                tickLine={false}
                width={80}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-lg border border-slate-700/50 bg-slate-800/95 p-4 shadow-xl backdrop-blur-sm">
                        <p className="font-semibold text-lg text-white">
                          ${formatNumber(payload[0].value as number)}
                        </p>
                        <p className="text-slate-400 text-sm">
                          {new Date(
                            payload[0].payload.timestamp
                          ).toLocaleString()}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                dataKey="price"
                dot={false}
                fill="url(#colorGradient)"
                stroke={isPositive ? "#10b981" : "#ef4444"}
                strokeWidth={3}
                type="monotone"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  );
}
