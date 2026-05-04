"use client";

import { Clock, PanelLeft, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { ChatHistoryWrapper } from "@/shared/layout/chat-history-wrapper";
import { MobileSidebarContent } from "@/shared/layout/mobile-sidebar-content";
import { sidebarData as defaultSidebarData } from "@/shared/layout/sidebar-data";
import { TopNavBar } from "@/shared/layout/top-nav-bar";
import {
  MultiSidebarProvider,
  MultiSidebarTrigger,
  useMultiSidebar,
} from "@/shared/ui/multi-sidebar";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/shared/ui/sheet";

interface MultiSidebarLayoutProps {
  children: React.ReactNode;
  className?: string;
  showRightSidebar?: boolean;
  showHeader?: boolean;
  sidebarData?: import("@/shared/layout/sidebar-data").SidebarData;
}

function MobileHeader({ title, showRightSidebar }: { title: string; showRightSidebar: boolean }) {
  const { toggleLeftSidebar } = useMultiSidebar();

  return (
    <header className="flex shrink-0 items-center justify-between bg-background px-4 py-3">
      <div className="flex items-center gap-2">
        <button
          onClick={toggleLeftSidebar}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md font-medium text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <PanelLeft className="h-5 w-5" />
        </button>
        <h1 className="font-semibold text-lg">{title}</h1>
      </div>
      {showRightSidebar && (
        <MultiSidebarTrigger side="right">
          <Clock className="h-5 w-5" />
        </MultiSidebarTrigger>
      )}
    </header>
  );
}

function MobileLayout({
  children,
  showRightSidebar,
  showHeader,
  title,
}: {
  children: React.ReactNode;
  showRightSidebar: boolean;
  showHeader: boolean;
  title: string;
}) {
  const { leftSidebarOpen, rightSidebarOpen, setLeftSidebarOpen, setRightSidebarOpen } =
    useMultiSidebar();

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden">
      {showHeader && <MobileHeader title={title} showRightSidebar={showRightSidebar} />}
      <main className="flex-1 overflow-y-auto overscroll-contain">{children}</main>

      {/* Left sidebar sheet - no border, custom close button */}
      <Sheet open={leftSidebarOpen} onOpenChange={setLeftSidebarOpen}>
        <SheetContent side="left" className="w-[280px] border-r-0 p-0" hideCloseButton>
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          {/* Custom close button like desktop */}
          <button
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
  title: string;
  sidebarData?: import("@/shared/layout/sidebar-data").SidebarData;
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
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
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
  title,
  sidebarData: customSidebarData,
}: {
  children: React.ReactNode;
  showRightSidebar: boolean;
  showHeader: boolean;
  title: string;
  sidebarData?: import("@/shared/layout/sidebar-data").SidebarData;
}) {
  const isMobile = useIsMobile();
  return isMobile ? (
    <MobileLayout showRightSidebar={showRightSidebar} showHeader={showHeader} title={title}>
      {children}
    </MobileLayout>
  ) : (
    <DesktopLayout
      showRightSidebar={showRightSidebar}
      showHeader={showHeader}
      title={title}
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
  title = "",
  sidebarData: customSidebarData,
}: MultiSidebarLayoutProps & {
  title?: string;
  sidebarData?: import("@/shared/layout/sidebar-data").SidebarData;
}) {
  return (
    <MultiSidebarProvider className={className || ""}>
      <LayoutContent
        showRightSidebar={showRightSidebar}
        showHeader={showHeader}
        title={title}
        sidebarData={customSidebarData}
      >
        {children}
      </LayoutContent>
    </MultiSidebarProvider>
  );
}
