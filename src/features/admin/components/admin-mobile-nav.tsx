"use client";

import { Bot, LogOut, type LucideIcon, PanelLeft, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAdminAuth } from "@/features/admin-auth/hooks/use-admin-auth";
import { cn } from "@/lib/utils";
import { adminSidebarData } from "@/shared/layout/sidebar-data";
import { Sheet, SheetContent } from "@/shared/ui/sheet";

function AdminMobileNavItem({
  title,
  url,
  icon: Icon,
  onClose,
}: {
  title: string;
  url: string;
  icon?: LucideIcon;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const isActive =
    pathname === url || pathname.startsWith(`${url}/`) || pathname.split("?")[0] === url;

  const IconComponent = Icon as LucideIcon | undefined;

  return (
    <Link
      href={url}
      onClick={onClose}
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

export function AdminMobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { logout } = useAdminAuth();
  const items = adminSidebarData.navGroups.flatMap((g) => g.items);

  const activeItem = items.find(
    (item) => pathname === item.url || pathname.startsWith(`${item.url}/`)
  );
  const pageTitle = activeItem?.title ?? "Admin";

  return (
    <>
      {/* Mobile Header */}
      <header className="flex h-14 items-center justify-between border-border border-b bg-background px-4 lg:hidden">
        <div className="flex items-center gap-2">
          <button
            aria-label="Open admin navigation"
            onClick={() => setOpen(true)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <PanelLeft className="h-5 w-5" />
          </button>
          <div className="h-4 w-[1px] bg-foreground/30" />
          <h1 className="font-semibold text-lg">{pageTitle}</h1>
        </div>
        <button
          aria-label="Sign out"
          onClick={logout}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </header>

      {/* Mobile Sidebar Sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-[280px] border-r-0 p-0" hideCloseButton>
          {/* Header */}
          <div className="flex items-center justify-between border-sidebar-border border-b p-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-sidebar-foreground text-sm">
                  {adminSidebarData.header.brand_name}
                </span>
                <span className="text-sidebar-foreground/60 text-xs">Admin Panel</span>
              </div>
            </div>
            <button
              aria-label="Close navigation"
              onClick={() => setOpen(false)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-sidebar-foreground transition-colors hover:bg-sidebar-accent"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2 overflow-y-auto p-3">
            {items.map((item) => (
              <AdminMobileNavItem
                key={item.url}
                title={item.title}
                url={item.url}
                icon={item.icon}
                onClose={() => setOpen(false)}
              />
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
        </SheetContent>
      </Sheet>
    </>
  );
}
