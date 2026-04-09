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
import { TaskDispatcher } from "@/shared/components/reasoning-dispatcher";

const ComponentMap = {
  // Supervisor (ReAct orchestrator)
  "supervisor-plan": SupervisorPlanCard, // Legacy — kept for backward compat
  "supervisor-agent-call": SupervisorAgentCallCard,

  // Swap Agent
  "swap-info": StellarInfoDispatcher,
  "swap-operation": StellarOperationDispatcher,
  "swap-task": TaskDispatcher,

  // Bridge Agent
  "bridge-info": StellarInfoDispatcher,
  "bridge-operation": StellarOperationDispatcher,
  "bridge-task": TaskDispatcher,

  // Vault Agent
  "vault-info": StellarInfoDispatcher,
  "vault-operation": StellarOperationDispatcher,
  "vault-task": TaskDispatcher,

  // Staking Agent
  "staking-info": StellarInfoDispatcher,
  "staking-operation": StellarOperationDispatcher,
  "staking-task": TaskDispatcher,

  // Yield Agent (read-only)
  "yield-info": StellarInfoDispatcher,
  "yield-task": TaskDispatcher,

  // Info Agent (read-only)
  "info-info": StellarInfoDispatcher,
  "info-task": TaskDispatcher,

  // Research Agent (read-only)
  "research-info": StellarInfoDispatcher,
  "research-task": TaskDispatcher,
} as const;

export default ComponentMap;

// Export type for TypeScript support
export type ComponentMapType = typeof ComponentMap;
