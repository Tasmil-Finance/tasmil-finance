"use client";

import { ArrowRight, CheckCircle2, Copy, DollarSign, ShieldCheck, TrendingUp, Zap } from "lucide-react";
import { useWallet } from "@/shared/context/wallet-context";
import { Button } from "@/shared/ui/button-v2";
import { GlassCard } from "@/shared/ui/glass-card";
import { Badge } from "@/shared/ui/badge";
import { useEffect, useState } from "react";
import { getSmartAccount } from "@/features/smart-wallet/get-account";
import { getAssetBalances, type AssetBalance } from "@/features/smart-wallet/get-assets";

export default function DashboardPage() {
  const { isConnected, connect } = useWallet();
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
    if (isConnected) {
      fetchAccount();
    } else {
      setIsLoading(false);
    }
  }, [isConnected]);

  // Calculate totals
  const totalValue = assets.reduce((sum, asset) => sum + (asset.valueUsd || 0), 0);
  // Calculate weighted APY or just use zero for now as APY is complex to aggregate without direct APY data per asset
  // For this mock, we'll assume 0 unless we have yield bearing assets logic, but user wants specific dashboard fields
  const currentAPY = 0;
  const lifetimeEarnings = 0; // Data not yet available in simple asset list

  if (!isConnected) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
        <GlassCard className="max-w-md p-8 border-white/5 bg-zinc-900/40">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br from-cyan-500/20 to-blue-600/20 ring-1 ring-cyan-500/30">
            <DollarSign className="h-10 w-10 text-cyan-400" />
          </div>

          <h2 className="mb-2 text-2xl font-bold text-white">Connect Your Wallet</h2>
          <p className="mb-8 text-zinc-400">Connect your wallet to access your intelligent DeFi dashboard and Agent Swarm.</p>

          <Button onClick={connect} size="lg" className="w-full rounded-full bg-white text-zinc-900 hover:bg-zinc-200">
            Connect Wallet
          </Button>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 lg:p-10 max-w-[1600px] mx-auto min-h-screen">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Actual Agent Position</h1>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-cyan-500/30 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition-colors cursor-pointer">
              Activate your agent <ArrowRight className="ml-1 h-3 w-3" />
            </Badge>
            {smartWalletAddress && (
              <Badge variant="outline" className="border-white/10 bg-white/5 text-zinc-400 font-mono">
                {smartWalletAddress.slice(0, 6)}...{smartWalletAddress.slice(-4)}
              </Badge>
            )}
          </div>
        </div>

        {/* Quick stats or Actions can go here */}
      </div>

      {/* Hero Grid - Agent Position */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-auto lg:h-[220px]">

        {/* Portfolio Value */}
        <GlassCard className="lg:col-span-3 flex flex-col justify-between p-6 border-white/5 bg-zinc-900/40 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none group-hover:bg-cyan-500/20 transition-all duration-500" />

          <div className="relative z-10">
            <p className="text-sm font-medium text-zinc-400 mb-2">Portfolio Value</p>
            {isLoading ? (
              <div className="h-10 w-32 bg-white/10 rounded animate-pulse" />
            ) : (
              <h2 className="text-4xl font-bold text-white tracking-tight">
                ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
            )}
            <p className="text-xs text-zinc-500 mt-1 cursor-pointer hover:text-cyan-400 transition-colors">See All Assets</p>
          </div>

          <div className="flex gap-3 mt-6 relative z-10">
            <Button className="flex-1 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/5 backdrop-blur-sm">Deposit</Button>
            <Button variant="outline" className="flex-1 rounded-lg border-white/10 bg-transparent text-zinc-400 hover:text-white hover:bg-white/5">Withdraw</Button>
          </div>
        </GlassCard>

        {/* Current APY */}
        <GlassCard className="lg:col-span-3 flex flex-col justify-center p-6 border-white/5 bg-zinc-900/40 relative overflow-hidden group">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-linear-to-br from-emerald-500/20 to-teal-600/20 flex items-center justify-center ring-1 ring-emerald-500/30">
              <TrendingUp className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-400">Current APY</p>
              <div className="flex items-baseline gap-2 mt-1">
                <h2 className="text-3xl font-bold text-white">{currentAPY.toFixed(1)}%</h2>
                <span className="text-sm font-medium text-emerald-400">+0.00%</span>
              </div>
              <Badge className="mt-3 bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mr-2 animate-pulse" />
                rTas APY Boost
              </Badge>
            </div>
          </div>
        </GlassCard>

        {/* Lifetime Earnings */}
        <GlassCard className="lg:col-span-3 flex flex-col justify-center p-6 border-white/5 bg-zinc-900/40 relative overflow-hidden group">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-linear-to-br from-purple-500/20 to-pink-600/20 flex items-center justify-center ring-1 ring-purple-500/30">
              <DollarSign className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-400">Lifetime Earnings</p>
              <div className="flex items-baseline gap-2 mt-1">
                <h2 className="text-3xl font-bold text-white">${lifetimeEarnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h2>
              </div>
              <p className="text-sm font-medium text-purple-400 mt-1">+ $0.00 rTas</p>
            </div>
          </div>
          <div className="mt-auto pt-4">
            <p className="text-xs text-zinc-500 hover:text-white cursor-pointer transition-colors">Details</p>
          </div>
        </GlassCard>


        {/* Points */}
        <GlassCard className="lg:col-span-3 flex flex-col justify-between p-6 border-white/5 bg-zinc-900/40 relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-linear-to-br from-amber-500/20 to-orange-600/20 flex items-center justify-center ring-1 ring-amber-500/30">
                <Zap className="h-6 w-6 text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-400">Points</p>
                <h2 className="text-3xl font-bold text-white mt-1">1,024</h2>
                <p className="text-xs text-zinc-500 mt-1">Boosted points for referrals</p>
              </div>
            </div>
            <Button size="sm" variant="outline" className="h-8 rounded-full border-white/10 bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10">
              Refer <Copy className="ml-2 h-3 w-3" />
            </Button>
          </div>
          <div>
            <p className="text-xs text-zinc-500 hover:text-white cursor-pointer transition-colors">External points</p>
          </div>
        </GlassCard>
      </div>

      {/* Middle Section - Rebalancing Updates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Earnings Chart / Abstract Visual */}
        <GlassCard className="h-[180px] border-white/5 bg-zinc-900/40 flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/images/grid-pattern.svg')] opacity-10" />
          <div className="text-center z-10">
            <h3 className="text-3xl font-bold text-white">$0.00</h3>
            <p className="text-sm text-zinc-500 mt-1 flex items-center justify-center gap-1">
              Last 24h Earnings <ShieldCheck className="h-3 w-3" />
            </p>
          </div>
          {/* Abstract background element */}
          <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-linear-to-t from-cyan-500/5 to-transparent" />
        </GlassCard>

        {/* Frequency & Boost Status */}
        <GlassCard className="h-[180px] border-white/5 bg-zinc-900/40 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/images/grid-pattern.svg')] opacity-10" />

          <h3 className="text-xl font-bold text-white">1x per day</h3>
          <p className="text-sm text-zinc-500 mt-1 mb-4 flex items-center gap-1">
            Current Rebalancing Frequency <ShieldCheck className="h-3 w-3" />
          </p>

          <div className="bg-white/5 border border-white/5 rounded-full px-4 py-2 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-sm font-medium text-zinc-400">2x Boost Not Activated</span>
            <ShieldCheck className="h-3 w-3 text-zinc-500" />
          </div>
        </GlassCard>
      </div>

      {/* Rebalancing Logic Visual */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Rebalancing Updates</h2>
          <p className="text-zinc-400 mt-1 max-w-2xl">The Agent checks daily to determine the best position to place your liquidity and we use 5 detailed checks to do it:</p>
        </div>

        <div className="flex flex-wrap gap-3">
          {['TVL Safety', 'Delta APY', 'APY Stability Analysis', 'Profit vs. Cost Analysis', 'Money Market'].map((check) => (
            <Badge key={check} variant="outline" className="px-3 py-1.5 border-white/10 bg-white/5 text-zinc-400 hover:text-white hover:border-white/20 transition-all cursor-default">
              {check} <CheckCircle2 className="ml-2 h-3 w-3 text-emerald-500" />
            </Badge>
          ))}
        </div>

        {/* History Table */}
        <GlassCard className="mt-6 border-white/5 bg-zinc-900/40 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="px-6 py-4 font-medium text-zinc-500">Date</th>
                  <th className="px-6 py-4 font-medium text-zinc-500">Chains</th>
                  <th className="px-6 py-4 font-medium text-zinc-500">Previous Pool</th>
                  <th className="px-6 py-4 font-medium text-zinc-500">New Pool</th>
                  <th className="px-6 py-4 font-medium text-zinc-500 text-right">Amount</th>
                  <th className="px-6 py-4 font-medium text-zinc-500 text-right">APR Change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {/* Empty State / Placeholder Rows */}
                {[1, 2].map((i) => (
                  <tr key={i} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 text-zinc-300">Oct {24 + i}, 2024</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <div className="h-5 w-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px] ring-1 ring-indigo-500/30">A</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-zinc-400">USDC-ETH LP</td>
                    <td className="px-6 py-4 text-white font-medium">USDC-ARB LP</td>
                    <td className="px-6 py-4 text-right text-zinc-300">$1,250.00</td>
                    <td className="px-6 py-4 text-right text-emerald-400 font-medium">+2.4%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-center gap-2 p-4 border-t border-white/5">
            <Button variant="ghost" size="sm" className="h-8 rounded-lg text-zinc-500 hover:text-white" disabled>Previous</Button>
            <span className="text-xs text-zinc-500 font-medium px-2">Page 1 of 1</span>
            <Button variant="ghost" size="sm" className="h-8 rounded-lg text-zinc-500 hover:text-white" disabled>Next</Button>
          </div>
        </GlassCard>
      </div>

      {/* Execution History */}
      <div className="space-y-4 pt-4">
        <h2 className="text-2xl font-bold text-white">Agent Execution History</h2>

        <GlassCard className="border-white/5 bg-zinc-900/40 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="px-6 py-4 font-medium text-zinc-500">Action</th>
                  <th className="px-6 py-4 font-medium text-zinc-500">Date</th>
                  <th className="px-6 py-4 font-medium text-zinc-500">Protocol Used</th>
                  <th className="px-6 py-4 font-medium text-zinc-500 text-right">Amount</th>
                  <th className="px-6 py-4 font-medium text-zinc-500">Chains</th>
                  <th className="px-6 py-4 font-medium text-zinc-500">Transaction Hash</th>
                  <th className="px-6 py-4 font-medium text-zinc-500">ERC-8004 ZK Proof</th>
                </tr>
              </thead>
              <tbody>
                {/* Empty State */}
                <tr className="border-b border-white/5">
                  <td colSpan={7} className="px-6 py-12 text-center text-zinc-500">
                    No execution history available yet.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-center gap-2 p-4 border-t border-white/5">
            <Button variant="ghost" size="sm" className="h-8 rounded-lg text-zinc-500 hover:text-white" disabled>Previous</Button>
            <span className="text-xs text-zinc-500 font-medium px-2">Page 1 of 1</span>
            <Button variant="ghost" size="sm" className="h-8 rounded-lg text-zinc-500 hover:text-white" disabled>Next</Button>
          </div>
        </GlassCard>
      </div>

    </div>
  );
}
