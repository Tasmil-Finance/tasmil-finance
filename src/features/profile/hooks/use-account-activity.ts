"use client";

import type { ActivityItem } from "@/features/account/types";
import { useAccountControllerGetActivity } from "@/gen-backend/hooks";

export interface UseAccountActivityResult {
  activities: ActivityItem[];
  isLoading: boolean;
  error: Error | null;
}

/**
 * Activity-model events for the given wallet (managed-account actions).
 *
 * Distinct from useStellarTransactions which fetches Horizon wallet ops.
 * Used by the new ActivityList for /portfolio?tab=history Protocol/Reward
 * sub-tabs.
 */
export function useAccountActivity(
  walletAddress: string | null | undefined
): UseAccountActivityResult {
  const query = useAccountControllerGetActivity(
    walletAddress ?? "",
    { limit: "50", cursor: "", category: "" },
    { query: { enabled: !!walletAddress } }
  );

  const activities: ActivityItem[] = ((query.data as { data?: ActivityItem[] } | undefined)?.data ??
    []) as ActivityItem[];

  return {
    activities,
    isLoading: query.isLoading,
    error: query.error as Error | null,
  };
}
