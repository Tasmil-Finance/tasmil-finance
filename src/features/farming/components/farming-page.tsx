"use client";

import { motion } from "framer-motion";
import { Loader2, Wallet } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useActivity, usePosition } from "@/features/account/hooks/use-account-api";
import { Button } from "@/shared/ui/button-v2";
import { useWalletStore } from "@/store/use-wallet";
import { useFarmingActions } from "../hooks/use-farming-actions";
import { usePools } from "../hooks/use-farming-api";
import type { DiscoveredPool } from "../types";
import { ActivityDrawer } from "./activity-drawer";
import type { AgentHistoryEvent } from "./dashboard/agent-history-card";
import { FarmingDashboard } from "./farming-dashboard";
import { FarmingModals, type FarmingModalTab } from "./farming-modals";
import { PoolDetailDrawer } from "./pool-detail-drawer";

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
function GetStartedEmptyState({ resuming, onStart }: { resuming: boolean; onStart: () => void }) {
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
  const { account } = useWalletStore();
  const publicKey = account ?? undefined;

  const tabParam = searchParams.get("tab");

  const [activityDrawerOpen, setActivityDrawerOpen] = useState(false);
  const [poolDrawer, setPoolDrawer] = useState<DiscoveredPool | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: open drawer once on mount when ?tab=activity
  useEffect(() => {
    if (tabParam === "activity") setActivityDrawerOpen(true);
  }, []);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<FarmingModalTab>("fund");
  const [withdrawAmount, setWithdrawAmount] = useState("");

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

  const { isLoading: registryPoolsLoading } = usePools();
  const {
    data: activities,
    isLoading: activitiesLoading,
    refetch: refetchActivity,
  } = useActivity(publicKey);

  const actions = useFarmingActions(publicKey);

  // Defensive guards: backend may return non-array shapes that slip past `?? []`
  // (which only catches null/undefined). Centralize here so every consumer
  // routes through a safe array.
  const positionsList = useMemo(
    () => (Array.isArray(position?.positions) ? position.positions : []),
    [position?.positions]
  );

  const activitiesList = useMemo(() => (Array.isArray(activities) ? activities : []), [activities]);

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

  const isRevoked = position.status === "REVOKED";

  const totalBalanceUsd = position.totalValueUsd ?? 0;
  const totalDepositedUsd = position.totalDepositedUsd ?? 0;
  const lifetimeEarningsUsd = position.profitUsd ?? 0;
  const lifetimeEarningsPct = position.profitPercent ?? 0;
  const netApr = position.currentApy ?? 0;
  const firstPosition = positionsList[0];
  const currentMarketName = firstPosition?.poolName ?? "—";
  const currentPositionApr = firstPosition?.apy ?? 0;
  const activatedAt = new Date().toISOString();

  const agentEvents: AgentHistoryEvent[] = activitiesList
    .filter((a) => a.category === "protocol" || a.type === "rebalance")
    .map((a) => ({
      id: a.id,
      title: a.detail ?? "Position reallocated to higher-yield lending market",
      detail:
        a.amount !== undefined
          ? `${a.amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${a.token ?? ""} reallocated`
          : (a.detail ?? ""),
      occurredAt: a.createdAt,
    }));

  return (
    <>
      <FarmingDashboard
        totalBalanceUsd={totalBalanceUsd}
        totalDepositedUsd={totalDepositedUsd}
        lifetimeEarningsUsd={lifetimeEarningsUsd}
        lifetimeEarningsPct={lifetimeEarningsPct}
        chartSeries={[]}
        agentEvents={agentEvents}
        netApr={netApr}
        currentPositionApr={currentPositionApr}
        currentMarketName={currentMarketName}
        activatedAt={activatedAt}
        onAddFunds={() => {
          setModalOpen(true);
          setModalTab("fund");
        }}
        onDeactivate={() => {
          setModalOpen(true);
          setModalTab("security");
        }}
      />

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
    </>
  );
}

export function FarmingPage() {
  return (
    <Suspense>
      <FarmingContent />
    </Suspense>
  );
}
