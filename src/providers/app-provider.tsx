"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ThemeProvider } from "next-themes";
import type { PropsWithChildren } from "react";
import { useState } from "react";
import { Toaster } from "sonner";
import { WalletProvider } from "@/shared/context/wallet-context";
import { TooltipProvider } from "@/shared/ui/tooltip";
import { OnboardingProvider } from "./onboarding-provider";
import { ThemeStorageMigration } from "./theme-storage-migration";

export function AppProvider({ children }: PropsWithChildren) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5,
            gcTime: 1000 * 60 * 10,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        forcedTheme="dark"
        disableTransitionOnChange
        storageKey="tasmil-ui-theme"
      >
        <ThemeStorageMigration />
        <TooltipProvider>
          <WalletProvider>
            <OnboardingProvider>{children}</OnboardingProvider>
          </WalletProvider>
        </TooltipProvider>
        <Toaster position="top-right" richColors />
      </ThemeProvider>
      {process.env.NEXT_PUBLIC_APP_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
