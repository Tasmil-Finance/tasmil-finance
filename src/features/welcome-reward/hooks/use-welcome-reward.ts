"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef } from "react";
import backendAxios, { $b } from "@/lib/kubb-backend";
import { useAuthStore } from "@/store/use-auth";

export interface WelcomeRewardStatus {
  reserved: boolean;
  welcomeCardSeen: boolean;
  currentVolumeUsd: number;
  targetVolumeUsd: number;
  progressPercent: number;
  unlocked: boolean;
  unlockedAt: string | null;
}

export interface TrackWelcomeRewardResult extends WelcomeRewardStatus {
  tracked: boolean;
  duplicate?: boolean;
  ignoredReason?: string;
}

const WELCOME_REWARD_QUERY_KEY = ["welcome-reward", "status"] as const;

function unwrapResponse<T>(payload: { data?: T } | T): T {
  return ((payload as { data?: T }).data ?? payload) as T;
}

async function fetchWelcomeRewardStatus(): Promise<WelcomeRewardStatus> {
  const response = await backendAxios.get<{ data?: WelcomeRewardStatus } | WelcomeRewardStatus>(
    "/api/welcome-reward/status"
  );
  return unwrapResponse(response.data);
}

async function markWelcomeRewardSeen(): Promise<WelcomeRewardStatus> {
  const response = await backendAxios.post<{ data?: WelcomeRewardStatus } | WelcomeRewardStatus>(
    "/api/welcome-reward/seen"
  );
  return unwrapResponse(response.data);
}

export interface TrackVolumeContext {
  protocol: string;
  operation?: string;
  asset: string;
  amount: string;
}

async function trackWelcomeRewardTransaction(
  params: { txHash: string; context?: TrackVolumeContext },
): Promise<TrackWelcomeRewardResult> {
  const response = await backendAxios.post<
    { data?: TrackWelcomeRewardResult } | TrackWelcomeRewardResult
  >("/api/welcome-reward/track", {
    txHash: params.txHash,
    ...(params.context ?? {}),
  });
  return unwrapResponse(response.data);
}

export function useWelcomeReward() {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const reportedTxHashes = useRef(new Set<string>());

  const statusQuery = useQuery({
    queryKey: WELCOME_REWARD_QUERY_KEY,
    queryFn: fetchWelcomeRewardStatus,
    enabled: isAuthenticated,
    ...$b.query,
  });

  const markSeenMutation = useMutation({
    mutationFn: markWelcomeRewardSeen,
    onSuccess: (status) => {
      queryClient.setQueryData(WELCOME_REWARD_QUERY_KEY, status);
    },
  });

  const trackMutation = useMutation({
    mutationFn: (params: { txHash: string; context?: TrackVolumeContext }) => trackWelcomeRewardTransaction(params),
    onSuccess: (result) => {
      queryClient.setQueryData(WELCOME_REWARD_QUERY_KEY, {
        reserved: result.reserved,
        welcomeCardSeen: result.welcomeCardSeen,
        currentVolumeUsd: result.currentVolumeUsd,
        targetVolumeUsd: result.targetVolumeUsd,
        progressPercent: result.progressPercent,
        unlocked: result.unlocked,
        unlockedAt: result.unlockedAt,
      } satisfies WelcomeRewardStatus);
    },
  });

  const openRewardPage = useCallback(async () => {
    if (typeof window !== "undefined") {
      window.open("/rewards/welcome", "_blank", "noopener,noreferrer");
    }
    if (!isAuthenticated) return;
    try {
      await markSeenMutation.mutateAsync();
    } catch {
      // Reward visibility should never block navigation.
    }
  }, [isAuthenticated, markSeenMutation]);

  const reportTransaction = useCallback(
    (txHash: string | null | undefined, context?: TrackVolumeContext) => {
      if (!isAuthenticated || !txHash || reportedTxHashes.current.has(txHash)) {
        return;
      }

      reportedTxHashes.current.add(txHash);
      trackMutation.mutate({ txHash, context });
    },
    [isAuthenticated, trackMutation]
  );

  return {
    status: statusQuery.data ?? null,
    isLoading: statusQuery.isLoading,
    isError: statusQuery.isError,
    refetch: statusQuery.refetch,
    markSeen: markSeenMutation.mutateAsync,
    markSeenPending: markSeenMutation.isPending,
    reportTransaction,
    trackTransaction: trackMutation.mutateAsync,
    isTrackingTransaction: trackMutation.isPending,
    openRewardPage,
  };
}
