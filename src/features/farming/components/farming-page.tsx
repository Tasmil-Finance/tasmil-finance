"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Shield, ShieldOff, Wallet } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { OnboardingPage } from "@/features/account/components/onboarding-page";
import {
  useActivity,
  usePosition,
  usePresets,
} from "@/features/account/hooks/use-account-api";
import type { RiskPreset } from "@/features/account/types";
import { cn } from "@/lib/utils";
import { Button } from "@/shared/ui/button-v2";
import { useWalletStore } from "@/store/use-wallet";
import { usePools } from "../hooks/use-farming-api";
import { useFarmingActions } from "../hooks/use-farming-actions";
import { computeCashflowSummary } from "../utils/cashflow";
import { FarmingActivity } from "./farming-activity";
import { FarmingHeader } from "./farming-header";
import { FarmingModals, type FarmingModalTab } from "./farming-modals";
import { FarmingPools } from "./farming-pools";
import { OverviewTab } from "./tabs/overview-tab";
import { StrategyTab } from "./tabs/strategy-tab";

type TabValue = "overview" | "pools" | "strategy" | "activity";
const VALID_TABS: TabValue[] = ["overview", "pools", "strategy", "activity"];
const TABS: { value: TabValue; label: string }[] = [
  { value: "overview", label: "Overview" },
  { value: "pools", label: "Pools" },
  { value: "strategy", label: "Strategy" },
  { value: "activity", label: "Activity" },
];

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

function FarmingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { account } = useWalletStore();
  const publicKey = account ?? undefined;

  const tabParam = searchParams.get("tab") as TabValue | null;
  const activeTab: TabValue = tabParam && VALID_TABS.includes(tabParam) ? tabParam : "overview";

  const setActiveTab = useCallback(
    (tab: TabValue) => {
      const params = new URLSearchParams(searchParams.toString());
      if (tab === "overview") params.delete("tab");
      else params.set("tab", tab);
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    },
    [router, searchParams, pathname]
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<FarmingModalTab>("fund");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<RiskPreset | null>(null);

  const {
    data: position,
    isLoading: positionLoading,
    refetch: refetchPosition,
  } = usePosition(publicKey);
  const { data: registryPoolsData, isLoading: registryPoolsLoading } = usePools();
  const {
    data: activities,
    isLoading: activitiesLoading,
    refetch: refetchActivity,
  } = useActivity(publicKey);

  const [strategyPreviewAsset, setStrategyPreviewAsset] = useState<"USDC" | "XLM">("USDC");
  const { data: presets, isLoading: presetsLoading } = usePresets(strategyPreviewAsset);

  const actions = useFarmingActions(publicKey);

  // biome-ignore lint/correctness/useExhaustiveDependencies: only sync from server preset on first load
  useEffect(() => {
    const normalized = position?.preset?.toLowerCase();
    const mapped: RiskPreset | null =
      normalized === "safe"
        ? "Safe"
        : normalized === "aggressive"
          ? "Aggressive"
          : normalized === "balanced"
            ? "Balanced"
            : null;
    if (mapped && selectedPreset === null) setSelectedPreset(mapped);
  }, [position?.preset]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: sync preview asset when account base asset changes
  useEffect(() => {
    const base = position?.baseAsset?.toUpperCase();
    if (base === "USDC" || base === "XLM") setStrategyPreviewAsset(base);
  }, [position?.baseAsset]);

  const { availableUsd, lockedUsd } = useMemo(() => {
    const positions = position?.positions ?? [];
    const isBalanceStale = Boolean(position?.balanceStale);
    let available = 0;
    let locked = 0;
    let positionsTotal = 0;
    for (const pos of positions) {
      positionsTotal += pos.valueUsd;
      if (pos.poolType === "backstop" && pos.q4wExpiresAt) locked += pos.valueUsd;
      else available += pos.valueUsd;
    }
    const walletAvailable = isBalanceStale
      ? 0
      : Math.max((position?.totalValueUsd ?? 0) - positionsTotal, 0);
    available += walletAvailable;
    return { availableUsd: available, lockedUsd: locked };
  }, [position?.positions, position?.totalValueUsd, position?.balanceStale]);

  const deployedInPoolsUsd = useMemo(
    () => (position?.positions ?? []).reduce((sum, pos) => sum + pos.valueUsd, 0),
    [position?.positions]
  );

  const unallocatedWalletUsd = useMemo(() => {
    if (position?.balanceStale) return 0;
    return Math.max((position?.totalValueUsd ?? 0) - deployedInPoolsUsd, 0);
  }, [position?.totalValueUsd, deployedInPoolsUsd, position?.balanceStale]);

  const cashflowSummary = useMemo(
    () => computeCashflowSummary(position ?? undefined, activities),
    [position, activities]
  );

  const openModal = (tab: FarmingModalTab) => {
    actions.setActionError(null);
    setModalTab(tab);
    setModalOpen(true);
  };

  const handleFund = async (amount: number, token: "USDC" | "XLM") => {
    const ok = await actions.fund(amount, token);
    if (ok) {
      await Promise.all([refetchPosition(), refetchActivity()]);
      setModalOpen(false);
    }
  };

  const handleWithdraw = async () => {
    const parsed = Number.parseFloat(withdrawAmount);
    if (Number.isNaN(parsed) || parsed <= 0 || parsed > availableUsd) return;
    const ok = await actions.withdraw(parsed);
    if (ok) {
      await Promise.all([refetchPosition(), refetchActivity()]);
      setWithdrawAmount("");
      setModalOpen(false);
    }
  };

  const handleRevoke = async () => {
    const ok = await actions.revoke();
    if (ok) {
      await Promise.all([refetchPosition(), refetchActivity()]);
      setModalOpen(false);
    }
  };

  const handleReactivate = async () => {
    const ok = await actions.reactivate();
    if (ok) {
      await Promise.all([refetchPosition(), refetchActivity()]);
      setModalOpen(false);
    }
  };

  const handleApplyPreset = async () => {
    if (!selectedPreset) return;
    const ok = await actions.applyPreset(selectedPreset);
    if (ok) await refetchPosition();
  };

  if (!publicKey) return <ConnectPrompt />;

  if (registryPoolsLoading || positionLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!position || position.status === "DEPLOYING") return <OnboardingPage />;

  const registryPools = registryPoolsData ?? [];
  const isRevoked = position.status === "REVOKED";

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex-1 overflow-auto">
        <div className="flex flex-col gap-6 px-4 py-6 sm:px-6 md:px-8">
          <FarmingHeader
            totalValueUsd={position.totalValueUsd}
            allTimePnlUsd={cashflowSummary.allTimePnlUsd}
            allTimePnlPercent={cashflowSummary.allTimePnlPercent}
            currentApy={position.currentApy}
            isLoading={false}
          />

          {position.sessionKeyStale && (
            <motion.div
              className="flex items-start gap-3 rounded-lg border border-yellow-500/40 bg-yellow-500/10 p-3 text-xs"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Shield className="mt-0.5 h-4 w-4 shrink-0 text-yellow-500" />
              <div className="flex-1">
                <p className="font-medium text-foreground">New yield strategies available</p>
                <p className="text-muted-foreground">
                  Your session key was registered before we launched some pools. Refresh it to let
                  the bot access the latest opportunities. Your funds stay in your keeper wallet —
                  this just updates the bot's scope.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => openModal("security")}>
                Refresh
              </Button>
            </motion.div>
          )}

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
              onClick={() => openModal("fund")}
            >
              Deposit
            </Button>
            <Button
              variant="outline"
              size="default"
              className="px-6"
              onClick={() => openModal("withdraw")}
              disabled={isRevoked}
            >
              Withdraw
            </Button>
            {isRevoked ? (
              <Button
                variant="gradient"
                size="default"
                className="px-6"
                onClick={() => openModal("activate")}
              >
                <Shield className="mr-1.5 h-3.5 w-3.5" />
                Activate Session Key
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="default"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => openModal("security")}
              >
                <ShieldOff className="mr-1.5 h-3.5 w-3.5" />
                Revoke
              </Button>
            )}
          </motion.div>

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
                    : "text-muted-foreground hover:text-foreground"
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

          <AnimatePresence mode="wait">
            {activeTab === "overview" && (
              <OverviewTab
                position={position}
                activities={activities}
                activitiesLoading={activitiesLoading}
                registryPools={registryPools}
                registryPoolsLoading={registryPoolsLoading}
                unallocatedWalletUsd={unallocatedWalletUsd}
                isRevoked={isRevoked}
                accountActionPending={actions.isPending}
                onActivate={() => openModal("activate")}
                onSeeAllActivity={() => setActiveTab("activity")}
              />
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

            {activeTab === "strategy" && (
              <StrategyTab
                presets={presets}
                presetsLoading={presetsLoading}
                selectedPreset={selectedPreset}
                onSelectPreset={setSelectedPreset}
                currentPreset={position.preset}
                previewAsset={strategyPreviewAsset}
                onChangePreviewAsset={setStrategyPreviewAsset}
                activeAssets={position.activeAssets ?? []}
                isRevoked={isRevoked}
                isUpdating={actions.isUpdatingPreset}
                actionError={actions.actionError}
                onApply={handleApplyPreset}
              />
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

      <FarmingModals
        open={modalOpen}
        tab={modalTab}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) actions.setActionError(null);
        }}
        actionError={actions.actionError}
        isPending={actions.isPending}
        onFund={handleFund}
        availableUsd={availableUsd}
        lockedUsd={lockedUsd}
        withdrawAmount={withdrawAmount}
        onWithdrawAmountChange={setWithdrawAmount}
        onWithdraw={handleWithdraw}
        onRevoke={handleRevoke}
        onReactivate={handleReactivate}
      />
    </div>
  );
}

export function FarmingPage() {
  return (
    <Suspense>
      <FarmingContent />
    </Suspense>
  );
}
