"use client";

// 🌉 Bridge tool renders - Custom UI for bridge agent backend tools

import { useRenderToolCall } from "@copilotkit/react-core";
import { BridgeResultCard } from "./components";

export function useBridgeRenders() {
  // Render for bridge_get_bridge_pairs
  useRenderToolCall({
    name: "bridge_get_bridge_pairs",
    render: ({ args, result, status }) => {
      const normalizedStatus = status === "inProgress" ? "executing" : status;
      return (
        <BridgeResultCard
          toolName="bridge_get_bridge_pairs"
          args={args}
          result={result}
          status={normalizedStatus as any}
        />
      );
    },
  });

  // Render for bridge_get_bridge_quote
  useRenderToolCall({
    name: "bridge_get_bridge_quote",
    render: ({ args, result, status }) => {
      const normalizedStatus = status === "inProgress" ? "executing" : status;
      return (
        <BridgeResultCard
          toolName="bridge_get_bridge_quote"
          args={args}
          result={result}
          status={normalizedStatus as any}
        />
      );
    },
  });

  // Render for bridge_get_supported_chains
  useRenderToolCall({
    name: "bridge_get_supported_chains",
    render: ({ args, result, status }) => {
      const normalizedStatus = status === "inProgress" ? "executing" : status;
      return (
        <BridgeResultCard
          toolName="bridge_get_supported_chains"
          args={args}
          result={result}
          status={normalizedStatus as any}
        />
      );
    },
  });
}
