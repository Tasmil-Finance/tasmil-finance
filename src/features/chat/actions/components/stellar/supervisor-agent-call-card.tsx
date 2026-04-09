"use client";

import {
  ArrowRightLeft,
  ChevronRight,
  Info,
  Landmark,
  Repeat,
  Search,
  TrendingUp,
  Wallet,
  AlertCircle,
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

interface SupervisorAgentCallCardProps {
  agent?: string;
  message?: string;
  status?: "calling" | "complete" | "error";
  toolCallId?: string;
}

const AGENT_CONFIG: Record<
  string,
  { icon: typeof Info; color: string; bgColor: string; label: string }
> = {
  info: {
    icon: Info,
    color: "text-gray-400",
    bgColor: "bg-gray-400",
    label: "Info Agent",
  },
  swap: {
    icon: Repeat,
    color: "text-orange-400",
    bgColor: "bg-orange-400",
    label: "Swap Agent",
  },
  vault: {
    icon: Wallet,
    color: "text-blue-400",
    bgColor: "bg-blue-400",
    label: "Vault Agent",
  },
  staking: {
    icon: Landmark,
    color: "text-cyan-400",
    bgColor: "bg-cyan-400",
    label: "Staking Agent",
  },
  bridge: {
    icon: ArrowRightLeft,
    color: "text-purple-400",
    bgColor: "bg-purple-400",
    label: "Bridge Agent",
  },
  yield: {
    icon: TrendingUp,
    color: "text-emerald-400",
    bgColor: "bg-emerald-400",
    label: "Yield Agent",
  },
  research: {
    icon: Search,
    color: "text-yellow-400",
    bgColor: "bg-yellow-400",
    label: "Research Agent",
  },
};

function SupervisorAgentCallCardComponent(
  props: SupervisorAgentCallCardProps,
) {
  const agentName = props.agent || "unknown";
  const message = props.message || "";
  const status = props.status || "calling";
  const [isOpen, setIsOpen] = useState(status === "calling");

  const config = AGENT_CONFIG[agentName] || AGENT_CONFIG["info"]!;
  const AgentIcon = config.icon;

  const isCalling = status === "calling";
  const isError = status === "error";

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="group flex items-center gap-2 py-1.5 text-sm transition-colors hover:opacity-80">
        {/* Agent-colored icon */}
        <div className="shrink-0">
          {isCalling ? (
            <Loader size={16} className="text-muted-foreground" />
          ) : isError ? (
            <AlertCircle className="h-4 w-4 text-red-400" />
          ) : (
            <AgentIcon className="h-4 w-4 text-muted-foreground" />
          )}
        </div>

        {/* Label with shimmer when calling */}
        {isCalling ? (
          <Shimmer className="font-medium text-sm" duration={2}>
            Using {config.label}
          </Shimmer>
        ) : (
          <span className="font-medium text-muted-foreground">
            {isError ? `${config.label} failed` : `Used ${config.label}`}
          </span>
        )}

        {/* Chevron */}
        <ChevronRight
          className={cn(
            "h-3.5 w-3.5 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-90",
          )}
        />
      </CollapsibleTrigger>

      <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
        {message && (
          <div className="border-l-2 border-muted-foreground/20 pl-4 py-2 ml-2 mt-1">
            <p className="text-sm leading-relaxed text-muted-foreground">
              {message}
            </p>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

export const SupervisorAgentCallCard = memo(
  SupervisorAgentCallCardComponent,
);
