"use client";

import type { LucideIcon } from "lucide-react";
import { AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface BaseInfoCardProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  isLoading?: boolean;
  error?: string | null;
  className?: string;
  children: React.ReactNode;
}

export function BaseInfoCard({
  title,
  subtitle,
  icon: Icon,
  iconColor = "text-primary",
  iconBg = "bg-primary/10",
  isLoading,
  error,
  className,
  children,
}: BaseInfoCardProps) {
  if (isLoading) {
    return (
      <div
        className={cn("w-fit min-w-[280px] max-w-[360px] rounded-lg border bg-card/40 p-4 shadow-sm", className)}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full", iconBg)}
          >
            <Loader2 className={cn("h-4 w-4 animate-spin", iconColor)} />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-sm">{title}</h3>
            <p className="text-muted-foreground text-xs">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={cn(
          "w-fit min-w-[280px] max-w-[360px] rounded-lg border border-destructive/30 bg-destructive/5 p-4 shadow-sm",
          className
        )}
      >
        <div className="flex items-center gap-2 text-destructive text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-fit min-w-[280px] max-w-[360px] rounded-lg border bg-card p-4 shadow-sm", className)}>
      {(Icon || title) && (
        <div className="mb-3 flex items-center gap-3">
          {Icon && (
            <div
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                iconBg
              )}
            >
              <Icon className={cn("h-4 w-4", iconColor)} />
            </div>
          )}
          <div className="min-w-0 space-y-0.5">
            <h3 className="font-semibold text-sm">{title}</h3>
            {subtitle && <p className="text-muted-foreground text-xs">{subtitle}</p>}
          </div>
        </div>
      )}
      {children}
    </div>
  );
}
