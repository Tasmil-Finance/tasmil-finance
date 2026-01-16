"use client";

import { StrategyListPage } from "@/features/strategies";
import { MultiSidebarLayout } from "@/shared/layout/multi-sidebar-layout";

export default function StrategiesPage() {
  return (
    <MultiSidebarLayout showRightSidebar={false} showHeader={false}>
      <StrategyListPage />
    </MultiSidebarLayout>
  );
}
