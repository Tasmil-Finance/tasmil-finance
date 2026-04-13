"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface CopyButtonProps {
  text: string;
  className?: string;
  iconSize?: string;
  successDuration?: number;
}

export function CopyButton({
  text,
  className,
  iconSize = "h-3.5 w-3.5",
  successDuration = 2000,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (text) {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), successDuration);
    }
  };

  return (
    <button
      className={cn("text-gray-400 transition-colors hover:text-white", className)}
      onClick={handleCopy}
      type="button"
    >
      {copied ? (
        <Check className={cn(iconSize, "text-green-500")} />
      ) : (
        <Copy className={iconSize} />
      )}
    </button>
  );
}
