"use client";

import { AlertTriangle, Check, Copy, Loader2, Lock, ShieldOff, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useId, useMemo, useState } from "react";

import { Button } from "@/shared/ui/button-v2";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Separator } from "@/shared/ui/separator";
import { useWalletStore } from "@/store/use-wallet";

import { usePosition, useRevoke, useSubmitTx, useWithdraw } from "../hooks/use-account-api";

function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatCountdown(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "Unlocking soon";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 0) return `${days}d ${hours}h remaining`;
  return `${hours}h remaining`;
}

async function signXdr(xdr: string, publicKey: string): Promise<string> {
  const { StellarWalletsKit } = await import("@creit.tech/stellar-wallets-kit/sdk");
  const { signedTxXdr } = await StellarWalletsKit.signTransaction(xdr, {
    address: publicKey,
    networkPassphrase:
      process.env["NEXT_PUBLIC_STELLAR_PASSPHRASE"] ?? "Test SDF Network ; September 2015",
  });
  return signedTxXdr;
}

export function SettingsPage() {
  const router = useRouter();
  const { account } = useWalletStore();
  const publicKey = account ?? undefined;

  const { data: position, isLoading: positionLoading } = usePosition(publicKey);
  const withdrawMutation = useWithdraw();
  const revokeMutation = useRevoke();
  const submitTx = useSubmitTx();

  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [copied, setCopied] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const withdrawAmountId = useId();

  // Compute available vs locked amounts
  const { availableUsd, lockedUsd, lockedCountdown, keeperAddress } = useMemo(() => {
    if (!position?.positions) {
      return { availableUsd: 0, lockedUsd: 0, lockedCountdown: null, keeperAddress: null };
    }

    const isBalanceStale = Boolean(position.balanceStale);

    let available = 0;
    let locked = 0;
    let countdown: string | null = null;
    let positionsTotal = 0;

    for (const pos of position.positions) {
      positionsTotal += pos.valueUsd;
      if (pos.poolType === "backstop" && pos.q4wExpiresAt) {
        locked += pos.valueUsd;
        countdown = formatCountdown(pos.q4wExpiresAt);
      } else {
        available += pos.valueUsd;
      }
    }

    // Include unallocated keeper-wallet funds (not shown as positions)
    // so instant withdraw supports funds parked in keeper wallet.
    const walletAvailable = isBalanceStale
      ? 0
      : Math.max((position.totalValueUsd ?? 0) - positionsTotal, 0);
    available += walletAvailable;

    return {
      availableUsd: available,
      lockedUsd: locked,
      lockedCountdown: countdown,
      keeperAddress: null as string | null,
    };
  }, [position]);

  const parsedAmount = Number.parseFloat(withdrawAmount);
  const isValidWithdraw =
    !Number.isNaN(parsedAmount) && parsedAmount > 0 && parsedAmount <= availableUsd;
  const isProcessing = withdrawMutation.isPending || revokeMutation.isPending || submitTx.isPending;

  const handleSetMax = useCallback(() => {
    setWithdrawAmount(availableUsd.toFixed(2));
  }, [availableUsd]);

  const handleWithdraw = async () => {
    if (!publicKey || !isValidWithdraw) return;
    setActionError(null);
    try {
      const result = await withdrawMutation.mutateAsync({
        publicKey,
        amount: parsedAmount,
      });

      const xdrs: string[] = result?.xdrs ?? (result?.xdr ? [result.xdr] : []);
      const signedXdrs: string[] = result?.signedXdrs ?? [];

      if (xdrs.length === 0 && signedXdrs.length === 0) {
        throw new Error("No transaction returned from server");
      }

      // 1) Submit owner-signed XDRs first (e.g. keeper session config updates)
      for (const [i, xdr] of xdrs.entries()) {
        const signedXdr = await signXdr(xdr, publicKey);
        const isLast = i === xdrs.length - 1 && signedXdrs.length === 0;
        await submitTx.mutateAsync({
          signedXdr,
          // Record activity only on the last TX
          ...(isLast ? { publicKey, txType: "withdraw" as const, amount: parsedAmount } : {}),
        });
      }

      // 2) Submit backend pre-signed XDRs next
      for (const [i, signedXdr] of signedXdrs.entries()) {
        const isLast = i === signedXdrs.length - 1;
        await submitTx.mutateAsync({
          signedXdr,
          ...(isLast ? { publicKey, txType: "withdraw" as const, amount: parsedAmount } : {}),
        });
      }

      setWithdrawAmount("");
      router.push("/farming");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Withdraw failed. Please try again.";
      if (message.toLowerCase().includes("reject") || message.toLowerCase().includes("cancel")) {
        console.warn("Withdraw cancelled by user:", message);
        setActionError("Transaction was cancelled.");
      } else {
        console.warn("Withdraw failed:", message);
        setActionError(message);
      }
    }
  };

  const handleRevoke = async () => {
    if (!publicKey) return;
    setActionError(null);
    try {
      const result = await revokeMutation.mutateAsync(publicKey);

      if (!result?.xdr) {
        throw new Error("No transaction returned from server");
      }

      const signedXdr = await signXdr(result.xdr, publicKey);
      await submitTx.mutateAsync({
        signedXdr,
        publicKey,
        txType: "revoke",
      });

      router.push("/farming");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Revoke failed. Please try again.";
      if (message.toLowerCase().includes("reject") || message.toLowerCase().includes("cancel")) {
        console.warn("Revoke cancelled by user:", message);
        setActionError("Transaction was cancelled.");
      } else {
        console.warn("Revoke failed:", message);
        setActionError(message);
      }
    }
  };

  const handleCopyAddress = async () => {
    const addr = keeperAddress ?? publicKey;
    if (!addr) return;
    await navigator.clipboard.writeText(addr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Not connected
  if (!publicKey) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center py-24 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted/20">
          <Wallet className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="mb-2 font-bold text-2xl text-foreground">Connect Your Wallet</h2>
        <p className="text-muted-foreground">
          Connect your Stellar wallet to manage your account settings.
        </p>
      </div>
    );
  }

  // Loading
  if (positionLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-1 font-bold text-3xl text-foreground">Account Settings</h1>
        <p className="text-muted-foreground text-sm">Withdraw funds or manage bot access.</p>
      </div>

      {/* Action error banner */}
      {actionError && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3">
          <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />
          <p className="text-destructive text-sm">{actionError}</p>
        </div>
      )}

      {/* ---- Withdraw section ---- */}
      <Card className="mb-8 border-border bg-muted/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Wallet className="h-5 w-5" />
            Withdraw
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Balance breakdown */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-border bg-muted/20 p-3">
              <span className="text-muted-foreground text-xs">Available (instant)</span>
              <p className="font-mono font-semibold text-foreground text-lg">
                {formatUsd(availableUsd)}
              </p>
              <span className="text-[10px] text-muted-foreground">
                {position?.balanceStale
                  ? "Wallet balance unavailable; only deployed positions included"
                  : "Lending + LP positions"}
              </span>
            </div>
            <div className="rounded-lg border border-border bg-muted/20 p-3">
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground text-xs">Locked (17-day queue)</span>
                <Lock className="h-3 w-3 text-orange-400" />
              </div>
              <p className="font-mono font-semibold text-foreground text-lg">
                {formatUsd(lockedUsd)}
              </p>
              {lockedCountdown && (
                <span className="text-[10px] text-orange-400">{lockedCountdown}</span>
              )}
            </div>
          </div>

          {/* Amount input */}
          <div>
            <label htmlFor={withdrawAmountId} className="mb-1 block text-muted-foreground text-xs">
              Withdraw amount (USD)
            </label>
            <div className="flex gap-2">
              <input
                id={withdrawAmountId}
                type="number"
                min="0"
                max={availableUsd}
                step="any"
                placeholder="0.00"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                disabled={isProcessing}
                className="w-full rounded-lg border border-border bg-background px-4 py-3 font-mono text-foreground text-lg focus:border-primary focus:outline-none disabled:opacity-50"
              />
              <button
                type="button"
                onClick={handleSetMax}
                disabled={isProcessing || availableUsd <= 0}
                className="shrink-0 rounded-lg border border-border bg-muted/40 px-3 text-muted-foreground text-xs transition-colors hover:border-primary hover:text-foreground disabled:opacity-50"
              >
                Max Instant
              </button>
            </div>
            {parsedAmount > availableUsd && !Number.isNaN(parsedAmount) && (
              <p className="mt-1 text-red-400 text-xs">
                Exceeds available balance ({formatUsd(availableUsd)}).
              </p>
            )}
          </div>

          {/* Withdraw button */}
          <Button
            variant="gradient"
            size="lg"
            className="h-12 w-full"
            onClick={handleWithdraw}
            disabled={!isValidWithdraw || isProcessing}
          >
            {(withdrawMutation.isPending || submitTx.isPending) && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {withdrawMutation.isPending || submitTx.isPending
              ? "Processing..."
              : `Withdraw ${isValidWithdraw ? formatUsd(parsedAmount) : ""}`}
          </Button>

          {withdrawMutation.isError && (
            <p className="text-center text-destructive text-sm">
              Withdrawal failed. Please try again.
            </p>
          )}
        </CardContent>
      </Card>

      <Separator className="mb-8" />

      {/* ---- Security section ---- */}
      <Card className="border-border bg-muted/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldOff className="h-5 w-5" />
            Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Keeper-wallet address */}
          <div className="rounded-lg border border-border bg-muted/20 p-3">
            <span className="mb-1 block text-muted-foreground text-xs">Keeper-Wallet Address</span>
            <div className="flex items-center gap-2">
              <code className="flex-1 truncate font-mono text-foreground text-xs">
                {keeperAddress ?? publicKey}
              </code>
              <button
                type="button"
                onClick={handleCopyAddress}
                className="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-emerald-400" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Revoke warning */}
          <div className="flex items-start gap-3 rounded-lg border border-orange-500/30 bg-orange-500/10 p-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-orange-400" />
            <div className="text-xs">
              <p className="font-medium text-orange-300">Revoking bot access is irreversible.</p>
              <p className="text-orange-400/80">
                After revoking, automated rebalancing and harvesting will stop. You will need to
                manage your positions manually or re-create your account.
              </p>
            </div>
          </div>

          {/* Revoke button */}
          <Button
            variant="destructive"
            size="lg"
            className="h-12 w-full"
            onClick={handleRevoke}
            disabled={isProcessing}
          >
            {(revokeMutation.isPending || submitTx.isPending) && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {revokeMutation.isPending || submitTx.isPending ? "Revoking..." : "Revoke Bot Access"}
          </Button>

          {revokeMutation.isError && (
            <p className="text-center text-destructive text-sm">Revoke failed. Please try again.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
