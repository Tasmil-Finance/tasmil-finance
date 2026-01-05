"use client";

import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button-v2";
import { cn } from "@/lib/utils";

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
  const handleClick = () => {
    onClick?.(suggestion);
  };

  return (
    <Button
      className={cn("cursor-pointer rounded-lg px-3 py-1.5 text-left text-xs h-auto whitespace-normal", className)}
      onClick={handleClick}
      type="button"
      variant={variant}
      {...props}
    >
      {children || suggestion}
    </Button>
  );
};