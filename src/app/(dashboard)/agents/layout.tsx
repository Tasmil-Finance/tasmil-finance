"use client";

import { MultiSidebarLayout } from "@/shared/layout/multi-sidebar-layout";

export default function AgentsLayout({ children }: { children: React.ReactNode }) {
  return (
    <MultiSidebarLayout showRightSidebar={false} showHeader={true} title="Agents">
      {children}
    </MultiSidebarLayout>
  );
}
