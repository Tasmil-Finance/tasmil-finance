"use client";

import { Coins, Loader2, Wallet } from "lucide-react";

import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/shared/ui/card";
import { useWalletStore } from "@/store/use-wallet";

import { useStellarBalances } from "@/features/account/hooks/use-stellar-balance";

function formatBalance(value: number, decimals = 7): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: decimals,
  }).format(value);
}

interface AssetDisplay {
  symbol: string;
  name: string;
  balance: number;
  icon: string;
  color: string;
}

export function PortfolioPage() {
  const { account } = useWalletStore();
  const publicKey = account ?? undefined;

  const { data: balances, isLoading } = useStellarBalances(publicKey);

  if (!publicKey) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center py-24 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted/20">
          <Wallet className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="mb-2 font-bold text-2xl text-foreground">Connect Your Wallet</h2>
        <p className="text-muted-foreground">
          Connect your Stellar wallet to view your portfolio.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const assets: AssetDisplay[] = [
    {
      symbol: "XLM",
      name: "Stellar Lumens",
      balance: balances?.xlm ?? 0,
      icon: "XLM",
      color: "text-blue-400",
    },
    {
      symbol: "USDC",
      name: "USD Coin",
      balance: balances?.usdc ?? 0,
      icon: "USDC",
      color: "text-emerald-400",
    },
  ].filter((a) => a.balance > 0);

  const hasAssets = assets.length > 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-1 font-bold text-3xl text-foreground">Portfolio</h1>
        <p className="text-muted-foreground text-sm">
          Your assets on the Stellar network.
        </p>
      </div>

      {/* Wallet Address */}
      <Card className="mb-8 border-border bg-muted/10">
        <CardContent className="flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Wallet className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-muted-foreground text-xs">Connected Wallet</span>
            <p className="truncate font-mono text-foreground text-sm">{publicKey}</p>
          </div>
        </CardContent>
      </Card>

      {/* Assets List */}
      {!hasAssets ? (
        <div className="flex flex-col items-center py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted/20">
            <Coins className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="mb-2 font-semibold text-foreground text-xl">No Assets Found</h2>
          <p className="text-muted-foreground text-sm">
            This wallet has no token balances on Stellar.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="mb-4 font-semibold text-foreground text-lg">Assets</h2>
          {assets.map((asset) => (
            <AssetRow key={asset.symbol} asset={asset} />
          ))}
        </div>
      )}
    </div>
  );
}

function AssetRow({ asset }: { asset: AssetDisplay }) {
  return (
    <div className="flex items-center gap-4 rounded-lg border border-border bg-muted/10 px-4 py-4">
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] font-bold text-sm",
          asset.color,
        )}
      >
        {asset.icon.slice(0, 2)}
      </div>
      <div className="min-w-0 flex-1">
        <span className="font-medium text-foreground text-sm">{asset.symbol}</span>
        <p className="text-muted-foreground text-xs">{asset.name}</p>
      </div>
      <div className="text-right">
        <p className="font-mono font-semibold text-foreground text-lg">
          {formatBalance(asset.balance)}
        </p>
        <p className="text-muted-foreground text-xs">{asset.symbol}</p>
      </div>
    </div>
  );
}
