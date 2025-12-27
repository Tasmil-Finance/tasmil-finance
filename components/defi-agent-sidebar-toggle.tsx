"use client";

import type { ComponentProps } from "react";
import { usePathname } from "next/navigation";
import { useWindowSize } from "usehooks-ts";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { useDefiAgentSidebar } from "@/context/defi-agent-sidebar-context";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { Clock } from "lucide-react";

export function DefiAgentSidebarToggle({
  className,
  ...props
}: ComponentProps<typeof SidebarTrigger>) {
  const pathname = usePathname();
  const isDefiAgent = pathname?.startsWith("/defi-agent") || pathname?.startsWith("/agents");

  // Always call hooks at top level
  const defiAgentSidebar = useDefiAgentSidebar();
  const regularSidebar = useSidebar();
  const { width: windowWidth } = useWindowSize();

  const handleToggle = () => {
    if (isDefiAgent && defiAgentSidebar) {
      defiAgentSidebar.toggle();
    } else {
      regularSidebar.toggleSidebar();
    }
  };

  if (isDefiAgent) {
    // If no provider, don't render
    if (!defiAgentSidebar) {
      return null;
    }
    
    // Hide Clock icon when sidebar is open (same logic as Plus icon)
    // Show on mobile (< 768px) even when sidebar is open
    if (defiAgentSidebar.isOpen && windowWidth >= 768) {
      return null;
    }

    // Custom implementation for DeFi Agent - use Clock icon to toggle sidebar history
    return (
      <Button
        className={cn("h-8 w-8 p-0", className)}
        data-testid="sidebar-toggle-button"
        onClick={handleToggle}
        type="button"
        variant="outline"
        {...props}
      >
        <Clock className="h-4 w-4" />
      </Button>
    );
  }

  // Use regular SidebarTrigger for non-DeFi Agent routes
  return (
    <SidebarTrigger className={className} onClick={handleToggle} {...props} />
  );
}
