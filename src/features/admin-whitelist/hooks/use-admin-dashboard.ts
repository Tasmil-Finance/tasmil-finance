"use client";

import { useQuery } from "@tanstack/react-query";
import { useAdminAuthStore } from "@/features/admin-auth/store/use-admin-auth-store";

interface RecentCampaign {
  name: string;
  status: string;
  targetedCount: number;
  sentCount: number;
  failedCount: number;
  completedAt: string | null;
}

interface DashboardStats {
  waitlist: { last24h: number; last7d: number; allTime: number };
  walletStats: {
    totalWalletEntries: number;
    contactableEntries: number;
    last24h: number;
    last7d: number;
    totalSuccessfulReferrals: number;
    usersWithReferrals: number;
    topReferrers: { walletAddress: string; referralCount: number }[];
  };
  emailDispatches: {
    confirmationSent: number;
    confirmationFailed: number;
    accessSent: number;
    accessFailed: number;
  };
  accessCodes: { total: number; active: number; exhausted: number };
  campaigns: { total: number; completed: number; failed: number };
  recentCampaign: RecentCampaign | null;
}

async function fetchDashboard(token: string): Promise<DashboardStats> {
  const response = await fetch("/api/admin/dashboard", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to fetch dashboard");
  const json = await response.json();
  return json.data ?? json;
}

export function useAdminDashboard() {
  const token = useAdminAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: () => fetchDashboard(token!),
    enabled: !!token,
    refetchInterval: 30_000,
  });
}
