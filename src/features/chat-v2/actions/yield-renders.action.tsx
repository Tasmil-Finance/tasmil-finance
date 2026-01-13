"use client";

// 🌾 Yield tool renders - Custom UI for yield agent backend tools

import { useRenderToolCall } from "@copilotkit/react-core";
import { YieldResultCard } from "./components";

export function useYieldRenders() {
  // Render for yield_get_yield_pools
  useRenderToolCall({
    name: "yield_get_yield_pools",
    render: ({ args, result, status }) => {
      const normalizedStatus = status === "inProgress" ? "executing" : status;
      return (
        <YieldResultCard
          toolName="yield_get_yield_pools"
          args={args}
          result={result}
          status={normalizedStatus as any}
        />
      );
    },
  });

  // Render for yield_get_top_yields_by_chain
  useRenderToolCall({
    name: "yield_get_top_yields_by_chain",
    render: ({ args, result, status }) => {
      const normalizedStatus = status === "inProgress" ? "executing" : status;
      return (
        <YieldResultCard
          toolName="yield_get_top_yields_by_chain"
          args={args}
          result={result}
          status={normalizedStatus as any}
        />
      );
    },
  });

  // Render for yield_get_yield_history
  useRenderToolCall({
    name: "yield_get_yield_history",
    render: ({ args, result, status }) => {
      const normalizedStatus = status === "inProgress" ? "executing" : status;
      return (
        <YieldResultCard
          toolName="yield_get_yield_history"
          args={args}
          result={result}
          status={normalizedStatus as any}
        />
      );
    },
  });

  // Render for yield_get_yield_stats
  useRenderToolCall({
    name: "yield_get_yield_stats",
    render: ({ args, result, status }) => {
      const normalizedStatus = status === "inProgress" ? "executing" : status;
      return (
        <YieldResultCard
          toolName="yield_get_yield_stats"
          args={args}
          result={result}
          status={normalizedStatus as any}
        />
      );
    },
  });

  // Render for yield_search_pools_by_token
  useRenderToolCall({
    name: "yield_search_pools_by_token",
    render: ({ args, result, status }) => {
      const normalizedStatus = status === "inProgress" ? "executing" : status;
      return (
        <YieldResultCard
          toolName="yield_search_pools_by_token"
          args={args}
          result={result}
          status={normalizedStatus as any}
        />
      );
    },
  });

  // Render for yield_get_stablecoin_yields
  useRenderToolCall({
    name: "yield_get_stablecoin_yields",
    render: ({ args, result, status }) => {
      const normalizedStatus = status === "inProgress" ? "executing" : status;
      return (
        <YieldResultCard
          toolName="yield_get_stablecoin_yields"
          args={args}
          result={result}
          status={normalizedStatus as any}
        />
      );
    },
  });
}
