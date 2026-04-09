import type { Interrupt } from "@langchain/langgraph-sdk";
import { useEffect, useMemo, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useStreamContext } from "../../hooks";
import { StateView } from "./components/state-view";
import { ThreadActionsView } from "./components/thread-actions-view";
import { StellarHITLHandler } from "./stellar-hitl-handler";
import type { HITLRequest } from "./types";
import {
  CheckCircle2,
  XCircle,
  ArrowRightLeft,
  Wallet,
  TrendingUp,
  Repeat,
  Landmark,
  Search,
  Info,
} from "lucide-react";
import { toast } from "sonner";

interface ThreadViewProps {
  interrupt: Interrupt<HITLRequest> | Interrupt<HITLRequest>[];
}

// Map HITL tool names to operation types for Stellar execute card
const EXECUTE_TOOL_OPERATIONS: Record<string, string> = {
  execute: "execute",
};

/**
 * Check if this interrupt is for a Stellar execute operation (requires wallet signing).
 * Returns the operation type string or null.
 */
function getStellarOperation(interrupt: Interrupt<HITLRequest>): string | null {
  const toolName = interrupt.value?.action_requests?.[0]?.name;
  if (!toolName) return null;
  if (toolName in EXECUTE_TOOL_OPERATIONS) return EXECUTE_TOOL_OPERATIONS[toolName] ?? null;
  return null;
}

/**
 * Check if this interrupt is a supervisor-level HITL (step approval).
 */
function isSupervisorInterrupt(interrupt: Interrupt<any>): boolean {
  return interrupt.value?.needs_confirm === true && "step_index" in (interrupt.value ?? {});
}

const AGENT_ICONS: Record<string, typeof ArrowRightLeft> = {
  bridge: ArrowRightLeft,
  vault: Wallet,
  yield: TrendingUp,
  swap: Repeat,
  staking: Landmark,
  research: Search,
  info: Info,
};

/**
 * Supervisor step approval UI — shown when the supervisor pauses for user confirmation.
 */
function SupervisorApprovalCard({ interrupt }: { interrupt: Interrupt<any> }) {
  const stream = useStreamContext();
  const [responded, setResponded] = useState(false);
  const value = interrupt.value ?? {};
  const agentName: string = value.agent ?? "unknown";
  const action: string = value.action ?? "";
  const stepIndex: number = value.step_index ?? 0;
  const AgentIcon = AGENT_ICONS[agentName] ?? Info;

  const handleApprove = useCallback(async () => {
    setResponded(true);
    try {
      await stream.submit({}, { command: { resume: { approved: true } } });
      toast.success(`Step ${stepIndex + 1} approved`);
    } catch (error) {
      console.error("[SupervisorApproval] Error:", error);
      toast.error("Failed to submit approval");
      setResponded(false);
    }
  }, [stream, stepIndex]);

  const handleReject = useCallback(async () => {
    setResponded(true);
    try {
      await stream.submit({}, { command: { resume: { approved: false } } });
      toast.info(`Step ${stepIndex + 1} skipped`);
    } catch (error) {
      console.error("[SupervisorApproval] Error:", error);
      toast.error("Failed to submit rejection");
      setResponded(false);
    }
  }, [stream, stepIndex]);

  return (
    <div className="w-fit min-w-[320px] max-w-[420px] rounded-lg border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-yellow-500/10">
          <AgentIcon className="h-4 w-4 text-yellow-500" />
        </div>
        <div className="space-y-0.5 min-w-0">
          <h3 className="text-sm font-semibold">
            Step {stepIndex + 1}: {agentName.charAt(0).toUpperCase() + agentName.slice(1)}
          </h3>
          <p className="text-muted-foreground text-xs">Requires your approval to proceed</p>
        </div>
      </div>

      <div className="mb-4 rounded-md bg-muted/30 px-3 py-2">
        <p className="text-sm">{action}</p>
      </div>

      {responded ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <span>Response submitted</span>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleApprove}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors"
          >
            <CheckCircle2 className="h-4 w-4" />
            Approve
          </button>
          <button
            type="button"
            onClick={handleReject}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
          >
            <XCircle className="h-4 w-4" />
            Skip
          </button>
        </div>
      )}
    </div>
  );
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

  const stellarOperation: string | null = activeInterrupt
    ? getStellarOperation(activeInterrupt)
    : null;

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

  // Supervisor step approval
  if (activeInterrupt && isSupervisorInterrupt(activeInterrupt)) {
    return <SupervisorApprovalCard interrupt={activeInterrupt} />;
  }

  if (stellarOperation) {
    return <StellarHITLHandler interrupt={activeInterrupt} operation={stellarOperation} />;
  }

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
