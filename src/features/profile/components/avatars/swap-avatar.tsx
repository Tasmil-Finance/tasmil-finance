"use client";

import { TokenImage } from "@/shared/components/token-image";

interface SwapAvatarProps {
  src: string;
  dst: string;
}

/**
 * Two overlapping token logos. Source asset (debited) sits behind, top-left;
 * destination asset (credited) sits in front, bottom-right with a small ring
 * cutout to separate the two discs visually.
 */
export function SwapAvatar({ src, dst }: SwapAvatarProps) {
  return (
    <div className="relative h-11 w-11 shrink-0">
      <TokenImage
        alt={src}
        className="absolute top-0 left-0 h-7 w-7 rounded-full text-[9px]"
      />
      <TokenImage
        alt={dst}
        className="absolute right-0 bottom-0 h-7 w-7 rounded-full text-[9px] ring-2 ring-background"
      />
    </div>
  );
}
