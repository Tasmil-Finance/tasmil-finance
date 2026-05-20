"use client";

import { PanelLeft, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ConnectWalletButton } from "@/shared/components/connect-wallet-button";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { ChatHistoryWrapper } from "@/shared/layout/chat-history-wrapper";
import { MobileSidebarContent } from "@/shared/layout/mobile-sidebar-content";
import type { SidebarData } from "@/shared/layout/sidebar-data";
import { sidebarData as defaultSidebarData } from "@/shared/layout/sidebar-data";
import { TopNavBar } from "@/shared/layout/top-nav-bar";
import { MultiSidebarProvider, useMultiSidebar } from "@/shared/ui/multi-sidebar";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/shared/ui/sheet";

interface MultiSidebarLayoutProps {
  children: React.ReactNode;
  className?: string;
  showRightSidebar?: boolean;
  showHeader?: boolean;
  // Currently unused; kept for API compat with external callers that still pass it.
  title?: string;
  sidebarData?: SidebarData;
}

function MobileHeader({ sidebarData }: { sidebarData: SidebarData }) {
  const { toggleLeftSidebar } = useMultiSidebar();

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-border border-b bg-background px-4">
      <Link href="/chat/new" className="flex items-center gap-2">
        <Image src={sidebarData.header.logo_url} width={36} height={36} alt="Logo" />
        <span className="animate-shimmer-text bg-gradient-to-r from-[#b5eaff] via-white to-[#00bfff] bg-[length:200%_100%] bg-clip-text font-bold text-lg text-transparent">
          {sidebarData.header.brand_name}
        </span>
      </Link>
      <div className="ml-auto flex items-center gap-2">
        <ConnectWalletButton variant="topbar" />
        <button
          type="button"
          onClick={toggleLeftSidebar}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-foreground transition-colors hover:bg-accent"
        >
          <PanelLeft className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}

function MobileLayout({
  children,
  showRightSidebar,
  showHeader: _showHeader,
  sidebarData,
}: {
  children: React.ReactNode;
  showRightSidebar: boolean;
  showHeader: boolean;
  sidebarData?: SidebarData;
}) {
  const { leftSidebarOpen, rightSidebarOpen, setLeftSidebarOpen, setRightSidebarOpen } =
    useMultiSidebar();
  const data = sidebarData ?? defaultSidebarData;

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden">
      {/* Always show header on mobile for sidebar access */}
      <MobileHeader sidebarData={data} />
      <main className="no-scrollbar flex-1 overflow-y-auto overscroll-contain">{children}</main>

      {/* Left sidebar sheet - no border, custom close button */}
      <Sheet open={leftSidebarOpen} onOpenChange={setLeftSidebarOpen}>
        <SheetContent side="right" className="w-[280px] border-l-0 p-0" hideCloseButton>
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <button
            type="button"
            onClick={() => setLeftSidebarOpen(false)}
            className="absolute top-4 right-4 z-10 inline-flex h-8 w-8 items-center justify-center rounded-md text-sidebar-foreground transition-colors hover:bg-sidebar-accent"
          >
            <X className="h-4 w-4" />
          </button>
          <MobileSidebarContent onClose={() => setLeftSidebarOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Right sidebar sheet - no border, custom close in ChatHistorySidebar */}
      {showRightSidebar && (
        <Sheet open={rightSidebarOpen} onOpenChange={setRightSidebarOpen}>
          <SheetContent side="right" className="w-[320px] p-0" hideCloseButton>
            <SheetHeader className="sr-only">
              <SheetTitle>Chat History</SheetTitle>
            </SheetHeader>
            <ChatHistoryWrapper />
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}

function DesktopLayout({
  children,
  showRightSidebar,
  sidebarData: customSidebarData,
}: {
  children: React.ReactNode;
  showRightSidebar: boolean;
  showHeader: boolean;
  sidebarData?: SidebarData;
}) {
  const { rightSidebarOpen } = useMultiSidebar();
  // Fall back to the default sidebarData export when the caller doesn't thread
  // it. Most dashboard layouts (portfolio, faucet, topup, aggregator, ...) don't
  // pass sidebarData explicitly; without this fallback, returning null here
  // produces a blank page instead of the dashboard chrome.
  const data = customSidebarData ?? defaultSidebarData;

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden">
      <TopNavBar sidebarData={data} showRightSidebar={showRightSidebar} />
      <div className="flex flex-1 overflow-hidden">
        <main className="no-scrollbar flex-1 overflow-y-auto">{children}</main>
        {showRightSidebar && (
          <div
            className={cn(
              "h-full flex-shrink-0 overflow-hidden border-border border-l transition-all duration-300 ease-in-out",
              rightSidebarOpen ? "w-80" : "w-0"
            )}
          >
            <div className="h-full w-80">
              <ChatHistoryWrapper />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LayoutContent({
  children,
  showRightSidebar,
  showHeader,
  sidebarData: customSidebarData,
}: {
  children: React.ReactNode;
  showRightSidebar: boolean;
  showHeader: boolean;
  sidebarData?: SidebarData;
}) {
  const isMobile = useIsMobile();
  return isMobile ? (
    <MobileLayout
      showRightSidebar={showRightSidebar}
      showHeader={showHeader}
      sidebarData={customSidebarData}
    >
      {children}
    </MobileLayout>
  ) : (
    <DesktopLayout
      showRightSidebar={showRightSidebar}
      showHeader={showHeader}
      sidebarData={customSidebarData}
    >
      {children}
    </DesktopLayout>
  );
}

export function MultiSidebarLayout({
  children,
  className,
  showRightSidebar = true,
  showHeader = true,
  sidebarData: customSidebarData,
}: MultiSidebarLayoutProps) {
  return (
    <MultiSidebarProvider className={className || ""}>
      <LayoutContent
        showRightSidebar={showRightSidebar}
        showHeader={showHeader}
        sidebarData={customSidebarData}
      >
        {children}
      </LayoutContent>
    </MultiSidebarProvider>
  );
}
