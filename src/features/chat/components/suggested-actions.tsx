"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronUp, RefreshCw, SparkleIcon } from "lucide-react";
import { memo, useCallback, useEffect, useState } from "react";
import { getAgentConfig, getAgentSuggestions } from "../config";
import { Button } from "@/shared/ui/button";
import { Suggestion } from "./suggestion";

type SuggestedActionsProps = {
  agentId: string;
  onSendMessage: (message: string) => void;
};

function PureSuggestedActions({ agentId, onSendMessage }: SuggestedActionsProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Get random suggestions using config
  const getRandomSuggestions = useCallback(() => {
    return getAgentSuggestions(agentId, 4);
  }, [agentId]);

  // Initialize with stable (non-random) suggestions for SSR, then randomize on client
  const [suggestedActions, setSuggestedActions] = useState(() =>
    getAgentConfig(agentId).suggestions.slice(0, 4)
  );

  // Randomize on mount and when agent changes (client-only)
  useEffect(() => {
    setSuggestedActions(getRandomSuggestions());
  }, [getRandomSuggestions]);

  // Get agent config for display name
  const config = getAgentConfig(agentId);

  return (
    <div className="w-full pt-2">
      {/* Header with collapse/expand controls */}
      <div className="flex flex-row items-center justify-between gap-1 rounded-lg px-2">
        <div className="flex flex-row items-center gap-1">
          <SparkleIcon width={12} height={12} />

          <span className="text-muted-foreground text-xs">Suggestions for {config.name}</span>
        </div>
        <div className="flex items-center gap-2">
          {!isCollapsed && (
            <Button
              variant="ghost"
              onClick={() => setSuggestedActions(getRandomSuggestions())}
              className="h-auto w-auto rounded p-1 text-muted-foreground hover:text-foreground"
              type="button"
              title="Refresh suggestions"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            variant="ghost"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-auto w-auto rounded p-1 text-muted-foreground hover:text-foreground"
            type="button"
            title={isCollapsed ? "Show suggestions" : "Hide suggestions"}
          >
            {isCollapsed ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </Button>
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
              <div className="pointer-events-none absolute top-0 left-0 z-10 h-full w-[10%] bg-gradient-to-r from-background to-transparent" />
              <div className="pointer-events-none absolute top-0 right-0 z-10 h-full w-[10%] bg-gradient-to-l from-background to-transparent" />

              {/* Horizontal scrolling container */}
              <div
                className="flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden"
                style={{
                  scrollbarWidth: "none" /* Firefox */,
                  msOverflowStyle: "none" /* IE and Edge */,
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

export const SuggestedActions = memo(PureSuggestedActions, (prevProps, nextProps) => {
  if (prevProps.agentId !== nextProps.agentId) {
    return false;
  }
  return true;
});
