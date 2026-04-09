"use client";

import {
  Check,
  XCircle,
  SkipForward,
  Circle,
  ChevronRight,
  ArrowRightLeft,
  Wallet,
  TrendingUp,
  Search,
  Info,
  Repeat,
  Landmark,
  Sparkles,
} from "lucide-react";
import { memo, useState } from "react";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/shared/ui/collapsible";
import { Loader } from "@/shared/ui/loader";
import { Shimmer } from "@/features/chat/components/ai/shimmer";

interface PlanStepData {
  step: number;
  agent: string;
  action: string;
  needs_confirm: boolean;
  status: string; // pending | running | completed | failed | skipped
}

interface SupervisorPlanCardProps {
  type?: string;
  toolName?: string;
  args?: Record<string, any>;
  result?: any;
  toolCallId?: string;
  status?: string;
  intent?: string;
  reasoning?: string;
  steps?: PlanStepData[];
  currentStep?: number;
  error?: string;
}

const AGENT_CONFIG: Record<
  string,
  { icon: typeof Info; color: string; bgColor: string; label: string }
> = {
  bridge: {
    icon: ArrowRightLeft,
    color: "text-purple-400",
    bgColor: "bg-purple-400",
    label: "Bridge",
  },
  vault: {
    icon: Wallet,
    color: "text-blue-400",
    bgColor: "bg-blue-400",
    label: "Vault",
  },
  yield: {
    icon: TrendingUp,
    color: "text-emerald-400",
    bgColor: "bg-emerald-400",
    label: "Yield",
  },
  swap: {
    icon: Repeat,
    color: "text-orange-400",
    bgColor: "bg-orange-400",
    label: "Swap",
  },
  staking: {
    icon: Landmark,
    color: "text-cyan-400",
    bgColor: "bg-cyan-400",
    label: "Staking",
  },
  research: {
    icon: Search,
    color: "text-yellow-400",
    bgColor: "bg-yellow-400",
    label: "Research",
  },
  info: {
    icon: Info,
    color: "text-gray-400",
    bgColor: "bg-gray-400",
    label: "Info",
  },
};

function getStepIcon(status: string, isCurrentStep: boolean) {
  switch (status) {
    case "completed":
      return <Check className="h-3.5 w-3.5 text-emerald-500" />;
    case "running":
      return (
        <Loader size={14} className="text-muted-foreground" />
      );
    case "failed":
      return <XCircle className="h-3.5 w-3.5 text-red-400" />;
    case "skipped":
      return (
        <SkipForward className="h-3.5 w-3.5 text-muted-foreground/40" />
      );
    case "pending":
    default:
      return (
        <Circle
          className={cn(
            "h-3.5 w-3.5",
            isCurrentStep
              ? "text-muted-foreground"
              : "text-muted-foreground/30",
          )}
        />
      );
  }
}

function SupervisorPlanCardComponent(props: SupervisorPlanCardProps) {
  const steps: PlanStepData[] = props.steps || props.result?.steps || [];
  const reasoning = props.reasoning || props.result?.reasoning || "";
  const currentStep = props.currentStep ?? props.result?.currentStep ?? 0;
  const [isOpen, setIsOpen] = useState(true);

  if (!steps.length) return null;

  const completedCount = steps.filter((s) => s.status === "completed").length;
  const allDone = completedCount === steps.length;
  const hasFailed = steps.some((s) => s.status === "failed");
  const isRunning = steps.some((s) => s.status === "running");

  const statusLabel = allDone
    ? `${steps.length} steps completed`
    : hasFailed
      ? "Encountered errors"
      : `${completedCount}/${steps.length}`;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="group flex items-center gap-2 py-1.5 text-sm transition-colors hover:opacity-80">
        {/* Status indicator */}
        <div className="shrink-0">
          {isRunning ? (
            <Loader size={16} className="text-muted-foreground" />
          ) : allDone ? (
            <Sparkles className="h-4 w-4 text-emerald-500" />
          ) : hasFailed ? (
            <XCircle className="h-4 w-4 text-red-400" />
          ) : (
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          )}
        </div>

        {/* Label with shimmer when running */}
        {isRunning ? (
          <Shimmer className="font-medium text-sm" duration={2}>
            Executing plan
          </Shimmer>
        ) : (
          <span
            className={cn(
              "font-medium",
              allDone ? "text-muted-foreground" : "text-foreground",
            )}
          >
            {allDone ? "Execution plan" : "Planning"}
          </span>
        )}

        {/* Step count badge */}
        <span
          className={cn(
            "text-xs px-1.5 py-0.5 rounded-full",
            allDone
              ? "bg-emerald-500/10 text-emerald-500"
              : hasFailed
                ? "bg-red-500/10 text-red-400"
                : "bg-muted text-muted-foreground",
          )}
        >
          {statusLabel}
        </span>

        {/* Chevron */}
        <ChevronRight
          className={cn(
            "h-3.5 w-3.5 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-90",
          )}
        />
      </CollapsibleTrigger>

      <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
        <div
          className={cn(
            "border-l-2 pl-4 py-2 ml-2 mt-1 space-y-0.5",
            isRunning
              ? "border-primary/40"
              : allDone
                ? "border-emerald-500/30"
                : hasFailed
                  ? "border-red-500/30"
                  : "border-border/40",
          )}
        >
          {/* Reasoning */}
          {reasoning && (
            <p className="text-sm text-muted-foreground/70 italic mb-2">
              {reasoning}
            </p>
          )}

          {/* Steps */}
          {steps.map((step, idx) => {
            const isCurrentStepActive = idx === currentStep && !allDone;
            const config =
              AGENT_CONFIG[step.agent] || AGENT_CONFIG["info"]!;
            const AgentIcon = config.icon;

            return (
              <div
                key={`step-${step.step}-${idx}`}
                className={cn(
                  "flex items-start gap-2.5 py-1.5 transition-all duration-200",
                  step.status === "completed" && "opacity-50",
                  step.status === "skipped" && "opacity-30",
                )}
              >
                {/* Status icon */}
                <div className="mt-0.5 shrink-0">
                  {getStepIcon(step.status, isCurrentStepActive)}
                </div>

                {/* Step content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <AgentIcon
                      className={cn("h-3 w-3 shrink-0", config.color)}
                    />
                    {step.status === "running" ? (
                      <Shimmer className="text-sm font-medium" duration={2}>
                        {config.label}
                      </Shimmer>
                    ) : (
                      <span
                        className={cn(
                          "text-sm font-medium",
                          isCurrentStepActive
                            ? "text-foreground"
                            : "text-muted-foreground",
                        )}
                      >
                        {config.label}
                      </span>
                    )}
                    {step.needs_confirm && step.status === "pending" && (
                      <span className="text-[10px] rounded-full bg-yellow-500/10 text-yellow-500 px-1.5 py-0.5 font-medium">
                        approval
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground/60 mt-0.5 leading-relaxed">
                    {step.action}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export const SupervisorPlanCard = memo(SupervisorPlanCardComponent);
