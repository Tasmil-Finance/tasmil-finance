"use client";

/**
 * Blend v2 Playground — /dev/blend-v2
 *
 * Direct HTTP playground for all Blend v2 operations and queries.
 * Calls mcp-stellar REST endpoints (/blend-v2/query/... and /blend-v2/op/...)
 * and renders results using the SAME card components as the AI chat —
 * Shared protocol cards for queries, BlendTxCard for operations.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { Loader2, RefreshCw, Zap, ChevronDown, AlertCircle } from "lucide-react";
import { StreamContext, type StreamContextType } from "@/features/chat/providers/stream-provider";
// Shared protocol cards (single source of truth for both playground and chat)
import { BlendPoolsCard, BlendPoolDetailCard, BlendReserveCard, BlendPositionsCard, BlendTxCard, BlendBackstopInfoCard, BlendBackstopBalanceCard } from "@/features/protocols/cards/blend";
import { normalizePoolsFromSdk, normalizePoolFromSdk, normalizeReserveFromSdk, normalizePositionsFromSdk, normalizeBackstopFromSdk, normalizeBackstopBalanceFromSdk } from "@/features/protocols/adapters/from-sdk";
import { resolveSymbol } from "@/features/protocols/lib/formatting";
import { useTrustlineCheck } from "@/features/protocols/hooks/use-trustline-check";
import { useWallet } from "@/shared/context/wallet-context";
import { Button } from "@/shared/ui/button";
import { Typography } from "@/shared/ui/typography";

// ── Mock stream so BlendExecuteCard's useStreamContext() doesn't throw ────────
const MOCK_STREAM = {
  messages: [],
  values: {},
  isLoading: false,
  error: undefined,
  interrupt: undefined,
  submit: async () => {},
  stop: () => {},
  getMessagesMetadata: () => undefined,
} as unknown as StreamContextType;

const MCP_URL = process.env["NEXT_PUBLIC_MCP_STELLAR_URL"] ?? "http://localhost:3009";
// SDK-backed routes (no MCP server needed)
const SDK_QUERY_URL = "/api/blend";
const SDK_OP_URL = "/api/blend/op";

// ── Styles ────────────────────────────────────────────────────────────────────
const inputCls =
  "w-full rounded-lg bg-secondary border border-border px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20";
const labelCls = "block text-muted-foreground text-[11px] mb-0.5 font-medium";
const panelCls =
  "rounded-xl border border-border bg-card/80 p-4 space-y-3 flex flex-col";

// ── Types ──────────────────────────────────────────────────────────────────────
interface PoolReserve { symbol: string; asset: string }
interface KnownPool { name: string; address: string; reserves?: PoolReserve[] }
interface Field { key: string; label: string; placeholder?: string; /** If true, user enters human amount (e.g. 1.5) and it's converted to stroops (7 decimals) before sending to API */ isAmount?: boolean }

// ── QueryPanel ────────────────────────────────────────────────────────────────
// Thin form wrapper: collects params, fetches, passes result to StellarInfoDispatcher.
interface QueryPanelProps {
  title: string;
  endpoint: string;
  infoType: string;
  fields: Field[];
  defaults?: Record<string, string>;
  /** Base URL for query — defaults to SDK route (/api/blend), falls back to MCP for unsupported endpoints */
  baseUrl?: string;
  /** Extra CSS classes for the panel container (e.g. col-span for grid) */
  className?: string;
  /** Auto-fetch on mount (no manual click needed) */
  autoFetch?: boolean;
  /** Custom renderer — replaces StellarInfoDispatcher for portfolio-style cards */
  renderResult?: (data: any) => React.ReactNode;
}

