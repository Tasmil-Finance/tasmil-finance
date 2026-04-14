"use client";

import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Loader2,
  Pause,
  Play,
  ShieldOff,
  Tractor,
  TrendingUp,
  Wallet,
  XCircle,
  Zap,
} from "lucide-react";
import { useId, useMemo, useState } from "react";
import { FundForm } from "@/features/account/components/fund-form";
import { OnboardingPage } from "@/features/account/components/onboarding-page";
import { PresetCard } from "@/features/account/components/preset-card";
import {
  useActivity,
  useFundAccount,
  usePosition,
  usePresets,
  useResumeAccount,
  useRevoke,
  useSetupAccount,
  useSubmitTx,
  useUpdatePreset,
  useWithdraw,
} from "@/features/account/hooks/use-account-api";
import type { ActivityItem, RiskPreset } from "@/features/account/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button-v2";
import { Card, CardContent } from "@/shared/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Separator } from "@/shared/ui/separator";
import { useWalletStore } from "@/store/use-wallet";
import { usePools, useRebalanceStatus } from "../hooks/use-farming-api";
import type { DiscoveredPool } from "../types";

async function signXdr(xdr: string, publicKey: string): Promise<string> {
  const { StellarWalletsKit } = await import("@creit.tech/stellar-wallets-kit/sdk");
  const { signedTxXdr } = await StellarWalletsKit.signTransaction(xdr, {
    address: publicKey,
    networkPassphrase:
      process.env["NEXT_PUBLIC_STELLAR_PASSPHRASE"] ?? "Test SDF Network ; September 2015",
  });
  return signedTxXdr;
}

function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatCompactUsd(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return formatUsd(value);
}

function formatApyPercent(apyDecimal: number): string {
  return `${(apyDecimal * 100).toFixed(2)}%`;
}

const ACTIVITY_LABEL: Record<string, string> = {
  DEPLOY: "Account Created",
  FUND: "Deposit",
  REBALANCE: "Rebalance",
  HARVEST: "Harvest",
  DEPOSIT: "Deposit",
  WITHDRAW: "Withdrawal",
  HALT: "Bot Halted",
  RESUME: "Bot Resumed",
  PRESET_CHANGE: "Strategy Changed",
  REVOKE: "Bot Revoked",
  BACKSTOP_QUEUE: "Backstop Queued",
  BACKSTOP_EXIT: "Backstop Exit",
};

const POOL_TYPE_COLOR: Record<string, string> = {
  lending: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  backstop: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  lp: "bg-teal-500/20 text-teal-400 border-teal-500/30",
};

function riskLabel(score: number): { label: string; color: string } {
  if (score <= 3) return { label: "Low", color: "text-emerald-400" };
  if (score <= 6) return { label: "Medium", color: "text-yellow-400" };
  if (score <= 8) return { label: "High", color: "text-orange-400" };
  return { label: "Critical", color: "text-red-400" };
}

