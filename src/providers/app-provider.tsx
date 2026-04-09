"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import type { PropsWithChildren } from "react";
import { useState } from "react";
import { Toaster } from "sonner";
import { WalletProvider } from "@/shared/context/wallet-context";
import { TooltipProvider } from "@/shared/ui/tooltip";

export function AppProvider({ children }: PropsWithChildren) {
  // CRITICAL: Use useState to ensure QueryClient is only created once
  // Creating new QueryClient on every render causes all queries to re-run
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            gcTime: 1000 * 60 * 10, // 10 minutes
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        disableTransitionOnChange
        enableSystem={false}
      >
        <TooltipProvider>
          <WalletProvider>
            {children}
          </WalletProvider>
        </TooltipProvider>
        <Toaster position="top-right" richColors />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
