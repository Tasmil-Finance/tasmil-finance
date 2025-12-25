"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { User } from "next-auth";
import { PlusIcon, X, Menu } from "lucide-react";
import { SidebarHistory } from "@/components/sidebar-history";
import { SidebarUserNav } from "@/components/sidebar-user-nav";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DefiAgentSidebarProps {
  user: User | undefined;
  isOpen: boolean;
  onToggle: () => void;
}

export function DefiAgentSidebar({
  user,
  isOpen,
  onToggle,
}: DefiAgentSidebarProps) {
  const router = useRouter();

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 md:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed right-0 top-0 z-50 h-full w-80 transform bg-background border-l border-border transition-transform duration-300 ease-in-out flex flex-col",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
          <Link
            className="flex items-center gap-3"
            href="/defi-agent"
            onClick={onToggle}
          >
            <span className="font-semibold text-lg">Chat History</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button
              className="h-8 w-8 p-0"
              onClick={() => {
                onToggle();
                router.push("/defi-agent");
                router.refresh();
              }}
              type="button"
              variant="outline"
            >
              <PlusIcon className="h-4 w-4" />
            </Button>
            <Button
              className="h-8 w-8 p-0"
              onClick={onToggle}
              type="button"
              variant="outline"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-2 min-h-0">
          <SidebarHistory user={user} />
        </div>

        {/* Footer - Fixed */}
        {/* {user && (
          <div className="border-t border-border p-2 flex-shrink-0">
            <SidebarUserNav user={user} />
          </div>
        )} */}
      </div>
    </>
  );
}

interface SidebarToggleButtonProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function SidebarToggleButton({
  isOpen,
  onToggle,
}: SidebarToggleButtonProps) {
  return (
    <Button
      className="fixed top-10 right-10 z-30 h-10 w-10 p-0 shadow-lg"
      onClick={onToggle}
      type="button"
      variant="outline"
    >
      {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
    </Button>
  );
}
