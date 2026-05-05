"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Wallet } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useActivity, usePosition, usePresets } from "@/features/account/hooks/use-account-api";
import type { RiskPreset } from "@/features/account/types";
import { cn } from "@/lib/utils";
import { Button } from "@/shared/ui/button-v2";
import { useWalletStore } from "@/store/use-wallet";
import { useFarmingActions } from "../hooks/use-farming-actions";
import { usePools } from "../hooks/use-farming-api";
import type { DiscoveredPool } from "../types";
import { computeCashflowSummary } from "../utils/cashflow";
import { ActivityDrawer } from "./activity-drawer";
import { FarmingModals, type FarmingModalTab } from "./farming-modals";
import { FarmingStatusBanners } from "./farming-status-banners";
import { StatRow } from "./hero/stat-row";
import { PoolDetailDrawer } from "./pool-detail-drawer";
import { SettingsButton } from "./settings-button";
import { ManageTab } from "./tabs/manage-tab";
import { PerformanceTab } from "./tabs/performance-tab";

type TabValue = "performance" | "manage";
const VALID_TABS: TabValue[] = ["performance", "manage"];
const TABS: { value: TabValue; label: string }[] = [
  { value: "performance", label: "Performance" },
  { value: "manage", label: "Manage" },
];

const LEGACY_TAB_MAP: Record<string, TabValue> = {
  overview: "performance",
  pools: "manage",
  strategy: "manage",
  activity: "performance",
};

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
      <h2 className="mb-2 font-bold text-2xl text-foreground">Connect Your Wallet</h2>
      <p className="text-muted-foreground">
        Connect your Stellar wallet to view the farming agent.
      </p>
    </motion.div>
  );
}

/**
 * Empty state shown to a connected user who has no Position yet (or whose
 * deploy is still in flight). Click the gradient CTA → routes to the
 * dedicated /farming/setup full-page wizard.
 */
function GetStartedEmptyState({
  resuming,
  onStart,
}: {
  resuming: boolean;
  onStart: () => void;
}) {
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
      <h2 className="mb-2 font-bold text-2xl text-foreground">
        {resuming ? "Resume your setup" : "Set up your farming account"}
      </h2>
      <p className="mb-6 max-w-md text-muted-foreground text-sm">
        {resuming
          ? "Your previous setup didn't finish. Pick up where you left off — your selections are saved."
          : "Choose the asset and strategy your agent will use. Two wallet signatures, ~30 seconds."}
      </p>
      <Button
        variant="gradient"
        size="lg"
        data-testid="setup-cta"
        className="h-11 px-8"
        onClick={onStart}
      >
        {resuming ? "Resume setup" : "Get started"}
      </Button>
    </motion.div>
  );
}

function FarmingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { account } = useWalletStore();
  const publicKey = account ?? undefined;

  const tabParam = searchParams.get("tab");
  const resolvedTab: TabValue = (() => {
    if (tabParam && VALID_TABS.includes(tabParam as TabValue)) return tabParam as TabValue;
    if (tabParam) {
      const mapped = LEGACY_TAB_MAP[tabParam];
      if (mapped) return mapped;
    }
    return "performance";
  })();

  const [activityDrawerOpen, setActivityDrawerOpen] = useState(false);
  const [poolDrawer, setPoolDrawer] = useState<DiscoveredPool | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: open drawer once on mount when ?tab=activity
  useEffect(() => {
    if (tabParam === "activity") setActivityDrawerOpen(true);
  }, []);

  const setActiveTab = useCallback(
    (tab: TabValue) => {
      const params = new URLSearchParams(searchParams.toString());
      if (tab === "performance") params.delete("tab");
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

  // Redirect connected-but-no-account users to the dedicated /farming/setup
  // full-page wizard. Guard waits for the position fetch to settle so we
  // don't redirect before the API has confirmed there's no managed account.
  useEffect(() => {
    if (!publicKey) return;
    if (positionLoading) return;
    if (!position) router.replace("/farming/setup");
  }, [publicKey, position, positionLoading, router]);

  const { data: registryPoolsData, isLoading: registryPoolsLoading } = usePools();
  const {
    data: activities,
    isLoading: activitiesLoading,
    refetch: refetchActivity,
  } = useActivity(publicKey);

  const [strategyPreviewAsset, setStrategyPreviewAsset] = useState<"USDC" | "XLM">("USDC");
  const { data: presets, isLoading: presetsLoading } = usePresets(strategyPreviewAsset);

  const actions = useFarmingActions(publicKey);

  // Defensive guards: backend may return non-array shapes that slip past `?? []`
  // (which only catches null/undefined). Centralize here so every consumer
  // routes through a safe array.
  const positionsList = useMemo(
    () => (Array.isArray(position?.positions) ? position.positions : []),
    [position?.positions]
  );

  const activitiesList = useMemo(
    () => (Array.isArray(activities) ? activities : []),
    [activities]
  );

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
    const isBalanceStale = Boolean(position?.balanceStale);
    let available = 0;
    let locked = 0;
    let positionsTotal = 0;
    for (const pos of positionsList) {
      positionsTotal += pos.valueUsd;
      if (pos.poolType === "backstop" && pos.q4wExpiresAt) locked += pos.valueUsd;
      else available += pos.valueUsd;
    }
    const walletAvailable = isBalanceStale
      ? 0
      : Math.max((position?.totalValueUsd ?? 0) - positionsTotal, 0);
    available += walletAvailable;
    return { availableUsd: available, lockedUsd: locked };
  }, [positionsList, position?.totalValueUsd, position?.balanceStale]);

  const deployedInPoolsUsd = useMemo(
    () => positionsList.reduce((sum, pos) => sum + pos.valueUsd, 0),
    [positionsList]
  );

  const unallocatedWalletUsd = useMemo(() => {
    if (position?.balanceStale) return 0;
    return Math.max((position?.totalValueUsd ?? 0) - deployedInPoolsUsd, 0);
  }, [position?.totalValueUsd, deployedInPoolsUsd, position?.balanceStale]);

  const cashflowSummary = useMemo(
    () =>
      computeCashflowSummary(
        position ? { ...position, positions: positionsList } : undefined,
        activitiesList
      ),
    [position, positionsList, activitiesList]
  );

  const inPositionKeys = useMemo(
    () => new Set(positionsList.map((p) => `${p.protocol.toLowerCase()}:${p.poolName}`)),
    [positionsList]
  );

  const userPositionUsd = useMemo(() => {
    if (!poolDrawer) return 0;
    const drawerName = `${poolDrawer.assetSymbol}${
      poolDrawer.pairedAssetSymbol ? `/${poolDrawer.pairedAssetSymbol}` : ""
    }`;
    const match = positionsList.find(
      (p) =>
        p.protocol.toLowerCase() === poolDrawer.protocol.toLowerCase() && p.poolName === drawerName
    );
    return match?.valueUsd ?? 0;
  }, [poolDrawer, positionsList]);

  const openModal = useCallback(
    (tab: FarmingModalTab) => {
      actions.setActionError(null);
      setModalTab(tab);
      setModalOpen(true);
    },
    [actions]
  );

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

  const handleReactivate = useCallback(async () => {
    const ok = await actions.reactivate();
    if (ok) {
      await Promise.all([refetchPosition(), refetchActivity()]);
      setModalOpen(false);
    }
  }, [actions, refetchPosition, refetchActivity]);

  const handleApplyPreset = async () => {
    if (!selectedPreset) return;
    const ok = await actions.applyPreset(selectedPreset);
    if (ok) await refetchPosition();
  };

  const handlePoolDeposit = useCallback(
    (_pool: DiscoveredPool) => {
      // pool argument unused by handler today; kept for Phase 2 per-pool routing
      setPoolDrawer(null);
      if (position?.status === "REVOKED") {
        // Drawer button reads "Reactivate Session" when revoked; route accordingly.
        void handleReactivate();
        return;
      }
      openModal("fund");
    },
    [position?.status, handleReactivate, openModal]
  );

  const handlePoolWithdraw = useCallback(
    (_pool: DiscoveredPool) => {
      // pool argument unused by handler today; kept for Phase 2 per-pool routing
      setWithdrawAmount(String(userPositionUsd.toFixed(2)));
      setPoolDrawer(null);
      openModal("withdraw");
    },
    [userPositionUsd, openModal]
  );

  if (!publicKey) return <ConnectPrompt />;

  if (registryPoolsLoading || positionLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!position || position.status === "DEPLOYING") {
    return (
      <GetStartedEmptyState
        resuming={position?.status === "DEPLOYING"}
        onStart={() => router.push("/farming/setup")}
      />
    );
  }

  const registryPools = registryPoolsData ?? [];
  const isRevoked = position.status === "REVOKED";

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex-1 overflow-auto">
        <div className="flex flex-col gap-6 px-4 py-6 sm:px-6 md:px-8">
          <FarmingStatusBanners
            status={position.status}
            balanceStale={Boolean(position.balanceStale)}
            sessionKeyStale={Boolean(position.sessionKeyStale)}
            onRefresh={() => openModal("security")}
            onDeposit={() => openModal("fund")}
          />

          <StatRow
            totalValueUsd={position.totalValueUsd}
            allTimePnlUsd={cashflowSummary.allTimePnlUsd}
            allTimePnlPercent={cashflowSummary.allTimePnlPercent}
            currentApy={position.currentApy}
          />

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
            <SettingsButton status={position.status} onOpen={openModal} />
          </motion.div>

          <motion.div
            role="tablist"
            className="flex items-center gap-4 border-border border-b pb-0"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            {TABS.map((tab) => (
              <button
                key={tab.value}
                role="tab"
                aria-selected={resolvedTab === tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={cn(
                  "relative pb-3 font-medium text-base transition-colors",
                  resolvedTab === tab.value
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
                {resolvedTab === tab.value && (
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
            {resolvedTab === "performance" && (
              <PerformanceTab
                key="performance"
                position={position}
                activities={activitiesList}
                activitiesLoading={activitiesLoading}
                unallocatedWalletUsd={unallocatedWalletUsd}
                publicKey={publicKey}
                onOpenDrawer={() => setActivityDrawerOpen(true)}
              />
            )}
            {resolvedTab === "manage" && (
              <ManageTab
                key="manage"
                presets={presets}
                presetsLoading={presetsLoading}
                selectedPreset={selectedPreset}
                onSelectPreset={setSelectedPreset}
                currentPreset={position.preset}
                previewAsset={strategyPreviewAsset}
                onChangePreviewAsset={setStrategyPreviewAsset}
                activeAssets={position.activeAssets ?? []}
                isRevoked={isRevoked}
                isUpdatingPreset={actions.isUpdatingPreset}
                actionError={actions.actionError}
                onApply={handleApplyPreset}
                pools={registryPools}
                poolsLoading={registryPoolsLoading}
                inPositionKeys={inPositionKeys}
                onSelectPool={setPoolDrawer}
              />
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

      <ActivityDrawer
        open={activityDrawerOpen}
        onOpenChange={setActivityDrawerOpen}
        activities={activitiesList}
        isLoading={activitiesLoading}
      />

      <PoolDetailDrawer
        open={!!poolDrawer}
        onOpenChange={(open) => {
          if (!open) setPoolDrawer(null);
        }}
        pool={poolDrawer}
        userPositionUsd={userPositionUsd}
        isRevoked={isRevoked}
        onDeposit={handlePoolDeposit}
        onWithdraw={handlePoolWithdraw}
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
