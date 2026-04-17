"use client";

import {
  AlertTriangle,
  Loader2,
  Pause,
  ShieldOff,
  Wallet,
  XCircle,
} from "lucide-react";
import { Suspense, useCallback, useId, useMemo, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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
import type { RiskPreset } from "@/features/account/types";
import { cn } from "@/lib/utils";
import { Button } from "@/shared/ui/button-v2";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { useWalletStore } from "@/store/use-wallet";
import { usePools, useRebalanceStatus } from "../hooks/use-farming-api";
import { FarmingHeader } from "./farming-header";
import { FarmingAllocation } from "./farming-allocation";
import { FarmingPools } from "./farming-pools";
import { FarmingActivity, FarmingActivitySidebar } from "./farming-activity";

// ─── Helpers ────────────────────────────────────────────────────────────────

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

// ─── Tabs ───────────────────────────────────────────────────────────────────

type TabValue = "overview" | "pools" | "activity";
const VALID_TABS: TabValue[] = ["overview", "pools", "activity"];

const TABS: { value: TabValue; label: string }[] = [
  { value: "overview", label: "Overview" },
  { value: "pools", label: "Pools" },
  { value: "activity", label: "Activity" },
];

// ─── Connect prompt ─────────────────────────────────────────────────────────

function ConnectPrompt() {
  return (
    <motion.div
      className="mx-auto flex max-w-lg flex-col items-center py-24 text-center"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted/20">
        <Wallet className="h-8 w-8 text-muted-foreground" />
      </div>
      <h2 className="mb-2 text-2xl font-bold text-foreground">Connect Your Wallet</h2>
      <p className="text-muted-foreground">
        Connect your Stellar wallet to view the farming agent.
      </p>
    </motion.div>
  );
}

// ─── Main content ───────────────────────────────────────────────────────────

function FarmingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { account } = useWalletStore();
  const publicKey = account ?? undefined;

  // Tab state
  const tabParam = searchParams.get("tab") as TabValue | null;
  const activeTab: TabValue = tabParam && VALID_TABS.includes(tabParam) ? tabParam : "overview";

  const setActiveTab = useCallback(
    (tab: TabValue) => {
      const params = new URLSearchParams(searchParams.toString());
      if (tab === "overview") {
        params.delete("tab");
      } else {
        params.set("tab", tab);
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    },
    [router, searchParams, pathname],
  );

  // Modal state
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [accountModalTab, setAccountModalTab] = useState<
    "fund" | "strategy" | "withdraw" | "security"
  >("fund");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<RiskPreset | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const withdrawAmountInputId = useId();
  const [isReconfiguring, setIsReconfiguring] = useState(false);
  const canChangeStrategy = false;

  // Data hooks
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

  // Mutations
  const fundAccount = useFundAccount();
  const withdrawMutation = useWithdraw();
  const revokeMutation = useRevoke();
  const submitTx = useSubmitTx();
  const updatePreset = useUpdatePreset();
  const setupAccount = useSetupAccount();
  const resumeAccount = useResumeAccount();

  // Computed values
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
    const netDepositsFromApi =
      position?.netDepositsUsd ?? totalDepositedUsd - totalWithdrawnFromApi;
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
      if (item.type === "FUND") totalFundedUsd += amountUsd;
      else if (item.type === "DEPOSIT") legacyStrategyDepositsUsd += amountUsd;
      else if (item.type === "WITHDRAW") totalWithdrawnUsd += amountUsd;
    }

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

    return { totalFundedUsd, totalWithdrawnUsd, netDepositsUsd, allTimePnlUsd, allTimePnlPercent };
  }, [
    activities,
    position?.totalDepositedUsd,
    position?.totalWithdrawnUsd,
    position?.netDepositsUsd,
    position?.totalValueUsd,
    position?.profitUsd,
    position?.profitPercent,
  ]);

  // ─── Action handlers ──────────────────────────────────────────────────────

  const openAccountModal = (tab: "fund" | "strategy" | "withdraw" | "security") => {
    setActionError(null);
    if (tab === "strategy") {
      const normalized = position?.preset?.toLowerCase();
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
      setActionError(err instanceof Error ? err.message : "Operation failed. Please try again.");
    }
  };

  const handleFund = async (amount: number, token: "USDC" | "XLM") => {
    if (!publicKey) return;
    try {
      setActionError(null);
      const result = await fundAccount.mutateAsync({ publicKey, amount, token });
      if (!result?.xdr) throw new Error("No fund transaction returned from server");
      const signedXdr = await signXdr(result.xdr, publicKey);
      await submitTx.mutateAsync({ signedXdr, publicKey, txType: "fund", amount, token });
      await Promise.all([refetchPosition(), refetchActivity()]);
      setAccountModalOpen(false);
    } catch (err) {
      console.warn("Fund failed:", err);
      setActionError(err instanceof Error ? err.message : "Operation failed. Please try again.");
    }
  };

  const handleWithdraw = async () => {
    if (!publicKey || !canWithdraw) return;
    try {
      setActionError(null);
      const result = await withdrawMutation.mutateAsync({ publicKey, amount: parsedWithdrawAmount });
      const xdrs: string[] = result?.xdrs ?? (result?.xdr ? [result.xdr] : []);
      const signedXdrs: string[] = result?.signedXdrs ?? [];
      if (xdrs.length === 0 && signedXdrs.length === 0)
        throw new Error("No withdrawal transaction returned from server");

      for (const [i, xdr] of xdrs.entries()) {
        const signedXdr = await signXdr(xdr, publicKey);
        const isLast = i === xdrs.length - 1 && signedXdrs.length === 0;
        await submitTx.mutateAsync({
          signedXdr,
          ...(isLast ? { publicKey, txType: "withdraw" as const, amount: parsedWithdrawAmount } : {}),
        });
      }

      for (const [i, signedXdr] of signedXdrs.entries()) {
        const isLast = i === signedXdrs.length - 1;
        await submitTx.mutateAsync({
          signedXdr,
          ...(isLast ? { publicKey, txType: "withdraw" as const, amount: parsedWithdrawAmount } : {}),
        });
      }

      await Promise.all([refetchPosition(), refetchActivity()]);
      setWithdrawAmount("");
      setAccountModalOpen(false);
    } catch (err) {
      console.warn("Withdraw failed:", err);
      setActionError(err instanceof Error ? err.message : "Operation failed. Please try again.");
    }
  };

  const handleReconfigure = async () => {
    if (!publicKey) return;
    try {
      setIsReconfiguring(true);
      setActionError(null);
      const setupResult = await setupAccount.mutateAsync(publicKey);
      const setupXdrs = setupResult?.setupTxs ?? [];
      if (setupXdrs.length === 0 || !setupXdrs[0]) {
        throw new Error("No setup transaction returned from server");
      }
      const signedXdr = await signXdr(setupXdrs[0], publicKey);
      await submitTx.mutateAsync({ signedXdr });
      await resumeAccount.mutateAsync(publicKey);
      await Promise.all([refetchPosition(), refetchActivity()]);
    } catch (err) {
      console.warn("Reconfigure failed:", err);
      setActionError(err instanceof Error ? err.message : "Reconfigure failed. Please try again.");
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
      await submitTx.mutateAsync({ signedXdr, publicKey, txType: "revoke" });
      await Promise.all([refetchPosition(), refetchActivity()]);
      setAccountModalOpen(false);
    } catch (err) {
      console.warn("Revoke failed:", err);
      setActionError(err instanceof Error ? err.message : "Operation failed. Please try again.");
    }
  };

  // ─── Guards ───────────────────────────────────────────────────────────────

  if (!publicKey) return <ConnectPrompt />;

  if (statusLoading || registryPoolsLoading || positionLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!position) return <OnboardingPage />;

  // ─── Derived ──────────────────────────────────────────────────────────────

  const registryPools = registryPoolsData ?? [];
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

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex-1 overflow-auto">
        <div className="flex flex-col gap-6 px-4 py-6 sm:px-6 md:px-8">
          {/* Header — like WalletHeader: icon + big value + P&L */}
          <FarmingHeader
            totalValueUsd={position.totalValueUsd}
            allTimePnlUsd={cashflowSummary.allTimePnlUsd}
            allTimePnlPercent={cashflowSummary.allTimePnlPercent}
            currentApy={position.currentApy}
            status={status}
            isLoading={false}
          />

          {/* Action buttons — visible right under header */}
          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.08 }}
          >
            <Button
              variant="gradient"
              size="default"
              className="px-6"
              onClick={() => openAccountModal("fund")}
            >
              Deposit
            </Button>
            <Button
              variant="outline"
              size="default"
              className="px-6"
              onClick={() => openAccountModal("withdraw")}
            >
              Withdraw
            </Button>
            <Button
              variant="ghost"
              size="default"
              className="text-muted-foreground hover:text-orange-400"
              onClick={() => openAccountModal("security")}
            >
              <ShieldOff className="mr-1.5 h-3.5 w-3.5" />
              Revoke
            </Button>
          </motion.div>

          {/* Tab bar — like portfolio tab bar */}
          <motion.div
            className="flex items-center gap-4 border-b border-border pb-0"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            {TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={cn(
                  "relative pb-3 text-base font-medium transition-colors",
                  activeTab === tab.value
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {tab.label}
                {activeTab === tab.value && (
                  <motion.div
                    className="absolute inset-x-0 bottom-0 h-0.5 bg-primary"
                    layoutId="farming-tab-indicator"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </motion.div>

          {/* Tab content */}
          <AnimatePresence mode="wait">
            {activeTab === "overview" && (
              <motion.div
                key="overview"
                className="flex flex-col gap-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                {/* Halted banner */}
                {status?.halted && (
                  <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">
                    <Pause className="h-4 w-4 shrink-0 text-red-400" />
                    <span className="flex-1 text-sm text-muted-foreground">
                      {status.haltReason ?? "Agent halted"}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0 border-red-500/30 text-red-400 hover:bg-red-500/10"
                      onClick={handleReconfigure}
                      disabled={isReconfiguring}
                    >
                      {isReconfiguring ? "Reconfiguring..." : "Reconfigure"}
                    </Button>
                  </div>
                )}

                {/* Two-column: Allocation card (left) + Activity sidebar (right)
                    Same layout as portfolio: Performance chart + History sidebar */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
                  <FarmingAllocation
                    positions={position.positions}
                    totalValueUsd={position.totalValueUsd}
                    unallocatedWalletUsd={unallocatedWalletUsd}
                    isLoading={false}
                  />
                  <FarmingActivitySidebar
                    activities={activities}
                    isLoading={activitiesLoading}
                    onSeeAll={() => setActiveTab("activity")}
                  />
                </div>

                {/* Pools table below — like Assets table in portfolio */}
                <FarmingPools pools={registryPools} isLoading={registryPoolsLoading} />

              </motion.div>
            )}

            {activeTab === "pools" && (
              <motion.div
                key="pools"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                <FarmingPools pools={registryPools} isLoading={registryPoolsLoading} />
              </motion.div>
            )}

            {activeTab === "activity" && (
              <motion.div
                key="activity"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                <FarmingActivity activities={activities} isLoading={activitiesLoading} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ─── Modals ──────────────────────────────────────────────────────────── */}

      <Dialog
        open={accountModalOpen}
        onOpenChange={(open) => {
          setAccountModalOpen(open);
          if (!open) setActionError(null);
        }}
      >
        <DialogContent
          className={cn(
            "max-h-[90vh] overflow-y-auto",
            accountModalTab === "strategy" ? "max-w-5xl" : "max-w-2xl",
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
                ? "Add funds to your farming agent."
                : accountModalTab === "strategy"
                  ? "Choose your risk profile for future allocations."
                  : accountModalTab === "withdraw"
                    ? "Withdraw from available positions."
                    : "Disable automation by revoking the active session key."}
            </DialogDescription>
          </DialogHeader>

          {actionError && (
            <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
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
                <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm text-yellow-300">
                  Strategy changes are admin-protected in this environment.
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                Choose your risk profile. Changes apply to future allocations.
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
          )}

          {accountModalTab === "withdraw" && (
            <div className="space-y-4 pt-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-border bg-muted/10 p-3">
                  <p className="text-xs text-muted-foreground">Available (instant)</p>
                  <p className="text-lg font-semibold text-foreground">{formatUsd(availableUsd)}</p>
                </div>
                <div className="rounded-lg border border-border bg-muted/10 p-3">
                  <p className="text-xs text-muted-foreground">Locked (backstop)</p>
                  <p className="text-lg font-semibold text-foreground">{formatUsd(lockedUsd)}</p>
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor={withdrawAmountInputId} className="block text-xs text-muted-foreground">
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
            </div>
          )}

          {accountModalTab === "security" && (
            <div className="space-y-4 pt-3">
              <div className="flex items-start gap-3 rounded-lg border border-orange-500/30 bg-orange-500/10 p-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-orange-400" />
                <div className="text-xs">
                  <p className="font-medium text-orange-300">
                    Revoke session key is irreversible.
                  </p>
                  <p className="text-orange-400/80">
                    Bot automation stops immediately. Account status becomes REVOKED.
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
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Export ──────────────────────────────────────────────────────────────────

export function FarmingPage() {
  return (
    <Suspense>
      <FarmingContent />
    </Suspense>
  );
}
