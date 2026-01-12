// ⚡ CopilotKit actions - Public exports

// Frontend actions (useCopilotAction) - These are sent to backend
// REMOVED: useStakingAction - Now handled by backend MCP tools with useRenderToolCall
export { useBridgeAction } from '@/features/chat-v2/actions/bridge.action';
export { useYieldAction } from '@/features/chat-v2/actions/yield.action';
export { usePortfolioAction } from '@/features/chat-v2/actions/portfolio.action';

// 🎨 Tool renders for custom UI (useRenderToolCall)
// These render custom UI when backend tools are called
export { useStakingRenders } from '@/features/chat-v2/actions/staking-renders.action';

// UI Components
export * from '@/features/chat-v2/actions/components';

// Combined hook to register all DeFi actions and renders
import { useBridgeAction } from '@/features/chat-v2/actions/bridge.action';
import { useYieldAction } from '@/features/chat-v2/actions/yield.action';
import { usePortfolioAction } from '@/features/chat-v2/actions/portfolio.action';
import { useStakingRenders } from '@/features/chat-v2/actions/staking-renders.action';

export function useDefiActions() {
  // Frontend actions (useCopilotAction) - sent to backend as available tools
  // NOTE: Staking is now handled by backend MCP tools, not frontend actions
  useBridgeAction();
  useYieldAction();
  usePortfolioAction();
  
  // Backend tool renders (useRenderToolCall) - Custom UI for backend MCP tools
  // These will render UI when backend calls u2u_staking_* tools
  useStakingRenders();
}
