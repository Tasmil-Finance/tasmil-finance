/**
 * Custom UI Components Registry
 *
 * Register your custom UI components here for LangGraph's LoadExternalComponent.
 * Backend agents emit UI messages with name "{ui_prefix}-info" or "{ui_prefix}-operation".
 * This map routes those names to the correct React dispatcher component.
 */

import {
  StellarInfoDispatcher,
  StellarOperationDispatcher,
} from "@/features/chat/actions/components/stellar";
import { SupervisorPlanCard } from "@/features/chat/actions/components/stellar/supervisor-plan-card";
import { SupervisorAgentCallCard } from "@/features/chat/actions/components/stellar/supervisor-agent-call-card";
import { ReasoningDispatcher, TaskDispatcher } from "@/shared/components/reasoning-dispatcher";
import { ToolStatusDispatcher } from "@/shared/components/tool-status-dispatcher";

const ComponentMap = {
  // Supervisor (ReAct orchestrator)
  "supervisor-plan": SupervisorPlanCard, // Legacy — kept for backward compat
  "supervisor-agent-call": SupervisorAgentCallCard,
  "supervisor-reasoning": ReasoningDispatcher,

  // Swap Agent
  "swap-info": StellarInfoDispatcher,
  "swap-operation": StellarOperationDispatcher,
  "swap-task": TaskDispatcher,
  "swap-reasoning": ReasoningDispatcher,
  "swap-tool-status": ToolStatusDispatcher,

  // Bridge Agent
  "bridge-info": StellarInfoDispatcher,
  "bridge-operation": StellarOperationDispatcher,
  "bridge-task": TaskDispatcher,
  "bridge-reasoning": ReasoningDispatcher,
  "bridge-tool-status": ToolStatusDispatcher,

  // Vault Agent
  "vault-info": StellarInfoDispatcher,
  "vault-operation": StellarOperationDispatcher,
  "vault-task": TaskDispatcher,
  "vault-reasoning": ReasoningDispatcher,
  "vault-tool-status": ToolStatusDispatcher,

  // Staking Agent
  "staking-info": StellarInfoDispatcher,
  "staking-operation": StellarOperationDispatcher,
  "staking-task": TaskDispatcher,
  "staking-reasoning": ReasoningDispatcher,
  "staking-tool-status": ToolStatusDispatcher,

  // Yield Agent (read-only)
  "yield-info": StellarInfoDispatcher,
  "yield-task": TaskDispatcher,
  "yield-reasoning": ReasoningDispatcher,
  "yield-tool-status": ToolStatusDispatcher,

  // Info Agent (read-only)
  "info-info": StellarInfoDispatcher,
  "info-task": TaskDispatcher,
  "info-reasoning": ReasoningDispatcher,
  "info-tool-status": ToolStatusDispatcher,

  // Research Agent (read-only)
  "research-info": StellarInfoDispatcher,
  "research-task": TaskDispatcher,
  "research-reasoning": ReasoningDispatcher,
  "research-tool-status": ToolStatusDispatcher,

  // Blend Agent (lending)
  "blend-info": StellarInfoDispatcher,
  "blend-operation": StellarOperationDispatcher,
  "blend-task": TaskDispatcher,
  "blend-reasoning": ReasoningDispatcher,
  "blend-tool-status": ToolStatusDispatcher,
} as const;

export default ComponentMap;

// Export type for TypeScript support
export type ComponentMapType = typeof ComponentMap;
