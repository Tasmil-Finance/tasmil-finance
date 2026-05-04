"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { accountControllerGetActivity } from "@/gen-backend/client/account-controller-get-activity";
import type {
  ActivityCategory,
  ActivityItem,
  ActivityListResponse,
} from "@/features/account/types";

interface BackendEnvelope<T> {
  success?: boolean;
  data?: T;
}

export interface UseAccountActivityInfiniteResult {
  activities: ActivityItem[];
  isLoading: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  error: Error | null;
}

const PAGE_SIZE = 50;

export function useAccountActivityInfinite(
  walletAddress: string | null | undefined,
  category?: ActivityCategory
): UseAccountActivityInfiniteResult {
  const enabled = Boolean(walletAddress);

  const query = useInfiniteQuery<
    BackendEnvelope<ActivityListResponse> | ActivityListResponse,
    Error
  >({
    queryKey: ["account", "activity", walletAddress ?? "", category ?? "all"],
    enabled,
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) => {
      const params: Record<string, string> = { limit: String(PAGE_SIZE) };
      if (pageParam) params.cursor = String(pageParam);
      if (category) params.category = category;
      // Generated client types only know { limit }; cast through unknown.
      const res = await accountControllerGetActivity(
        walletAddress ?? "",
        params as unknown as { limit: string }
      );
      return res as BackendEnvelope<ActivityListResponse> | ActivityListResponse;
    },
    getNextPageParam: (last) => {
      const payload = unwrap(last);
      return payload?.nextCursor ?? undefined;
    },
  });

  const activities: ActivityItem[] =
    query.data?.pages?.flatMap((p) => unwrap(p)?.items ?? []) ?? [];

  return {
    activities,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: Boolean(query.hasNextPage),
    fetchNextPage: () => {
      void query.fetchNextPage();
    },
    error: (query.error as Error | null) ?? null,
  };
}

function unwrap(
  payload: BackendEnvelope<ActivityListResponse> | ActivityListResponse | undefined
): ActivityListResponse | undefined {
  if (!payload) return undefined;
  if ("data" in payload && payload.data) return payload.data;
  if ("items" in payload) return payload as ActivityListResponse;
  return undefined;
}
