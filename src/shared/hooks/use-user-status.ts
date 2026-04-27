"use client";

import { useQuery } from "@tanstack/react-query";
import backendAxios, { $b } from "@/lib/kubb-backend";
import { useAuthStore } from "@/store/use-auth";

export interface ChatCreditInfo {
  remaining: number;
  total: number;
}

export interface UserStatus {
  volumeUsd: number;
  points: number;
  chatCredits: ChatCreditInfo;
}

export const USER_STATUS_KEY = ["user-status"] as const;

function unwrapResponse<T>(payload: { data?: T } | T): T {
  return ((payload as { data?: T }).data ?? payload) as T;
}

async function fetchUserStatus(): Promise<UserStatus> {
  const response = await backendAxios.get<{ data?: UserStatus } | UserStatus>(
    "/api/welcome-reward/full-status",
  );
  return unwrapResponse(response.data);
}

export function useUserStatus() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const query = useQuery({
    queryKey: USER_STATUS_KEY,
    queryFn: fetchUserStatus,
    enabled: isAuthenticated,
    staleTime: 0,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 1,
  });

  return {
    status: query.data ?? null,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}
