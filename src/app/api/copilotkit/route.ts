import {
  CopilotRuntime,
  copilotRuntimeNextJSAppRouterEndpoint,
  ExperimentalEmptyAdapter,
} from '@copilotkit/runtime';
import { LangGraphHttpAgent } from '@copilotkit/runtime/langgraph';
import type { NextRequest } from 'next/server';

const LANGGRAPH_URL =
  process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:8001';

// 1. Service adapter for multi-agent support
const serviceAdapter = new ExperimentalEmptyAdapter();

// 2. Create the CopilotRuntime instance with LangGraph agents
// Each agent has its own endpoint path matching backend registration
const runtime = new CopilotRuntime({
  agents: {
    // Staking Agent - U2U Network staking operations
    staking_agent: new LangGraphHttpAgent({
      url: `${LANGGRAPH_URL}/copilotkit/agents/staking_agent`,
    }),
    // Bridge Agent - Cross-chain token bridging
    bridge_agent: new LangGraphHttpAgent({
      url: `${LANGGRAPH_URL}/copilotkit/agents/bridge_agent`,
    }),
    // Research Agent - Crypto market research and analysis
    research_agent: new LangGraphHttpAgent({
      url: `${LANGGRAPH_URL}/copilotkit/agents/research_agent`,
    }),
    // Yield Agent - DeFi yield farming opportunities
    yield_agent: new LangGraphHttpAgent({
      url: `${LANGGRAPH_URL}/copilotkit/agents/yield_agent`,
    }),
  },
});

// 3. Build a Next.js API route that handles the CopilotKit runtime requests.
export const POST = async (req: NextRequest) => {
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter,
    endpoint: '/api/copilotkit',
  });

  return handleRequest(req);
};
