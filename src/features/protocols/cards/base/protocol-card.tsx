"use client";

import type { LucideIcon } from "lucide-react";
import { AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CardMode } from "../../schemas/common.schema";

// ─── Protocol Card Shell ────────────────────────────────────────

interface ProtocolCardProps {
  children: React.ReactNode;
  mode?: CardMode;
  isLoading?: boolean;
  error?: string | null;
  className?: string;
  // Optional header
  title?: string;
  subtitle?: string;
  icon?: LucideIcon;
  iconColor?: string;
  iconBg?: string;
}

export function ProtocolCard({
  children,
  mode = "playground",
  isLoading,
  error,
  className,
  title,
  subtitle,
  icon: Icon,
  iconColor = "text-primary",
  iconBg = "bg-primary/10",
}: ProtocolCardProps) {
  const isChat = mode === "chat";

  const shellClass = isChat
    ? "w-fit min-w-[280px] max-w-[360px] rounded-lg border bg-card p-4 shadow-sm"
    : "rounded-xl border border-border bg-card overflow-hidden";

  if (isLoading) {
    return (
      <div className={cn(shellClass, isChat && "bg-card/40", className)}>
        <div className="flex items-center gap-3">
          {Icon && (
            <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full", iconBg)}>
              <Loader2 className={cn("h-4 w-4 animate-spin", iconColor)} />
            </div>
          )}
          <div className="space-y-1">
            <h3 className="font-semibold text-sm">{title ?? "Loading"}</h3>
            <p className="text-muted-foreground text-xs">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn(shellClass, "border-destructive/30 bg-destructive/5", className)}>
        <div className="flex items-center gap-2 text-destructive text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(shellClass, className)}>
      {isChat && (Icon || title) && (
        <div className="mb-3 flex items-center gap-3">
          {Icon && (
            <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full", iconBg)}>
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

// ─── Empty state ────────────────────────────────────────────────

export function EmptyState({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 py-8 text-muted-foreground">
      <Icon className="h-5 w-5 opacity-30" />
      <p className="text-xs">{text}</p>
    </div>
  );
}
