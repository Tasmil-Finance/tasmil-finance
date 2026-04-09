"use client";

import * as React from "react";
import { Brain, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/shared/ui/collapsible";
import { MarkdownText } from "@/features/chat/thread/components/markdown-text";
import { Shimmer } from "./shimmer";

interface AIReasoningProps {
  children: React.ReactNode;
  duration?: number;
  isStreaming?: boolean;
  defaultOpen?: boolean;
  className?: string;
}

export function AIReasoning({
  children,
  duration,
  isStreaming = false,
  defaultOpen,
  className,
}: AIReasoningProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen ?? isStreaming);
  const [thinkingSeconds, setThinkingSeconds] = React.useState(0);
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  // Track thinking duration in real-time while streaming
  React.useEffect(() => {
    if (isStreaming) {
      setThinkingSeconds(0);
      timerRef.current = setInterval(() => {
        setThinkingSeconds((prev) => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isStreaming]);

  // Auto-open when streaming starts
  React.useEffect(() => {
    if (isStreaming && defaultOpen === undefined) {
      setIsOpen(true);
    }
  }, [isStreaming, defaultOpen]);

  // Auto-close when streaming finishes
  React.useEffect(() => {
    if (!isStreaming && defaultOpen === undefined) {
      const timer = setTimeout(() => {
        setIsOpen(false);
      }, 500);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isStreaming, defaultOpen]);

  const formatDuration = (dur: number) => {
    if (dur < 60) {
      return `${Math.round(dur)}s`;
    }
    const minutes = Math.floor(dur / 60);
    const seconds = Math.round(dur % 60);
    return `${minutes}m ${seconds}s`;
  };

  const displayDuration =
    duration ?? (thinkingSeconds > 0 ? thinkingSeconds : undefined);

  const label = isStreaming
    ? "Thinking"
    : `Thought for ${displayDuration ? formatDuration(displayDuration) : "a moment"}`;

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className={cn("group/reasoning", className)}
    >
      <CollapsibleTrigger className="flex items-center gap-2 py-1.5 text-sm transition-colors hover:opacity-80">
        {/* Brain icon */}
        <Brain
          className={cn(
            "h-4 w-4 shrink-0",
            isStreaming
              ? "text-foreground animate-pulse"
              : "text-muted-foreground",
          )}
        />

        {/* Label with shimmer when streaming */}
        {isStreaming ? (
          <Shimmer className="font-medium text-sm" duration={2}>
            {label}
            {displayDuration && displayDuration > 2
              ? ` ${formatDuration(displayDuration)}`
              : "..."}
          </Shimmer>
        ) : (
          <span className="font-medium text-muted-foreground">{label}</span>
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
        <div
          className={cn(
            "relative border-l-2 pl-4 py-2 ml-2 mt-1",
            isStreaming
              ? "border-muted-foreground/40"
              : "border-border/50",
          )}
        >
          {/* Streaming shimmer line overlay */}
          {isStreaming && (
            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-muted-foreground/60 via-muted-foreground to-muted-foreground/60 animate-pulse" />
          )}

          <div
            className={cn(
              "text-sm leading-relaxed text-muted-foreground",
              "prose prose-sm max-w-none dark:prose-invert",
              "[&_p]:text-muted-foreground [&_li]:text-muted-foreground [&_strong]:text-muted-foreground",
            )}
          >
            {typeof children === "string" ? (
              <MarkdownText>{children}</MarkdownText>
            ) : (
              children
            )}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
