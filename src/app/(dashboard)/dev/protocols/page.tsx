"use client";

import { Suspense, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wifi, WifiOff } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { useWallet } from "@/shared/context/wallet-context";
import { TokenImage } from "@/shared/components/token-image";
import { cn } from "@/lib/utils";
import {
  PROTOCOL_CONFIGS,
  CATEGORY_LABELS,
  type ProtocolConfig,
} from "@/features/dev-playground/config/protocol-configs";
import { QueryPanel } from "@/features/dev-playground/components/query-panel";

// ─── Health status ──────────────────────────────────────────────

type HealthStatus = "ok" | "error" | "loading";

interface ProtocolHealth {
  protocol: string;
  status: HealthStatus;
  latencyMs?: number;
  error?: string;
}

// ─── Sidebar ────────────────────────────────────────────────────

function ProtocolSidebar({
  selected,
  onSelect,
  health,
}: {
  selected: string;
  onSelect: (id: string) => void;
  health: Map<string, ProtocolHealth>;
}) {
  const grouped = new Map<string, ProtocolConfig[]>();
  for (const p of PROTOCOL_CONFIGS) {
    const existing = grouped.get(p.category);
    if (existing) existing.push(p);
    else grouped.set(p.category, [p]);
  }

  return (
    <div className="w-56 shrink-0 space-y-5">
      {Array.from(grouped.entries()).map(([category, protocols]) => (
        <div key={category}>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-2 px-2">
            {CATEGORY_LABELS[category] ?? category}
          </p>
          <div className="space-y-0.5">
            {protocols.map((p) => {
              const isActive = selected === p.id;
              const h = health.get(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onSelect(p.id)}
                  className={cn(
                    "w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors text-left",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                  )}
                >
                  <TokenImage src={p.icon} alt={p.name} className="h-5 w-5 rounded-sm" />
                  <span className="flex-1 truncate">{p.name}</span>
                  {h && (
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full shrink-0",
                        h.status === "ok" ? "bg-emerald-400" : h.status === "error" ? "bg-red-400" : "bg-amber-400 animate-pulse",
                      )}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Inner page content (uses searchParams) ──────────────────

function ProtocolPlaygroundContent() {
  const { address: walletAddress } = useWallet();
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialProtocol = searchParams.get("protocol") ?? "blend";
  const [selectedProtocol, setSelectedProtocol] = useState(initialProtocol);
  const [health, setHealth] = useState<Map<string, ProtocolHealth>>(new Map());
  const [networkInfo, setNetworkInfo] = useState<string>("");

  // Update URL when protocol changes
  const selectProtocol = (id: string) => {
    setSelectedProtocol(id);
    router.replace(`/dev/protocols?protocol=${id}`, { scroll: false });
  };

  // Load health status on mount
  useEffect(() => {
    // Set all to loading initially
    const loading = new Map<string, ProtocolHealth>();
    for (const p of PROTOCOL_CONFIGS) {
      loading.set(p.id, { protocol: p.id, status: "loading" });
    }
    setHealth(loading);

    fetch("/api/protocols/health")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setNetworkInfo(d.network ?? "");
          const map = new Map<string, ProtocolHealth>();
          for (const h of d.health as ProtocolHealth[]) {
            map.set(h.protocol, h);
          }
          setHealth(map);
        }
      })
      .catch(() => {});
  }, []);

  const config = PROTOCOL_CONFIGS.find((p) => p.id === selectedProtocol);

  return (
    <div className="min-h-screen p-6 space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Protocol Playground</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Direct SDK queries — no AI, no MCP server needed.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {networkInfo && (
            <span className="text-[11px] px-2 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-medium uppercase">
              {networkInfo}
            </span>
          )}
          {walletAddress && (
            <span className="text-[11px] px-2 py-0.5 rounded-full border border-primary/30 bg-primary/10 text-primary font-mono">
              {walletAddress.slice(0, 8)}…
            </span>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex gap-6">
        {/* Sidebar */}
        <ProtocolSidebar
          selected={selectedProtocol}
          onSelect={selectProtocol}
          health={health}
        />

        {/* Main panels */}
        <div className="flex-1 min-w-0 space-y-4">
          {config ? (
            <>
              {/* Protocol header */}
              <div className="flex items-center gap-3 mb-4">
                <TokenImage src={config.icon} alt={config.name} className="h-8 w-8 rounded-lg" />
                <div>
                  <h2 className="text-lg font-semibold text-foreground">{config.name}</h2>
                  <p className="text-xs text-muted-foreground">
                    {config.panels.length} endpoint{config.panels.length !== 1 ? "s" : ""} ·{" "}
                    {CATEGORY_LABELS[config.category]}
                  </p>
                </div>
                {health.get(config.id) && (
                  <span
                    className={cn(
                      "ml-2 flex items-center gap-1 text-xs",
                      health.get(config.id)!.status === "ok" ? "text-emerald-400" : "text-red-400",
                    )}
                  >
                    {health.get(config.id)!.status === "ok" ? (
                      <Wifi className="h-3.5 w-3.5" />
                    ) : (
                      <WifiOff className="h-3.5 w-3.5" />
                    )}
                    {health.get(config.id)!.latencyMs != null && `${health.get(config.id)!.latencyMs}ms`}
                  </span>
                )}
              </div>

              {/* Query panels */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedProtocol}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="grid grid-cols-1 xl:grid-cols-2 gap-4"
                >
                  {config.panels.map((panel) => (
                    <QueryPanel
                      key={`${config.id}-${panel.id}`}
                      protocol={config.id}
                      panel={panel}
                      walletAddress={walletAddress ?? undefined}
                    />
                  ))}
                </motion.div>
              </AnimatePresence>
            </>
          ) : (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              Select a protocol from the sidebar
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Page wrapper with Suspense ──────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="min-h-screen p-6 space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="h-8 w-64 bg-muted rounded animate-pulse mb-2" />
          <div className="h-4 w-96 bg-muted rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export default function ProtocolPlaygroundPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <ProtocolPlaygroundContent />
    </Suspense>
  );
}
