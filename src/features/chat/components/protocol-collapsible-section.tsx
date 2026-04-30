"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { TokenImage } from "@/shared/components/token-image";
import { PROTOCOL_ICONS as CDN_PROTOCOL_ICONS } from "@/shared/constants/asset-manifest";
import type { PositionItem } from "@/features/profile/hooks/use-defi-positions";
import { CompactPositionRow } from "./compact-position-row";

// ─── Protocol icon mapping ──────────────────────────────────────────────────

const PROTOCOL_ICONS: Record<string, string> = {
  "tasmil-vault": CDN_PROTOCOL_ICONS.tasmil!,
  blend:          CDN_PROTOCOL_ICONS.blend!,
  soroswap:       CDN_PROTOCOL_ICONS.soroswap!,
  aquarius:       CDN_PROTOCOL_ICONS.aquarius!,
  phoenix:        CDN_PROTOCOL_ICONS.phoenix!,
  defindex:       CDN_PROTOCOL_ICONS.defindex!,
  sdex:           CDN_PROTOCOL_ICONS.sdex!,
  templar:        CDN_PROTOCOL_ICONS.templar!,
  allbridge:      CDN_PROTOCOL_ICONS.allbridge!,
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

// ─── Protocol section ───────────────────────────────────────────────────────

interface ProtocolCollapsibleSectionProps {
  protocol: string;
  displayName: string;
  totalValueUsd: number;
  positions: PositionItem[];
  pnl?: { profitUsd: number; profitPercent: number; currentApy: number };
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
    <div className="border-b border-sidebar-border last:border-b-0">
      {/* Protocol header */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-2.5 px-4 py-2.5 transition-colors hover:bg-sidebar-accent/60"
      >
          {iconSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={iconSrc}
              alt={displayName}
              className="h-5 w-5 shrink-0 rounded-full"
            />
          ) : (
            <TokenImage
              alt={displayName}
              className="h-5 w-5 shrink-0 rounded-full text-[8px]"
            />
          )}
          <div className="flex min-w-0 flex-1 flex-col items-start">
            <span className="text-sm font-medium text-sidebar-foreground">
              {displayName}
            </span>
            <div className="flex items-center gap-1.5 text-xs text-sidebar-foreground/50">
              <span>
                {positions.length} position{positions.length !== 1 ? "s" : ""}
              </span>
              {pnl && pnl.profitUsd !== 0 && (
                <span
                  className={cn(
                    "font-medium",
                    pnl.profitUsd >= 0 ? "text-emerald-400" : "text-red-400",
                  )}
                >
                  {pnl.profitUsd >= 0 ? "+" : ""}
                  {formatUsd(pnl.profitUsd)}
                </span>
              )}
            </div>
          </div>
          <span className="shrink-0 text-xs font-medium text-sidebar-foreground/70 tabular-nums">
            {formatUsd(totalValueUsd)}
          </span>
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 shrink-0 text-sidebar-foreground/40 transition-transform duration-200",
              !expanded && "-rotate-90",
            )}
          />
        </button>

        {/* Position cards */}
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="border-t border-sidebar-border">
                <div className="flex flex-col gap-2 px-4 pb-3 pt-2">
                  {positions.map((pos, i) => (
                    <CompactPositionRow
                      key={`${pos.name}-${pos.type}-${i}`}
                      position={pos}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
}
