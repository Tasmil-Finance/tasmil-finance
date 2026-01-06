"use client";

import { motion, AnimatePresence } from "framer-motion";
import { memo, useState, useEffect } from "react";
import { ChevronDown, ChevronUp, RefreshCw, Sparkle, SparkleIcon } from "lucide-react";
import { Suggestion } from "./suggestion";

type SuggestedActionsProps = {
  agentId: string;
  onSendMessage: (message: string) => void;
};

// Agent-specific suggestions
const agentSuggestions = {
  staking: [
    "What's my U2U balance?",
    "Show me all validators",
    "Stake 100 U2U to validator 1",
    "Check my pending rewards",
    "What's the current staking APR?",
    "Help me understand U2U staking",
    "Show network staking statistics",
    "I want to claim my rewards from validator 1",
    "Lock 200 U2U for 30 days on validator 1",
    "What are the risks of staking?",
  ],
  
  research: [
    "What's the current price of Bitcoin?",
    "Analyze Ethereum's market trends",
    "Compare BTC vs ETH",
    "Show trending cryptocurrencies",
    "What are the top 10 cryptocurrencies by market cap?",
    "Give me an investment score for Bitcoin",
    "What's the latest crypto news?",
    "Show me the global crypto market statistics",
    "What are the best performing coins this week?",
    "What's the market sentiment right now?",
  ],
  
  yield: [
    "What are the best yields on Ethereum?",
    "Show stablecoin yields",
    "Find high APY pools",
    "Compare yields across chains",
    "Show me yield pools with over 20% APY",
    "What are the best stablecoin yields?",
    "Find USDC yield opportunities",
    "Show me Aave yield pools",
    "Give me a yield market overview",
    "Show me high TVL yield pools",
  ],
  
  bridge: [
    "Show available bridge routes",
    "Bridge 100 USDT to Ethereum",
    "What are the bridge fees?",
    "Supported chains for bridging",
    "How do I bridge tokens to U2U?",
    "Bridge USDC from BSC to U2U",
    "What's the fee to bridge USDT to Ethereum?",
    "How long does bridging take?",
    "Is bridging safe?",
    "Help me understand cross-chain bridging",
  ],
  
  default: [
    "What can you help me with?",
    "Show me yield opportunities",
    "Check crypto prices",
    "Help me stake tokens",
    "Tell me about cryptocurrency market trends",
    "How do I get started with crypto investing?",
    "What's the difference between Bitcoin and Ethereum?",
    "What is DeFi and how does it work?",
  ]
};

function PureSuggestedActions({ agentId, onSendMessage }: SuggestedActionsProps) {
  // Get suggestions based on current agent
  const getSuggestionsForAgent = (agentId: string) => {
    switch (agentId) {
      case "staking-agent":
      case "staking":
        return agentSuggestions.staking;
      case "research-agent":
      case "research":
        return agentSuggestions.research;
      case "yield-agent":
      case "yield":
        return agentSuggestions.yield;
      case "bridge-agent":
      case "bridge":
        return agentSuggestions.bridge;
      default:
        return agentSuggestions.default;
    }
  };
  
  const availableSuggestions = getSuggestionsForAgent(agentId);
  
  // Randomly select 4 suggestions to show
  const getRandomSuggestions = () => {
    const shuffled = [...availableSuggestions].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 4);
  };

  // Use state to store suggestions and collapse state
  const [suggestedActions, setSuggestedActions] = useState(() => getRandomSuggestions());
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Refresh suggestions when agent changes
  useEffect(() => {
    setSuggestedActions(getRandomSuggestions());
  }, [agentId]);
  
  // Get agent display name for UI
  const getAgentDisplayName = (agentId: string) => {
    switch (agentId) {
      case "staking-agent":
      case "staking":
        return "Staking Agent";
      case "research-agent":
      case "research":
        return "Research Agent";
      case "yield-agent":
      case "yield":
        return "Yield Agent";
      case "bridge-agent":
      case "bridge":
        return "Bridge Agent";
      default:
        return "General Assistant";
    }
  };
  
  const agentDisplayName = getAgentDisplayName(agentId);

  return (
    <div className="w-full pt-2">
      {/* Header with collapse/expand controls */}
      <div className="flex flex-row items-center justify-between rounded-lg gap-1 px-2">
        <div className="flex flex-row items-center gap-1">
          <SparkleIcon width={12} height={12}/>

          <span className="text-xs text-muted-foreground">
            Suggestions for {agentDisplayName}
          </span>

        </div>
        <div className="flex items-center gap-2">
          {!isCollapsed && (
            <button
              onClick={() => setSuggestedActions(getRandomSuggestions())}
              className="p-1 text-muted-foreground hover:text-foreground transition-colors rounded"
              type="button"
              title="Refresh suggestions"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors rounded"
            type="button"
            title={isCollapsed ? "Show suggestions" : "Hide suggestions"}
          >
            {isCollapsed ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>
      
      {/* Suggestions horizontal scroll with animation */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="relative mt-3">
              {/* Gradient fade effects */}
              <div className="absolute left-0 top-0 z-10 h-full w-[10%] bg-gradient-to-r from-background to-transparent pointer-events-none" />
              <div className="absolute right-0 top-0 z-10 h-full w-[10%] bg-gradient-to-l from-background to-transparent pointer-events-none" />
              
              {/* Horizontal scrolling container */}
              <div 
                className="flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden"
                style={{
                  scrollbarWidth: 'none', /* Firefox */
                  msOverflowStyle: 'none', /* IE and Edge */
                }}
              >
                {suggestedActions.map((suggestedAction: string, index: number) => (
                  <motion.div
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    initial={{ opacity: 0, y: 20 }}
                    key={suggestedAction}
                    transition={{ delay: 0.05 * index }}
                    className="flex-shrink-0"
                  >
                    <Suggestion
                      suggestion={suggestedAction}
                      onClick={onSendMessage}
                      className="whitespace-nowrap"
                    >
                      {suggestedAction}
                    </Suggestion>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export const SuggestedActions = memo(
  PureSuggestedActions,
  (prevProps, nextProps) => {
    if (prevProps.agentId !== nextProps.agentId) {
      return false;
    }
    return true;
  }
);