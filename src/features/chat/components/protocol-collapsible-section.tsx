"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { TokenImage } from "@/shared/components/token-image";
import type { PositionItem } from "@/features/profile/hooks/use-defi-positions";
import { CompactPositionRow } from "./compact-position-row";

// ─── Protocol icon mapping ──────────────────────────────────────────────────

const PROTOCOL_ICONS: Record<string, string> = {
  "tasmil-vault": "/protocols/tasmil.png",
  blend:          "/protocols/blend.svg",
  soroswap:       "/protocols/soroswap.svg",
  aquarius:       "/protocols/aquarius.svg",
  phoenix:        "/protocols/phoenix.svg",
  defindex:       "/protocols/defindex.svg",
  sdex:           "/protocols/sdex.svg",
  templar:        "/protocols/templar.svg",
  allbridge:      "/protocols/allbridge.svg",
};

function getProtocolIcon(protocol: string): string | null {
  if (PROTOCOL_ICONS[protocol]) return PROTOCOL_ICONS[protocol]!;
  const prefix = protocol.split("-")[0];
  if (prefix && PROTOCOL_ICONS[prefix]) return PROTOCOL_ICONS[prefix]!;
  return null;
}

function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);
}

// ─── Protocol collapsible section ───────────────────────────────────────────

interface ProtocolCollapsibleSectionProps {
  protocol: string;
  displayName: string;
  totalValueUsd: number;
  positions: PositionItem[];
  pnl?: { profitUsd: number; profitPercent: number; currentApy: number };
  /** Collapsed by default when >3 positions */
  defaultCollapsed?: boolean;
}

export function ProtocolCollapsibleSection({
  protocol,
  displayName,
  totalValueUsd,
  positions,
  pnl,
  defaultCollapsed,
}: ProtocolCollapsibleSectionProps) {
  const isCollapsedDefault = defaultCollapsed ?? positions.length > 3;
  const [expanded, setExpanded] = useState(!isCollapsedDefault);
  const iconSrc = getProtocolIcon(protocol);

  return (
    <motion.div
      className="overflow-hidden rounded-xl border border-border bg-card"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Protocol header */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/20"
      >
        {iconSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={iconSrc}
            alt={displayName}
            className="h-7 w-7 shrink-0 rounded-full"
          />
        ) : (
          <TokenImage
            alt={displayName}
            className="h-7 w-7 shrink-0 rounded-full text-[10px]"
          />
        )}
        <div className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
          <span className="text-sm font-semibold text-foreground">
            {displayName}
          </span>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>
              {positions.length} position{positions.length !== 1 ? "s" : ""}
            </span>
            {pnl && pnl.profitUsd !== 0 && (
              <span
                className={cn(
                  "font-medium",
                  pnl.profitUsd >= 0 ? "text-emerald-400" : "text-destructive",
                )}
              >
                {pnl.profitUsd >= 0 ? "+" : ""}
                {formatUsd(pnl.profitUsd)} ({pnl.profitPercent >= 0 ? "+" : ""}
                {pnl.profitPercent.toFixed(1)}%)
              </span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-sm font-medium text-foreground tabular-nums">
            {formatUsd(totalValueUsd)}
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
              !expanded && "-rotate-90",
            )}
          />
        </div>
      </button>

      {/* Positions list */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="border-t border-border">
              {positions.map((pos, i) => (
                <CompactPositionRow
                  key={`${pos.name}-${pos.type}-${i}`}
                  position={pos}
                  isLast={i === positions.length - 1}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
