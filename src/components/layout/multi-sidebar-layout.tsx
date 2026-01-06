"use client";

import { PanelLeft, Clock, X } from "lucide-react";
import {
  MultiSidebarProvider,
  MultiSidebarTrigger,
  useMultiSidebar,
} from "@/components/ui/multi-sidebar";
import { SidebarProvider, SidebarInset, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { MobileSidebarContent } from "@/components/layout/mobile-sidebar-content";
import { ChatHistoryWrapper } from "@/components/layout/chat-history-wrapper";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/common/use-mobile";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button-v2";

interface MultiSidebarLayoutProps {
  children: React.ReactNode;
  className?: string;
  showRightSidebar?: boolean;
  showHeader?: boolean;
}

function Header({ showRightSidebar }: { showRightSidebar: boolean }) {
  const { toggleSidebar } = useSidebar();

  return (
    <header className="flex flex-shrink-0 items-center justify-between bg-background px-4 py-3">
      <div className="flex items-center gap-2">
        <Button variant="ghost" onClick={toggleSidebar} className="!p-0">
          <PanelLeft className="h-4 w-4" />
        </Button>
        <div className="mx-2 h-4 w-[1px] bg-foreground/30" />
        <h1 className="font-semibold text-2xl">Explore Agents</h1>
      </div>
      {showRightSidebar && (
        <MultiSidebarTrigger side="right">
          <Clock className="h-4 w-4" />
        </MultiSidebarTrigger>
      )}
    </header>
  );
}

function MobileHeader({ showRightSidebar }: { showRightSidebar: boolean }) {
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
        <h1 className="font-semibold text-lg">Tasmil Finance</h1>
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
}: {
  children: React.ReactNode;
  showRightSidebar: boolean;
  showHeader: boolean;
}) {
  const { leftSidebarOpen, rightSidebarOpen, setLeftSidebarOpen, setRightSidebarOpen } =
    useMultiSidebar();

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden">
      {showHeader && <MobileHeader showRightSidebar={showRightSidebar} />}
      <main className="flex-1 overflow-hidden">{children}</main>

      {/* Left sidebar sheet - no border, custom close button */}
      <Sheet open={leftSidebarOpen} onOpenChange={setLeftSidebarOpen}>
        <SheetContent side="left" className="w-[280px] p-0 border-r-0" hideCloseButton>
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
  showHeader,
}: {
  children: React.ReactNode;
  showRightSidebar: boolean;
  showHeader: boolean;
}) {
  const { rightSidebarOpen } = useMultiSidebar();

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />

      {/* Main Content Area - Header + Content */}
      <SidebarInset className="flex h-screen flex-col">
        {showHeader && <Header showRightSidebar={showRightSidebar} />}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </SidebarInset>

      {/* Right Sidebar - Separate, full height with animation */}
      {showRightSidebar && (
        <div
          className={cn(
            "h-screen flex-shrink-0 overflow-hidden border-border border-l transition-all duration-300 ease-in-out",
            rightSidebarOpen ? "w-80" : "w-0"
          )}
        >
          <div className="h-full w-80">
            <ChatHistoryWrapper />
          </div>
        </div>
      )}
    </SidebarProvider>
  );
}

function LayoutContent({
  children,
  showRightSidebar,
  showHeader,
}: {
  children: React.ReactNode;
  showRightSidebar: boolean;
  showHeader: boolean;
}) {
  const isMobile = useIsMobile();
  return isMobile ? (
    <MobileLayout showRightSidebar={showRightSidebar} showHeader={showHeader}>
      {children}
    </MobileLayout>
  ) : (
    <DesktopLayout showRightSidebar={showRightSidebar} showHeader={showHeader}>
      {children}
    </DesktopLayout>
  );
}

export function MultiSidebarLayout({
  children,
  className,
  showRightSidebar = true,
  showHeader = true,
}: MultiSidebarLayoutProps) {
  return (
    <MultiSidebarProvider className={className}>
      <LayoutContent showRightSidebar={showRightSidebar} showHeader={showHeader}>
        {children}
      </LayoutContent>
    </MultiSidebarProvider>
  );
}
