/**
 * Custom UI Components Registry
 * 
 * Register your custom UI components here.
 * These components will be rendered when the backend emits UI messages
 * with matching names.
 * 
 * Usage in backend:
 * ```typescript
 * ui.push({
 *   name: "bridge-result",  // Must match key in ComponentMap
 *   props: {
 *     result: {...},
 *     toolType: "tool-getBridgePairs"
 *   }
 * }, { message });
 * ```
 */

// DeFi components
import BridgeResult from "./bridge-result";
import YieldResult from "./yield-result";
import ResearchResult from "./research-result";
import StakingResult from "./staking-result";
import StakingOperationResult from "./staking-operation-result";

const ComponentMap = {
  // DeFi Agent UI Components
  "bridge-result": BridgeResult,
  "yield-result": YieldResult,
  "research-result": ResearchResult,
  "staking-result": StakingResult,
  "staking-operation-result": StakingOperationResult,
} as const;

export default ComponentMap;

// Export type for TypeScript support
export type ComponentMapType = typeof ComponentMap;
