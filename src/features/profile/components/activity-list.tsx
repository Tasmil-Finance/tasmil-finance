"use client";

import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Layers,
  Pause,
  RefreshCw,
  Settings,
  ShieldOff,
  XCircle,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/shared/ui/skeleton";
import { cn } from "@/lib/utils";
import { getExplorerUrl } from "@/shared/config/stellar";
import { groupByDate, type DatedItem } from "@/shared/utils/date-group";
import type { ActivityItem } from "@/features/account/types";
import { useAccountActivity } from "../hooks/use-account-activity";

type ActivityCategory = "all" | "protocol" | "reward";

const PROTOCOL_TYPES: ReadonlySet<string> = new Set([
  "DEPLOY",
  "FUND",
  "DEPOSIT",
  "WITHDRAW",
  "REBALANCE",
  "PRESET_CHANGE",
  "HALT",
  "RESUME",
  "REVOKE",
]);

const REWARD_TYPES: ReadonlySet<string> = new Set([
  "HARVEST",
  "BACKSTOP_QUEUE",
  "BACKSTOP_EXIT",
]);

const OP_ICONS: Record<string, { icon: LucideIcon; bg: string; fg: string }> = {
  DEPLOY: { icon: Layers, bg: "bg-primary/10", fg: "text-primary" },
  FUND: { icon: ArrowDownLeft, bg: "bg-primary/10", fg: "text-primary" },
  DEPOSIT: { icon: ArrowDownLeft, bg: "bg-primary/10", fg: "text-primary" },
  REBALANCE: { icon: RefreshCw, bg: "bg-muted/30", fg: "text-muted-foreground" },
  HARVEST: { icon: Zap, bg: "bg-primary/10", fg: "text-primary" },
  WITHDRAW: { icon: ArrowUpRight, bg: "bg-destructive/10", fg: "text-destructive" },
  HALT: { icon: XCircle, bg: "bg-destructive/10", fg: "text-destructive" },
  RESUME: { icon: CheckCircle2, bg: "bg-primary/10", fg: "text-primary" },
  PRESET_CHANGE: { icon: Settings, bg: "bg-muted/30", fg: "text-muted-foreground" },
  REVOKE: { icon: ShieldOff, bg: "bg-destructive/10", fg: "text-destructive" },
  BACKSTOP_QUEUE: { icon: Pause, bg: "bg-muted/30", fg: "text-muted-foreground" },
  BACKSTOP_EXIT: { icon: CheckCircle2, bg: "bg-primary/10", fg: "text-primary" },
};

const ACTIVITY_LABEL: Record<string, string> = {
  DEPLOY: "Account Created",
  FUND: "Deposit",
  DEPOSIT: "Deposit",
  REBALANCE: "Rebalance",
  HARVEST: "Harvest",
  WITHDRAW: "Withdrawal",
  HALT: "Bot Halted",
  RESUME: "Bot Resumed",
  PRESET_CHANGE: "Strategy Changed",
  REVOKE: "Bot Revoked",
  BACKSTOP_QUEUE: "Backstop Queued",
  BACKSTOP_EXIT: "Backstop Exit",
};

function categoryFilter(category: ActivityCategory) {
  return (a: ActivityItem) => {
    if (category === "all") return true;
    if (category === "protocol") return PROTOCOL_TYPES.has(a.type);
    if (category === "reward") return REWARD_TYPES.has(a.type);
    return false;
  };
}

function isReward(type: string): boolean {
  return REWARD_TYPES.has(type);
}

function emptyCopy(category: ActivityCategory): string {
  if (category === "reward") return "No rewards yet";
  if (category === "protocol") return "No protocol activity yet";
  return "No activity yet";
}

interface ActivityListProps {
  walletAddress: string;
  category: ActivityCategory;
}

export function ActivityList({ walletAddress, category }: ActivityListProps) {
  const { activities, isLoading, error } = useAccountActivity(walletAddress);

  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex flex-col divide-y divide-border">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              data-testid="activity-skeleton-row"
              className="flex items-center gap-3 px-6 py-3.5"
            >
              <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        Could not load activity: {error.message}
      </div>
    );
  }

  const filtered = activities.filter(categoryFilter(category));

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card p-12 text-muted-foreground">
        <Clock className="h-8 w-8 opacity-40" />
        <p className="text-sm">{emptyCopy(category)}</p>
      </div>
    );
  }

  const datedItems: (ActivityItem & DatedItem)[] = filtered.map((a) => ({ ...a }));
  const groups = groupByDate(datedItems);

  return (
    <div className="flex flex-col gap-4">
      {groups.map((group) => (
        <section key={group.key} className="flex flex-col gap-2">
          <h3 className="px-1 pt-2 text-sm font-semibold text-muted-foreground">{group.label}</h3>
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="flex flex-col divide-y divide-border">
              {group.items.map((activity, idx) => {
                const iconConfig = OP_ICONS[activity.type] ?? {
                  icon: Clock,
                  bg: "bg-muted/30",
                  fg: "text-muted-foreground",
                };
                const Icon = iconConfig.icon;
                const label = ACTIVITY_LABEL[activity.type] ?? activity.type;
                const reward = isReward(activity.type);

                return (
                  <motion.div
                    key={activity.id}
                    className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-muted/20"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.25, delay: idx * 0.02 }}
                  >
                    <div
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                        iconConfig.bg,
                      )}
                    >
                      <Icon className={cn("h-[15px] w-[15px]", iconConfig.fg)} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{label}</p>
                      {activity.detail && (
                        <p className="truncate text-sm text-muted-foreground">{activity.detail}</p>
                      )}
                    </div>
                    {activity.amount != null && activity.token && (
                      <span
                        className={cn(
                          "shrink-0 text-sm font-semibold",
                          reward ? "text-emerald-400" : "text-foreground",
                        )}
                      >
                        {reward ? "+" : ""}
                        {activity.amount} {activity.token}
                      </span>
                    )}
                    {activity.txHash && (
                      <a
                        href={getExplorerUrl("tx", activity.txHash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 text-sm text-primary hover:underline"
                      >
                        TX
                      </a>
                    )}
                    <span className="shrink-0 text-sm text-muted-foreground">
                      {new Date(activity.createdAt).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
