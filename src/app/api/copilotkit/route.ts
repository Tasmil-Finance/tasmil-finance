import {
  CopilotRuntime,
  copilotRuntimeNextJSAppRouterEndpoint,
  ExperimentalEmptyAdapter,
} from "@copilotkit/runtime";
import { LangGraphAgent } from "@copilotkit/runtime/langgraph";
import type { NextRequest } from "next/server";
import { getServerAiBaseUrl } from "@/lib/runtime-urls";

const LANGGRAPH_URL = getServerAiBaseUrl();

// 1. Service adapter for multi-agent support
const serviceAdapter = new ExperimentalEmptyAdapter();

const AGENT_NAMES = [
  "blend_agent",
  "soroswap_agent",
  "phoenix_agent",
  "aquarius_agent",
  "defindex_agent",
  "templar_agent",
  "allbridge_agent",
  "sdex_agent",
  "bridge_agent",
  "info_agent",
  "research_agent",
  "yield_agent",
  "supervisor",
] as const;

/**
 * Subclass LangGraphAgent to sanitize events before they reach the SSE stream.
 * The base class emits TOOL_CALL_RESULT events with undefined toolCallId/content
 * when LangGraph tool messages have missing fields, which fails AG-UI Zod validation.
 */
class SafeLangGraphAgent extends LangGraphAgent {
  override dispatchEvent(event: any): boolean {
    // Sanitize TOOL_CALL events to prevent AG-UI Zod validation errors.
    // LangGraph tool messages sometimes have missing toolCallId/toolCallName
    // which causes: "toolCallId: Required", "toolCallName: Required"
    const eventType = (event.type ?? "").toLowerCase();

    if (eventType.includes("tool_call")) {
      // Fix missing toolCallId on any tool_call event type
      if (!event.toolCallId) {
        event.toolCallId = event.actionExecutionId || event.id || `tc_${Date.now()}`;
      }
      // Fix missing toolCallName (required by TOOL_CALL_START / TOOL_CALL_CHUNK)
      if (!event.toolCallName) {
        event.toolCallName = event.name || event.toolName || "unknown_tool";
      }
    }

    if (eventType === "tool_call_result") {
      // Ensure content is always present and a string
      event.content = event.content ?? "";
      if (typeof event.content !== "string") {
        event.content = JSON.stringify(event.content);
      }
    }

    return super.dispatchEvent(event);
  }

  override clone() {
    return new SafeLangGraphAgent((this as any).config);
  }
}

const agentsMap: Record<string, SafeLangGraphAgent> = Object.fromEntries(
  AGENT_NAMES.map((name) => [
    name,
    new SafeLangGraphAgent({
      deploymentUrl: LANGGRAPH_URL,
      graphId: name,
      agentId: name,
    }),
  ]),
);

// 2. CopilotKit runtime with all agents registered
const runtime = new CopilotRuntime({ agents: agentsMap });

// 3. Build a Next.js API route that handles the CopilotKit runtime requests.
export const POST = async (req: NextRequest) => {
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter,
    endpoint: "/api/copilotkit",
  });

  return handleRequest(req);
};
