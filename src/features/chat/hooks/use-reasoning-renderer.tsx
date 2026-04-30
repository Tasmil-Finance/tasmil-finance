"use client";

import { useCoAgentStateRender } from "@copilotkit/react-core";
import { AIReasoning } from "@/features/chat/components/ai";

/**
 * Renders reasoning/thinking blocks from CopilotKit agent state.
 *
 * When the backend emits reasoning via `copilotkit_emit_state`, this hook
 * picks it up and renders the AIReasoning component with streaming support.
 *
 * Must be rendered inside a <CopilotKit> provider.
 */
export function ReasoningRenderer() {
  useCoAgentStateRender({
    name: "reasoning",
    render: ({ state }) => {
      const agentState = state as Record<string, unknown>;
      const reasoning = agentState?.reasoning as string | undefined;
      const isStreaming = agentState?.reasoning_streaming as boolean | undefined;

      if (!reasoning) return <></>;

      return <AIReasoning isStreaming={isStreaming}>{reasoning}</AIReasoning>;
    },
  });

  return null;
}
