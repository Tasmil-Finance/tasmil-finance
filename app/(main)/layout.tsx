"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Inter } from "next/font/google";
import { usePathname } from "next/navigation";
import { ThemeProvider } from "next-themes";
import { useAccount } from "wagmi";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Header } from "@/components/layout/header";
import { TopNav } from "@/components/layout/top-nav";
import { Button } from "@/components/ui/button-v2";
import { Main } from "@/components/ui/main";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useNavigation } from "@/context/nav-context";
import { SearchProvider } from "@/context/search-context";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"] });

// Simple connect button for welcome page (without sidebar context)
function WelcomeConnectButton() {
  return (
    <ConnectButton.Custom>
      {({ openConnectModal, mounted }) => {
        return (
          <Button
            className="w-full max-w-xs"
            disabled={!mounted}
            onClick={openConnectModal}
            variant="gradient"
          >
            Connect Wallet
          </Button>
        );
      }}
    </ConnectButton.Custom>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { navItems } = useNavigation();
  const pathname = usePathname();
  // Only show Header for /agents (list page), not for /agents/*/chat/* (chat pages)
  const isAgentsListPage = pathname === "/agents" || pathname === "/agents/";
  const { isConnected, isConnecting } = useAccount();

  // Show connect wallet UI if not connected
  if (!isConnected && !isConnecting) {
    return (
      <div className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          disableTransitionOnChange
          enableSystem
        >
          <div className="flex min-h-screen items-center justify-center bg-background">
            <div className="mx-auto w-full max-w-md p-6">
              <div className="space-y-6 text-center">
                <div className="space-y-2">
                  <h1 className="font-bold text-2xl tracking-tight">
                    Welcome to DeFi AI
                  </h1>
                  <p className="text-muted-foreground">
                    Connect your wallet to get started with DeFi AI platform
                  </p>
                </div>
                <div className="flex justify-center">
                  <WelcomeConnectButton />
                </div>
              </div>
            </div>
          </div>
        </ThemeProvider>
      </div>
    );
  }

  // Show loading state while connecting
  if (isConnecting) {
    return (
      <div className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          disableTransitionOnChange
          enableSystem
        >
          <div className="flex min-h-screen items-center justify-center bg-background">
            <div className="space-y-4 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-primary border-b-2" />
              <p className="text-muted-foreground">Connecting wallet...</p>
            </div>
          </div>
        </ThemeProvider>
      </div>
    );
  }

  // Show main app when connected
  return (
    <div className={inter.className}>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        disableTransitionOnChange
        enableSystem
      >
        <div>
          <SidebarProvider>
            <SearchProvider>
              <AppSidebar />
              <div
                className={cn(
                  "ml-auto w-full max-w-full",
                  "peer-data-[state=collapsed]:w-[calc(100%-var(--sidebar-width-icon))]",
                  "peer-data-[state=expanded]:w-[calc(100%-var(--sidebar-width))]",
                  "transition-[width] duration-200 ease-linear",
                  "flex h-svh flex-col",
                  "group-data-[scroll-locked=1]/body:h-full",
                  "group-data-[scroll-locked=1]/body:has-[main.fixed-main]:h-svh"
                )}
                id="content"
              >
                <Main fixed>
                  {isAgentsListPage && (
                    <Header>
                      <TopNav header={navItems} />
                    </Header>
                  )}
                  {children}
                </Main>
              </div>
            </SearchProvider>
          </SidebarProvider>
        </div>
      </ThemeProvider>
    </div>
  );
}
