"use client";

/**
 * Generic Protocol Playground — /playground/[protocol]
 *
 * Same visual style as blend-v2 playground.
 * Calls SDK-backed routes (/api/protocols/[protocol]/...) and renders JSON results.
 */

import { use, useState, useEffect, useCallback, useRef } from "react";
import { notFound } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";
import { useWallet } from "@/shared/context/wallet-context";
import { TokenImage } from "@/shared/components/token-image";
import { Button } from "@/shared/ui/button";
import { Typography } from "@/shared/ui/typography";
import {
  PROTOCOL_CONFIGS,
  CATEGORY_LABELS,
} from "@/features/dev-playground/config/protocol-configs";

// ── Styles (same as blend-v2) ─────────────────────────────────────────────────
const inputCls =
  "w-full rounded-lg bg-secondary border border-border px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20";
const labelCls = "block text-muted-foreground text-[11px] mb-0.5 font-medium";
const panelCls =
  "rounded-xl border border-border bg-card/80 p-4 space-y-3 flex flex-col";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Field { key: string; label: string; placeholder?: string }

// ── QueryPanel ────────────────────────────────────────────────────────────────
interface QueryPanelProps {
  title: string;
  protocol: string;
  endpoint: string;
  fields: Field[];
  defaults?: Record<string, string>;
  autoFetch?: boolean;
}

