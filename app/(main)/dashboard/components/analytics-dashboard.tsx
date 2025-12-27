"use client";

import { useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// Top Whale Wallets
const topWhales = [
  {
    rank: 1,
    address: "0x742d...9a2f",
    name: "Binance Hot Wallet",
    balance: "2,847,523",
    balanceUSD: "$4,234,285,000",
    change24h: "+2.3%",
    txCount: "1,234,567",
    lastActive: "2m ago",
    category: "Exchange",
    portfolioDistribution: [
      { token: "ETH", amount: "1,200,000", percentage: 42 },
      { token: "BTC", amount: "85,000", percentage: 30 },
      { token: "USDT", amount: "850M", percentage: 28 },
    ],
  },
  {
    rank: 2,
    address: "0x28c6...4f1b",
    name: "Vitalik Buterin",
    balance: "325,678",
    balanceUSD: "$485,234,000",
    change24h: "-0.8%",
    txCount: "45,234",
    lastActive: "5h ago",
    category: "Individual",
    portfolioDistribution: [
      { token: "ETH", amount: "245,000", percentage: 75 },
      { token: "Other", amount: "Various", percentage: 25 },
    ],
  },
  {
    rank: 3,
    address: "0xa9d1...8c3e",
    name: "Wrapped ETH",
    balance: "3,456,789",
    balanceUSD: "$5,145,678,000",
    change24h: "+5.2%",
    txCount: "2,345,678",
    lastActive: "1m ago",
    category: "Smart Contract",
    portfolioDistribution: [{ token: "WETH", amount: "3,456,789", percentage: 100 }],
  },
  {
    rank: 4,
    address: "0x5a3d...7b2c",
    name: "Crypto.com",
    balance: "1,234,567",
    balanceUSD: "$1,838,567,000",
    change24h: "+1.5%",
    txCount: "987,654",
    lastActive: "30s ago",
    category: "Exchange",
    portfolioDistribution: [
      { token: "ETH", amount: "800,000", percentage: 65 },
      { token: "USDC", amount: "432M", percentage: 35 },
    ],
  },
  {
    rank: 5,
    address: "0xf6da...3e9a",
    name: "Unknown Whale",
    balance: "892,345",
    balanceUSD: "$1,328,456,000",
    change24h: "+8.7%",
    txCount: "12,456",
    lastActive: "15m ago",
    category: "Unknown",
    portfolioDistribution: [
      { token: "ETH", amount: "650,000", percentage: 73 },
      { token: "DAI", amount: "240M", percentage: 27 },
    ],
  },
];

// Whale Activity Data (24h)
const whaleActivityData = [
  { time: "00:00", volume: 245000000, transactions: 145 },
  { time: "04:00", volume: 180000000, transactions: 98 },
  { time: "08:00", volume: 320000000, transactions: 234 },
  { time: "12:00", volume: 450000000, transactions: 312 },
  { time: "16:00", volume: 580000000, transactions: 456 },
  { time: "20:00", volume: 390000000, transactions: 289 },
];

// Token Holdings Distribution
const tokenHoldingsData = [
  { name: "ETH", value: 45, color: "#627EEA" },
  { name: "BTC", value: 25, color: "#F7931A" },
  { name: "USDT", value: 15, color: "#26A17B" },
  { name: "USDC", value: 10, color: "#2775CA" },
  { name: "Others", value: 5, color: "#8b5cf6" },
];

// Whale Flow (Inflow/Outflow)
const whaleFlowData = [
  { date: "Mon", inflow: 1200, outflow: 800 },
  { date: "Tue", inflow: 1500, outflow: 950 },
  { date: "Wed", inflow: 980, outflow: 1100 },
  { date: "Thu", inflow: 1800, outflow: 750 },
  { date: "Fri", inflow: 2100, outflow: 1200 },
  { date: "Sat", inflow: 1650, outflow: 890 },
  { date: "Sun", inflow: 1450, outflow: 1050 },
];

// Stats Cards Data
const statsCards = [
  {
    title: "Total Whale Holdings",
    value: "$12.53B",
    change: "+5.2%",
    isPositive: true,
    subtitle: "Top 100 wallets",
  },
  {
    title: "24h Whale Volume",
    value: "$2.16B",
    change: "+18.7%",
    isPositive: true,
    subtitle: "1,534 transactions",
  },
  {
    title: "Net Flow (24h)",
    value: "+$456M",
    change: "+23.4%",
    isPositive: true,
    subtitle: "Inflow dominant",
  },
  {
    title: "Active Whales",
    value: "847",
    change: "-2.1%",
    isPositive: false,
    subtitle: "Last 24 hours",
  },
];

export function AnalyticsDashboard() {
  const [selectedWhale, setSelectedWhale] = useState<number | null>(null);

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case "Exchange":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "Individual":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "Smart Contract":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">🐋 Whale Tracker Dashboard</h1>
          <p className="text-slate-400 mt-1">
            Monitor top wallet holders and on-chain whale activities
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm text-slate-300">Live</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, index) => (
          <div
            key={index}
            className="rounded-xl border border-slate-700/50 bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm p-6 hover:border-slate-600/50 transition-all"
          >
            <p className="text-slate-400 text-sm font-medium">{stat.title}</p>
            <div className="mt-2 flex items-end justify-between">
              <h3 className="text-2xl font-bold text-white">{stat.value}</h3>
              <span
                className={`text-sm font-medium ${
                  stat.isPositive ? "text-green-400" : "text-red-400"
                }`}
              >
                {stat.change}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-2">{stat.subtitle}</p>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Whale Activity Chart */}
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Whale Activity (24h)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={whaleActivityData}>
              <defs>
                <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="time" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                }}
                formatter={(value: number) => [`$${(value / 1000000).toFixed(2)}M`, "Volume"]}
              />
              <Area
                type="monotone"
                dataKey="volume"
                stroke="#3b82f6"
                fillOpacity={1}
                fill="url(#colorVolume)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Token Holdings Distribution */}
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Token Holdings Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={tokenHoldingsData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {tokenHoldingsData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Whale Flow */}
        {/* <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-white mb-4">Whale Flow (Inflow vs Outflow)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={whaleFlowData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                }}
                formatter={(value: number) => [`$${value}M`, ""]}
              />
              <Legend />
              <Bar dataKey="inflow" fill="#10b981" radius={[8, 8, 0, 0]} />
              <Bar dataKey="outflow" fill="#ef4444" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div> */}
      </div>

      {/* Top Whales Table */}
      <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Top 5 Whales</h3>
          <button className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
            View All →
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Rank</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Wallet</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Category</th>
                <th className="text-right py-3 px-4 text-slate-400 font-medium">Balance (USD)</th>
                <th className="text-right py-3 px-4 text-slate-400 font-medium">24h Change</th>
                <th className="text-right py-3 px-4 text-slate-400 font-medium">Transactions</th>
                <th className="text-right py-3 px-4 text-slate-400 font-medium">Last Active</th>
              </tr>
            </thead>
            <tbody>
              {topWhales.map((whale) => (
                <tr
                  key={whale.rank}
                  className={`border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors cursor-pointer ${
                    selectedWhale === whale.rank ? "bg-slate-700/30" : ""
                  }`}
                  onClick={() => setSelectedWhale(selectedWhale === whale.rank ? null : whale.rank)}
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30">
                      <span className="text-sm font-bold text-yellow-400">#{whale.rank}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div>
                      <div className="font-semibold text-white">{whale.name}</div>
                      <div className="text-sm text-slate-400 font-mono">{whale.address}</div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={`px-2 py-1 rounded-md text-xs font-medium border ${getCategoryBadgeColor(
                        whale.category
                      )}`}
                    >
                      {whale.category}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="font-bold text-white">{whale.balanceUSD}</div>
                    <div className="text-sm text-slate-400">{whale.balance} ETH</div>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <span
                      className={`font-semibold ${
                        whale.change24h.startsWith("+") ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {whale.change24h}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right text-slate-300">{whale.txCount}</td>
                  <td className="py-4 px-4 text-right text-slate-400">{whale.lastActive}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Expanded Whale Details */}
        {selectedWhale !== null && (
          <div className="mt-6 p-4 rounded-lg bg-slate-900/50 border border-slate-700/50">
            <h4 className="text-sm font-semibold text-white mb-3">
              Portfolio Distribution - {topWhales[selectedWhale - 1]?.name}
            </h4>
            <div className="space-y-2">
              {topWhales[selectedWhale - 1]?.portfolioDistribution.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-slate-300">{item.token}</span>
                      <span className="text-sm text-slate-400">
                        {item.amount} ({item.percentage}%)
                      </span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
