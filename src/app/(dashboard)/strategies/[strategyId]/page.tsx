"use client";

import { useParams } from "next/navigation";
import { StrategyDetailPage } from "@/features/strategies";
import { MultiSidebarLayout } from "@/shared/layout/multi-sidebar-layout";

export default function StrategyDetailPageRoute() {
  const params = useParams();
  const strategyId = params["strategyId"] as string;

  return (
    <MultiSidebarLayout showRightSidebar={false} showHeader={false}>
      <StrategyDetailPage strategyId={strategyId} />
    </MultiSidebarLayout>
  );
}
