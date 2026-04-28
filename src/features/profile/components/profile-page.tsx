"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Wallet } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback } from "react";
import { TOUR_NAMES } from "@/features/onboarding/config/tour-steps";
import { usePageTour } from "@/features/onboarding/hooks/use-onboarding";
import { cn } from "@/lib/utils";
import { Button } from "@/shared/ui/button-v2";
import { useWalletStore } from "@/store/use-wallet";
import { useDefiPositions } from "../hooks/use-defi-positions";
import { useSnapshotSubmitter } from "../hooks/use-snapshot-submitter";
import { useWalletTokens } from "../hooks/use-wallet-tokens";
import { HistorySidebar } from "./history-sidebar";
import { NftPlaceholder } from "./nft-placeholder";
import { PerformanceChart } from "./performance-chart";
import { ProtocolPositions } from "./protocol-positions";
import { TokenList } from "./token-list";
import { TransactionList } from "./transaction-list";
import { WalletHeader } from "./wallet-header";

type TabValue = "tokens" | "positions" | "nfts" | "history";
const VALID_TABS: TabValue[] = ["tokens", "positions", "nfts", "history"];

const TABS: { value: TabValue; label: string }[] = [
  { value: "tokens", label: "Tokens" },
  { value: "positions", label: "Positions" },
  { value: "nfts", label: "NFTs" },
  { value: "history", label: "Transaction History" },
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
      <p className="text-muted-foreground">Connect your Stellar wallet to view your profile.</p>
    </motion.div>
  );
}

function ProfileContent() {
  usePageTour(TOUR_NAMES.portfolio);
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { account } = useWalletStore();

  const tabParam = searchParams.get("tab") as TabValue | null;
  const activeTab: TabValue = tabParam && VALID_TABS.includes(tabParam) ? tabParam : "tokens";

  const setActiveTab = useCallback(
    (tab: TabValue) => {
      const params = new URLSearchParams(searchParams.toString());
      if (tab === "tokens") {
        params.delete("tab");
      } else {
        params.set("tab", tab);
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    },
    [router, searchParams]
  );

  const { data: walletData, isLoading: tokensLoading } = useWalletTokens(account);
  const {
    groups,
    isLoading: positionsLoading,
    loadingProtocols,
    totalValueUsd: positionsTotalUsd,
  } = useDefiPositions(account);

  // Total portfolio = wallet tokens + DeFi positions
  const walletUsd = walletData?.totalUsd ?? 0;
  const totalUsd = walletUsd + positionsTotalUsd;

  // Submit periodic portfolio snapshots — backend fetches values via SDK
  useSnapshotSubmitter(account);

  if (!account) {
    return <ConnectPrompt />;
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex-1 overflow-auto">
        <div className="flex flex-col gap-6 px-4 py-6 sm:px-6 md:px-8">
          {/* Wallet header */}
          <WalletHeader
            address={account}
            totalUsd={totalUsd}
            walletUsd={walletUsd}
            positionsUsd={positionsTotalUsd}
            isLoading={tokensLoading}
          />

          {/* Credits link */}
          <div className="flex justify-end">
            <Button asChild variant="ghost" className="text-sm font-medium">
              <Link href="/profile/credits">View credits & ledger →</Link>
            </Button>
          </div>

          {/* Tab bar */}
          <motion.div
            data-onborda="portfolio-tabs"
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
                    layoutId="profile-tab-indicator"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </motion.div>

          {/* Tab content */}
          <AnimatePresence mode="wait">
            {activeTab === "tokens" && (
              <motion.div
                key="tokens"
                className="flex flex-col gap-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                {/* Two-column: Portfolio stats + History sidebar */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
                  <PerformanceChart
                    address={account}
                    totalUsd={totalUsd}
                    walletUsd={walletUsd}
                    defiUsd={positionsTotalUsd}
                    isLoadingTokens={tokensLoading}
                  />
                  <HistorySidebar address={account} onSeeAll={() => setActiveTab("history")} />
                </div>

                {/* Assets table */}
                <TokenList
                  tokens={walletData?.tokens ?? []}
                  totalUsd={totalUsd}
                  isLoading={tokensLoading}
                />
              </motion.div>
            )}

            {activeTab === "positions" && (
              <motion.div
                key="positions"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                <ProtocolPositions
                  groups={groups}
                  isLoading={positionsLoading}
                  loadingProtocols={loadingProtocols}
                  totalValueUsd={positionsTotalUsd}
                />
              </motion.div>
            )}

            {activeTab === "nfts" && (
              <motion.div
                key="nfts"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                <NftPlaceholder />
              </motion.div>
            )}

            {activeTab === "history" && account && (
              <motion.div
                key="history"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                <TransactionList address={account} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export function ProfilePage() {
  return (
    <Suspense>
      <ProfileContent />
    </Suspense>
  );
}
