"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import type { NavGroup, NavItem } from "./sidebar-data";

export function NavGroup({ items }: NavGroup) {
  const pathname = usePathname();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) => (
          <NavMenuItem
            key={`${item.title}-${item.url}`}
            item={item}
            pathname={pathname}
            isCollapsed={isCollapsed}
          />
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}

function NavMenuItem({
  item,
  pathname,
  isCollapsed,
}: {
  item: NavItem;
  pathname: string;
  isCollapsed: boolean;
}) {
  const { setOpenMobile } = useSidebar();
  const isActive = checkIsActive(pathname, item);

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={isActive}
        tooltip={item.title}
        className={cn(
          isActive ? "sidebar-item-active" : "",
          isCollapsed ? "!justify-center !p-0" : ""
        )}
      >
        <Link
          href={item.url}
          onClick={() => setOpenMobile(false)}
          className={cn(
            "flex items-center gap-3",
            isCollapsed ? "sidebar-collapsed-center" : ""
          )}
        >
          {item.icon && (
            <item.icon className={`h-4 w-4 flex-shrink-0 ${isActive ? "text-black" : ""}`} />
          )}
          {!isCollapsed && (
            <span className={isActive ? "font-medium text-black" : ""}>{item.title}</span>
          )}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function checkIsActive(pathname: string, item: NavItem) {
  if (pathname === item.url || pathname.split("?")[0] === item.url) return true;
  if (item.url && pathname.startsWith(`${item.url}/`)) return true;
  return false;
}
