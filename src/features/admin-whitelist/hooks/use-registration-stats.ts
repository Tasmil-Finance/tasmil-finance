"use client";

import { useQuery } from "@tanstack/react-query";
import { useAdminAuthStore } from "@/store/use-admin-auth";

export interface RegistrationDataPoint {
  date: string;
  count: number;
}

async function fetchRegistrationStats(
  token: string,
  days: number,
): Promise<RegistrationDataPoint[]> {
  const response = await fetch(`/api/admin/stats/registrations?days=${days}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to fetch registration stats");
  const json = await response.json();
  return json.data ?? json;
}

export function useRegistrationStats(days = 30) {
  const token = useAdminAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["admin-registration-stats", days],
    queryFn: () => fetchRegistrationStats(token!, days),
    enabled: !!token,
    refetchInterval: 60_000,
  });
}
