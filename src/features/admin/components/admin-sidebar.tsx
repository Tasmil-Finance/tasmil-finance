"use client";

import { Bot, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { adminSidebarData } from "@/shared/layout/sidebar-data";

function AdminNavItem({
  title,
  url,
  icon: Icon,
}: {
  title: string;
  url: string;
  icon?: LucideIcon;
}) {
  const pathname = usePathname();
  const isActive =
    pathname === url || pathname.startsWith(`${url}/`) || pathname.split("?")[0] === url;

  const IconComponent = Icon as LucideIcon | undefined;

  return (
    <Link
      href={url}
      className={cn(
        "flex items-center gap-3 rounded-full px-4 py-3 font-medium text-sm transition-colors",
        isActive
          ? "bg-gradient-to-b from-[#B5EAFF] to-[#00BFFF] text-black shadow-md"
          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      )}
    >
      {IconComponent && (
        <IconComponent
          className={cn("h-5 w-5", isActive ? "text-black" : "text-sidebar-foreground")}
        />
      )}
      <span className={isActive ? "font-semibold text-black" : "text-sidebar-foreground"}>
        {title}
      </span>
    </Link>
  );
}

export function AdminSidebar() {
  return (
    <aside className="flex h-screen w-64 flex-col border-sidebar-border border-r bg-sidebar">
      {/* Header */}
      <div className="flex h-14 items-center gap-2 border-sidebar-border border-b px-4">
        <Link href="/admin/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sidebar-foreground text-sm">
              {adminSidebarData.header.brand_name}
            </span>
            <span className="text-sidebar-foreground/60 text-xs">Admin Panel</span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3">
        {adminSidebarData.navGroups.map((group, gi) => (
          <div key={gi} className={gi > 0 ? "mt-4" : ""}>
            {group.title && (
              <p className="mb-1 px-4 font-semibold text-[10px] text-sidebar-foreground/40 uppercase tracking-widest">
                {group.title}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <AdminNavItem key={item.url} title={item.title} url={item.url} icon={item.icon} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="flex items-center gap-2 border-sidebar-border border-t p-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary font-semibold text-sm text-white">
          A
        </div>
        <div className="flex min-w-0 flex-col">
          <span className="truncate font-medium text-sidebar-foreground text-sm">
            {adminSidebarData.user.name}
          </span>
          <span className="truncate text-sidebar-foreground/60 text-xs">
            {adminSidebarData.user.email}
          </span>
        </div>
      </div>
    </aside>
  );
}
