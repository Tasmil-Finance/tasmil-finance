"use client";

import { MultiSidebarLayout } from "@/components/layout/multi-sidebar-layout";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <MultiSidebarLayout showRightSidebar={true} showHeader={false}>
      {children}
    </MultiSidebarLayout>
  );
}
