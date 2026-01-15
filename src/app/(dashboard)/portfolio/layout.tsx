"use client";

import { MultiSidebarLayout } from "@/shared/layout/multi-sidebar-layout";

export default function PortfolioLayout({ children }: { children: React.ReactNode }) {
  return (
    <MultiSidebarLayout showRightSidebar={false} showHeader={true} title="Portfolio">
      {children}
    </MultiSidebarLayout>
  );
}
