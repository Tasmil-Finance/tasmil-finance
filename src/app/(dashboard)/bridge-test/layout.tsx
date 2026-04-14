import { EvmWalletProvider } from "@/features/bridge/providers/evm-wallet-provider";
import type { ReactNode } from "react";

export default function BridgeTestLayout({ children }: { children: ReactNode }) {
  return <EvmWalletProvider>{children}</EvmWalletProvider>;
}