function QueryPanel({ title, protocol, endpoint, fields, defaults = {}, autoFetch = false }: QueryPanelProps) {
  const [form, setForm] = useState<Record<string, string>>(defaults);
  const [result, setResult] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autoFetched = useRef(false);

  useEffect(() => {
    setForm((prev) => ({ ...defaults, ...prev }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(defaults)]);

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams(
        Object.fromEntries(Object.entries(form).filter(([, v]) => v.trim()))
      ).toString();
      const url = `/api/protocols/${protocol}/${endpoint}${params ? `?${params}` : ""}`;
      const r = await fetch(url);
      const d = await r.json();
      if (!d.success) setError(d.error ?? "Request failed");
      else setResult(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setLoading(false);
    }
  }, [form, protocol, endpoint]);

  useEffect(() => {
    if (!autoFetch || autoFetched.current) return;
    const allFilled = fields.length === 0 || fields.every((f) => (form[f.key] ?? "").trim());
    if (allFilled) {
      autoFetched.current = true;
      run();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFetch, form]);

  return (
    <div className={panelCls}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wider">{title}</span>
        <span className="text-[10px] text-muted-foreground/60 font-mono">GET /{endpoint}</span>
      </div>

      {fields.map((f) => (
        <div key={f.key}>
          <label className={labelCls}>{f.label}</label>
          <input
            className={inputCls}
            value={form[f.key] ?? ""}
            placeholder={f.placeholder ?? f.label}
            onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
          />
        </div>
      ))}

      <Button
        variant="ghost"
        size="sm"
        className="border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 gap-1.5"
        onClick={run}
        disabled={loading}
      >
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
        Fetch
      </Button>

      {error && <Typography variant="small" className="text-red-400 text-xs bg-red-500/10 rounded p-2">{error}</Typography>}

      {result && (
        <pre className="max-h-[400px] overflow-auto rounded-lg bg-muted/30 p-3 text-xs text-muted-foreground font-mono">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}

// ── Protocol endpoint configs ─────────────────────────────────────────────────

interface EndpointConfig {
  title: string;
  endpoint: string;
  fields: Field[];
  autoFetch?: boolean;
}

const PROTOCOL_ENDPOINTS: Record<string, EndpointConfig[]> = {
  aquarius: [
    { title: "List Pools", endpoint: "pools", fields: [], autoFetch: true },
    { title: "Pool Detail", endpoint: "pool", fields: [{ key: "address", label: "Pool Address", placeholder: "C..." }] },
    { title: "Yield Opportunities", endpoint: "yield", fields: [], autoFetch: true },
    { title: "Swap Quote", endpoint: "quote", fields: [
      { key: "tokenIn", label: "Token In", placeholder: "XLM" },
      { key: "tokenOut", label: "Token Out", placeholder: "USDC" },
      { key: "amount", label: "Amount", placeholder: "10000000" },
    ]},
  ],
  soroswap: [
    { title: "List Pools", endpoint: "pools", fields: [], autoFetch: true },
    { title: "Yield Opportunities", endpoint: "yield", fields: [], autoFetch: true },
    { title: "Swap Quote", endpoint: "quote", fields: [
      { key: "tokenIn", label: "Token In", placeholder: "XLM" },
      { key: "tokenOut", label: "Token Out", placeholder: "USDC" },
      { key: "amount", label: "Amount", placeholder: "10000000" },
    ]},
  ],
  phoenix: [
    { title: "List Pools", endpoint: "pools", fields: [], autoFetch: true },
    { title: "Pool Detail", endpoint: "pool", fields: [{ key: "address", label: "Pool Address", placeholder: "C..." }] },
    { title: "Yield Opportunities", endpoint: "yield", fields: [], autoFetch: true },
    { title: "Swap Quote", endpoint: "quote", fields: [
      { key: "tokenIn", label: "Token In", placeholder: "XLM" },
      { key: "tokenOut", label: "Token Out", placeholder: "USDC" },
      { key: "amount", label: "Amount", placeholder: "10000000" },
    ]},
  ],
  sdex: [
    { title: "Yield Opportunities", endpoint: "yield", fields: [], autoFetch: true },
    { title: "Swap Quote", endpoint: "quote", fields: [
      { key: "tokenIn", label: "Token In", placeholder: "XLM" },
      { key: "tokenOut", label: "Token Out", placeholder: "USDC" },
      { key: "amount", label: "Amount", placeholder: "10000000" },
    ]},
    { title: "Order Book", endpoint: "orderbook", fields: [
      { key: "selling", label: "Selling Asset", placeholder: "XLM" },
      { key: "buying", label: "Buying Asset", placeholder: "USDC" },
      { key: "limit", label: "Depth", placeholder: "20" },
    ]},
  ],
  allbridge: [
    { title: "Yield Opportunities", endpoint: "yield", fields: [], autoFetch: true },
    { title: "Bridge Quote", endpoint: "quote", fields: [
      { key: "tokenIn", label: "Token In", placeholder: "USDC" },
      { key: "tokenOut", label: "Token Out", placeholder: "USDC" },
      { key: "amount", label: "Amount", placeholder: "10000000" },
    ]},
  ],
  defindex: [
    { title: "List Vaults", endpoint: "pools", fields: [], autoFetch: true },
    { title: "Vault Detail", endpoint: "pool", fields: [{ key: "address", label: "Vault Address", placeholder: "C..." }] },
    { title: "Yield Opportunities", endpoint: "yield", fields: [], autoFetch: true },
  ],
  templar: [
    { title: "Yield Opportunities", endpoint: "yield", fields: [], autoFetch: true },
    { title: "Lending Markets", endpoint: "markets", fields: [], autoFetch: true },
    { title: "User Position", endpoint: "positions", fields: [
      { key: "market", label: "Market ID", placeholder: "ixlm-ixlmusdc.v1.tmplr.near" },
    ]},
    { title: "Swap Quote", endpoint: "quote", fields: [
      { key: "tokenIn", label: "Token In", placeholder: "XLM" },
      { key: "tokenOut", label: "Token Out", placeholder: "USDC" },
      { key: "amount", label: "Amount", placeholder: "10000000" },
    ]},
  ],
};

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ProtocolPlaygroundPage({
  params,
}: {
  params: Promise<{ protocol: string }>;
}) {
  const { protocol: protocolId } = use(params);
  const config = PROTOCOL_CONFIGS.find((p) => p.id === protocolId);
  const endpoints = PROTOCOL_ENDPOINTS[protocolId];

  if (!config || !endpoints) notFound();

  const { address: walletAddress } = useWallet();
  const [networkInfo, setNetworkInfo] = useState("");

  useEffect(() => {
    fetch("/api/protocols/health")
      .then((r) => r.json())
      .then((d) => { if (d.success) setNetworkInfo(d.network ?? ""); })
      .catch(() => {});
  }, []);

  // Build defaults with wallet address for position queries
  const buildDefaults = (fields: Field[]) => {
    const d: Record<string, string> = {};
    for (const f of fields) {
      if (f.key === "user" && walletAddress) d[f.key] = walletAddress;
    }
    return d;
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <TokenImage src={config.icon} alt={config.name} className="h-8 w-8 rounded-lg" />
          <div>
            <Typography as="h1" variant="h3" weight="bold" className="text-foreground">{config.name} Playground</Typography>
            <Typography variant="p" className="text-muted-foreground text-sm mt-1">
              Direct SDK queries · {CATEGORY_LABELS[config.category]} · {endpoints.length} endpoints
            </Typography>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {networkInfo && (
            <span className="text-[11px] px-2 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-medium uppercase">
              {networkInfo}
            </span>
          )}
          {walletAddress && (
            <span className="text-[11px] px-2 py-0.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 font-mono">
              {walletAddress.slice(0, 8)}…
            </span>
          )}
        </div>
      </div>

      {/* Query panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {endpoints.map((ep) => (
          <QueryPanel
            key={`${protocolId}-${ep.endpoint}`}
            title={ep.title}
            protocol={protocolId}
            endpoint={ep.endpoint}
            fields={ep.fields}
            defaults={buildDefaults(ep.fields)}
            autoFetch={ep.autoFetch}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="border-t border-border pt-4 text-center">
        <Typography variant="small" className="text-muted-foreground/40 text-xs">
          {config.name} Playground · SDK-backed queries via{" "}
          <span className="font-mono text-muted-foreground/60">/api/protocols/{protocolId}/…</span>
        </Typography>
      </div>
    </div>
  );
}
