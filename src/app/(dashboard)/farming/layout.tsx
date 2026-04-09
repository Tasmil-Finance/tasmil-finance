"use client";

import { MultiSidebarLayout } from "@/shared/layout/multi-sidebar-layout";

export default function FarmingLayout({ children }: { children: React.ReactNode }) {
  return (
    <MultiSidebarLayout showRightSidebar={false} showHeader={true} title="Farming Agent">
      {children}
    </MultiSidebarLayout>
  );
}
