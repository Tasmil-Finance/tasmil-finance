"use client";

import { cn } from "@/lib/utils";
import { ThreadProvider } from "@/providers/thread";
import { ChatHistorySidebar } from "@/shared/layout/chat-history-sidebar";
import { PositionsSidebarPanel } from "@/features/chat/components/positions-sidebar-panel";
import { useRightSidebarTab } from "@/store/use-right-sidebar-tab";

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-t-md px-3 py-2 text-xs font-medium transition-colors",
        active
          ? "bg-sidebar-accent text-sidebar-foreground"
          : "text-sidebar-foreground/60 hover:text-sidebar-foreground",
      )}
    >
      {children}
    </button>
  );
}

export function ChatHistoryWrapper() {
  const { tab, setTab } = useRightSidebarTab();

  return (
    <div className="flex h-full flex-col">
      {/* Tab bar */}
      <div className="flex shrink-0 gap-1 border-b border-sidebar-border px-4 pt-3 pb-0">
        <TabButton active={tab === "history"} onClick={() => setTab("history")}>
          History
        </TabButton>
        <TabButton active={tab === "positions"} onClick={() => setTab("positions")}>
          Positions
        </TabButton>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
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
