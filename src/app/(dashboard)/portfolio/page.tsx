"use client";

import {
  ArrowDownRight,
  ArrowUpRight,
  Copy,
  DollarSign,
  Percent,
  Plus,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/ui/button-v2";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Typography } from "@/shared/ui/typography";
import { useEffect, useState } from "react";
import { getSmartAccount } from "@/features/smart-wallet/get-account";
import { getAssetBalances, type AssetBalance } from "@/features/smart-wallet/get-assets";
import Image from "next/image";

export default function PortfolioPage() {
  const [assets, setAssets] = useState<AssetBalance[]>([]);
  const [smartWalletAddress, setSmartWalletAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const fetchAccount = async () => {
    try {
      const account = await getSmartAccount();
      
      if (account.address) {
        setSmartWalletAddress(account.address);
        const balances = await getAssetBalances(account.address);
        setAssets(balances);
      }
    } catch (error) {
      console.error('Error fetching account:', error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchAccount();
  }, []);

  const totalValue = assets.reduce((sum, asset) => sum + (asset.valueUsd || 0), 0);
  const total24hChange = assets.reduce((sum, asset) => {
    const value = asset.valueUsd || 0;
    const change = asset.change24h || 0;
    return sum + (value * change / 100);
  }, 0);
  const changePercent = totalValue > 0 ? (total24hChange / (totalValue - total24hChange)) * 100 : 0;
  const bestPerformer = assets.reduce((best, asset) => 
    (!best || (asset.change24h || 0) > (best.change24h || 0)) ? asset : best
  , assets[0]);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <Typography variant="h1" className="font-bold text-2xl">
            Portfolio
          </Typography>
          <Typography className="text-muted-foreground">
            Track your DeFi investments and performance
          </Typography>
          
          {smartWalletAddress && (
            <div className="pt-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-muted/30 pl-3 pr-1 py-1 backdrop-blur-sm transition-all hover:bg-muted/50">
                  <div className="flex items-center gap-2">
                    <div className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">Smart Wallet</span>
                  </div>
                  <div className="mx-1 h-3 w-[1px] bg-border" />
                  <span className="font-mono text-xs text-foreground/80">
                    {smartWalletAddress.slice(0, 6)}...{smartWalletAddress.slice(-4)}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 ml-1 text-muted-foreground hover:text-foreground"
                    onClick={() => {
                        navigator.clipboard.writeText(smartWalletAddress);
                        toast.success("Address copied to clipboard");
                    }}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
            </div>
          )}
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
            {isLoading ? (
              <div className="font-bold text-2xl">Loading...</div>
            ) : (
              <>
                <div className="font-bold text-2xl">${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                <div className="flex items-center text-muted-foreground text-xs">
                  {changePercent >= 0 ? (
                    <ArrowUpRight className="mr-1 h-3 w-3 text-green-500" />
                  ) : (
                    <ArrowDownRight className="mr-1 h-3 w-3 text-red-500" />
                  )}
                  <span className={changePercent >= 0 ? "text-green-500" : "text-red-500"}>
                    {changePercent >= 0 ? "+" : ""}{changePercent.toFixed(2)}%
                  </span>
                  <span className="ml-1">24h</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">24h Change</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="font-bold text-2xl">Loading...</div>
            ) : (
              <>
                <div className={`font-bold text-2xl ${total24hChange >= 0 ? "text-green-500" : "text-red-500"}`}>
                  {total24hChange >= 0 ? "+" : ""}${Math.abs(total24hChange).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="flex items-center text-muted-foreground text-xs">
                  <span>Previous: ${(totalValue - total24hChange).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Assets</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{isLoading ? "..." : assets.length}</div>
            <div className="flex items-center text-muted-foreground text-xs">
              <span>Across {isLoading ? "..." : assets.length} tokens</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Best Performer</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="font-bold text-2xl">Loading...</div>
            ) : bestPerformer ? (
              <>
                <div className="font-bold text-2xl">{bestPerformer.symbol}</div>
                <div className="flex items-center text-muted-foreground text-xs">
                  {(bestPerformer.change24h || 0) >= 0 ? (
                    <ArrowUpRight className="mr-1 h-3 w-3 text-green-500" />
                  ) : (
                    <ArrowDownRight className="mr-1 h-3 w-3 text-red-500" />
                  )}
                  <span className={(bestPerformer.change24h || 0) >= 0 ? "text-green-500" : "text-red-500"}>
                    {(bestPerformer.change24h || 0) >= 0 ? "+" : ""}{(bestPerformer.change24h || 0).toFixed(2)}%
                  </span>
                </div>
              </>
            ) : (
              <div className="font-bold text-2xl">N/A</div>
            )}
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
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Typography className="text-muted-foreground">Loading assets...</Typography>
              </div>
            ) : assets.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <Typography className="text-muted-foreground">No assets found</Typography>
              </div>
            ) : (
              <div className="space-y-4">
                {assets.map((asset) => (
                  <div
                    key={asset.symbol}
                    className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      {asset.icon ? (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full overflow-hidden bg-primary/10">
                          <Image
                            src={asset.icon}
                            alt={asset.symbol}
                            width={40}
                            height={40}
                            className="rounded-full"
                          />
                        </div>
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                          <span className="font-bold text-sm">{asset.symbol}</span>
                        </div>
                      )}
                      <div>
                        <Typography className="font-medium">{asset.name}</Typography>
                        <Typography className="text-muted-foreground text-sm">
                          {parseFloat(asset.balance).toLocaleString(undefined, { maximumFractionDigits: 6 })} {asset.symbol}
                        </Typography>
                      </div>
                    </div>

                    <div className="text-right">
                      <Typography className="font-medium">
                        ${(asset.valueUsd || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </Typography>
                      <div className="flex items-center gap-1">
                        {(asset.change24h || 0) >= 0 ? (
                          <ArrowUpRight className="h-3 w-3 text-green-500" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3 text-red-500" />
                        )}
                        <Typography
                          className={`text-sm ${
                            (asset.change24h || 0) >= 0
                              ? "text-green-500"
                              : "text-red-500"
                          }`}
                        >
                          {(asset.change24h || 0) >= 0 ? "+" : ""}{(asset.change24h || 0).toFixed(2)}%
                        </Typography>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Allocation Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Asset Allocation</CardTitle>
            <CardDescription>Portfolio distribution by value</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Typography className="text-muted-foreground">Loading...</Typography>
              </div>
            ) : assets.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <Typography className="text-muted-foreground">No data</Typography>
              </div>
            ) : (
              <div className="space-y-4">
                {assets.map((asset) => (
                  <div key={asset.symbol} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{asset.symbol}</span>
                      <span className="text-muted-foreground">{(asset.allocation || 0).toFixed(1)}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-primary transition-all duration-300"
                        style={{ width: `${asset.allocation || 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
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
