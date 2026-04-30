"use client";

import { MultiSidebarLayout } from "@/shared/layout/multi-sidebar-layout";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <MultiSidebarLayout showRightSidebar={true} showHeader={false}>
      {children}
    </MultiSidebarLayout>
  );
}
