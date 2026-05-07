"use client";

import { cn } from "@/lib/utils";
import { TokenImage } from "@/shared/components/token-image";

interface TokenAvatarProps {
  code: string;
  src?: string;
  className?: string;
}

/**
 * Avatar variant that shows a token logo. Wraps the shared `TokenImage`
 * which already handles manifest CDN lookup, letter-fallback, and Next/Image
 * optimisation.
 */
export function TokenAvatar({ code, src, className }: TokenAvatarProps) {
  return (
    <TokenImage
      src={src}
      alt={code}
      className={cn("h-11 w-11 shrink-0 rounded-full text-[10px]", className)}
    />
  );
}
