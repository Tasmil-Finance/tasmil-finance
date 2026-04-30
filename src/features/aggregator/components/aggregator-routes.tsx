"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, Clock, Info, Settings2, RefreshCw, AlertTriangle } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import type { RouteQuote } from "@/features/aggregator/hooks/use-aggregator";
import BorderGlow from "@/shared/ui/border-glow";
import { TokenImage } from "@/shared/components/token-image";
import { PROTOCOL_ICONS as CDN_PROTOCOL_ICONS } from "@/shared/constants/asset-manifest";
import { cn } from "@/lib/utils";

// ─── Protocol branding ──────────────────────────────────────────

const PROTOCOL_META: Record<string, { label: string; icon: string; color: string }> = {
  soroswap: { label: "Soroswap", icon: CDN_PROTOCOL_ICONS.soroswap!, color: "#7B61FF" },
  aquarius: { label: "Aquarius", icon: CDN_PROTOCOL_ICONS.aquarius!, color: "#00B4D8" },
  phoenix:  { label: "Phoenix",  icon: CDN_PROTOCOL_ICONS.phoenix!,  color: "#FF6B35" },
  sdex:     { label: "SDEX",     icon: CDN_PROTOCOL_ICONS.sdex!,     color: "#00C2FF" },
  templar:  { label: "Templar",  icon: CDN_PROTOCOL_ICONS.templar!,  color: "#10B981" },
  allbridge: { label: "Allbridge", icon: CDN_PROTOCOL_ICONS.allbridge!, color: "#3B82F6" },
};

function getProto(quote: RouteQuote) {
  const id = quote.protocol || quote.provider || "unknown";
  return { id, ...(PROTOCOL_META[id] || { label: id, icon: "", color: "#a1a1aa" }) };
}

