"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { NavItem } from "./sidebar-data";

export function NavLink({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const isActive =
    pathname === item.url || pathname.startsWith(`${item.url}/`);

  return (
    <Link
      href={item.url}
      data-active={isActive ? "true" : "false"}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
        isActive
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:text-foreground hover:bg-accent",
      )}
    >
      {item.icon && <item.icon className="h-4 w-4" />}
      {item.title}
    </Link>
  );
}
