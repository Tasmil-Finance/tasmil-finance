"use client";

import {
  CheckCircleIcon,
  ChevronDownIcon,
  CircleIcon,
  ClockIcon,
  WrenchIcon,
  XCircleIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

export type ToolState =
  | "input-streaming"
  | "input-available"
  | "approval-requested"
  | "approval-responded"
  | "output-available"
  | "output-error"
  | "output-denied";

export interface ToolCallProps {
  type: string;
  state: ToolState;
  input?: Record<string, unknown>;
  output?: Record<string, unknown> | string;
  errorText?: string;
  onApprove?: () => void;
  onDeny?: () => void;
  defaultOpen?: boolean;
  className?: string;
}

const getStatusBadge = (status: ToolState) => {
  const labels: Record<ToolState, string> = {
    "input-streaming": "Pending",
    "input-available": "Running",
    "approval-requested": "Awaiting Approval",
    "approval-responded": "Approved",
    "output-available": "Completed",
    "output-error": "Error",
    "output-denied": "Denied",
  };

  const icons: Record<ToolState, ReactNode> = {
    "input-streaming": <CircleIcon className="size-3" />,
    "input-available": <ClockIcon className="size-3 animate-pulse" />,
    "approval-requested": <ClockIcon className="size-3 text-yellow-500" />,
    "approval-responded": <CheckCircleIcon className="size-3 text-blue-500" />,
    "output-available": <CheckCircleIcon className="size-3 text-green-500" />,
    "output-error": <XCircleIcon className="size-3 text-red-500" />,
    "output-denied": <XCircleIcon className="size-3 text-orange-500" />,
  };

  const variants: Record<ToolState, "default" | "secondary" | "destructive" | "outline"> = {
    "input-streaming": "secondary",
    "input-available": "secondary",
    "approval-requested": "outline",
    "approval-responded": "secondary",
    "output-available": "secondary",
    "output-error": "destructive",
    "output-denied": "outline",
  };

  return (
    <Badge
      className="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs"
      variant={variants[status]}
    >
      {icons[status]}
      <span>{labels[status]}</span>
    </Badge>
  );
};

// Simple syntax highlighting for JSON
function highlightJSON(json: string): ReactNode {
  const lines = json.split("\n");

  return lines.map((line, lineIndex) => {
    const parts: ReactNode[] = [];
    let remaining = line;
    let keyIndex = 0;

    // Match patterns: keys, strings, numbers, booleans, null
    const patterns = [
      { regex: /^(\s*)("[\w-]+")(:)/, type: "key" },
      { regex: /"[^"]*"/, type: "string" },
      { regex: /\b(true|false)\b/, type: "boolean" },
      { regex: /\bnull\b/, type: "null" },
      { regex: /\b-?\d+\.?\d*\b/, type: "number" },
    ];

    while (remaining.length > 0) {
      let matched = false;

      for (const { regex, type } of patterns) {
        const match = remaining.match(regex);
        if (match && match.index === 0) {
          if (type === "key") {
            // Handle key with colon
            const [full, indent, key, colon] = match;
            parts.push(<span key={`${lineIndex}-${keyIndex++}`}>{indent}</span>);
            parts.push(
              <span key={`${lineIndex}-${keyIndex++}`} className="text-cyan-400">
                {key}
              </span>
            );
            parts.push(<span key={`${lineIndex}-${keyIndex++}`}>{colon}</span>);
            remaining = remaining.slice(full.length);
          } else {
            const colorClass =
              {
                string: "text-green-400",
                number: "text-orange-400",
                boolean: "text-purple-400",
                null: "text-gray-500",
              }[type] || "";

            parts.push(
              <span key={`${lineIndex}-${keyIndex++}`} className={colorClass}>
                {match[0]}
              </span>
            );
            remaining = remaining.slice(match[0].length);
          }
          matched = true;
          break;
        }
      }

      if (!matched) {
        // No pattern matched, take one character
        parts.push(<span key={`${lineIndex}-${keyIndex++}`}>{remaining[0]}</span>);
        remaining = remaining.slice(1);
      }
    }

    return <div key={lineIndex}>{parts.length > 0 ? parts : "\u00A0"}</div>;
  });
}

export function ToolCall({
  type,
  state,
  input,
  output,
  errorText,
  onApprove,
  onDeny,
  defaultOpen = true,
  className,
}: ToolCallProps) {
  const toolName = type.replace("tool-", "");

  return (
    <Collapsible
      defaultOpen={defaultOpen}
      className={cn("w-fit md:max-w-[80%] rounded-lg border border-border bg-card", className)}
    >
      <CollapsibleTrigger className="group flex w-full min-w-0 items-center justify-between gap-2 rounded-t-lg p-3 transition-colors hover:bg-muted/50">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <WrenchIcon className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate font-medium text-sm">{toolName}</span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {getStatusBadge(state)}
          <ChevronDownIcon className="size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent>
        {/* Input/Parameters - show for all states except streaming and error */}
        {input && state !== "input-streaming" && state !== "output-error" && (
            <div className="space-y-2 border-border border-t p-4">
              <h4 className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
                Parameters
              </h4>
              <div className="overflow-x-auto rounded-md bg-muted/50 p-3">
                <pre className="font-mono text-xs">
                  {highlightJSON(JSON.stringify(input, null, 2))}
                </pre>
              </div>
            </div>
          )}

        {/* Approval Buttons */}
        {state === "approval-requested" && onApprove && onDeny && (
          <div className="flex items-center justify-end gap-2 border-border border-t px-4 py-3">
            <button
              className="rounded-md px-3 py-1.5 text-muted-foreground text-sm transition-colors hover:bg-muted hover:text-foreground"
              onClick={onDeny}
              type="button"
            >
              Deny
            </button>
            <button
              className="rounded-md bg-primary px-3 py-1.5 text-primary-foreground text-sm transition-colors hover:bg-primary/90"
              onClick={onApprove}
              type="button"
            >
              Allow
            </button>
          </div>
        )}

        {/* Output/Result */}
        {(state === "output-available" || state === "output-error") && (output || errorText) && (
          <div className="space-y-2 border-border border-t p-4">
            <h4 className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
              {errorText ? "Error" : "Result"}
            </h4>
            <div
              className={cn(
                "overflow-x-auto rounded-md p-3",
                errorText ? "bg-destructive/10 text-destructive" : "bg-muted/50"
              )}
            >
              {errorText ? (
                <p className="text-sm">{errorText}</p>
              ) : (
                <pre className="font-mono text-xs">
                  {highlightJSON(
                    typeof output === "string" ? output : JSON.stringify(output, null, 2)
                  )}
                </pre>
              )}
            </div>
          </div>
        )}

        {/* Denied state */}
        {state === "output-denied" && (
          <div className="border-border border-t p-4">
            <p className="text-muted-foreground text-sm">Tool execution was denied by user.</p>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
