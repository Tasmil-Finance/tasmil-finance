"use client";

import { MultiSidebarLayout } from "@/components/layout/multi-sidebar-layout";

export default function DashboardPageLayout({ children }: { children: React.ReactNode }) {
  return (
    <MultiSidebarLayout showRightSidebar={false} showHeader={true}>
      {children}
    </MultiSidebarLayout>
  );
}
