"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, Clock, Info, Settings2, RefreshCw } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import type { RouteQuote } from "@/features/bridge/hooks/use-aggregator";
import BorderGlow from "@/shared/ui/border-glow";

// ─── Protocol branding ──────────────────────────────────────────

const PROTOCOL_META: Record<string, { label: string; icon: string; color: string }> = {
  soroswap: { label: "Soroswap", icon: "/protocols/soroswap.svg", color: "#7B61FF" },
  aquarius: { label: "Aquarius", icon: "/protocols/aquarius.svg", color: "#00B4D8" },
  phoenix: { label: "Phoenix", icon: "/protocols/phoenix.svg", color: "#FF6B35" },
  templar: { label: "Templar", icon: "/protocols/templar.svg", color: "#10B981" },
  allbridge: { label: "Allbridge", icon: "/protocols/allbridge.svg", color: "#3B82F6" },
};

function getProto(quote: RouteQuote) {
  const id = quote.protocol || quote.provider || "unknown";
  return { id, ...(PROTOCOL_META[id] || { label: id, icon: "", color: "var(--muted-foreground)" }) };
}

function formatAmount(raw: string, decimals = 7): string {
  const num = Number(raw) / 10 ** decimals;
  if (num === 0) return "0";
  if (num < 0.0001) return "<0.0001";
  return num.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

// ─── Route Card ─────────────────────────────────────────────────

function RouteCard({
  quote,
  isBest,
  isSelected,
  tokenOutSymbol,
  decimals,
  onClick,
}: {
  quote: RouteQuote;
  isBest: boolean;
  isSelected: boolean;
  tokenOutSymbol: string;
  decimals: number;
  onClick: () => void;
}) {
  const proto = getProto(quote);

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-xl p-4 transition-colors relative"
      style={{
        background: isSelected ? "var(--accent)" : "var(--secondary)",
        border: isBest
          ? "1px solid rgba(89,224,125,0.5)"
          : isSelected
            ? "1px solid var(--primary)"
            : "1px solid transparent",
      }}
    >
      <div className="flex items-center justify-between">
        <span className="text-lg font-bold" style={{ color: "var(--foreground)" }}>
          {formatAmount(quote.amountOut, decimals)} {tokenOutSymbol}
        </span>
        <div className="flex items-center gap-2">
          {isBest && (
            <span
              className="px-2.5 py-1 text-[11px] font-bold rounded-full uppercase tracking-wide"
              style={{ background: "rgba(16,185,129,0.15)", color: "#10B981" }}
            >
              Best
            </span>
          )}
          {isSelected && <Check className="h-5 w-5" style={{ color: "var(--primary)" }} />}
        </div>
      </div>
      <div className="flex items-center justify-between mt-2">
        <span className="flex items-center gap-1.5 text-sm" style={{ color: "var(--muted-foreground)" }}>
          <Info className="h-3.5 w-3.5" />
          Fee: {quote.feePercent}
        </span>
        <span className="flex items-center gap-1.5 text-sm font-medium" style={{ color: "var(--muted-foreground)" }}>
          <img src={proto.icon} alt={proto.label} className="h-5 w-5 rounded-sm" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          {proto.label}
        </span>
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

  // Click outside to close
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
        className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-xl transition-colors"
        style={{
          color: "var(--muted-foreground)",
          background: "var(--secondary)",
        }}
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
            className="absolute right-0 top-10 z-50 w-72 rounded-2xl p-4 space-y-4 shadow-xl"
            style={{ background: "var(--popover)", border: "1px solid var(--border)" }}
          >
            <div>
              <p className="text-xs font-medium mb-2.5" style={{ color: "var(--muted-foreground)" }}>
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
                      className="flex-1 py-2 text-xs font-medium rounded-xl transition-all"
                      style={{
                        background: active ? "var(--primary)" : "var(--secondary)",
                        color: active ? "var(--primary-foreground)" : "var(--muted-foreground)",
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium mb-2.5" style={{ color: "var(--muted-foreground)" }}>
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
                      className="flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-xl transition-all"
                      style={{
                        background: active ? "var(--accent)" : "var(--secondary)",
                        color: active ? "var(--foreground)" : "var(--ring)",
                        opacity: active ? 1 : 0.5,
                      }}
                    >
                      <img src={icon} alt="" className="h-5 w-5 rounded-sm" style={{ opacity: active ? 1 : 0.4 }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
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
  tokenOutSymbol,
  decimals,
  selectedProtocol,
  onSelectProtocol,
  onRefresh,
}: {
  quotes: RouteQuote[];
  bestQuote: RouteQuote | null;
  isLoading: boolean;
  tokenOutSymbol: string;
  decimals: number;
  selectedProtocol: string | null;
  onSelectProtocol: (protocol: string) => void;
  onRefresh: () => void;
}) {
  const okQuotes = quotes.filter((q) => q.status === "ok");

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
      <div className="p-5 flex flex-col h-full">{children}</div>
    </BorderGlow>
  );

  if (isLoading && quotes.length === 0) {
    return inner(
      <>
        <div className="flex items-center justify-between mb-3">
          <p className="text-base font-semibold" style={{ color: "var(--foreground)" }}>Select a route</p>
          <RefreshCw className="h-4 w-4 animate-spin" style={{ color: "var(--muted-foreground)" }} />
        </div>
        <p className="text-sm mb-4" style={{ color: "var(--muted-foreground)" }}>Finding best routes...</p>
        <div className="flex flex-col gap-2 flex-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-[80px] rounded-xl animate-pulse" style={{ background: "var(--secondary)", opacity: 0.4 }} />
          ))}
        </div>
      </>
    );
  }

  if (okQuotes.length === 0) {
    return inner(
      <div className="flex flex-col items-center justify-center flex-1 gap-3">
        <p className="text-base font-semibold" style={{ color: "var(--foreground)" }}>No routes available</p>
        <p className="text-sm text-center" style={{ color: "var(--muted-foreground)" }}>Try a different token pair or amount</p>
        <button type="button" onClick={onRefresh} className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-colors mt-2" style={{ background: "var(--secondary)", color: "var(--muted-foreground)" }}>
          <RefreshCw className="h-3.5 w-3.5" /> Retry
        </button>
      </div>
    );
  }

  return inner(
    <>
      <div className="flex items-center justify-between mb-2">
        <p className="text-base font-semibold" style={{ color: "var(--foreground)" }}>Select a route</p>
        <div className="flex items-center gap-2">
          <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            {okQuotes.length} route{okQuotes.length !== 1 ? "s" : ""}
          </span>
          <button type="button" onClick={onRefresh} className="p-1.5 rounded-full transition-colors hover:bg-[var(--secondary)] active:scale-90" title="Refresh">
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} style={{ color: "var(--muted-foreground)" }} />
          </button>
        </div>
      </div>
      <p className="text-xs mb-4" style={{ color: "var(--muted-foreground)", opacity: 0.6 }}>
        Best route is selected based on net output after fees.
      </p>
      <div className="flex flex-col gap-2 overflow-y-auto flex-1 pr-1">
        {okQuotes.map((quote, i) => {
          const id = quote.protocol || quote.provider || `route-${i}`;
          const isBest = bestQuote != null && (quote.protocol || quote.provider) === (bestQuote.protocol || bestQuote.provider);
          return (
            <RouteCard
              key={id}
              quote={quote}
              isBest={isBest}
              isSelected={selectedProtocol === id}
              tokenOutSymbol={tokenOutSymbol}
              decimals={decimals}
              onClick={() => onSelectProtocol(id)}
            />
          );
        })}
      </div>
    </>
  );
}
