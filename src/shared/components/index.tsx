/**
 * Custom UI Components Registry
 *
 * Register your custom UI components here for LangGraph's LoadExternalComponent.
 * These components will be rendered when the backend emits UI messages
 * with matching names.
 */

// Import components from chat features
import {
  BridgeResultCard,
  ResearchResultCard,
  YieldResultCard,
} from "@/features/chat/actions/components";

const ComponentMap = {
  // Bridge Agent UI Components
  "bridge-result": BridgeResultCard,

  // Research Agent UI Components
  "research-result": ResearchResultCard,

  // Yield Agent UI Components
  "yield-result": YieldResultCard,
} as const;

export default ComponentMap;

// Export type for TypeScript support
export type ComponentMapType = typeof ComponentMap;
