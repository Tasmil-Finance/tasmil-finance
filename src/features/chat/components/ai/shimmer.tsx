"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ShimmerProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Animation duration in seconds
   * @default 2
   */
  duration?: number;
  /**
   * Width of the shine band as a percentage
   * @default 33
   */
  spread?: number;
}

/**
 * Animated text gradient effect for streaming and loading states.
 * Renders an animated gradient that sweeps across text to signal ongoing activity.
 *
 * @example
 * ```tsx
 * <Shimmer>Thinking...</Shimmer>
 * <Shimmer duration={3} spread={50}>Processing request</Shimmer>
 * ```
 */
export function Shimmer({
  children,
  className,
  duration = 2,
  spread = 33,
  style,
  ...props
}: ShimmerProps) {
  return (
    <div
      className={cn(
        "animate-shimmer bg-clip-text text-transparent bg-[length:200%_100%]",
        "bg-gradient-to-r from-muted-foreground via-foreground to-muted-foreground",
        className,
      )}
      style={{
        animationDuration: `${duration}s`,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}
