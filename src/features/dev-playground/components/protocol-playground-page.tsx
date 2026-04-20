"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Wifi, WifiOff } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { TokenImage } from "@/shared/components/token-image";
import { useWallet } from "@/shared/context/wallet-context";
import { QueryPanel } from "../components/query-panel";
import { CATEGORY_LABELS, PROTOCOL_CONFIGS, type ProtocolConfig } from "../config/protocol-configs";

type HealthStatus = "ok" | "error" | "loading";

interface ProtocolHealth {
  protocol: string;
  status: HealthStatus;
  latencyMs?: number;
  error?: string;
}

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
          <p className="mb-2 px-2 font-semibold text-[11px] text-muted-foreground/60 uppercase tracking-wider">
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
                    "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left font-medium text-sm transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                  )}
                >
                  <TokenImage src={p.icon} alt={p.name} className="h-5 w-5 rounded-sm" />
                  <span className="flex-1 truncate">{p.name}</span>
                  {h && (
                    <span
                      className={cn(
                        "h-2 w-2 shrink-0 rounded-full",
                        h.status === "ok"
                          ? "bg-emerald-400"
                          : h.status === "error"
                            ? "bg-red-400"
                            : "bg-amber-400 animate-pulse"
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

export function ProtocolPlaygroundPage() {
  const { address: walletAddress } = useWallet();
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialProtocol = searchParams.get("protocol") ?? "blend";
  const [selectedProtocol, setSelectedProtocol] = useState(initialProtocol);
  const [health, setHealth] = useState<Map<string, ProtocolHealth>>(new Map());
  const [networkInfo, setNetworkInfo] = useState<string>("");

  const selectProtocol = (id: string) => {
    setSelectedProtocol(id);
    router.replace(`/dev/protocols?protocol=${id}`, { scroll: false });
  };

  useEffect(() => {
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
    <div className="min-h-screen space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-bold text-2xl text-foreground">Protocol Playground</h1>
          <p className="mt-1 text-muted-foreground text-sm">
            Direct SDK queries — no AI, no MCP server needed.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {networkInfo && (
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-medium text-[11px] text-emerald-400 uppercase">
              {networkInfo}
            </span>
          )}
          {walletAddress && (
            <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 font-mono text-[11px] text-primary">
              {walletAddress.slice(0, 8)}…
            </span>
          )}
        </div>
      </div>

      <div className="flex gap-6">
        <ProtocolSidebar selected={selectedProtocol} onSelect={selectProtocol} health={health} />

        <div className="min-w-0 flex-1 space-y-4">
          {config ? (
            <>
              <div className="mb-4 flex items-center gap-3">
                <TokenImage src={config.icon} alt={config.name} className="h-8 w-8 rounded-lg" />
                <div>
                  <h2 className="font-semibold text-foreground text-lg">{config.name}</h2>
                  <p className="text-muted-foreground text-xs">
                    {config.panels.length} endpoint{config.panels.length !== 1 ? "s" : ""} ·{" "}
                    {CATEGORY_LABELS[config.category]}
                  </p>
                </div>
                {health.get(config.id) && (
                  <span
                    className={cn(
                      "ml-2 flex items-center gap-1 text-xs",
                      health.get(config.id)?.status === "ok" ? "text-emerald-400" : "text-red-400"
                    )}
                  >
                    {health.get(config.id)?.status === "ok" ? (
                      <Wifi className="h-3.5 w-3.5" />
                    ) : (
                      <WifiOff className="h-3.5 w-3.5" />
                    )}
                    {health.get(config.id)?.latencyMs != null &&
                      `${health.get(config.id)?.latencyMs}ms`}
                  </span>
                )}
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedProtocol}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="grid grid-cols-1 gap-4 xl:grid-cols-2"
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
            <div className="flex h-64 items-center justify-center text-muted-foreground">
              Select a protocol from the sidebar
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
