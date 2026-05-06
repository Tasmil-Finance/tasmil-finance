"use client";

import { useIsMobile } from "@/shared/hooks/use-mobile";
import { AdminHeader } from "./admin-header";
import { AdminMobileNav } from "./admin-mobile-nav";
import { AdminSidebar } from "./admin-sidebar";

interface AdminShellProps {
  children: React.ReactNode;
  title: string;
}

export function AdminShell({ children, title }: AdminShellProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
        <AdminMobileNav />
        <main className="flex-1 overflow-y-auto overscroll-contain px-4 py-4">{children}</main>
      </div>
    );
  }

  return (
    <div className="hidden h-screen w-full overflow-hidden bg-background lg:flex">
      <AdminSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminHeader title={title} />
        <main className="flex-1 overflow-y-auto px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
