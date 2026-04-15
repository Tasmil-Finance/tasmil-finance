"use client";

import { useAdminDashboard } from "@/features/admin-whitelist/hooks/use-admin-dashboard";
import { useRegistrationStats } from "@/features/admin-whitelist/hooks/use-registration-stats";
import { Typography } from "@/shared/ui/typography";
import { Card, CardContent } from "@/shared/ui/card";
import { Loader2, RefreshCw, TrendingUp } from "lucide-react";
import { Button } from "@/shared/ui/button-v2";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { cn } from "@/lib/utils";

// u2500u2500 Shared primitives u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500

function MiniStat({
  label,
  value,
  sub,
  valueColor,
}: {
  label: string;
  value: string | number;
  sub?: string;
  valueColor?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn("text-xl font-bold leading-tight mt-0.5", valueColor ?? "text-foreground")}>
        {value}
      </p>
      {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

// u2500u2500 KPI Row u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500

function KpiBadge({ label, variant }: { label: string; variant: "green" | "blue" | "amber" }) {
  const cls = {
    green: "bg-green-500/10 text-green-400",
    blue: "bg-blue-500/10 text-blue-400",
    amber: "bg-amber-500/10 text-amber-400",
  }[variant];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold mt-1",
        cls,
      )}
    >
      {label}
    </span>
  );
}

function KpiCard({
  label,
  value,
  sub,
  badge,
}: {
  label: string;
  value: string | number;
  sub: string;
  badge?: { label: string; variant: "green" | "blue" | "amber" };
}) {
  return (
    <Card className="border-t-2 border-t-blue-500/60 border-border bg-card">
      <CardContent className="p-4">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">{label}</p>
        <p className="text-2xl font-bold leading-none">{value}</p>
        <p className="text-[11px] text-muted-foreground mt-1">{sub}</p>
        {badge && <KpiBadge label={badge.label} variant={badge.variant} />}
      </CardContent>
    </Card>
  );
}

function KpiRow({
  walletStats,
  emailDispatches,
}: {
  walletStats: {
    totalWalletEntries: number;
    contactableEntries: number;
    last24h: number;
    last7d: number;
    totalSuccessfulReferrals: number;
  };
  emailDispatches: { accessSent: number };
}) {
  const { totalWalletEntries, contactableEntries, last24h, last7d, totalSuccessfulReferrals } =
    walletStats;
  const emailPct =
    totalWalletEntries > 0
      ? Math.round((contactableEntries / totalWalletEntries) * 100)
      : 0;
  const viralRate =
    totalWalletEntries > 0
      ? Math.round((totalSuccessfulReferrals / totalWalletEntries) * 100)
      : 0;
  const accessPct =
    totalWalletEntries > 0
      ? Math.round((emailDispatches.accessSent / totalWalletEntries) * 100)
      : 0;

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
      <KpiCard
        label="Total Wallets"
        value={totalWalletEntries.toLocaleString()}
        sub="All-time registrations"
        badge={{ label: `+${last24h} today`, variant: "green" }}
      />
      <KpiCard
        label="New (24h)"
        value={last24h}
        sub={`Last 7 days: ${last7d}`}
        badge={{ label: "Registrations", variant: "blue" }}
      />
      <KpiCard
        label="Email Conversion"
        value={`${emailPct}%`}
        sub={`${contactableEntries.toLocaleString()} / ${totalWalletEntries.toLocaleString()} have email`}
        badge={
          emailPct < 70
            ? { label: "Below 70% target", variant: "amber" }
            : { label: "On target", variant: "green" }
        }
      />
      <KpiCard
        label="Total Referrals"
        value={totalSuccessfulReferrals.toLocaleString()}
        sub="Successful referrals"
        badge={{ label: `${viralRate}% viral rate`, variant: "blue" }}
      />
      <KpiCard
        label="Access Sent"
        value={emailDispatches.accessSent.toLocaleString()}
        sub="Access emails delivered"
        badge={{ label: `${accessPct}% of total`, variant: "blue" }}
      />
    </div>
  );
}

// u2500u2500 Growth Chart u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500