function formatAmount(raw: string, decimals = 7): string {
  const num = Number(raw) / 10 ** decimals;
  if (num === 0) return "0";
  if (num < 0.0001) return "<0.0001";
  return num.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

function computeRate(amountIn: string, amountOut: string, decimalsIn: number, decimalsOut: number): number {
  const numIn = Number(amountIn) / 10 ** decimalsIn;
  const numOut = Number(amountOut) / 10 ** decimalsOut;
  if (numIn === 0) return 0;
  return numOut / numIn;
}

function formatRate(rate: number): string {
  if (rate === 0) return "0";
  if (rate < 0.000001) return "<0.000001";
  if (rate >= 1000) return rate.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return rate.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

// ─── Route Card ─────────────────────────────────────────────────

function RouteCard({
  quote,
  isBest,
  isSelected,
  tokenInSymbol,
  tokenOutSymbol,
  decimalsIn,
  decimalsOut,
  rateDiffPct,
  onClick,
}: {
  quote: RouteQuote;
  isBest: boolean;
  isSelected: boolean;
  tokenInSymbol: string;
  tokenOutSymbol: string;
  decimalsIn: number;
  decimalsOut: number;
  rateDiffPct: number;
  onClick: () => void;
}) {
  const proto = getProto(quote);
  const rate = computeRate(quote.amountIn, quote.amountOut, decimalsIn, decimalsOut);
  const showRateWarning = rateDiffPct > 5;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-2xl p-4 transition-all duration-200 relative border",
        "active:scale-[0.98]",
        isSelected
          ? "bg-secondary border-primary/30"
          : "bg-secondary border-border hover:border-primary/20",
      )}
    >
      {/* Row 1: Protocol + badges */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <TokenImage src={proto.icon} alt={proto.label} className="h-7 w-7 rounded-lg shrink-0" />
          <span className="text-sm font-semibold text-foreground">
            {proto.label}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isBest && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
              <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Best
            </span>
          )}
          {isSelected && (
            <div className="h-5 w-5 rounded-full flex items-center justify-center bg-primary">
              <Check className="h-3 w-3 text-primary-foreground" strokeWidth={3} />
            </div>
          )}
        </div>
      </div>

      {/* Row 2: Amount output */}
      <div className="flex items-baseline gap-1.5 mb-0.5">
        <span className="text-[22px] font-bold tabular-nums tracking-tight text-foreground">
          {formatAmount(quote.amountOut, decimalsOut)}
        </span>
        <span className="text-sm font-medium text-muted-foreground">
          {tokenOutSymbol}
        </span>
      </div>

      {/* Row 3: Exchange rate */}
      <p className="text-xs text-muted-foreground/60 mb-2.5">
        1 {tokenInSymbol} = {formatRate(rate)} {tokenOutSymbol}
      </p>

      {/* Rate warning */}
      {showRateWarning && (
        <div className={cn(
          "flex items-center gap-1.5 mb-2.5 text-[11px] font-medium",
          rateDiffPct > 50 ? "text-red-400" : "text-amber-400",
        )}>
          <AlertTriangle className="h-3 w-3 shrink-0" />
          {rateDiffPct.toFixed(0)}% worse rate than best
        </div>
      )}

      {/* Divider */}
      <div className="my-2.5 h-px bg-border/40" />

      {/* Row 4: Fee details */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground/70">
            <Info className="h-3 w-3" />
            Fee
          </span>
          <span className="text-[11px] text-muted-foreground/70">
            {formatAmount(quote.fee, decimalsIn)} {tokenInSymbol} ({quote.feePercent})
          </span>
        </div>
        {quote.gasFee && (
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground/70">
              <Info className="h-3 w-3" />
              Gas fee
            </span>
            <span className="text-[11px] text-muted-foreground/70">
              {quote.gasFee} {quote.gasFeeToken ?? ""}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground/70">
            <Clock className="h-3 w-3" />
            Est. time
          </span>
          <span className="text-[11px] text-muted-foreground/70">
            {quote.estimatedTime}
          </span>
        </div>
      </div>
    </button>
  );
}

// ─── Slippage Settings ──────────────────────────────────────────

export function SlippageSettings({
  slippageBps,
  setSlippageBps,
  enabledProtocols,
  toggleProtocol,
}: {
  slippageBps: number;
  setSlippageBps: (bps: number) => void;
  enabledProtocols: Set<string>;
  toggleProtocol: (protocol: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const presets = [
    { label: "Auto", value: 100 },
    { label: "0.5%", value: 50 },
    { label: "1.0%", value: 100 },
    { label: "2.0%", value: 200 },
    { label: "3.0%", value: 300 },
  ];

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const isAuto = slippageBps === 100;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-xl transition-colors bg-secondary text-muted-foreground"
      >
        <Settings2 className="h-3.5 w-3.5" />
        <span>{isAuto ? "Auto" : `${(slippageBps / 100).toFixed(1)}%`}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-10 z-50 w-72 rounded-2xl p-4 space-y-4 shadow-xl bg-popover border border-border"
          >
            <div>
              <p className="text-xs font-medium mb-2.5 text-muted-foreground">
                Slippage Tolerance
              </p>
              <div className="flex gap-1.5">
                {presets.map(({ label, value }) => {
                  const active = label === "Auto" ? isAuto : slippageBps === value && !isAuto;
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setSlippageBps(value)}
                      className={cn(
                        "flex-1 py-2 text-xs font-medium rounded-xl transition-all",
                        active
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-muted-foreground",
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium mb-2.5 text-muted-foreground">
                Protocols
              </p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(PROTOCOL_META).map(([id, { label, icon }]) => {
                  const active = enabledProtocols.has(id);
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => toggleProtocol(id)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-xl transition-all",
                        active
                          ? "bg-accent text-foreground"
                          : "bg-secondary text-ring opacity-50",
                      )}
                    >
                      <TokenImage src={icon} alt={label} className="h-5 w-5 rounded-sm" />
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Route Panel ────────────────────────────────────────────────

export function AggregatorRoutePanel({
  quotes,
  bestQuote,
  isLoading,
  tokenInSymbol,
  tokenOutSymbol,
  decimalsIn,
  decimals,
  selectedProtocol,
  onSelectProtocol,
  onRefresh,
}: {
  quotes: RouteQuote[];
  bestQuote: RouteQuote | null;
  isLoading: boolean;
  tokenInSymbol: string;
  tokenOutSymbol: string;
  decimalsIn: number;
  decimals: number;
  selectedProtocol: string | null;
  onSelectProtocol: (protocol: string) => void;
  onRefresh: () => void;
}) {
  const okQuotes = quotes.filter((q) => q.status === "ok");

  const bestRate = okQuotes.reduce((best, q) => {
    const r = computeRate(q.amountIn, q.amountOut, decimalsIn, decimals);
    return r > best ? r : best;
  }, 0);

  const inner = (children: React.ReactNode) => (
    <BorderGlow
      className="w-[360px] h-full"
      backgroundColor="var(--card)"
      borderRadius={24}
      glowColor="203 100 73"
      glowIntensity={0.3}
      glowRadius={30}
      colors={["hsl(203 100% 73%)", "hsl(195 90% 55%)", "hsl(210 80% 50%)"]}
      fillOpacity={0.15}
    >
      <div className="p-4 flex flex-col h-full min-h-0">{children}</div>
    </BorderGlow>
  );

  if (isLoading && quotes.length === 0) {
    return inner(
      <>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-semibold text-foreground">Finding routes</p>
            <p className="text-[11px] mt-0.5 text-muted-foreground/50">Comparing protocols...</p>
          </div>
          <div className="h-8 w-8 rounded-xl flex items-center justify-center bg-secondary">
            <RefreshCw className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
          </div>
        </div>
        <div className="flex flex-col gap-2.5 flex-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl p-4 bg-secondary/50 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl animate-pulse bg-input/30" />
                <div className="h-4 w-16 rounded-lg animate-pulse bg-input/30" />
              </div>
              <div className="h-6 w-28 rounded-lg animate-pulse bg-input/20" />
              <div className="h-3 w-36 rounded animate-pulse bg-input/15" />
            </div>
          ))}
        </div>
      </>
    );
  }

  if (okQuotes.length === 0) {
    return inner(
      <div className="flex flex-col items-center justify-center flex-1 gap-3 py-8">
        <div className="h-12 w-12 rounded-2xl flex items-center justify-center bg-secondary">
          <AlertTriangle className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-sm font-semibold text-foreground">No routes found</p>
        <p className="text-xs text-center max-w-[200px] text-muted-foreground/60">
          Try a different pair or amount
        </p>
        <button
          type="button"
          onClick={onRefresh}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-xl transition-all hover:brightness-110 mt-1 bg-secondary text-muted-foreground"
        >
          <RefreshCw className="h-3 w-3" /> Retry
        </button>
      </div>
    );
  }

  return inner(
    <>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-semibold text-foreground">Select a route</p>
          <p className="text-[11px] mt-0.5 text-muted-foreground/50">
            {okQuotes.length} route{okQuotes.length !== 1 ? "s" : ""} found
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="h-8 w-8 rounded-xl flex items-center justify-center transition-all bg-secondary hover:bg-accent active:scale-90"
          title="Refresh quotes"
        >
          <RefreshCw
            className={cn("h-3.5 w-3.5 text-muted-foreground", isLoading && "animate-spin")}
          />
        </button>
      </div>
      <div className="flex flex-col gap-2.5 overflow-y-auto flex-1 min-h-0">
        {okQuotes.map((quote, i) => {
          const id = quote.protocol || quote.provider || `route-${i}`;
          const isBest = bestQuote != null && (quote.protocol || quote.provider) === (bestQuote.protocol || bestQuote.provider);
          const quoteRate = computeRate(quote.amountIn, quote.amountOut, decimalsIn, decimals);
          const rateDiffPct = bestRate > 0 ? ((bestRate - quoteRate) / bestRate) * 100 : 0;
          return (
            <RouteCard
              key={id}
              quote={quote}
              isBest={isBest}
              isSelected={selectedProtocol === id}
              tokenInSymbol={tokenInSymbol}
              tokenOutSymbol={tokenOutSymbol}
              decimalsIn={decimalsIn}
              decimalsOut={decimals}
              rateDiffPct={rateDiffPct}
              onClick={() => onSelectProtocol(id)}
            />
          );
        })}
      </div>
    </>
  );
}
