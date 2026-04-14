import {
  CopilotRuntime,
  copilotRuntimeNextJSAppRouterEndpoint,
  ExperimentalEmptyAdapter,
} from "@copilotkit/runtime";
import { LangGraphHttpAgent } from "@copilotkit/runtime/langgraph";
import type { NextRequest } from "next/server";

const LANGGRAPH_URL = process.env["NEXT_PUBLIC_API_URL"] || "http://localhost:8001";

// 1. Service adapter for multi-agent support
const serviceAdapter = new ExperimentalEmptyAdapter();

// 2. Create the CopilotRuntime instance with LangGraph agents
// Each agent has its own endpoint path matching backend registration
const runtime = new CopilotRuntime({
  agents: {
    blend_agent: new LangGraphHttpAgent({
      url: `${LANGGRAPH_URL}/copilotkit/agents/blend_agent`,
    }),
    soroswap_agent: new LangGraphHttpAgent({
      url: `${LANGGRAPH_URL}/copilotkit/agents/soroswap_agent`,
    }),
    phoenix_agent: new LangGraphHttpAgent({
      url: `${LANGGRAPH_URL}/copilotkit/agents/phoenix_agent`,
    }),
    aquarius_agent: new LangGraphHttpAgent({
      url: `${LANGGRAPH_URL}/copilotkit/agents/aquarius_agent`,
    }),
    defindex_agent: new LangGraphHttpAgent({
      url: `${LANGGRAPH_URL}/copilotkit/agents/defindex_agent`,
    }),
    templar_agent: new LangGraphHttpAgent({
      url: `${LANGGRAPH_URL}/copilotkit/agents/templar_agent`,
    }),
    allbridge_agent: new LangGraphHttpAgent({
      url: `${LANGGRAPH_URL}/copilotkit/agents/allbridge_agent`,
    }),
    sdex_agent: new LangGraphHttpAgent({
      url: `${LANGGRAPH_URL}/copilotkit/agents/sdex_agent`,
    }),
    lumenswap_agent: new LangGraphHttpAgent({
      url: `${LANGGRAPH_URL}/copilotkit/agents/lumenswap_agent`,
    }),
    bridge_agent: new LangGraphHttpAgent({
      url: `${LANGGRAPH_URL}/copilotkit/agents/bridge_agent`,
    }),
    info_agent: new LangGraphHttpAgent({
      url: `${LANGGRAPH_URL}/copilotkit/agents/info_agent`,
    }),
    research_agent: new LangGraphHttpAgent({
      url: `${LANGGRAPH_URL}/copilotkit/agents/research_agent`,
    }),
    yield_agent: new LangGraphHttpAgent({
      url: `${LANGGRAPH_URL}/copilotkit/agents/yield_agent`,
    }),
    supervisor: new LangGraphHttpAgent({
      url: `${LANGGRAPH_URL}/copilotkit/agents/supervisor`,
    }),
  },
});

// 3. Build a Next.js API route that handles the CopilotKit runtime requests.
export const POST = async (req: NextRequest) => {
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter,
    endpoint: "/api/copilotkit",
  });

  return handleRequest(req);
};
