"use client";

import { useQuery } from "@tanstack/react-query";
import { getStrategies } from "../services";
import type { StrategyListItem } from "../types";

export function useStrategies() {
  return useQuery<StrategyListItem[]>({
    queryKey: ["strategies"],
    queryFn: () => getStrategies(),
  });
}