function GrowthChart({ data }: { data: Array<{ date: string; count: number }> }) {
  const formatTick = (dateStr: string, index: number) => {
    if (index % 7 !== 0) return "";
    const d = new Date(`${dateStr}T00:00:00Z`);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <Card className="border-border bg-card">
      <CardContent className="p-6">
        <div className="mb-4">
          <Typography variant="h3" className="text-base font-semibold">
            Signups Over Time
          </Typography>
          <Typography variant="p" className="text-xs text-muted-foreground">
            Daily wallet registrations u2014 last 30 days
          </Typography>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={formatTick}
              tick={{ fontSize: 10, fill: "#64748b" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#64748b" }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                background: "#0f172a",
                border: "1px solid #1e293b",
                borderRadius: 6,
                fontSize: 12,
              }}
              labelFormatter={(label: string) => {
                const d = new Date(`${label}T00:00:00Z`);
                return d.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });
              }}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#blueGrad)"
              dot={false}
              activeDot={{ r: 4, fill: "#3b82f6" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// u2500u2500 Conversion Funnel u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500

function ConversionFunnel({
  totalWalletEntries,
  contactableEntries,
  accessSent,
}: {
  totalWalletEntries: number;
  contactableEntries: number;
  accessSent: number;
}) {
  const emailPct =
    totalWalletEntries > 0
      ? Math.round((contactableEntries / totalWalletEntries) * 100)
      : 0;
  const accessPct =
    totalWalletEntries > 0 ? Math.round((accessSent / totalWalletEntries) * 100) : 0;
  const dropOff = totalWalletEntries - contactableEntries;
  const eligible = Math.max(contactableEntries - accessSent, 0);

  const steps = [
    { label: "Wallets", count: totalWalletEntries, pct: 100, from: "from-blue-500", to: "to-indigo-500" },
    { label: "Have Email", count: contactableEntries, pct: emailPct, from: "from-indigo-500", to: "to-violet-500" },
    { label: "Access Sent", count: accessSent, pct: accessPct, from: "from-violet-500", to: "to-purple-500" },
  ];

  return (
    <Card className="border-border bg-card">
      <CardContent className="p-6">
        <div className="mb-4">
          <Typography variant="h3" className="text-base font-semibold">
            Conversion Funnel
          </Typography>
          <Typography variant="p" className="text-xs text-muted-foreground">
            Wallet u2192 Email u2192 Access progression
          </Typography>
        </div>
        <div className="space-y-1">
          {steps.map((step, i) => (
            <div key={step.label}>
              <div className="flex items-center gap-3">
                <span className="w-20 shrink-0 text-right text-[11px] text-muted-foreground">
                  {step.label}
                </span>
                <div className="h-7 flex-1 overflow-hidden rounded bg-background">
                  <div
                    className={cn(
                      "flex h-full items-center rounded bg-gradient-to-r pl-3",
                      step.from,
                      step.to,
                    )}
                    style={{ width: `${Math.max(step.pct, 4)}%` }}
                  >
                    <span className="text-[11px] font-semibold text-white">
                      {step.count.toLocaleString()}
                    </span>
                  </div>
                </div>
                <span className="w-8 text-right text-[11px] text-muted-foreground">{step.pct}%</span>
              </div>
              {i < steps.length - 1 && (
                <p className="py-0.5 pl-20 text-center text-[10px] text-muted-foreground/40">
                  u25bc {i === 0 ? 100 - emailPct : emailPct - accessPct}% drop-off
                </p>
              )}
            </div>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <MiniStat
            label="Missing Email"
            value={dropOff.toLocaleString()}
            sub="Wallets without email"
            valueColor={
              totalWalletEntries > 0 && dropOff / totalWalletEntries > 0.3
                ? "text-amber-400"
                : undefined
            }
          />
          <MiniStat
            label="Eligible for Access"
            value={eligible.toLocaleString()}
            sub="Have email, not yet sent"
            valueColor="text-green-400"
          />
        </div>
      </CardContent>
    </Card>
  );
}

// u2500u2500 Email Delivery u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500

function EmailDelivery({
  emailDispatches,
}: {
  emailDispatches: {
    confirmationSent: number;
    confirmationFailed: number;
    accessSent: number;
    accessFailed: number;
  };
}) {
  const { confirmationSent, confirmationFailed, accessSent, accessFailed } = emailDispatches;
  const chartData = [
    { name: "Confirmation", sent: confirmationSent, failed: confirmationFailed },
    { name: "Access", sent: accessSent, failed: accessFailed },
  ];

  return (
    <Card className="border-border bg-card">
      <CardContent className="p-6">
        <div className="mb-4">
          <Typography variant="h3" className="text-base font-semibold">
            Email Delivery
          </Typography>
          <Typography variant="p" className="text-xs text-muted-foreground">
            Confirmation &amp; access email status
          </Typography>
        </div>
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: "#64748b" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#64748b" }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                background: "#0f172a",
                border: "1px solid #1e293b",
                borderRadius: 6,
                fontSize: 12,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="sent" name="Sent" fill="#3b82f6" radius={[3, 3, 0, 0]} />
            <Bar dataKey="failed" name="Failed" fill="#ef4444" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <MiniStat
            label="Confirmation Sent"
            value={confirmationSent.toLocaleString()}
            sub={confirmationFailed > 0 ? `${confirmationFailed} failed` : "No failures"}
          />
          <MiniStat
            label="Access Sent"
            value={accessSent.toLocaleString()}
            sub={accessFailed > 0 ? `${accessFailed} failed` : "No failures"}
          />
        </div>
      </CardContent>
    </Card>
  );
}

// u2500u2500 Referral Performance u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500

function ReferralPerformance({
  walletStats,
}: {
  walletStats: {
    totalWalletEntries: number;
    totalSuccessfulReferrals: number;
    usersWithReferrals: number;
    topReferrers: { walletAddress: string; referralCount: number }[];
  };
}) {
  const { totalWalletEntries, totalSuccessfulReferrals, usersWithReferrals, topReferrers } =
    walletStats;
  const avgPerReferrer =
    usersWithReferrals > 0
      ? (totalSuccessfulReferrals / usersWithReferrals).toFixed(1)
      : "0";
  const viralCoeff =
    totalWalletEntries > 0
      ? (totalSuccessfulReferrals / totalWalletEntries).toFixed(2)
      : "0.00";
  const preview = topReferrers.slice(0, 3);

  return (
    <Card className="border-border bg-card">
      <CardContent className="p-6">
        <div className="mb-4">
          <Typography variant="h3" className="text-base font-semibold">
            Referral Performance
          </Typography>
          <Typography variant="p" className="text-xs text-muted-foreground">
            Viral growth metrics
          </Typography>
        </div>
        <div className="mb-4 grid grid-cols-2 gap-2">
          <MiniStat
            label="Total Referrals"
            value={totalSuccessfulReferrals.toLocaleString()}
            sub="Successful conversions"
          />
          <MiniStat
            label="Referrers"
            value={usersWithReferrals.toLocaleString()}
            sub={`${totalWalletEntries > 0 ? Math.round((usersWithReferrals / totalWalletEntries) * 100) : 0}% of wallets`}
          />
          <MiniStat label="Avg / Referrer" value={avgPerReferrer} />
          <MiniStat
            label="Viral Coefficient"
            value={viralCoeff}
            sub={`${totalSuccessfulReferrals} / ${totalWalletEntries.toLocaleString()}`}
            valueColor={Number(viralCoeff) >= 0.2 ? "text-green-400" : undefined}
          />
        </div>
        {preview.length > 0 && (
          <div className="space-y-2 border-t border-border pt-3">
            <p className="mb-2 text-[10px] uppercase tracking-wide text-muted-foreground">
              Top Referrers Preview
            </p>
            {preview.map((r, i) => (
              <div key={r.walletAddress} className="flex items-center gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                  {i + 1}
                </span>
                <span className="flex-1 font-mono text-[11px] text-muted-foreground">
                  {r.walletAddress.slice(0, 4)}...{r.walletAddress.slice(-4)}
                </span>
                <span className="text-xs font-semibold text-primary">{r.referralCount}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// u2500u2500 Top Referrers u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500

function TopReferrers({
  referrers,
}: {
  referrers: { walletAddress: string; referralCount: number }[];
}) {
  const maxCount = referrers[0]?.referralCount ?? 1;
  const rankStyle = [
    { bg: "bg-amber-500/15", text: "text-amber-400" },
    { bg: "bg-slate-500/15", text: "text-slate-400" },
    { bg: "bg-orange-500/15", text: "text-orange-400" },
  ];

  return (
    <Card className="border-border bg-card">
      <CardContent className="p-6">
        <div className="mb-4">
          <Typography variant="h3" className="text-base font-semibold">
            Top Referrers
          </Typography>
          <Typography variant="p" className="text-xs text-muted-foreground">
            Top 10 by successful referral count
          </Typography>
        </div>
        {referrers.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">No referrals yet</p>
        ) : (
          <div className="divide-y divide-border">
            {referrers.map((r, i) => {
              const style = rankStyle[i] ?? { bg: "bg-primary/10", text: "text-primary" };
              return (
                <div key={r.walletAddress} className="flex items-center gap-3 py-2.5">
                  <span
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                      style.bg,
                      style.text,
                    )}
                  >
                    {i + 1}
                  </span>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {r.walletAddress.slice(0, 4)}...{r.walletAddress.slice(-4)}
                  </span>
                  <div className="h-1 flex-1 overflow-hidden rounded bg-border">
                    <div
                      className="h-full rounded bg-blue-500"
                      style={{ width: `${(r.referralCount / maxCount) * 100}%` }}
                    />
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-primary" />
                    <span className="text-xs font-semibold text-primary">{r.referralCount}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// u2500u2500 Campaigns Section u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500

function CampaignsSection({
  campaigns,
  recentCampaign,
}: {
  campaigns: { total: number; completed: number; failed: number };
  recentCampaign: {
    name: string;
    status: string;
    targetedCount: number;
    sentCount: number;
    failedCount: number;
    completedAt: string | null;
  } | null;
}) {
  const statusColor: Record<string, string> = {
    COMPLETED: "bg-green-500/10 text-green-400",
    RUNNING: "bg-blue-500/10 text-blue-400",
    FAILED: "bg-red-500/10 text-red-400",
    CANCELLED: "bg-slate-500/10 text-slate-400",
    PENDING: "bg-amber-500/10 text-amber-400",
  };

  return (
    <Card className="border-border bg-card">
      <CardContent className="p-6">
        <div className="mb-4">
          <Typography variant="h3" className="text-base font-semibold">
            Campaigns
          </Typography>
          <Typography variant="p" className="text-xs text-muted-foreground">
            Access email campaign runs
          </Typography>
        </div>
        <div className="mb-4 grid grid-cols-3 gap-3">
          <MiniStat label="Total Runs" value={campaigns.total} />
          <MiniStat label="Completed" value={campaigns.completed} valueColor="text-green-400" />
          <MiniStat label="Failed" value={campaigns.failed} valueColor="text-red-400" />
        </div>
        {recentCampaign && (
          <div className="rounded-lg border border-border bg-background p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] font-semibold">{recentCampaign.name}</span>
              <span
                className={cn(
                  "rounded px-2 py-0.5 text-[10px] font-semibold",
                  statusColor[recentCampaign.status] ?? "bg-muted text-muted-foreground",
                )}
              >
                {recentCampaign.status}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-base font-bold">{recentCampaign.targetedCount}</p>
                <p className="text-[9px] text-muted-foreground">Targeted</p>
              </div>
              <div>
                <p className="text-base font-bold text-green-400">{recentCampaign.sentCount}</p>
                <p className="text-[9px] text-muted-foreground">Sent</p>
              </div>
              <div>
                <p className="text-base font-bold text-red-400">{recentCampaign.failedCount}</p>
                <p className="text-[9px] text-muted-foreground">Failed</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// u2500u2500 Error state u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16">
      <Typography variant="h3" className="text-destructive">
        Failed to load dashboard
      </Typography>
      <Button variant="outline" onClick={onRetry} className="flex items-center gap-2">
        <RefreshCw className="h-4 w-4" />
        Retry
      </Button>
    </div>
  );
}

// u2500u2500 Page u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500u2500

export default function AdminDashboardPage() {
  const { data: stats, isLoading, isFetching, isError, refetch } = useAdminDashboard();
  const { data: registrationStats } = useRegistrationStats(30);

  if (isLoading || isFetching) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) return <ErrorState onRetry={refetch} />;

  if (!stats) return <ErrorState onRetry={refetch} />;

  const walletStats = stats.walletStats;
  const emailDispatches = stats.emailDispatches;

  return (
    <div className="space-y-6 p-8">
      <div>
        <Typography variant="h1" className="text-3xl font-bold">
          Waitlist Dashboard
        </Typography>
        <Typography variant="p" className="mt-1 text-muted-foreground">
          Comprehensive overview: growth, conversion, email delivery, and referral performance
        </Typography>
      </div>

      <KpiRow walletStats={walletStats} emailDispatches={emailDispatches} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <GrowthChart data={registrationStats ?? []} />
        <ConversionFunnel
          totalWalletEntries={walletStats.totalWalletEntries}
          contactableEntries={walletStats.contactableEntries}
          accessSent={emailDispatches.accessSent}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <EmailDelivery emailDispatches={emailDispatches} />
        <ReferralPerformance walletStats={walletStats} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TopReferrers referrers={walletStats.topReferrers} />
        <CampaignsSection
          campaigns={stats.campaigns}
          recentCampaign={stats.recentCampaign}
        />
      </div>
    </div>
  );
}
