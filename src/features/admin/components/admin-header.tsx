"use client";

import { LogOut } from "lucide-react";
import { useAdminAuth } from "@/features/admin-auth/hooks/use-admin-auth";
import { Button } from "@/shared/ui/button-v2";
import { Typography } from "@/shared/ui/typography";

interface AdminHeaderProps {
  title: string;
}

export function AdminHeader({ title }: AdminHeaderProps) {
  const { logout } = useAdminAuth();

  return (
    <header className="flex h-14 items-center justify-between border-border border-b bg-background px-6">
      <h1 className="font-semibold text-foreground text-xl">{title}</h1>
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={logout}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          <Typography variant="p" className="text-sm">
            Sign Out
          </Typography>
        </Button>
      </div>
    </header>
  );
}
