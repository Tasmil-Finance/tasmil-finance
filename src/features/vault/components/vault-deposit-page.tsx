"use client";

import { CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useWalletStore } from "@/store/use-wallet";

import { VAULT_DESCRIPTION, VAULT_NAME } from "../constants";
import { useDeposit, useVaultPosition, useVaultStats } from "../hooks/use-vault-api";
import { DepositForm } from "./deposit-form";
import { PositionBanner } from "./position-banner";
import { VaultStatsBar } from "./vault-stats-bar";

export function VaultDepositPage() {
  const router = useRouter();
  const { account } = useWalletStore();
  const publicKey = account ?? null;

  const { data: stats, isLoading: statsLoading } = useVaultStats();
  const { data: position } = useVaultPosition(publicKey);
  const deposit = useDeposit();

  // Redirect to dashboard after successful deposit
  useEffect(() => {
    if (deposit.status !== "success") return;
    const timer = setTimeout(() => {
      router.push("/vault/dashboard");
    }, 2000);
    return () => clearTimeout(timer);
  }, [deposit.status, router]);

  if (deposit.status === "success") {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center py-24 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
          <CheckCircle className="h-8 w-8 text-green-500" />
        </div>
        <h2 className="mb-2 font-bold text-2xl text-foreground">Deposit Successful</h2>
        <p className="text-muted-foreground">Redirecting to your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-10">
      {/* Header */}
      <div>
        <h1 className="font-bold text-2xl text-foreground">{VAULT_NAME}</h1>
        <p className="text-muted-foreground">{VAULT_DESCRIPTION}</p>
      </div>

      {/* Existing position banner */}
      {position && <PositionBanner position={position} />}

      {/* Stats */}
      <VaultStatsBar stats={stats} isLoading={statsLoading} />

      {/* Deposit form */}
      <DepositForm
        status={deposit.status}
        lastData={deposit.data}
        onDeposit={(token, amount) => {
          if (!publicKey) return;
          deposit.mutate({ publicKey, token, amount });
        }}
      />

      {/* How it works */}
      <div className="space-y-3 rounded-xl border border-border bg-muted/10 p-5">
        <h3 className="font-semibold text-foreground text-sm">How it works</h3>
        <ol className="list-inside list-decimal space-y-2 text-muted-foreground text-sm">
          <li>Deposit USDC or XLM into the vault</li>
          <li>AI rebalances across Stellar DeFi strategies</li>
          <li>Earn optimized yield automatically</li>
          <li>Withdraw anytime to your wallet</li>
        </ol>
      </div>

      {!publicKey && (
        <p className="text-center text-muted-foreground text-sm">
          Connect your Stellar wallet to get started.
        </p>
      )}
    </div>
  );
}
