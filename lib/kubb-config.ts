// lib/kubb-config.ts
import { kubbClient } from '@/lib/api-client';

// 1. only auth (used for client function, mutation quickly)
export const withAuth = { client: kubbClient } as const;

// 2. Auth + config TanStack Query common (used 99% of the time)
export const $ = {
  ...withAuth,
  query: {
    staleTime: 5 * 60 * 1000,        // 5 minutes
    gcTime: 30 * 60 * 1000,          // 30 minutes
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  },
} as const;

// 3. if needed realtime (e.g. dashboard data live)
export const $live = {
  ...withAuth,
  query: { staleTime: 0, refetchInterval: 10_000 },
} as const;

