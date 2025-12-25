"use client";

import type { User } from "next-auth";
import { usePathname } from "next/navigation";
import { DefiAgentHeader } from "@/components/defi-agent-header";
import { DefiAgentSidebar } from "@/components/defi-agent-sidebar";
import { useDefiAgentSidebar } from "@/contexts/defi-agent-sidebar-context";
import { cn } from "@/lib/utils";

type DefiAgentLayoutProps = {
  children: React.ReactNode;
  user: User | undefined;
};

export function DefiAgentLayout({ children, user }: DefiAgentLayoutProps) {
  const { isOpen: isSidebarOpen, toggle: toggleSidebar } =
    useDefiAgentSidebar();
  const pathname = usePathname();
  
  // Only show DefiAgentHeader for chat routes, not for /agents list page
  const isAgentsListPage = pathname === "/agents" || pathname === "/agents/";
  const showDefiAgentHeader = !isAgentsListPage;

  return (
    <div className="relative h-screen overflow-hidden">
      {/* Main content */}
      <div
        className={cn(
          "flex h-full flex-col transition-all duration-300 ease-in-out",
          // On desktop, adjust margin when sidebar is open
          "md:transition-[margin-right]",
          isSidebarOpen ? "md:mr-80" : "md:mr-0"
        )}
      >
        {/* Header - Only show for chat routes */}
        {showDefiAgentHeader && <DefiAgentHeader />}

        {/* Page content - Remove overflow-auto to prevent outer scroll */}
        <div className="flex-1">{children}</div>
      </div>

      {/* Custom sidebar */}
      <DefiAgentSidebar
        isOpen={isSidebarOpen}
        onToggle={toggleSidebar}
        user={user}
      />
    </div>
  );
}
