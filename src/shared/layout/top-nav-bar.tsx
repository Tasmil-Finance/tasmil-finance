"use client";

import { Clock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectWalletButton } from "@/shared/components/connect-wallet-button";
import { MultiSidebarTrigger } from "@/shared/ui/multi-sidebar";
import { NavLink } from "./nav-link";
import type { SidebarData } from "./sidebar-data";

interface TopNavBarProps {
  sidebarData: SidebarData;
  showRightSidebar: boolean;
}

export function TopNavBar({ sidebarData, showRightSidebar }: TopNavBarProps) {
  const items = sidebarData.navGroups.flatMap((g) => g.items);
  const pathname = usePathname();
  const onChatRoute = pathname.startsWith("/chat");
  const showClockTrigger = showRightSidebar && onChatRoute;

  return (
    <nav
      data-testid="top-nav-bar"
      className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-6 border-border border-b bg-background px-4"
    >
      <Link href="/chat/new" className="flex items-center gap-2">
        <Image src={sidebarData.header.logo_url} width={28} height={28} alt="Logo" />
        <span className="font-semibold text-base text-foreground">
          {sidebarData.header.brand_name}
        </span>
      </Link>

      <div className="flex items-center gap-6 overflow-x-auto">
        {items.map((item) => (
          <NavLink key={item.url} item={item} />
        ))}
      </div>

      <div className="ml-auto flex items-center gap-3">
        {showClockTrigger && (
          <MultiSidebarTrigger side="right">
            <Clock className="h-4 w-4" />
          </MultiSidebarTrigger>
        )}
        <ConnectWalletButton variant="topbar" />
      </div>
    </nav>
  );
}
