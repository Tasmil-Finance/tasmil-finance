/**
 * Custom UI Components Registry
 *
 * Register your custom UI components here for LangGraph's LoadExternalComponent.
 * These components will be rendered when the backend emits UI messages
 * with matching names.
 *
 * Backend Usage (Python):
 * ```python
 * from langgraph.graph.ui import UIMessage
 * 
 * ui_message = UIMessage(
 *   name="bridge-result",  # Must match key in ComponentMap
 *   props={
 *     "toolName": "bridge_get_bridge_pairs",
 *     "args": {...},
 *     "result": {...}
 *   },
 *   metadata={"message_id": message.id}
 * )
 * state["ui"].append(ui_message)
 * ```
 *
 * Frontend Usage:
 * ```tsx
 * import ComponentMap from "@/shared/components";
 * 
 * <LoadExternalComponent
 *   stream={thread}
 *   message={uiMessage}
 *   components={ComponentMap}
 * />
 * ```
 */

// Import components from chat features
import {
  BridgeResultCard,
  ResearchResultCard,
  YieldResultCard,
  StakingInfoCard,
  StakingOperationCard,
  VaultResultCard,
} from "@/features/chat/actions/components";

const ComponentMap = {
  // Bridge Agent UI Components
  "bridge-result": BridgeResultCard,
  
  // Research Agent UI Components
  "research-result": ResearchResultCard,
  
  // Yield Agent UI Components
  "yield-result": YieldResultCard,
  
  // Staking Agent UI Components
  "staking-info": StakingInfoCard,
  "staking-operation": StakingOperationCard,
  
  // Vault Agent UI Components
  "vault-result": VaultResultCard,
} as const;

export default ComponentMap;

// Export type for TypeScript support
export type ComponentMapType = typeof ComponentMap;
