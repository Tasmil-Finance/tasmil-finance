"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { NavItem } from "./sidebar-data";

export function NavLink({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const isActive = pathname === item.url || pathname.startsWith(`${item.url}/`);

  return (
    <Link
      href={item.url}
      data-active={isActive ? "true" : "false"}
      className={cn(
        "text-base font-medium transition-colors",
        isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
      )}
    >
      {item.title}
    </Link>
  );
}