function QueryPanel({ title, endpoint, infoType: _infoType, fields, defaults = {}, baseUrl = SDK_QUERY_URL, className, autoFetch = false, renderResult }: QueryPanelProps) {
  const [form, setForm] = useState<Record<string, string>>(defaults);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autoFetched = useRef(false);

  useEffect(() => {
    setForm((prev) => ({ ...defaults, ...prev }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(defaults)]);

  const isSdk = baseUrl === SDK_QUERY_URL;

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams(
        Object.fromEntries(Object.entries(form).filter(([, v]) => v.trim()))
      ).toString();
      const url = isSdk
        ? `${baseUrl}/${endpoint}${params ? `?${params}` : ""}`
        : `${baseUrl}/blend-v2/query/${endpoint}${params ? `?${params}` : ""}`;
      const r = await fetch(url);
      const d = await r.json();
      if (!d.success) setError(d.error ?? "Request failed");
      else setResult(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : isSdk ? "Network error" : "Network error — is mcp-stellar running?");
    } finally {
      setLoading(false);
    }
  }, [form, endpoint, baseUrl, isSdk]);

  // Auto-fetch on mount if enabled and all required fields are filled
  useEffect(() => {
    if (!autoFetch || autoFetched.current) return;
    const allFieldsFilled = fields.length === 0 || fields.every((f) => (form[f.key] ?? "").trim());
    if (allFieldsFilled) {
      autoFetched.current = true;
      run();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFetch, form]);

  return (
    <div className={`${panelCls} ${className ?? ""}`}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wider">{title}</span>
        <span className="text-[10px] text-muted-foreground/60 font-mono">{isSdk ? "SDK" : "MCP"} GET /{endpoint}</span>
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

      {/* Render result — custom portfolio-style card or fallback to raw JSON */}
      {result && (
        <div className="mt-1">
          {renderResult ? renderResult(result) : (
            <pre className="max-h-[300px] overflow-auto rounded-lg bg-muted/30 p-3 text-xs text-muted-foreground font-mono">
              {JSON.stringify(result, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

// ── OpPanel ───────────────────────────────────────────────────────────────────
// Thin form wrapper: collects params, posts to op endpoint, passes result to
// StellarOperationDispatcher — same as when the AI builds the TX.
/** Operations that receive a new asset and may need a trustline */
const TRUSTLINE_OPS = new Set(["borrow"]);

interface OpPanelProps {
  title: string;
  endpoint: string;
  operation: string;
  fields: Field[];
  defaults?: Record<string, string>;
}

function OpPanel({ title, endpoint, operation, fields, defaults = {} }: OpPanelProps) {
  const { address } = useWallet();
  const [form, setForm] = useState<Record<string, string>>({ ...defaults, from: address ?? "" });

  // Trustline check for borrow operations
  const needsTrustlineOp = TRUSTLINE_OPS.has(endpoint);
  const trustline = useTrustlineCheck(
    needsTrustlineOp ? (form.from || address || undefined) : undefined,
    needsTrustlineOp ? (form.asset || undefined) : undefined,
    needsTrustlineOp ? resolveSymbol(form.asset ?? "") : undefined,
  );
  const trustlineMissing = needsTrustlineOp && trustline.needsTrustline && !trustline.hasTrustline && !trustline.checking;
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep from synced with wallet
  useEffect(() => {
    if (address) setForm((prev) => ({ ...prev, from: address }));
  }, [address]);

  // Keep pool and asset synced with defaults (pool selector, dynamic asset)
  useEffect(() => {
    setForm((prev) => {
      const next = { ...prev };
      for (const [k, v] of Object.entries(defaults)) {
        // Only overwrite if the field hasn't been manually edited
        // OR if it's pool/from/asset which should auto-update
        if (k === "pool" || k === "from" || !prev[k]) {
          next[k] = v;
        }
      }
      if (address) next.from = address;
      return next;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(defaults), address]);

  /** Convert human-readable amounts to stroops (7 decimals) before sending to API */
  const toStroops = (v: string): string => {
    const n = Number.parseFloat(v);
    if (!Number.isFinite(n)) return v;
    return Math.round(n * 1e7).toString();
  };

  const build = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      // Convert amount fields from human-readable to stroops
      const amountKeys = new Set(fields.filter((f) => f.isAmount).map((f) => f.key));
      const payload = { ...form };
      for (const key of amountKeys) {
        if (payload[key]) payload[key] = toStroops(payload[key]);
      }

      const r = await fetch(`${SDK_OP_URL}/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = await r.json();
      if (!d.success) setError(d.error ?? "Simulation failed");
      else setResult(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error — is mcp-stellar running?");
    } finally {
      setLoading(false);
    }
  }, [form, endpoint, fields]);

  return (
    <div className={panelCls}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">{title}</span>
        <span className="text-[10px] text-muted-foreground/60 font-mono">POST /op/{endpoint}</span>
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

      {/* Trustline warning */}
      {trustlineMissing && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 space-y-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
            <span className="text-xs font-medium text-amber-400">Trustline missing</span>
          </div>
          <div className="flex items-center justify-between pl-6">
            <div>
              <p className="text-xs text-foreground font-medium">{resolveSymbol(form.asset ?? "")}</p>
              <p className="text-[10px] text-muted-foreground">Trustline required to receive</p>
            </div>
            <button
              type="button"
              onClick={() => trustline.addTrustline()}
              disabled={trustline.adding}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold bg-gradient-to-b from-[#B5EAFF] to-[#00BFFF] text-black hover:from-[#C5F0FF] hover:to-[#1CCFFF] transition-all active:scale-[0.98] disabled:opacity-40 flex items-center gap-1"
            >
              {trustline.adding ? <><Loader2 className="h-3 w-3 animate-spin" /> Adding...</> : "Add +"}
            </button>
          </div>
        </div>
      )}

      <Button
        variant="ghost"
        size="sm"
        className={`border gap-1.5 ${trustlineMissing
          ? "border-border bg-muted text-muted-foreground cursor-not-allowed"
          : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
        }`}
        onClick={build}
        disabled={loading || trustlineMissing}
      >
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
        {trustlineMissing ? "Add trustline first" : "Build TX"}
      </Button>

      {error && <Typography variant="small" className="text-red-400 text-xs bg-red-500/10 rounded p-2">{error}</Typography>}

      {/* Transaction overview card with before/after position changes */}
      {result?.xdr && (
        <div className="mt-1">
          <BlendTxCard
            tx={{
              operation: String(result.operation ?? operation),
              xdr: String(result.xdr ?? ""),
              estimatedFee: result.estimatedFee ? String(result.estimatedFee) : undefined,
              asset: form.asset ?? (result.asset ? String(result.asset) : undefined),
              symbol: form.asset ? resolveSymbol(form.asset) : undefined,
              amount: result.amount ? String(result.amount) : (result.lpAmount ? String(result.lpAmount) : undefined),
              pool: form.pool ?? (result.pool ? String(result.pool) : undefined),
              from: form.from ?? (result.from ? String(result.from) : undefined),
              context: result.context,
            }}
            mode="playground"
          />
        </div>
      )}
    </div>
  );
}

// ── Pool selector ──────────────────────────────────────────────────────────────
function PoolSelector({
  pools,
  selected,
  onSelect,
}: {
  pools: KnownPool[];
  selected: string;
  onSelect: (addr: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-muted-foreground text-xs font-medium whitespace-nowrap">Active Pool:</label>
      <div className="relative">
        <select
          className="appearance-none bg-secondary border border-border rounded px-3 py-1.5 pr-7 text-sm text-foreground focus:outline-none focus:border-primary/50 cursor-pointer"
          value={selected}
          onChange={(e) => onSelect(e.target.value)}
        >
          {pools.map((p) => (
            <option key={p.address} value={p.address}>
              {p.name} — {p.address.slice(0, 8)}…
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
      </div>
      <span className="text-[10px] text-muted-foreground/60 font-mono hidden sm:block">{selected}</span>
    </div>
  );
}

// ── Main playground ───────────────────────────────────────────────────────────
export default function BlendV2PlaygroundPage() {
  const { address: walletAddress } = useWallet();
  const [tab, setTab] = useState<"queries" | "operations">("queries");
  const [pools, setPools] = useState<KnownPool[]>([]);
  const [selectedPool, setSelectedPool] = useState("");
  const [networkInfo, setNetworkInfo] = useState<string>("");
  // Comet LP pool tokens — separate from lending pool reserves (testnet uses different USDC)
  const [cometUsdc, setCometUsdc] = useState("");
  const [_cometBlnd, setCometBlnd] = useState("");

  useEffect(() => {
    fetch(`${SDK_QUERY_URL}/pools`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.pools?.length) {
          const mapped: KnownPool[] = d.pools.map((p: any) => ({
            name: p.name,
            address: p.address ?? p.poolAddress,
            reserves: (p.reserves ?? []).map((r: any) => ({ symbol: r.symbol ?? "?", asset: r.asset ?? r.assetAddress ?? "" })),
          }));
          setPools(mapped);
          setSelectedPool(mapped[0]!.address);
          setNetworkInfo(d.network ?? "");
          // Comet LP pool uses Blend-config USDC/BLND (different from lending pool reserves on testnet)
          if (d.usdcToken) setCometUsdc(String(d.usdcToken));
          if (d.blndToken) setCometBlnd(String(d.blndToken));
        }
      })
      .catch(() => {
        setPools([{ name: "TestnetV2 Pool", address: "CCEBVDYM32YNYCVNRXQKDFFPISJJCV557CDZEIRBEE4NCV4KHPQ44HGF" }]);
        setSelectedPool("CCEBVDYM32YNYCVNRXQKDFFPISJJCV557CDZEIRBEE4NCV4KHPQ44HGF");
      });
  }, []);

  const pool = selectedPool ?? "";
  const poolDefaults: Record<string, string> = { pool };
  const userDefaults: Record<string, string> = { pool, user: walletAddress ?? "" };
  const fromDefaults: Record<string, string> = { pool, from: walletAddress ?? "" };

  // Derive asset defaults from selected pool's reserves
  const selectedPoolData = pools.find((p) => p.address === selectedPool);
  const poolReserves = selectedPoolData?.reserves ?? [];
  const xlmReserve = poolReserves.find((r) => r.symbol === "XLM");
  // Prefer USDC for borrow/repay defaults, fallback to first non-XLM reserve
  const usdcReserve = poolReserves.find((r) => r.symbol === "USDC") ?? poolReserves.find((r) => r.symbol !== "XLM");
  const XLM_SAC = xlmReserve?.asset ?? "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC";
  const BLEND_USDC = usdcReserve?.asset ?? "CAQCFVLOBK5GIULPNZRGATJJMIZL5BSP7X5YJVMGCPTUEPFM4AVSRCJU";

  return (
    <StreamContext.Provider value={MOCK_STREAM}>
      <div className="min-h-screen bg-background text-foreground p-6 space-y-6">

        {/* ── Header ── */}
        <div className="space-y-3">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <Typography as="h1" variant="h3" weight="bold" className="text-foreground">Blend v2 Playground</Typography>
              <Typography variant="p" className="text-muted-foreground text-sm mt-1">
                Direct SDK — no AI, no MCP server needed for queries. Operations still use MCP.{" "}
                <span className="font-mono text-cyan-400 text-xs">/api/blend/…</span>
              </Typography>
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

          {pools.length > 0 && (
            <PoolSelector pools={pools} selected={selectedPool} onSelect={setSelectedPool} />
          )}
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-1 bg-card rounded-lg p-1 w-fit border border-border">
          {(["queries", "operations"] as const).map((t) => (
            <Button
              key={t}
              variant="ghost"
              onClick={() => setTab(t)}
              className={`px-5 py-1.5 rounded-md text-sm font-medium transition-colors capitalize h-auto ${
                tab === t ? "bg-accent text-foreground shadow hover:bg-accent" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "queries" ? "Queries (7)" : "Operations (10)"}
            </Button>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════════
            QUERY TAB — all results rendered by StellarInfoDispatcher
        ══════════════════════════════════════════════════════ */}
        {tab === "queries" && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

            {/* 1. List Pools */}
            <QueryPanel
              title="List Pools"
              endpoint="pools"
              infoType="blend_pool_info"
              fields={[]}
              autoFetch
              renderResult={(d) => <BlendPoolsCard pools={normalizePoolsFromSdk(d)} mode="playground" />}
            />

            {/* 2. Pool Info */}
            <QueryPanel
              title="Pool Info"
              endpoint="pool-info"
              infoType="blend_pool_info"
              fields={[{ key: "pool", label: "Pool Address", placeholder: "C..." }]}
              defaults={poolDefaults}
              autoFetch
              renderResult={(d) => {
                const pool = normalizePoolFromSdk(d);
                return pool ? <BlendPoolDetailCard pool={pool} mode="playground" /> : null;
              }}
            />

            {/* 3. Assets List */}
            <QueryPanel
              title="Assets List"
              endpoint="assets"
              infoType="blend_pool_info"
              fields={[{ key: "pool", label: "Pool Address", placeholder: "C..." }]}
              defaults={poolDefaults}
              autoFetch
              renderResult={(d) => {
                const pool = normalizePoolFromSdk(d);
                return pool ? <BlendPoolDetailCard pool={pool} mode="playground" /> : null;
              }}
            />

            {/* 4. Reserve Detail */}
            <QueryPanel
              title="Reserve Detail"
              endpoint="reserve"
              infoType="blend_reserve_info"
              fields={[
                { key: "pool",  label: "Pool Address",  placeholder: "C..." },
                { key: "asset", label: "Asset Contract", placeholder: "C..." },
              ]}
              defaults={{ ...poolDefaults, asset: XLM_SAC }}
              autoFetch
              renderResult={(d) => <BlendReserveCard reserve={normalizeReserveFromSdk(d)} mode="playground" />}
            />

            {/* 5. User Positions */}
            <QueryPanel
              title="User Positions"
              endpoint="positions"
              infoType="blend_user_position"
              fields={[
                { key: "pool", label: "Pool Address", placeholder: "C..." },
                { key: "user", label: "User Address", placeholder: "G..." },
              ]}
              defaults={userDefaults}
              autoFetch
              renderResult={(d) => {
                const data = normalizePositionsFromSdk(d);
                return data ? <BlendPositionsCard data={data} mode="playground" /> : null;
              }}
            />

            {/* 6. Backstop Details (MCP only) */}
            <QueryPanel
              title="Backstop Details"
              endpoint="backstop"
              infoType="blend_backstop_info"
              fields={[{ key: "pool", label: "Pool Address", placeholder: "C..." }]}
              defaults={poolDefaults}
              baseUrl={MCP_URL}
              autoFetch
              renderResult={(d) => {
                const backstop = normalizeBackstopFromSdk(d.data ?? d);
                if (!backstop) return null;
                // Enrich with pool name from known pools
                const poolName = pools.find((p) => p.address === backstop.poolAddress)?.name;
                if (poolName) backstop.poolName = poolName;
                return <BlendBackstopInfoCard backstop={backstop} mode="playground" />;
              }}
            />

            {/* 7. Q4W Balance (MCP only) */}
            <QueryPanel
              title="Q4W Balance"
              endpoint="q4w"
              infoType="blend_backstop_balance"
              fields={[
                { key: "pool", label: "Pool Address", placeholder: "C..." },
                { key: "user", label: "User Address", placeholder: "G..." },
              ]}
              defaults={userDefaults}
              baseUrl={MCP_URL}
              autoFetch
              renderResult={(d) => {
                const balance = normalizeBackstopBalanceFromSdk(d.data ?? d);
                if (!balance) return null;
                const poolName = pools.find((p) => p.address === balance.pool)?.name;
                if (poolName) balance.poolName = poolName;
                return <BlendBackstopBalanceCard data={balance} mode="playground" />;
              }}
            />
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            OPERATIONS TAB — all results rendered by StellarOperationDispatcher
        ══════════════════════════════════════════════════════ */}
        {tab === "operations" && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

            {/* 1. Deposit → blend_supply → BlendExecuteCard */}
            <OpPanel
              title="Deposit (Supply Collateral)"
              endpoint="deposit"
              operation="blend_supply"
              fields={[
                { key: "pool",   label: "Pool Address",  placeholder: "C..." },
                { key: "asset",  label: "Asset Contract", placeholder: "C..." },
                { key: "amount", label: "Amount", placeholder: "1.0", isAmount: true },
                { key: "from",   label: "From Address",  placeholder: "G..." },
              ]}
              defaults={{ ...fromDefaults, asset: XLM_SAC, amount: "1" }}
            />

            {/* 2. Withdraw → blend_withdraw → BlendExecuteCard */}
            <OpPanel
              title="Withdraw"
              endpoint="withdraw"
              operation="blend_withdraw"
              fields={[
                { key: "pool",   label: "Pool Address",  placeholder: "C..." },
                { key: "asset",  label: "Asset Contract", placeholder: "C..." },
                { key: "amount", label: "Amount", placeholder: "0.5", isAmount: true },
                { key: "from",   label: "From Address",  placeholder: "G..." },
              ]}
              defaults={{ ...fromDefaults, asset: XLM_SAC, amount: "0.5" }}
            />

            {/* 3. Borrow → blend_borrow → BlendExecuteCard */}
            <OpPanel
              title="Borrow"
              endpoint="borrow"
              operation="blend_borrow"
              fields={[
                { key: "pool",   label: "Pool Address",  placeholder: "C..." },
                { key: "asset",  label: "Asset Contract", placeholder: "C..." },
                { key: "amount", label: "Amount", placeholder: "0.1", isAmount: true },
                { key: "from",   label: "From Address",  placeholder: "G..." },
              ]}
              defaults={{ ...fromDefaults, asset: BLEND_USDC, amount: "0.1" }}
            />

            {/* 4. Repay → blend_repay → BlendExecuteCard */}
            <OpPanel
              title="Repay"
              endpoint="repay"
              operation="blend_repay"
              fields={[
                { key: "pool",   label: "Pool Address",  placeholder: "C..." },
                { key: "asset",  label: "Asset Contract", placeholder: "C..." },
                { key: "amount", label: "Amount", placeholder: "0.05", isAmount: true },
                { key: "from",   label: "From Address",  placeholder: "G..." },
              ]}
              defaults={{ ...fromDefaults, asset: BLEND_USDC, amount: "0.05" }}
            />

            {/* 5. Enable/Disable Collateral → blend_toggle_collateral → BlendExecuteCard */}
            <OpPanel
              title="Toggle Collateral"
              endpoint="toggle-collateral"
              operation="blend_toggle_collateral"
              fields={[
                { key: "pool",   label: "Pool Address",  placeholder: "C..." },
                { key: "asset",  label: "Asset Contract", placeholder: "C..." },
                { key: "amount", label: "Amount", placeholder: "0.5", isAmount: true },
                { key: "from",   label: "From Address",  placeholder: "G..." },
                { key: "enable", label: "Enable? (true/false)", placeholder: "true" },
              ]}
              defaults={{ ...fromDefaults, asset: XLM_SAC, amount: "0.5", enable: "true" }}
            />

            {/* 6. Join Pool (Comet LP) — uses Blend-config USDC/BLND (different from lending pool reserves on testnet) */}
            <OpPanel
              title="Join Pool (Comet LP)"
              endpoint="join-pool"
              operation="backstop_deposit"
              fields={[
                { key: "asset",    label: `Token In (USDC or BLND)`, placeholder: "C..." },
                { key: "amount",   label: "Amount", placeholder: "1.0", isAmount: true },
                { key: "minLpOut", label: "Min LP Out (0 = no slippage)", placeholder: "0", isAmount: true },
                { key: "from",     label: "From Address",  placeholder: "G..." },
              ]}
              defaults={{ asset: cometUsdc || BLEND_USDC, amount: "1", minLpOut: "0", from: walletAddress ?? "" }}
            />

            {/* 7. Exit Pool (Comet LP) → backstop_withdraw → BlendExecuteCard */}
            <OpPanel
              title="Exit Pool (Comet LP)"
              endpoint="exit-pool"
              operation="backstop_withdraw"
              fields={[
                { key: "lpAmount",   label: "LP Amount", placeholder: "0.1", isAmount: true },
                { key: "minBlndOut", label: "Min BLND Out (0 = no slippage)", placeholder: "0", isAmount: true },
                { key: "minUsdcOut", label: "Min USDC Out (0 = no slippage)", placeholder: "0", isAmount: true },
                { key: "from",       label: "From Address", placeholder: "G..." },
              ]}
              defaults={{ lpAmount: "0.1", minBlndOut: "0", minUsdcOut: "0", from: walletAddress ?? "" }}
            />

            {/* 8. Backstop Deposit → backstop_deposit → BlendExecuteCard */}
            <OpPanel
              title="Backstop Deposit (LP Tokens)"
              endpoint="backstop-deposit"
              operation="backstop_deposit"
              fields={[
                { key: "pool",   label: "Pool Address",  placeholder: "C..." },
                { key: "amount", label: "LP Amount", placeholder: "0.1", isAmount: true },
                { key: "from",   label: "From Address",  placeholder: "G..." },
              ]}
              defaults={{ ...fromDefaults, amount: "0.1" }}
            />

            {/* 9. Queue Withdrawal → backstop_queue → BlendExecuteCard */}
            <OpPanel
              title="Queue Withdrawal (21-day)"
              endpoint="queue-withdrawal"
              operation="backstop_queue"
              fields={[
                { key: "pool",   label: "Pool Address",  placeholder: "C..." },
                { key: "amount", label: "Shares", placeholder: "0.05", isAmount: true },
                { key: "from",   label: "From Address",  placeholder: "G..." },
              ]}
              defaults={{ ...fromDefaults, amount: "0.05" }}
            />

            {/* 10. Dequeue Withdrawal → backstop_dequeue → BlendExecuteCard */}
            <OpPanel
              title="Dequeue Withdrawal (Cancel)"
              endpoint="dequeue-withdrawal"
              operation="backstop_dequeue"
              fields={[
                { key: "pool",   label: "Pool Address",  placeholder: "C..." },
                { key: "amount", label: "Shares", placeholder: "0.05", isAmount: true },
                { key: "from",   label: "From Address",  placeholder: "G..." },
              ]}
              defaults={{ ...fromDefaults, amount: "0.05" }}
            />
          </div>
        )}

        {/* ── Footer ── */}
        <div className="border-t border-border pt-4 text-center">
          <Typography variant="small" className="text-muted-foreground/40 text-xs">
            Blend v2 Playground · mcp-stellar{" "}
            <span className="font-mono text-muted-foreground/60">{MCP_URL}</span>
            {" · "}Operations build XDR only — wallet signing required to submit on-chain
          </Typography>
        </div>
      </div>
    </StreamContext.Provider>
  );
}
