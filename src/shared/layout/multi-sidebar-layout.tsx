"use client";

import { Clock, PanelLeft, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { AppSidebar } from "@/shared/layout/app-sidebar";
import { ChatHistoryWrapper } from "@/shared/layout/chat-history-wrapper";
import { MobileSidebarContent } from "@/shared/layout/mobile-sidebar-content";
import { Button } from "@/shared/ui/button-v2";
import {
  MultiSidebarProvider,
  MultiSidebarTrigger,
  useMultiSidebar,
} from "@/shared/ui/multi-sidebar";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/shared/ui/sheet";
import { SidebarInset, SidebarProvider, useSidebar } from "@/shared/ui/sidebar";

interface MultiSidebarLayoutProps {
  children: React.ReactNode;
  className?: string;
  showRightSidebar?: boolean;
  showHeader?: boolean;
}

function Header({title, showRightSidebar }: { title: string; showRightSidebar: boolean }) {
  const { toggleSidebar } = useSidebar();

  return (
    <header className="flex flex-shrink-0 items-center justify-between bg-background px-4 py-3">
      <div className="flex items-center gap-2">
        <Button variant="ghost" onClick={toggleSidebar} className="!p-0">
          <PanelLeft className="h-4 w-4" />
        </Button>
        <div className="mx-2 h-4 w-[1px] bg-foreground/30" />
        <h1 className="font-semibold text-2xl">{title}</h1>
      </div>
      {showRightSidebar && (
        <MultiSidebarTrigger side="right">
          <Clock className="h-4 w-4" />
        </MultiSidebarTrigger>
      )}
    </header>
  );
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
  title
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
  title
}: {
  children: React.ReactNode;
  showRightSidebar: boolean;
  showHeader: boolean;
  title: string;
}) {
  const { rightSidebarOpen } = useMultiSidebar();

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />

      {/* Main Content Area - Header + Content */}
      <SidebarInset className="flex h-screen flex-col">
        {showHeader && <Header title={title} showRightSidebar={showRightSidebar} />}
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
  title,
}: {
  children: React.ReactNode;
  showRightSidebar: boolean;
  showHeader: boolean;
  title: string;
}) {
  const isMobile = useIsMobile();
  return isMobile ? (
    <MobileLayout showRightSidebar={showRightSidebar} showHeader={showHeader} title={title}>
      {children}
    </MobileLayout>
  ) : (
    <DesktopLayout showRightSidebar={showRightSidebar} showHeader={showHeader} title={title}>
      {children}
    </DesktopLayout>
  );
}

export function MultiSidebarLayout({
  children,
  className,
  showRightSidebar = true,
  showHeader = true,
  title ,
}: MultiSidebarLayoutProps & { title?: string }) {
  return (
    <MultiSidebarProvider className={className || ""}>
      <LayoutContent showRightSidebar={showRightSidebar} showHeader={showHeader} title={title}>
        {children}
      </LayoutContent>
    </MultiSidebarProvider>
  );
}
