"use client";

import { MultiSidebarLayout } from "@/shared/layout/multi-sidebar-layout";
import { EvmWalletProvider } from "@/features/bridge/providers/evm-wallet-provider";

export default function BridgeLayout({ children }: { children: React.ReactNode }) {
  return (
    <MultiSidebarLayout showRightSidebar={false} showHeader={false}>
      <EvmWalletProvider>{children}</EvmWalletProvider>
    </MultiSidebarLayout>
  );
}
