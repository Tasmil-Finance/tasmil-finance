"use client";

import { MultiSidebarLayout } from "@/shared/layout/multi-sidebar-layout";

export default function TopupLayout({ children }: { children: React.ReactNode }) {
  return (
    <MultiSidebarLayout showRightSidebar={false} showHeader={true} title="Top up">
      {children}
    </MultiSidebarLayout>
  );
}
