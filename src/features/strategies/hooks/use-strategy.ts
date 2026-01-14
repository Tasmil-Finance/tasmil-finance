"use client";

import { useQuery } from "@tanstack/react-query";
import { getStrategy } from "../services";
import type { Strategy } from "../types";

interface UseStrategyOptions {
  enabled?: boolean;
}

export function useStrategy(
  strategyId: string,
  options: UseStrategyOptions = {}
) {
  const { enabled = true } = options;

  return useQuery<Strategy>({
    queryKey: ["strategy", strategyId],
    queryFn: () => getStrategy(strategyId),
    enabled: enabled && !!strategyId,
  });
}
