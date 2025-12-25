"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import { motion } from "framer-motion";
import { memo } from "react";
import type { ChatMessage } from "@/lib/types";
import { Suggestion } from "./elements/suggestion";
import type { VisibilityType } from "./visibility-selector";

type SuggestedActionsProps = {
  chatId: string;
  sendMessage: UseChatHelpers<ChatMessage>["sendMessage"];
  selectedVisibilityType: VisibilityType;
};

function PureSuggestedActions({ chatId, sendMessage }: SuggestedActionsProps) {
  const allSuggestedActions = [
    // Staking Query Actions - Balance & Account
    "What's my U2U balance?",
    "Check my wallet balance on U2U network",
    "Show my account balance",

    // Staking Query Actions - Network Info
    "Show current epoch on U2U network",
    "What's the total stake in the network?",
    "What's the total active stake?",
    "Show network staking statistics",

    // Staking Query Actions - Validator Info
    "Check validator 1 information",
    "Show validator 2 details",
    "What's validator 1 self-stake amount?",
    "Check validator 3 self-stake amount",

    // Staking Query Actions - My Stakes & Rewards
    "How much have I staked to validator 1?",
    "Check my stake on validator 2",
    "Show my pending rewards from validator 1",
    "Show my pending rewards from validator 2",
    "Check my rewards stash for validator 1",
    "What's my lockup info for validator 1?",
    "Show my unlocked stake for validator 2",

    // Staking Operation Actions - Delegate
    "I want to stake 100 U2U to validator 1",
    "Stake 50 U2U to validator 2",
    "Help me delegate 200 U2U to validator 1",

    // Staking Operation Actions - Undelegate
    "Help me unstake 50 U2U from validator 1",
    "I want to unstake 100 U2U from validator 2",
    "Undelegate 75 U2U from validator 1",

    // Staking Operation Actions - Rewards
    "I want to claim my rewards from validator 1",
    "Claim rewards from validator 2",
    "Restake my rewards on validator 1",
    "Restake my rewards on validator 2",

    // Staking Operation Actions - Lock
    "Lock 200 U2U for 30 days on validator 1",
    "Lock 100 U2U for 14 days on validator 2",
    "I want to lock stake for 7 days",

    // Advanced Staking Queries - APR & Statistics
    "What's the APR for staking 1000 U2U to validator 1?",
    "Show me all validators information",
    "Get staking APR for validator 2 with 500 U2U",
    "Display overall network staking statistics",
    "Show me the best validators to stake with",
    "What's the current staking APR for 100 U2U?",

    // General Queries
    "What is the weather in San Francisco?",
    "Help me understand U2U staking",
  ];

  // Randomly select 4 suggestions to show
  const getRandomSuggestions = () => {
    const shuffled = [...allSuggestedActions].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 4);
  };

  const suggestedActions = getRandomSuggestions();

  return (
    <div
      className="grid w-full gap-2 sm:grid-cols-2"
      data-testid="suggested-actions"
    >
      {suggestedActions.map((suggestedAction, index) => (
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          initial={{ opacity: 0, y: 20 }}
          key={suggestedAction}
          transition={{ delay: 0.05 * index }}
        >
          <Suggestion
            className="h-auto w-full whitespace-normal p-3 text-left"
            onClick={(suggestion) => {
              // Preserve current route instead of hardcoding /chat/
              const currentPath = window.location.pathname;
              if (!currentPath.includes(chatId)) {
                window.history.replaceState({}, "", `${currentPath}/${chatId}`);
              }
              sendMessage({
                role: "user",
                parts: [{ type: "text", text: suggestion }],
              });
            }}
            suggestion={suggestedAction}
          >
            {suggestedAction}
          </Suggestion>
        </motion.div>
      ))}
    </div>
  );
}

export const SuggestedActions = memo(
  PureSuggestedActions,
  (prevProps, nextProps) => {
    if (prevProps.chatId !== nextProps.chatId) {
      return false;
    }
    if (prevProps.selectedVisibilityType !== nextProps.selectedVisibilityType) {
      return false;
    }

    return true;
  }
);
