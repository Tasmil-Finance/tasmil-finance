import type { Interrupt } from "@langchain/langgraph-sdk";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { useStreamContext } from "@/providers/stream";
import { StateView } from "./components/state-view";
import { ThreadActionsView } from "./components/thread-actions-view";
import { StakingHITLHandler } from "./staking-hitl-handler";
import type { HITLRequest } from "./types";

interface ThreadViewProps {
  interrupt: Interrupt<HITLRequest> | Interrupt<HITLRequest>[];
}

// Staking tool names that should use custom handler
const STAKING_TOOLS = [
  "u2u_staking_delegate",
  "u2u_staking_undelegate",
  "u2u_staking_claim_rewards",
  "u2u_staking_restake_rewards",
  "u2u_staking_lock_stake",
];

function isStakingOperation(interrupt: Interrupt<HITLRequest>): boolean {
  const toolName = interrupt.value?.action_requests?.[0]?.name;
  return toolName ? STAKING_TOOLS.includes(toolName) : false;
}

export function ThreadView({ interrupt }: ThreadViewProps) {
  const thread = useStreamContext();
  const interrupts = useMemo(
    () =>
      (Array.isArray(interrupt) ? interrupt : [interrupt]).filter(
        (item): item is Interrupt<HITLRequest> => !!item
      ),
    [interrupt]
  );
  const [activeInterruptIndex, setActiveInterruptIndex] = useState(0);
  const [showDescription, setShowDescription] = useState(false);
  const [showState, setShowState] = useState(false);
  const showSidePanel = showDescription || showState;

  useEffect(() => {
    setActiveInterruptIndex(0);
  }, [interrupts.length]);

  const activeInterrupt = interrupts[activeInterruptIndex];
  const activeDescription = activeInterrupt?.value?.action_requests?.[0]?.description ?? "";

  // Check if this is a staking operation
  const isStaking = activeInterrupt ? isStakingOperation(activeInterrupt) : false;

  const handleShowSidePanel = (showStateFlag: boolean, showDescriptionFlag: boolean) => {
    if (showStateFlag && showDescriptionFlag) {
      console.error("Cannot show both state and description");
      return;
    }
    if (showStateFlag) {
      setShowDescription(false);
      setShowState(true);
    } else if (showDescriptionFlag) {
      setShowState(false);
      setShowDescription(true);
    } else {
      setShowState(false);
      setShowDescription(false);
    }
  };

  if (!activeInterrupt) {
    return null;
  }

  // Use custom staking handler for staking operations
  if (isStaking) {
    return <StakingHITLHandler interrupt={activeInterrupt} />;
  }

  // Use default ThreadActionsView for other operations
  return (
    <div className="flex h-full w-full flex-col rounded-2xl bg-gray-50 p-8 lg:flex-row">
      {showSidePanel ? (
        <StateView
          handleShowSidePanel={handleShowSidePanel}
          description={activeDescription}
          values={thread.values}
          view={showState ? "state" : "description"}
        />
      ) : (
        <div className="flex w-full flex-col gap-6">
          {interrupts.length > 1 && (
            <div className="flex flex-wrap items-center gap-2">
              {interrupts.map((it, idx) => {
                const title = it.value?.action_requests?.[0]?.name ?? `Interrupt ${idx + 1}`;
                return (
                  <button
                    key={it.id ?? idx}
                    type="button"
                    onClick={() => setActiveInterruptIndex(idx)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-sm transition-colors",
                      idx === activeInterruptIndex
                        ? "border-primary bg-primary/10 text-primary"
                        : "hover:border-primary hover:text-primary border-gray-300 bg-white text-gray-600"
                    )}
                  >
                    {title}
                  </button>
                );
              })}
            </div>
          )}
          <ThreadActionsView
            interrupt={activeInterrupt}
            handleShowSidePanel={handleShowSidePanel}
            showState={showState}
            showDescription={showDescription}
          />
        </div>
      )}
    </div>
  );
}
