"use client";

import { ArrowRight, DollarSign, Tractor, Wallet } from "lucide-react";
import Link from "next/link";
import { usePosition } from "@/features/account/hooks/use-account-api";
import { useWallet } from "@/shared/context/wallet-context";
import { Button } from "@/shared/ui/button-v2";
import { Card } from "@/shared/ui/card";
import { useWalletStore } from "@/store/use-wallet";

export default function DashboardPage() {
  const { isConnected, connect } = useWallet();
  const { account } = useWalletStore();
  const publicKey = account ?? undefined;
  const { data: position, isLoading } = usePosition(publicKey);

  const hasAccount = !!position;

  if (!isConnected) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
        <Card className="max-w-md border-border bg-card p-8">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br from-primary/20 to-primary/40 ring-1 ring-primary/30">
            <DollarSign className="h-10 w-10 text-primary" />
          </div>

          <h2 className="mb-2 font-bold text-2xl text-foreground">Connect Your Wallet</h2>
          <p className="mb-8 text-muted-foreground">
            Connect your Stellar wallet to access your portfolio dashboard.
          </p>

          <Button
            onClick={connect}
            size="lg"
            className="w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Connect Wallet
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-400 space-y-8 p-6 lg:p-10">
      <div>
        <h1 className="mb-1 font-bold text-3xl text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Manage your Stellar DeFi portfolio</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {!isLoading && !hasAccount && (
          <Card className="border-border bg-card p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-primary/20 to-primary/40 ring-1 ring-primary/30">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-medium text-muted-foreground text-sm">Get Started</p>
                <h3 className="mt-1 font-semibold text-foreground text-lg">Deploy Your Account</h3>
                <p className="mt-2 text-muted-foreground text-sm">
                  Create a keeper-wallet, choose a strategy preset, and start earning yield on
                  Stellar.
                </p>
                <Link href="/farming">
                  <Button className="mt-4" size="sm">
                    Set Up Account <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        )}

        <Card className="border-border bg-card p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-accent/20 to-accent/40 ring-1 ring-accent/30">
              <Wallet className="h-6 w-6 text-accent-foreground" />
            </div>
            <div>
              <p className="font-medium text-muted-foreground text-sm">Portfolio</p>
              <h3 className="mt-1 font-semibold text-foreground text-lg">View Your Assets</h3>
              <p className="mt-2 text-muted-foreground text-sm">
                View your wallet assets and token balances on the Stellar network.
              </p>
              <Link href="/portfolio">
                <Button className="mt-4" size="sm" variant="outline">
                  View Portfolio <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        {hasAccount && (
          <Card className="border-border bg-card p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-emerald-500/20 to-emerald-500/40 ring-1 ring-emerald-500/30">
                <Tractor className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <p className="font-medium text-muted-foreground text-sm">Farming Agent</p>
                <h3 className="mt-1 font-semibold text-foreground text-lg">Manage Your Vault</h3>
                <p className="mt-2 text-muted-foreground text-sm">
                  Monitor your allocations, P&L, and rebalance activity across Blend and Soroswap.
                </p>
                <Link href="/farming">
                  <Button className="mt-4" size="sm" variant="outline">
                    View Farming Agent <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
