"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThreadProvider } from "@/providers/thread";
import { ChatHistorySidebar } from "@/shared/layout/chat-history-sidebar";
import { PositionsSidebarPanel } from "@/features/chat/components/positions-sidebar-panel";
import { useMultiSidebar } from "@/shared/ui/multi-sidebar";
import { useRightSidebarTab } from "@/store/use-right-sidebar-tab";

export function ChatHistoryWrapper() {
  const { tab, setTab } = useRightSidebarTab();
  const { setRightSidebarOpen } = useMultiSidebar();

  return (
    <div className="flex h-full w-full flex-col bg-sidebar">
      {/* Browser-style tab bar */}
      <div className="flex shrink-0 items-end justify-between border-b border-sidebar-border">
        <div className="flex translate-y-px gap-0">
          <button
            type="button"
            onClick={() => setTab("history")}
            className={cn(
              "rounded-t-lg border border-b-0 px-4 py-2 text-sm font-medium transition-colors",
              tab === "history"
                ? "border-sidebar-border bg-sidebar text-sidebar-foreground"
                : "border-transparent text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/40",
            )}
          >
            History
          </button>
          <button
            type="button"
            onClick={() => setTab("positions")}
            className={cn(
              "rounded-t-lg border border-b-0 px-4 py-2 text-sm font-medium transition-colors",
              tab === "positions"
                ? "border-sidebar-border bg-sidebar text-sidebar-foreground"
                : "border-transparent text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/40",
            )}
          >
            Positions
          </button>
        </div>
        <button
          onClick={() => setRightSidebarOpen(false)}
          className="mb-1 mr-1 flex h-7 w-7 items-center justify-center rounded hover:bg-sidebar-accent"
        >
          <X className="h-3.5 w-3.5 text-sidebar-foreground/60" />
        </button>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden bg-sidebar">
        {tab === "history" ? (
          <ThreadProvider>
            <ChatHistorySidebar />
          </ThreadProvider>
        ) : (
          <div className="h-full overflow-y-auto">
            <PositionsSidebarPanel />
          </div>
        )}
      </div>
    </div>
  );
}
