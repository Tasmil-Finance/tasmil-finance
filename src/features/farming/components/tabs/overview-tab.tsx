"use client";

import { motion } from "framer-motion";
import { Info } from "lucide-react";
import type { ActivityItem, PositionData } from "@/features/account/types";
import { Button } from "@/shared/ui/button-v2";
import { FarmingActivitySidebar } from "../farming-activity";
import { FarmingAllocation } from "../farming-allocation";
import { FarmingPools } from "../farming-pools";
import type { DiscoveredPool } from "../../types";

interface OverviewTabProps {
  position: PositionData;
  activities: ActivityItem[] | undefined;
  activitiesLoading: boolean;
  registryPools: DiscoveredPool[];
  registryPoolsLoading: boolean;
  unallocatedWalletUsd: number;
  isRevoked: boolean;
  accountActionPending: boolean;
  onActivate: () => void;
  onSeeAllActivity: () => void;
}

export function OverviewTab({
  position,
  activities,
  activitiesLoading,
  registryPools,
  registryPoolsLoading,
  unallocatedWalletUsd,
  isRevoked,
  accountActionPending,
  onActivate,
  onSeeAllActivity,
}: OverviewTabProps) {
  return (
    <motion.div
      key="overview"
      className="flex flex-col gap-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.25 }}
    >
      {isRevoked && (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/10 px-4 py-3">
          <Info className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="flex-1 text-sm text-muted-foreground">
            <strong className="text-foreground">Agent paused.</strong> Deposits are available, but
            withdrawals require reactivating the session key first.
          </span>
          <Button
            size="sm"
            variant="gradient"
            className="shrink-0"
            onClick={onActivate}
            disabled={accountActionPending}
          >
            Activate Session Key
          </Button>
        </div>
      )}

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
          onSeeAll={onSeeAllActivity}
        />
      </div>

      <FarmingPools pools={registryPools} isLoading={registryPoolsLoading} />
    </motion.div>
  );
}
