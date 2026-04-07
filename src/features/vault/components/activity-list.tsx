"use client";

import { cn } from "@/lib/utils";

import type { ActivityItem } from "../types";

interface ActivityListProps {
  activities: ActivityItem[];
  className?: string;
}

const ICONS: Record<ActivityItem["type"], string> = {
  deposit: "\u2193",
  withdraw: "\u2191",
  rebalance: "\u21BB",
  harvest: "+",
};

const ICON_COLORS: Record<ActivityItem["type"], string> = {
  deposit: "text-green-500 bg-green-500/10",
  withdraw: "text-red-400 bg-red-400/10",
  rebalance: "text-blue-400 bg-blue-400/10",
  harvest: "text-yellow-400 bg-yellow-400/10",
};

function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function ActivityList({ activities, className }: ActivityListProps) {
  const items = activities.slice(0, 10);

  if (items.length === 0) {
    return (
      <div className={cn("py-8 text-center text-muted-foreground text-sm", className)}>
        No activity yet
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <h3 className="font-semibold text-foreground text-sm">Recent Activity</h3>
      {items.map((item, i) => (
        <div
          key={`${item.type}-${item.timestamp}-${i}`}
          className="flex items-center gap-3 rounded-lg border border-border bg-muted/20 px-3 py-2"
        >
          <span
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full font-bold text-sm",
              ICON_COLORS[item.type],
            )}
          >
            {ICONS[item.type]}
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate font-medium text-foreground text-sm capitalize">
              {item.type}
              {item.amount && item.token ? ` ${item.amount} ${item.token}` : ""}
            </div>
            {item.detail && (
              <div className="truncate text-muted-foreground text-xs">{item.detail}</div>
            )}
          </div>
          <span className="shrink-0 text-muted-foreground text-xs">
            {formatTimeAgo(item.timestamp)}
          </span>
        </div>
      ))}
    </div>
  );
}
