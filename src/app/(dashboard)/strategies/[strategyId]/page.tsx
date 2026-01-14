"use client";

import { useParams } from "next/navigation";
import { StrategyDetailPage } from "@/features/strategies";

export default function StrategyDetailPageRoute() {
  const params = useParams();
  const strategyId = params["strategyId"] as string;

  return <StrategyDetailPage strategyId={strategyId} />;
}
