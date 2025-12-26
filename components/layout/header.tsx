"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { DefiAgentSidebarToggle } from "@/components/defi-agent-sidebar-toggle";
import { cn } from "@/lib/utils";

interface HeaderProps extends React.HTMLAttributes<HTMLElement> {
  fixed?: boolean;
  ref?: React.Ref<HTMLElement>;
}

export const Header = ({
  className,
  fixed,
  children,
  ...props
}: HeaderProps) => {
  const [offset, setOffset] = React.useState(0);
  const pathname = usePathname();
  const isAgentsPage = pathname?.startsWith("/agents");

  React.useEffect(() => {
    const onScroll = () => {
      setOffset(document.body.scrollTop || document.documentElement.scrollTop);
    };

    // Add scroll listener to the body
    document.addEventListener("scroll", onScroll, { passive: true });

    // Clean up the event listener on unmount
    return () => document.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "flex h-16 items-center gap-3 bg-background p-4 sm:gap-4",
        fixed &&
          "header-fixed peer/header fixed z-50 w-[inherit] rounded-m bg-transparent",
        offset > 10 && fixed ? "shadow" : "shadow-none",
        className
      )}
      {...props}
    >
      <SidebarTrigger
        className="z-10 scale-125 sm:scale-100"
        variant="outline"
      />
      <Separator className="h-6" orientation="vertical" />
      {children}
      {/* Add DefiAgent sidebar toggle on the right for /agents pages */}
      {isAgentsPage && (
        <div className="ml-auto">
          <DefiAgentSidebarToggle />
        </div>
      )}
    </header>
  );
};

Header.displayName = "Header";
