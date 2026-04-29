"use client";

import { MultiSidebarLayout } from "@/shared/layout/multi-sidebar-layout";

export default function ReferralsLayout({ children }: { children: React.ReactNode }) {
  return (
    <MultiSidebarLayout showRightSidebar={false} showHeader={true} title="Referrals">
      {children}
    </MultiSidebarLayout>
  );
}
