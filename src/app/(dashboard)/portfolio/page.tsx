"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button-v2";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Percent,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
} from "lucide-react";

const portfolioData = [
  {
    symbol: "U2U",
    name: "U2U Network",
    amount: "1,250.00",
    value: "$3,750.00",
    change: "+8.5%",
    changeType: "positive" as const,
    allocation: 45.2,
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    amount: "2,500.00",
    value: "$2,500.00",
    change: "0.0%",
    changeType: "neutral" as const,
    allocation: 30.1,
  },
  {
    symbol: "ETH",
    name: "Ethereum",
    amount: "0.75",
    value: "$1,875.00",
    change: "-2.3%",
    changeType: "negative" as const,
    allocation: 22.6,
  },
  {
    symbol: "BTC",
    name: "Bitcoin",
    amount: "0.005",
    value: "$175.00",
    change: "+1.2%",
    changeType: "positive" as const,
    allocation: 2.1,
  },
];

const totalValue = portfolioData.reduce((sum, asset) => {
  return sum + parseFloat(asset.value.replace("$", "").replace(",", ""));
}, 0);

export default function PortfolioPage() {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Typography variant="h1" className="font-bold text-2xl">
            Portfolio
          </Typography>
          <Typography className="text-muted-foreground">
            Track your DeFi investments and performance
          </Typography>
        </div>
        <Button variant="gradient">
          <Plus className="mr-2 h-4 w-4" />
          Add Asset
        </Button>
      </div>

      {/* Portfolio Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">${totalValue.toLocaleString()}</div>
            <div className="flex items-center text-muted-foreground text-xs">
              <ArrowUpRight className="mr-1 h-3 w-3 text-green-500" />
              <span className="text-green-500">+12.5%</span>
              <span className="ml-1">24h</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">24h Change</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl text-green-500">+$1,045</div>
            <div className="flex items-center text-muted-foreground text-xs">
              <span>Previous: $7,255</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Assets</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{portfolioData.length}</div>
            <div className="flex items-center text-muted-foreground text-xs">
              <span>Across {portfolioData.length} tokens</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Best Performer</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">U2U</div>
            <div className="flex items-center text-muted-foreground text-xs">
              <ArrowUpRight className="mr-1 h-3 w-3 text-green-500" />
              <span className="text-green-500">+8.5%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Portfolio Breakdown */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Assets List */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Your Assets</CardTitle>
            <CardDescription>Current holdings and their performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {portfolioData.map((asset) => (
                <div
                  key={asset.symbol}
                  className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <span className="font-bold text-sm">{asset.symbol}</span>
                    </div>
                    <div>
                      <Typography className="font-medium">{asset.name}</Typography>
                      <Typography className="text-muted-foreground text-sm">
                        {asset.amount} {asset.symbol}
                      </Typography>
                    </div>
                  </div>

                  <div className="text-right">
                    <Typography className="font-medium">{asset.value}</Typography>
                    <div className="flex items-center gap-1">
                      {asset.changeType === "positive" ? (
                        <ArrowUpRight className="h-3 w-3 text-green-500" />
                      ) : asset.changeType === "negative" ? (
                        <ArrowDownRight className="h-3 w-3 text-red-500" />
                      ) : null}
                      <Typography
                        className={`text-sm ${
                          asset.changeType === "positive"
                            ? "text-green-500"
                            : asset.changeType === "negative"
                              ? "text-red-500"
                              : "text-muted-foreground"
                        }`}
                      >
                        {asset.change}
                      </Typography>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Allocation Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Asset Allocation</CardTitle>
            <CardDescription>Portfolio distribution by value</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {portfolioData.map((asset) => (
                <div key={asset.symbol} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{asset.symbol}</span>
                    <span className="text-muted-foreground">{asset.allocation}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-primary transition-all duration-300"
                      style={{ width: `${asset.allocation}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Manage your portfolio</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <Button variant="outline" className="h-20 flex-col gap-2">
              <Plus className="h-6 w-6" />
              <span>Buy More</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <TrendingDown className="h-6 w-6" />
              <span>Sell Assets</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <TrendingUp className="h-6 w-6" />
              <span>Rebalance</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <DollarSign className="h-6 w-6" />
              <span>Yield Farm</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
