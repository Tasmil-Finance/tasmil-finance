"use client";

import {
  ArrowUp,
  Plus,
  type LucideIcon,
  User,
  Wallet,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AvatarGlyph } from "../../lib/types";

const GLYPHS: Record<AvatarGlyph, LucideIcon> = {
  user: User,
  wallet: Wallet,
  plus: Plus,
  "arrow-up": ArrowUp,
  "x-circle": XCircle,
};

interface BorderedGlyphAvatarProps {
  glyph: AvatarGlyph;
  corner?: { glyph: AvatarGlyph; tone: "primary" | "destructive" };
  className?: string;
}

/**
 * Bordered ring avatar with a centered lucide glyph and an optional small
 * corner badge. Used for: contract calls, classic ops without an asset,
 * Create Account (corner: plus / arrow-up), Transaction Failed (wallet +
 * destructive x-circle).
 */
export function BorderedGlyphAvatar({ glyph, corner, className }: BorderedGlyphAvatarProps) {
  const Glyph = GLYPHS[glyph];
  const Corner = corner ? GLYPHS[corner.glyph] : null;
  return (
    <div
      className={cn(
        "relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border/60",
        className,
      )}
    >
      <Glyph className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
      {Corner && corner ? (
        <span
          className={cn(
            "-bottom-0.5 -right-0.5 absolute flex h-4 w-4 items-center justify-center rounded-full bg-background",
            corner.tone === "primary" && "text-primary",
            corner.tone === "destructive" && "text-destructive",
          )}
        >
          <Corner className="h-3 w-3" strokeWidth={2} />
        </span>
      ) : null}
    </div>
  );
}
