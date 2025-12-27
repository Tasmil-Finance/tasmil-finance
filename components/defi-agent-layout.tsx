"use client";

import type { User } from "next-auth";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { DefiAgentHeader } from "@/components/defi-agent-header";
import { DefiAgentSidebar } from "@/components/defi-agent-sidebar";
import { DefiAgentSidebarToggle } from "@/components/defi-agent-sidebar-toggle";
import { Typography } from "@/components/ui/typography";
import { useDefiAgentSidebar } from "@/context/defi-agent-sidebar-context";
import { useWallet } from "@/context/wallet-context";
import { cn } from "@/lib/utils";

type DefiAgentLayoutProps = {
  children: React.ReactNode;
  user: User | undefined;
};

export function DefiAgentLayout({ children, user: _user }: DefiAgentLayoutProps) {
  const { isOpen: isSidebarOpen, toggle: toggleSidebar } =
    useDefiAgentSidebar();
  const pathname = usePathname();
  
  // Get user from wallet context instead of prop
  const { user: walletUser, isAuthenticated } = useWallet();
  
  // Convert wallet user to NextAuth User format for compatibility
  const user = isAuthenticated && walletUser ? {
    id: walletUser.id,
    email: walletUser.email || undefined,
    name: walletUser.walletAddress || undefined,
    image: undefined,
  } as User : undefined;
  
  // Only show DefiAgentHeader for chat routes, not for /agents list page
  const isAgentsListPage = pathname === "/agents" || pathname === "/agents/";
  const showDefiAgentHeader = !isAgentsListPage;
  
  // Extract agentId from pathname (e.g., /agents/[agent-id]/[chat-id])
  const pathSegments = pathname?.split("/").filter(Boolean) || [];
  const agentId = pathSegments[0] === "agents" && pathSegments.length >= 2 
    ? pathSegments[1] 
    : undefined;
  
  // Close sidebar when navigating to /agents list page
  useEffect(() => {
    if (isAgentsListPage && isSidebarOpen) {
      toggleSidebar();
    }
  }, [isAgentsListPage, isSidebarOpen, toggleSidebar]);

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

        {/* Page content */}
        <div className={cn(
          "flex-1",
          isAgentsListPage ? "overflow-y-auto" : ""
        )}>
          {children}
        </div>
      </div>

      {/* Custom sidebar */}
      <DefiAgentSidebar
        isOpen={isSidebarOpen}
        onToggle={toggleSidebar}
        user={user}
        agentId={agentId}
      />
    </div>
  );
}
