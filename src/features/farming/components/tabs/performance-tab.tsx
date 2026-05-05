"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import type { ActivityItem, PositionData } from "@/features/account/types";
import { type HistoryRange, usePortfolioHistory } from "../../hooks/use-portfolio-history";
import { FarmingActivitySidebar } from "../farming-activity";
import { FarmingAllocation } from "../farming-allocation";
import { PerformanceChart } from "../performance-chart";

interface PerformanceTabProps {
  position: PositionData;
  activities: ActivityItem[] | undefined;
  activitiesLoading: boolean;
  unallocatedWalletUsd: number;
  publicKey: string | undefined;
  onOpenDrawer: () => void;
}

export function PerformanceTab({
  position,
  activities,
  activitiesLoading,
  unallocatedWalletUsd,
  publicKey,
  onOpenDrawer,
}: PerformanceTabProps) {
  const [range, setRange] = useState<HistoryRange>("7d");
  const history = usePortfolioHistory(publicKey, range);

  return (
    <motion.div
      key="performance"
      className="flex flex-col gap-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.25 }}
    >
      <PerformanceChart
        data={history.data}
        range={history.range}
        isPlaceholder={history.isPlaceholder}
        isLoading={history.isLoading}
        onRangeChange={setRange}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
        <FarmingAllocation
          positions={position.positions}
          unallocatedWalletUsd={unallocatedWalletUsd}
          isLoading={false}
        />
        <FarmingActivitySidebar
          activities={activities}
          isLoading={activitiesLoading}
          onSeeAll={onOpenDrawer}
        />
      </div>
    </motion.div>
  );
}
