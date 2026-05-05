"use client";

import Image from "next/image";
import Link from "next/link";
import { ConnectWalletButton } from "@/shared/components/connect-wallet-button";
import { NavLink } from "./nav-link";
import type { SidebarData } from "./sidebar-data";

interface TopNavBarProps {
  sidebarData: SidebarData;
  /**
   * Retained for layout-API compatibility. The chat-history trigger has been
   * removed from the header surface entirely; this prop is no longer consumed.
   */
  showRightSidebar?: boolean;
}

export function TopNavBar({ sidebarData }: TopNavBarProps) {
  const items = sidebarData.navGroups.flatMap((g) => g.items);

  return (
    <nav
      data-testid="top-nav-bar"
      className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-6 border-border border-b bg-background px-4"
    >
      <Link href="/chat/new" className="flex items-center gap-2">
        <Image src={sidebarData.header.logo_url} width={36} height={36} alt="Logo" />
        <span className="animate-shimmer-text bg-[length:200%_100%] bg-gradient-to-r from-[#b5eaff] via-white to-[#00bfff] bg-clip-text font-semibold text-lg text-transparent">
          {sidebarData.header.brand_name}
        </span>
      </Link>

      <div className="flex items-center gap-6 overflow-x-auto">
        {items.map((item) => (
          <NavLink key={item.url} item={item} />
        ))}
      </div>

      <div className="ml-auto flex items-center gap-3">
        <ConnectWalletButton variant="topbar" />
      </div>
    </nav>
  );
}
