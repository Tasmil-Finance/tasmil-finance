"use client";

import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/shared/ui/button-v2";
import { useRipple, RippleContainer } from "@/shared/ui/ripple-effect";

export type SuggestionProps = Omit<ComponentProps<typeof Button>, "onClick"> & {
  suggestion: string;
  onClick?: (suggestion: string) => void;
};

export const Suggestion = ({
  suggestion,
  onClick,
  className,
  variant = "outline",
  children,
  ...props
}: SuggestionProps) => {
  const { ripples, createRipple } = useRipple();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    createRipple(e);
    onClick?.(suggestion);
  };

  return (
    <Button
      className={cn(
        "relative overflow-hidden cursor-pointer rounded-lg px-3 py-1.5 text-left text-xs h-auto whitespace-normal",
        className
      )}
      onClick={handleClick}
      type="button"
      variant={variant}
      {...props}
    >
      <RippleContainer ripples={ripples} />
      {children || suggestion}
    </Button>
  );
};
