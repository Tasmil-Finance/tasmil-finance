"use client";

import { MultiSidebarLayout } from "@/shared/layout/multi-sidebar-layout";

export default function DashboardPageLayout({ children }: { children: React.ReactNode }) {
  return (
    <MultiSidebarLayout showRightSidebar={false} showHeader={true} title="Dashboard">
      {children}
    </MultiSidebarLayout>
  );
}