export function FarmingPage() {
  const { account } = useWalletStore();
  const publicKey = account ?? undefined;
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [accountModalTab, setAccountModalTab] = useState<
    "fund" | "strategy" | "withdraw" | "security"
  >("fund");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<RiskPreset | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const withdrawAmountInputId = useId();

  const {
    data: position,
    isLoading: positionLoading,
    refetch: refetchPosition,
  } = usePosition(publicKey);
  const { data: status, isLoading: statusLoading } = useRebalanceStatus();
  const { data: registryPoolsData, isLoading: registryPoolsLoading } = usePools();
  const {
    data: activities,
    isLoading: activitiesLoading,
    refetch: refetchActivity,
  } = useActivity(publicKey);
  const { data: presets, isLoading: presetsLoading } = usePresets();
  const fundAccount = useFundAccount();
  const withdrawMutation = useWithdraw();
  const revokeMutation = useRevoke();
  const submitTx = useSubmitTx();
  const updatePreset = useUpdatePreset();
  const setupAccount = useSetupAccount();
  const resumeAccount = useResumeAccount();
  const [isReconfiguring, setIsReconfiguring] = useState(false);
  const canChangeStrategy = false;

  const { availableUsd, lockedUsd } = useMemo(() => {
    const positions = position?.positions ?? [];
    const isBalanceStale = Boolean(position?.balanceStale);
    let available = 0;
    let locked = 0;
    let positionsTotal = 0;
    for (const pos of positions) {
      positionsTotal += pos.valueUsd;
      if (pos.poolType === "backstop" && pos.q4wExpiresAt) {
        locked += pos.valueUsd;
      } else {
        available += pos.valueUsd;
      }
    }

    // Include unallocated keeper-wallet funds (not represented as strategy positions)
    // so users can still withdraw when funds are parked in the keeper wallet.
    const walletAvailable = isBalanceStale
      ? 0
      : Math.max((position?.totalValueUsd ?? 0) - positionsTotal, 0);
    available += walletAvailable;

    return { availableUsd: available, lockedUsd: locked };
  }, [position?.positions, position?.totalValueUsd, position?.balanceStale]);

  const deployedInPoolsUsd = useMemo(() => {
    return (position?.positions ?? []).reduce((sum, pos) => sum + pos.valueUsd, 0);
  }, [position?.positions]);

  const unallocatedWalletUsd = useMemo(() => {
    if (position?.balanceStale) return 0;
    return Math.max((position?.totalValueUsd ?? 0) - deployedInPoolsUsd, 0);
  }, [position?.totalValueUsd, deployedInPoolsUsd, position?.balanceStale]);

  const cashflowSummary = useMemo(() => {
    const totalValueUsd = position?.totalValueUsd ?? 0;
    const totalDepositedUsd = position?.totalDepositedUsd ?? 0;
    const totalWithdrawnFromApi = position?.totalWithdrawnUsd ?? 0;
    const netDepositsFromApi = position?.netDepositsUsd ?? totalDepositedUsd - totalWithdrawnFromApi;
    const profitUsd = position?.profitUsd ?? 0;
    const profitPercent = position?.profitPercent ?? 0;

    if (totalDepositedUsd > 0 || totalWithdrawnFromApi > 0) {
      return {
        totalFundedUsd: totalDepositedUsd,
        totalWithdrawnUsd: totalWithdrawnFromApi,
        netDepositsUsd: netDepositsFromApi,
        allTimePnlUsd: profitUsd,
        allTimePnlPercent: profitPercent,
      };
    }

    let totalFundedUsd = 0;
    let legacyStrategyDepositsUsd = 0;
    let totalWithdrawnUsd = 0;
    const seen = new Set<string>();

    for (const item of activities ?? []) {
      const dedupeKey = item.txHash ? `${item.type}:${item.txHash}` : `${item.type}:${item.id}`;
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);

      const amountUsd = typeof item.amountUsd === "number" ? item.amountUsd : 0;
      if (amountUsd <= 0) continue;

      if (item.type === "FUND") {
        totalFundedUsd += amountUsd;
      } else if (item.type === "DEPOSIT") {
        legacyStrategyDepositsUsd += amountUsd;
      } else if (item.type === "WITHDRAW") {
        totalWithdrawnUsd += amountUsd;
      }
    }

    // Backward compatibility for legacy activity data where FUND might be missing.
    if (totalFundedUsd <= 0 && legacyStrategyDepositsUsd > 0) {
      totalFundedUsd = legacyStrategyDepositsUsd;
    }

    const hasCashflowData = totalFundedUsd > 0 || totalWithdrawnUsd > 0;

    if (!hasCashflowData) {
      return {
        totalFundedUsd: totalDepositedUsd,
        totalWithdrawnUsd: 0,
        netDepositsUsd: totalDepositedUsd,
        allTimePnlUsd: profitUsd,
        allTimePnlPercent: profitPercent,
      };
    }

    const netDepositsUsd = totalFundedUsd - totalWithdrawnUsd;
    const allTimePnlUsd = totalValueUsd + totalWithdrawnUsd - totalFundedUsd;
    const allTimePnlPercent =
      totalFundedUsd > 0 ? Math.round((allTimePnlUsd / totalFundedUsd) * 10000) / 100 : 0;

    return {
      totalFundedUsd,
      totalWithdrawnUsd,
      netDepositsUsd,
      allTimePnlUsd,
      allTimePnlPercent,
    };
  }, [activities, position?.totalDepositedUsd, position?.totalValueUsd, position?.profitUsd, position?.profitPercent]);

  if (!publicKey) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center py-24 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted/20">
          <Wallet className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="mb-2 font-bold text-2xl text-foreground">Connect Your Wallet</h2>
        <p className="text-muted-foreground">
          Connect your Stellar wallet to view the farming agent.
        </p>
      </div>
    );
  }

  if (statusLoading || registryPoolsLoading || positionLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // No managed account yet — prompt to set up
  if (!position) {
    return <OnboardingPage />;
  }

  const registryPools = registryPoolsData ?? [];
  const profitPositive = cashflowSummary.allTimePnlUsd >= 0;
  const accountActionPending =
    fundAccount.isPending ||
    withdrawMutation.isPending ||
    revokeMutation.isPending ||
    submitTx.isPending;

  const parsedWithdrawAmount = Number.parseFloat(withdrawAmount);
  const canWithdraw =
    !Number.isNaN(parsedWithdrawAmount) &&
    parsedWithdrawAmount > 0 &&
    parsedWithdrawAmount <= availableUsd;

  const depositablePools = registryPools.filter((p) => !!p.strategyContractAddress);
  const depositableTvl = depositablePools.reduce((sum, p) => sum + p.tvlUsd, 0);

  const openAccountModal = (tab: "fund" | "strategy" | "withdraw" | "security") => {
    setActionError(null);
    if (tab === "strategy") {
      const normalized = position.preset?.toLowerCase();
      const mapped =
        normalized === "safe" ? "Safe" : normalized === "aggressive" ? "Aggressive" : "Balanced";
      setSelectedPreset(mapped);
    }
    setAccountModalTab(tab);
    setAccountModalOpen(true);
  };

  const handleUpdatePreset = async () => {
    if (!publicKey || !selectedPreset || !canChangeStrategy) return;
    try {
      setActionError(null);
      await updatePreset.mutateAsync({ publicKey, preset: selectedPreset });
      setAccountModalOpen(false);
    } catch (err) {
      console.warn("Update preset failed:", err);
      const message = err instanceof Error ? err.message : "Operation failed. Please try again.";
      setActionError(message);
    }
  };

  const handleFund = async (amount: number, token: "USDC" | "XLM") => {
    if (!publicKey) return;
    try {
      setActionError(null);
      const result = await fundAccount.mutateAsync({ publicKey, amount, token });
      if (!result?.xdr) throw new Error("No fund transaction returned from server");

      const signedXdr = await signXdr(result.xdr, publicKey);
      await submitTx.mutateAsync({
        signedXdr,
        publicKey,
        txType: "fund",
        amount,
        token,
      });

      await Promise.all([refetchPosition(), refetchActivity()]);
      setAccountModalOpen(false);
    } catch (err) {
      console.warn("Fund failed:", err);
      const message = err instanceof Error ? err.message : "Operation failed. Please try again.";
      setActionError(message);
    }
  };

  const handleWithdraw = async () => {
    if (!publicKey || !canWithdraw) return;
    try {
      setActionError(null);
      const result = await withdrawMutation.mutateAsync({
        publicKey,
        amount: parsedWithdrawAmount,
      });

      const xdrs: string[] = result?.xdrs ?? (result?.xdr ? [result.xdr] : []);
      const signedXdrs: string[] = result?.signedXdrs ?? [];
      if (xdrs.length === 0 && signedXdrs.length === 0)
        throw new Error("No withdrawal transaction returned from server");

      // 1) Submit owner-signed XDRs first
      for (const [i, xdr] of xdrs.entries()) {
        const signedXdr = await signXdr(xdr, publicKey);
        const isLast = i === xdrs.length - 1 && signedXdrs.length === 0;
        await submitTx.mutateAsync({
          signedXdr,
          ...(isLast
            ? {
                publicKey,
                txType: "withdraw" as const,
                amount: parsedWithdrawAmount,
              }
            : {}),
        });
      }

      // 2) Submit backend pre-signed XDRs next
      for (const [i, signedXdr] of signedXdrs.entries()) {
        const isLast = i === signedXdrs.length - 1;
        await submitTx.mutateAsync({
          signedXdr,
          ...(isLast
            ? {
                publicKey,
                txType: "withdraw" as const,
                amount: parsedWithdrawAmount,
              }
            : {}),
        });
      }

      await Promise.all([refetchPosition(), refetchActivity()]);
      setWithdrawAmount("");
      setAccountModalOpen(false);
    } catch (err) {
      console.warn("Withdraw failed:", err);
      const message = err instanceof Error ? err.message : "Operation failed. Please try again.";
      setActionError(message);
    }
  };

  const handleReconfigure = async () => {
    if (!publicKey) return;
    try {
      setIsReconfiguring(true);
      setActionError(null);

      // 1. Build new setup TX with updated allowed contracts
      const setupResult = await setupAccount.mutateAsync(publicKey);
      const setupXdrs = setupResult?.setupTxs ?? [];
      if (setupXdrs.length === 0 || !setupXdrs[0]) {
        throw new Error("No setup transaction returned from server");
      }

      // 2. User signs the configure_session_key TX
      const signedXdr = await signXdr(setupXdrs[0], publicKey);
      await submitTx.mutateAsync({ signedXdr });

      // 3. Resume the individual account in the backend
      await resumeAccount.mutateAsync(publicKey);

      await Promise.all([refetchPosition(), refetchActivity()]);
    } catch (err) {
      console.warn("Reconfigure failed:", err);
      const message = err instanceof Error ? err.message : "Reconfigure failed. Please try again.";
      setActionError(message);
    } finally {
      setIsReconfiguring(false);
    }
  };

  const handleRevoke = async () => {
    if (!publicKey) return;
    try {
      setActionError(null);
      const result = await revokeMutation.mutateAsync(publicKey);
      if (!result?.xdr) throw new Error("No revoke transaction returned from server");

      const signedXdr = await signXdr(result.xdr, publicKey);
      await submitTx.mutateAsync({
        signedXdr,
        publicKey,
        txType: "revoke",
      });

      await Promise.all([refetchPosition(), refetchActivity()]);
      setAccountModalOpen(false);
    } catch (err) {
      console.warn("Revoke failed:", err);
      const message = err instanceof Error ? err.message : "Operation failed. Please try again.";
      setActionError(message);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/8 bg-white/4">
            <Tractor className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="font-bold text-3xl text-foreground">Farming Agent</h1>
            <p className="text-muted-foreground text-sm">
              Automated yield farming powered by AI rebalancing.
            </p>
          </div>
        </div>
      </div>

      {/* Bot Status Banner */}
      <BotStatusBanner
        status={status}
        onReconfigure={handleReconfigure}
        isReconfiguring={isReconfiguring}
      />

      {/* Account Summary */}
      <Card className="mb-8 border-border bg-muted/10">
        <CardContent className="p-6">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            <div>
              <span className="text-muted-foreground text-xs">Total Value</span>
              <p className="font-bold font-mono text-2xl text-foreground">
                {formatUsd(position.totalValueUsd)}
              </p>
              <p className="text-[11px] text-muted-foreground/70">
                In pools: {formatUsd(deployedInPoolsUsd)}
              </p>
              <p className="text-[11px] text-muted-foreground/70">
                In wallet: {position.balanceStale ? "—" : formatUsd(unallocatedWalletUsd)}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Net Deposits</span>
              <p className="font-mono font-semibold text-foreground text-lg">
                {formatUsd(cashflowSummary.netDepositsUsd)}
              </p>
              <p className="text-[11px] text-muted-foreground/70">
                +{formatUsd(cashflowSummary.totalFundedUsd)} / -
                {formatUsd(cashflowSummary.totalWithdrawnUsd)}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">All-time P/L</span>
              <div className="flex items-center gap-1.5">
                {profitPositive ? (
                  <ArrowUpRight className="h-4 w-4 text-emerald-400" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-red-400" />
                )}
                <p
                  className={cn(
                    "font-mono font-semibold text-lg",
                    profitPositive ? "text-emerald-400" : "text-red-400"
                  )}
                >
                  {formatUsd(Math.abs(cashflowSummary.allTimePnlUsd))}
                </p>
                <span
                  className={cn(
                    "text-xs",
                    profitPositive ? "text-emerald-400/70" : "text-red-400/70"
                  )}
                >
                  ({profitPositive ? "+" : "-"}
                  {Math.abs(cashflowSummary.allTimePnlPercent).toFixed(2)}%)
                </span>
              </div>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Current APY</span>
              <div className="flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
                <p className="font-mono font-semibold text-emerald-400 text-lg">
                  {formatApyPercent(position.currentApy)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Portfolio & opportunity stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3">
        <StatCard
          label="Pools You Can Deposit Into"
          value={String(depositablePools.length)}
          icon={<TrendingUp className="h-4 w-4 text-emerald-400" />}
        />
        <StatCard
          label="Active Positions"
          value={String(position.positions.length)}
          icon={<Activity className="h-4 w-4 text-blue-400" />}
        />
        <StatCard
          label="Depositable Market TVL"
          value={formatCompactUsd(depositableTvl)}
          icon={<Zap className="h-4 w-4 text-yellow-400" />}
        />
      </div>

      {/* Current Allocation */}
      {position.positions.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-4 font-semibold text-foreground text-lg">
            Your Current Allocation (Deployed in Pools)
          </h2>
          <AllocationTable positions={position.positions} />
        </div>
      )}

      <Separator className="mb-8" />

      {/* Depositable pools */}
      <div className="mb-8">
        <h2 className="mb-1 font-semibold text-foreground text-lg">Available Pools to Deposit</h2>
        <p className="mb-4 text-muted-foreground text-sm">
          Only pools that are live and depositable by your agent are shown.
        </p>
        {depositablePools.length === 0 ? (
          <p className="py-4 text-center text-muted-foreground text-sm">
            No depositable pools available yet.
          </p>
        ) : (
          <PoolTable pools={depositablePools} />
        )}
      </div>

      <Separator className="mb-8" />

      {/* Agent Activity */}
      <div className="mb-8">
        <h2 className="mb-1 font-semibold text-foreground text-lg">Activity Timeline</h2>
        <p className="mb-4 text-muted-foreground text-sm">
          Full history of account actions and automation events.
        </p>
        {activitiesLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : !activities || activities.length === 0 ? (
          <p className="py-4 text-center text-muted-foreground text-sm">No activity yet.</p>
        ) : (
          <div className="space-y-2">
            {activities.map((activity) => (
              <FarmingActivityRow key={activity.id} activity={activity} />
            ))}
          </div>
        )}
      </div>

      <Separator className="mb-8" />

      {/* Action buttons */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <Button
          variant="gradient"
          size="lg"
          className="h-12 flex-1"
          onClick={() => openAccountModal("fund")}
        >
          Deposit More
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="h-12 flex-1 border-border bg-muted/10 hover:bg-muted/20"
          onClick={() => openAccountModal("withdraw")}
        >
          Withdraw
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="h-12 flex-1 border-orange-500/30 bg-orange-500/10 text-orange-300 hover:bg-orange-500/20"
          onClick={() => openAccountModal("security")}
        >
          Revoke Session Key
        </Button>
      </div>

      <Dialog open={accountModalOpen} onOpenChange={(open) => { setAccountModalOpen(open); if (!open) setActionError(null); }}>
        <DialogContent
          className={cn(
            "max-h-[90vh] overflow-y-auto",
            accountModalTab === "strategy" ? "max-w-5xl" : "max-w-2xl"
          )}
        >
          <DialogHeader>
            <DialogTitle>
              {accountModalTab === "fund"
                ? "Deposit More"
                : accountModalTab === "strategy"
                  ? "Change Strategy"
                  : accountModalTab === "withdraw"
                    ? "Withdraw"
                    : "Revoke Session Key"}
            </DialogTitle>
            <DialogDescription>
              {accountModalTab === "fund"
                ? "Add funds without leaving Farming."
                : accountModalTab === "strategy"
                  ? "Choose your risk profile for future allocations."
                  : accountModalTab === "withdraw"
                    ? "Withdraw from available positions."
                    : "Disable automation by revoking the active session key."}
            </DialogDescription>
          </DialogHeader>

          {actionError && (
            <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-red-300 text-sm">
              <XCircle className="h-4 w-4 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          {accountModalTab === "fund" && (
            <div className="space-y-4 pt-3">
              <FundForm onFund={handleFund} isLoading={accountActionPending} />
            </div>
          )}

          {accountModalTab === "strategy" && (
            <div className="space-y-4 pt-3">
              {!canChangeStrategy && (
                <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3 text-yellow-300 text-sm">
                  Strategy changes are admin-protected in this environment.
                </div>
              )}
              <div className="space-y-4">
                <p className="text-muted-foreground text-sm">
                  Choose your risk profile. Changes apply to future allocations and rebalances.
                </p>
                {presetsLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {presets?.map((preset) => (
                      <PresetCard
                        key={preset.name}
                        preset={preset}
                        selected={selectedPreset === preset.name}
                        onSelect={() => setSelectedPreset(preset.name)}
                      />
                    ))}
                  </div>
                )}

                <Button
                  variant="gradient"
                  size="lg"
                  className="h-12 w-full"
                  onClick={handleUpdatePreset}
                  disabled={!canChangeStrategy || !selectedPreset || updatePreset.isPending}
                >
                  {updatePreset.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Apply Strategy
                </Button>
              </div>
            </div>
          )}

          {accountModalTab === "withdraw" && (
            <div className="space-y-4 pt-3">
              <Card className="border-border bg-muted/10">
                <CardContent className="space-y-4 p-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-border bg-muted/20 p-3">
                      <p className="text-muted-foreground text-xs">Available (instant)</p>
                      <p className="font-mono font-semibold text-foreground text-lg">
                        {formatUsd(availableUsd)}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/20 p-3">
                      <p className="text-muted-foreground text-xs">Locked (backstop queue)</p>
                      <p className="font-mono font-semibold text-foreground text-lg">
                        {formatUsd(lockedUsd)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor={withdrawAmountInputId}
                      className="block text-muted-foreground text-xs"
                    >
                      Withdraw amount (USD)
                    </label>
                    <div className="flex gap-2">
                      <input
                        id={withdrawAmountInputId}
                        type="number"
                        min="0"
                        max={availableUsd}
                        step="any"
                        placeholder="0.00"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        disabled={accountActionPending}
                        className="w-full rounded-lg border border-border bg-background px-4 py-3 font-mono text-foreground focus:border-primary focus:outline-none disabled:opacity-50"
                      />
                      <Button
                        variant="outline"
                        size="default"
                        className="shrink-0"
                        onClick={() => setWithdrawAmount(availableUsd.toFixed(2))}
                        disabled={accountActionPending || availableUsd <= 0}
                      >
                        Max
                      </Button>
                    </div>
                  </div>

                  <Button
                    variant="gradient"
                    size="lg"
                    className="h-12 w-full"
                    onClick={handleWithdraw}
                    disabled={!canWithdraw || accountActionPending}
                  >
                    {(withdrawMutation.isPending || submitTx.isPending) && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Withdraw
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {accountModalTab === "security" && (
            <div className="space-y-4 pt-3">
              <Card className="border-border bg-muted/10">
                <CardContent className="space-y-4 p-4">
                  <div className="flex items-start gap-3 rounded-lg border border-orange-500/30 bg-orange-500/10 p-3">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-orange-400" />
                    <div className="text-xs">
                      <p className="font-medium text-orange-300">
                        Revoke session key is irreversible.
                      </p>
                      <p className="text-orange-400/80">
                        Bot automation stops immediately. In current backend rules, account status
                        becomes REVOKED and normal withdraw endpoint is blocked.
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="destructive"
                    size="lg"
                    className="h-12 w-full"
                    onClick={handleRevoke}
                    disabled={accountActionPending}
                  >
                    {(revokeMutation.isPending || submitTx.isPending) && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    <ShieldOff className="mr-2 h-4 w-4" />
                    Revoke Session Key
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BotStatusBanner({
  status,
  onReconfigure,
  isReconfiguring,
}: {
  status: { ready: boolean; halted: boolean; haltReason: string | null } | undefined;
  onReconfigure?: () => void;
  isReconfiguring?: boolean;
}) {
  if (!status) return null;

  const isActive = status.ready && !status.halted;
  const isHalted = status.halted;

  return (
    <Card
      className={cn(
        "mb-8 border",
        isActive
          ? "border-emerald-500/30 bg-emerald-500/5"
          : isHalted
            ? "border-red-500/30 bg-red-500/5"
            : "border-yellow-500/30 bg-yellow-500/5"
      )}
    >
      <CardContent className="flex items-center gap-4 p-4">
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-full",
            isActive ? "bg-emerald-500/20" : isHalted ? "bg-red-500/20" : "bg-yellow-500/20"
          )}
        >
          {isActive ? (
            <Play className="h-5 w-5 text-emerald-400" />
          ) : isHalted ? (
            <Pause className="h-5 w-5 text-red-400" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-yellow-400" />
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">
              {isActive ? "Agent Active" : isHalted ? "Agent Halted" : "Agent Initializing"}
            </span>
            <span
              className={cn(
                "inline-flex h-2 w-2 rounded-full",
                isActive
                  ? "animate-pulse bg-emerald-400"
                  : isHalted
                    ? "bg-red-400"
                    : "bg-yellow-400"
              )}
            />
          </div>
          <p className="text-muted-foreground text-sm">
            {isActive
              ? "Monitoring pools and rebalancing automatically."
              : isHalted
                ? `Halted: ${status.haltReason ?? "Unknown reason"}`
                : "Waiting for session key initialization."}
          </p>
        </div>
        {isHalted && onReconfigure && (
          <Button
            size="sm"
            variant="outline"
            className="shrink-0 border-red-500/30 text-red-400 hover:bg-red-500/10"
            onClick={onReconfigure}
            disabled={isReconfiguring}
          >
            {isReconfiguring ? "Reconfiguring..." : "Reconfigure & Resume"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <Card className="border-border bg-muted/10">
      <CardContent className="p-4">
        <div className="mb-2 flex items-center gap-2">
          {icon}
          <span className="text-muted-foreground text-xs">{label}</span>
        </div>
        <p className="font-mono font-semibold text-foreground text-lg">{value}</p>
      </CardContent>
    </Card>
  );
}

function AllocationTable({
  positions,
}: {
  positions: {
    poolName: string;
    poolType: string;
    protocol: string;
    allocationPercent: number;
    valueUsd: number;
    apy: number;
    q4wExpiresAt?: string;
  }[];
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full">
        <thead>
          <tr className="border-border border-b bg-muted/20">
            <th className="px-4 py-3 text-left font-medium text-muted-foreground text-xs">Pool</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground text-xs">Type</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground text-xs">
              Target Weight
            </th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground text-xs">
              Value
            </th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground text-xs">APY</th>
          </tr>
        </thead>
        <tbody>
          {positions.map((pos) => (
            <tr
              key={`${pos.poolName}-${pos.protocol}`}
              className="border-border/50 border-b last:border-0"
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground text-sm">{pos.poolName}</span>
                  <span className="text-muted-foreground text-xs">{pos.protocol}</span>
                </div>
              </td>
              <td className="px-4 py-3">
                <Badge
                  className={cn(
                    "text-[10px]",
                    POOL_TYPE_COLOR[pos.poolType] ?? "bg-muted text-muted-foreground"
                  )}
                >
                  {pos.poolType}
                </Badge>
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-2">
                  <div className="hidden h-1.5 w-16 overflow-hidden rounded-full bg-muted/30 sm:block">
                    <div
                      className="h-full rounded-full bg-primary/60"
                      style={{ width: `${Math.min(pos.allocationPercent, 100)}%` }}
                    />
                  </div>
                  <span className="font-mono text-foreground text-sm">
                    {pos.allocationPercent.toFixed(1)}%
                  </span>
                </div>
              </td>
              <td className="px-4 py-3 text-right">
                <span className="font-mono text-foreground text-sm">{formatUsd(pos.valueUsd)}</span>
              </td>
              <td className="px-4 py-3 text-right">
                <span className="font-mono text-emerald-400 text-sm">
                  {formatApyPercent(pos.apy)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PoolTable({ pools }: { pools: DiscoveredPool[] }) {
  const sorted = [...pools].sort((a, b) => b.currentApy - a.currentApy);

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full">
        <thead>
          <tr className="border-border border-b bg-muted/20">
            <th className="px-4 py-3 text-left font-medium text-muted-foreground text-xs">Pool</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground text-xs">
              Protocol
            </th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground text-xs">Type</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground text-xs">APY</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground text-xs">TVL</th>
            <th className="hidden px-4 py-3 text-right font-medium text-muted-foreground text-xs sm:table-cell">
              Risk
            </th>
            <th className="hidden px-4 py-3 text-right font-medium text-muted-foreground text-xs md:table-cell">
              Updated
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((pool, idx) => {
            const risk = riskLabel(pool.riskScore);
            return (
              <tr key={`${pool.id}-${idx}`} className="border-border/50 border-b last:border-0">
                <td className="px-4 py-3">
                  <span className="font-medium text-foreground text-sm">
                    {pool.assetSymbol}
                    {pool.pairedAssetSymbol ? `/${pool.pairedAssetSymbol}` : ""}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-muted-foreground text-sm capitalize">{pool.protocol}</span>
                </td>
                <td className="px-4 py-3">
                  <Badge
                    className={cn(
                      "text-[10px]",
                      POOL_TYPE_COLOR[pool.poolType] ?? "bg-muted text-muted-foreground"
                    )}
                  >
                    {pool.poolType}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="font-mono text-emerald-400 text-sm">
                    {formatApyPercent(pool.currentApy)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="font-mono text-foreground text-sm">
                    {formatCompactUsd(pool.tvlUsd)}
                  </span>
                </td>
                <td className="hidden px-4 py-3 text-right sm:table-cell">
                  <div className="flex items-center justify-end gap-1.5">
                    <span className={cn("font-mono text-sm", risk.color)}>{pool.riskScore}</span>
                    <span className={cn("text-xs", risk.color)}>{risk.label}</span>
                  </div>
                </td>
                <td className="hidden px-4 py-3 text-right md:table-cell">
                  <span className="text-muted-foreground text-xs">
                    {formatTimestamp(pool.lastUpdated)}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function FarmingActivityRow({ activity }: { activity: ActivityItem }) {
  const label = ACTIVITY_LABEL[activity.type] ?? activity.type;

  const icon =
    activity.type === "REBALANCE" ? (
      <ArrowUpRight className="h-4 w-4 text-blue-400" />
    ) : activity.type === "HARVEST" ? (
      <Zap className="h-4 w-4 text-yellow-400" />
    ) : activity.type === "HALT" ? (
      <XCircle className="h-4 w-4 text-red-400" />
    ) : activity.type === "RESUME" ? (
      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
    ) : (
      <Clock className="h-4 w-4 text-muted-foreground" />
    );

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/10 px-4 py-3">
      {icon}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground text-sm">{label}</span>
          {activity.amount != null && activity.token && (
            <Badge variant="secondary" className="text-[10px]">
              {activity.amount} {activity.token}
            </Badge>
          )}
        </div>
        {activity.detail && (
          <span className="text-muted-foreground text-xs">{activity.detail}</span>
        )}
      </div>
      {activity.txHash && (
        <a
          href={`https://stellar.expert/explorer/testnet/tx/${activity.txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-primary text-xs hover:underline"
        >
          TX
        </a>
      )}
      <span className="shrink-0 text-muted-foreground text-xs">
        {formatTimestamp(activity.createdAt)}
      </span>
    </div>
  );
}
