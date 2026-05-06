"use client";

/**
 * Aquarius AMM Playground — /playground/aquarius
 *
 * Full-featured playground covering all 23 Aquarius agent capabilities:
 * 6 Operations + 17 Queries.
 *
 * Calls /api/aquarius/* endpoints (SDK-backed) and /api/aquarius/op/* (MCP-backed).
 * Renders results using shared Aquarius card components.
 */

import { ChevronDown, Loader2, RefreshCw, Zap } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { SwapExecuteCard } from "@/features/chat/actions/components/stellar/swap-execute-card";
import { StreamContext, type StreamContextType } from "@/features/chat/providers/stream-provider";
import {
  normalizeAquaPoolFromSdk,
  normalizeAquaPoolsFromSdk,
  normalizeAquaPositionsFromSdk,
  normalizeAquaQuoteFromSdk,
  normalizeAquaYieldFromSdk,
} from "@/features/protocols/adapters/aquarius-from-sdk";
import {
  AquaLockInfoCard,
  AquaPoolDetailCard,
  AquaPoolsCard,
  AquaPositionsCard,
  AquaQuoteCard,
  AquaRewardsCard,
  AquaTxCard,
} from "@/features/protocols/cards/aquarius";
import { useMultiTrustlineCheck } from "@/features/protocols/hooks/use-multi-trustline-check";
import { TokenImage } from "@/shared/components/token-image";
import { useWallet } from "@/shared/context/wallet-context";
import { Button } from "@/shared/ui/button";
import { Typography } from "@/shared/ui/typography";

// ── Mock stream ─────────────────────────────────────────────────
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

const SDK_QUERY_URL = "/api/aquarius";
const SDK_OP_URL = "/api/aquarius/op";

// ── Styles ──────────────────────────────────────────────────────
const inputCls =
  "w-full rounded-lg bg-secondary border border-border px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20";
const labelCls = "block text-muted-foreground text-[11px] mb-0.5 font-medium";
const panelCls = "rounded-xl border border-border bg-card/80 p-4 space-y-3 flex flex-col";
const selectCls =
  "w-full rounded-lg bg-secondary border border-border px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-primary/50 cursor-pointer";

// ── Types ───────────────────────────────────────────────────────
interface KnownPool {
  label: string;
  address: string;
  tokens?: string[];
}
interface Field {
  key: string;
  label: string;
  placeholder?: string;
  type?: "select";
  options?: { value: string; label: string }[];
}

// ── QueryPanel ──────────────────────────────────────────────────
interface QueryPanelProps {
  title: string;
  endpoint: string;
  fields: Field[];
  defaults?: Record<string, string>;
  autoFetch?: boolean;
  renderResult?: (data: any) => React.ReactNode;
  badge?: string;
}

function QueryPanel({
  title,
  endpoint,
  fields,
  defaults = {},
  autoFetch = false,
  renderResult,
  badge,
}: QueryPanelProps) {
  const [form, setForm] = useState<Record<string, string>>(defaults);
  const [result, setResult] = useState<any>(null);
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
      const url = `${SDK_QUERY_URL}/${endpoint}${params ? `?${params}` : ""}`;
      const r = await fetch(url);
      const d = await r.json();
      if (!d.success) setError(d.error ?? "Request failed");
      else setResult(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setLoading(false);
    }
  }, [form, endpoint]);

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
    <div className={panelCls}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wider">
            {title}
          </span>
          {badge && (
            <span className="text-[9px] px-1.5 py-px rounded-full bg-muted text-muted-foreground font-medium">
              {badge}
            </span>
          )}
        </div>
        <span className="text-[10px] text-muted-foreground/60 font-mono">GET /{endpoint}</span>
      </div>
      {fields.map((f) => (
        <div key={f.key}>
          <label className={labelCls}>{f.label}</label>
          {f.type === "select" && f.options ? (
            <select
              className={selectCls}
              value={form[f.key] ?? ""}
              onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
            >
              {f.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              className={inputCls}
              value={form[f.key] ?? ""}
              placeholder={f.placeholder ?? f.label}
              onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
            />
          )}
        </div>
      ))}
      <Button
        variant="ghost"
        size="sm"
        className="border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 gap-1.5"
        onClick={run}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <RefreshCw className="w-3.5 h-3.5" />
        )}
        Fetch
      </Button>
      {error && (
        <Typography variant="small" className="text-red-400 text-xs bg-red-500/10 rounded p-2">
          {error}
        </Typography>
      )}
      {result && (
        <div className="mt-1">
          {renderResult ? (
            renderResult(result)
          ) : (
            <pre className="max-h-[300px] overflow-auto rounded-lg bg-muted/30 p-3 text-xs text-muted-foreground font-mono">
              {JSON.stringify(result, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

// ── OpPanel ─────────────────────────────────────────────────────
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
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (address) setForm((prev) => ({ ...prev, from: address }));
  }, [address]);

  useEffect(() => {
    setForm((prev) => {
      const next = { ...prev };
      for (const [k, v] of Object.entries(defaults)) {
        if (k === "poolAddress" || k === "from" || !prev[k]) next[k] = v;
      }
      if (address) next.from = address;
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(defaults), address]);

  const build = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const r = await fetch(`${SDK_OP_URL}/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await r.json();
      if (!d.success) setError(d.error ?? "Simulation failed");
      else setResult(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error — is mcp-stellar running?");
    } finally {
      setLoading(false);
    }
  }, [form, endpoint]);

  return (
    <div className={panelCls}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
          {title}
        </span>
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
      <Button
        variant="ghost"
        size="sm"
        className="border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 gap-1.5"
        onClick={build}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Zap className="w-3.5 h-3.5" />
        )}
        Build TX
      </Button>
      {error && (
        <Typography variant="small" className="text-red-400 text-xs bg-red-500/10 rounded p-2">
          {error}
        </Typography>
      )}
      {result?.xdr && (
        <div className="mt-1 space-y-4">
          <AquaTxCard
            tx={{
              operation: String(result.operation ?? operation),
              xdr: String(result.xdr ?? ""),
              estimatedFee: result.estimatedFee ? String(result.estimatedFee) : undefined,
              pool: form.poolAddress ?? (result.pool ? String(result.pool) : undefined),
              from: form.from ?? undefined,
              amount: form.amount ?? (result.amount ? String(result.amount) : undefined),
              amounts: result.amounts ?? undefined,
              shares: form.shares ?? undefined,
              tokenIn: form.tokenIn ?? undefined,
              tokenOut: form.tokenOut ?? undefined,
              route: result.route ?? undefined,
              context: result.context,
            }}
            mode="playground"
          />

          {/* NEW unified swap/bridge execute card — protocol-agnostic */}
          {operation === "swap" ? (
            <div className="border-t border-border/50 pt-4 mt-4">
              <p className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider mb-3">
                NEW — Unified Swap/Bridge Execute Card (Aquarius)
              </p>
              <SwapExecuteCard
                tx={{
                  operation: "swap",
                  protocol: "aquarius",
                  tokenIn: form.tokenIn ?? "XLM",
                  tokenOut: form.tokenOut ?? "USDC",
                  amountIn: form.amount ?? "0",
                  xdr: String(result.xdr ?? ""),
                  estimatedFee: result.estimatedFee ? String(result.estimatedFee) : undefined,
                  routeTokens: result.route?.tokens ?? undefined,
                  routePools: result.route?.pools ?? undefined,
                  context: result.context,
                }}
                mode="playground"
              />
            </div>
          ) : null}
        </div>
      )}
      {/* For lock-aqua that returns instruction instead of XDR */}
      {result && !result.xdr && result.lockInfo && (
        <div className="mt-1">
          <AquaLockInfoCard data={result.lockInfo} mode="playground" />
        </div>
      )}
    </div>
  );
}

// ── Pool selector ───────────────────────────────────────────────
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
      <label className="text-muted-foreground text-xs font-medium whitespace-nowrap">
        Active Pool:
      </label>
      <div className="relative">
        <select
          className="appearance-none bg-secondary border border-border rounded px-3 py-1.5 pr-7 text-sm text-foreground focus:outline-none focus:border-primary/50 cursor-pointer"
          value={selected}
          onChange={(e) => onSelect(e.target.value)}
        >
          {pools.map((p) => (
            <option key={p.address} value={p.address}>
              {p.label} — {p.address.slice(0, 8)}...
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
      </div>
      <span className="text-[10px] text-muted-foreground/60 font-mono hidden sm:block">
        {selected}
      </span>
    </div>
  );
}

// ── PoolsFilterPanel ────────────────────────────────────────────
// Custom panel with pool type filter + server-side pagination.
function PoolsFilterPanel() {
  const [poolTypeFilter, setPoolTypeFilter] = useState<
    "all" | "stable" | "volatile" | "concentrated"
  >("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const limit = 10;

  const fetchPools = useCallback(async (type: string, page: number) => {
    setLoading(true);
    setError(null);
    try {
      const url = `${SDK_QUERY_URL}/pools?type=${type}&page=${page}&limit=${limit}`;
      const r = await fetch(url);
      const d = await r.json();
      if (!d.success) setError(d.error ?? "Request failed");
      else setResult(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-fetch on mount and when filter/page changes
  useEffect(() => {
    fetchPools(poolTypeFilter, currentPage);
  }, [poolTypeFilter, currentPage, fetchPools]);

  const pagination = result?.pagination;
  const pools = result ? normalizeAquaPoolsFromSdk(result) : [];

  return (
    <div className={panelCls}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wider">
          List All Pools
        </span>
        <span className="text-[10px] text-muted-foreground/60 font-mono">GET /pools</span>
      </div>

      {/* Filter + info row */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <label className={labelCls}>Pool Type</label>
          <select
            className={selectCls}
            value={poolTypeFilter}
            onChange={(e) => {
              setPoolTypeFilter(e.target.value as "all" | "stable" | "volatile" | "concentrated");
              setCurrentPage(1);
            }}
          >
            <option value="all">All Pools</option>
            <option value="stable">Stable</option>
            <option value="volatile">Volatile</option>
            <option value="concentrated">Concentrated</option>
          </select>
        </div>
        {pagination && (
          <div className="text-right pt-4">
            <p className="text-[10px] text-muted-foreground">{pagination.totalCount} pools</p>
          </div>
        )}
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 gap-1.5"
        onClick={() => fetchPools(poolTypeFilter, currentPage)}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <RefreshCw className="w-3.5 h-3.5" />
        )}
        Fetch
      </Button>

      {error && (
        <Typography variant="small" className="text-red-400 text-xs bg-red-500/10 rounded p-2">
          {error}
        </Typography>
      )}

      {/* Results */}
      {pools.length > 0 && (
        <div className="mt-1">
          <AquaPoolsCard pools={pools} mode="playground" />
        </div>
      )}

      {/* Pagination controls */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-7 px-3"
            disabled={!pagination.hasPrev || loading}
            onClick={() => setCurrentPage((p) => p - 1)}
          >
            Prev
          </Button>
          <span className="text-[10px] text-muted-foreground tabular-nums">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-7 px-3"
            disabled={!pagination.hasNext || loading}
            onClick={() => setCurrentPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Yield table ─────────────────────────────────────────────────
function YieldTable({ data }: { data: any }) {
  const yields = normalizeAquaYieldFromSdk(data);
  if (!yields.length)
    return <p className="text-xs text-muted-foreground">No yield opportunities.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-muted-foreground/60 border-b border-border">
            <th className="text-left py-1.5 font-medium">Pool</th>
            <th className="text-left py-1.5 font-medium">Type</th>
            <th className="text-right py-1.5 font-medium">Base APY</th>
            <th className="text-right py-1.5 font-medium">Reward APY</th>
            <th className="text-right py-1.5 font-medium">Total APY</th>
            <th className="text-right py-1.5 font-medium">TVL</th>
          </tr>
        </thead>
        <tbody>
          {yields.slice(0, 30).map((y) => (
            <tr
              key={y.poolAddress ?? y.name}
              className="border-b border-border/50 hover:bg-muted/20"
            >
              <td className="py-1.5 text-foreground font-medium">{y.assets.join(" / ")}</td>
              <td className="py-1.5 text-muted-foreground capitalize">
                {y.poolType?.replace(/_/g, " ") ?? "—"}
              </td>
              <td className="py-1.5 text-right tabular-nums">
                {y.apy.base != null ? `${Number(y.apy.base).toFixed(2)}%` : "—"}
              </td>
              <td className="py-1.5 text-right tabular-nums text-emerald-400">
                {y.apy.reward != null ? `${Number(y.apy.reward).toFixed(2)}%` : "—"}
              </td>
              <td className="py-1.5 text-right tabular-nums font-semibold">
                {y.apy.total != null ? `${Number(y.apy.total).toFixed(2)}%` : "—"}
              </td>
              <td className="py-1.5 text-right tabular-nums text-muted-foreground">
                {y.tvl != null ? `$${Number(y.tvl).toLocaleString()}` : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Price Range presets ──────────────────────────────────────────
const RANGE_PRESETS = [
  { label: "Tight", range: [-0.3, 0.3], desc: "-0.3% \u2014 +0.3%" },
  { label: "Medium", range: [-20, 20], desc: "-20% \u2014 +20%" },
  { label: "Wide", range: [-50, 100], desc: "-50% \u2014 +100%" },
  { label: "One-sided up", range: [0, 50], desc: "0% \u2014 +50%" },
  { label: "One-sided lower", range: [-50, 0], desc: "-50% \u2014 0%" },
  { label: "Full Range", range: [-100, 100], desc: "All ticks" },
] as const;

// ── DepositPanel (auto-paired amounts + price range for concentrated) ──
function DepositPanel({
  poolAddress,
  walletAddress: userAddr,
}: {
  poolAddress: string;
  walletAddress: string;
}) {
  const { address } = useWallet();
  const from = address ?? userAddr;
  const [pool, setPool] = useState<any>(null);
  const [amountA, setAmountA] = useState("");
  const [amountB, setAmountB] = useState("");
  const [poolAddr, setPoolAddr] = useState(poolAddress);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Concentrated pool state
  const [rangePreset, setRangePreset] = useState(5); // Full Range default
  const [minPrice, setMinPrice] = useState("0");
  const [maxPrice, setMaxPrice] = useState("\u221E");

  // Fetch pool detail
  useEffect(() => {
    if (!poolAddr) return;
    fetch(`${SDK_QUERY_URL}/pool-info?pool=${poolAddr}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.pool) setPool(d.pool);
      })
      .catch(() => {});
  }, [poolAddr]);
  useEffect(() => {
    if (poolAddress) setPoolAddr(poolAddress);
  }, [poolAddress]);

  // Pool info
  const reserves = pool?.reserves ?? [];
  const tokensStr = (pool?.tokens_str ?? []) as string[];
  const sym = (s: string) => (s === "native" ? "XLM" : s.includes(":") ? s.split(":")[0]! : s);
  const tokenA = tokensStr[0] ? sym(tokensStr[0]) : "Token A";
  const tokenB = tokensStr[1] ? sym(tokensStr[1]) : "Token B";
  const reserveA = reserves[0] ? Number(reserves[0]) : 0;
  const reserveB = reserves[1] ? Number(reserves[1]) : 0;
  const isConcentrated = pool?.pool_type === "concentrated";
  const currentTick = pool?.current_tick;
  const tickSpacing = pool?.tick_spacing;
  const rate = reserveA > 0 && reserveB > 0 ? reserveB / reserveA : null;

  // Auto-calculate paired amount
  const onChangeA = (val: string) => {
    setAmountA(val);
    if (reserveA > 0 && reserveB > 0 && val && Number(val) > 0) {
      setAmountB(((Number(val) * reserveB) / reserveA).toFixed(7));
    } else if (!val) setAmountB("");
  };
  const onChangeB = (val: string) => {
    setAmountB(val);
    if (reserveA > 0 && reserveB > 0 && val && Number(val) > 0) {
      setAmountA(((Number(val) * reserveA) / reserveB).toFixed(7));
    } else if (!val) setAmountA("");
  };

  // Update price range from preset
  const applyPreset = (idx: number) => {
    setRangePreset(idx);
    const preset = RANGE_PRESETS[idx]!;
    if (rate != null && preset.label !== "Full Range") {
      setMinPrice((rate * (1 + preset.range[0] / 100)).toFixed(4));
      setMaxPrice((rate * (1 + preset.range[1] / 100)).toFixed(4));
    } else {
      setMinPrice("0");
      setMaxPrice("\u221E");
    }
  };

  const build = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const r = await fetch(`${SDK_OP_URL}/add-liquidity`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          poolAddress: poolAddr,
          amounts: `${amountA},${amountB}`,
          from,
          minShares: "0",
        }),
      });
      const d = await r.json();
      if (!d.success) setError(d.error ?? "Failed");
      else setResult(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, [poolAddr, amountA, amountB, from]);

  return (
    <div className={panelCls}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
          Add Liquidity
        </span>
        {isConcentrated && (
          <span className="text-[9px] px-1.5 py-px rounded-full bg-violet-500/20 text-violet-400 font-medium">
            Concentrated
          </span>
        )}
        {!isConcentrated && pool?.pool_type && (
          <span className="text-[9px] px-1.5 py-px rounded-full bg-muted text-muted-foreground font-medium capitalize">
            {pool.pool_type.replace(/_/g, " ")}
          </span>
        )}
      </div>

      <div>
        <label className={labelCls}>Pool Address</label>
        <input
          className={inputCls}
          value={poolAddr}
          onChange={(e) => setPoolAddr(e.target.value)}
          placeholder="C..."
        />
      </div>

      {/* Token A */}
      <div>
        <div className="flex justify-between items-center mb-0.5">
          <label className={labelCls}>{tokenA} Amount</label>
          {reserveA > 0 && (
            <span className="text-[10px] text-muted-foreground">
              {(reserveA / 1e7).toLocaleString()} available
            </span>
          )}
        </div>
        <div className="relative">
          <input
            className={inputCls}
            value={amountA}
            onChange={(e) => onChangeA(e.target.value)}
            placeholder="0.00"
            type="number"
            step="any"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">
            {tokenA}
          </span>
        </div>
      </div>

      {/* Token B */}
      <div>
        <div className="flex justify-between items-center mb-0.5">
          <label className={labelCls}>{tokenB} Amount</label>
          {reserveB > 0 && (
            <span className="text-[10px] text-muted-foreground">
              {(reserveB / 1e7).toLocaleString()} available
            </span>
          )}
        </div>
        <div className="relative">
          <input
            className={inputCls}
            value={amountB}
            onChange={(e) => onChangeB(e.target.value)}
            placeholder="0.00"
            type="number"
            step="any"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">
            {tokenB}
          </span>
        </div>
      </div>

      {/* Rate */}
      {rate != null && (
        <div className="text-center text-[10px] text-muted-foreground py-1">
          1 {tokenA} = {rate.toFixed(7)} {tokenB}
        </div>
      )}

      {/* Price Range — only for concentrated pools */}
      {isConcentrated && (
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground">Price Range</span>
            {rate != null && (
              <span className="text-[10px] text-muted-foreground">
                1 {tokenA} = {rate.toFixed(4)} {tokenB}
              </span>
            )}
          </div>

          {/* Presets grid */}
          <div className="grid grid-cols-3 gap-1.5">
            {RANGE_PRESETS.map((preset, i) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => applyPreset(i)}
                className={`rounded-lg border py-2 px-1 text-center transition-colors ${
                  rangePreset === i
                    ? "border-violet-500 bg-violet-500/10 text-foreground"
                    : "border-border bg-secondary/30 text-muted-foreground hover:border-border hover:bg-secondary/60"
                }`}
              >
                <p className="text-[11px] font-medium">{preset.label}</p>
                <p className="text-[9px] text-muted-foreground">{preset.desc}</p>
              </button>
            ))}
          </div>

          {/* Min/Max Price inputs */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelCls}>Min Price</label>
              <input
                className={inputCls}
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <label className={labelCls}>Max Price</label>
              <input
                className={inputCls}
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="\u221E"
              />
            </div>
          </div>

          {/* Info rows */}
          <div className="rounded-lg bg-secondary/40 p-2.5 space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Selected range ({tokenA}/{tokenB})
              </span>
              <span className="text-foreground font-medium">
                {RANGE_PRESETS[rangePreset]?.label}
              </span>
            </div>
            {currentTick != null && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current tick</span>
                <span className="text-foreground tabular-nums">{currentTick}</span>
              </div>
            )}
            {tickSpacing != null && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tick spacing</span>
                <span className="text-foreground tabular-nums">{tickSpacing}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div>
        <label className={labelCls}>From Address</label>
        <input className={inputCls} value={from} readOnly />
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 gap-1.5"
        onClick={build}
        disabled={loading || !amountA || !amountB || !pool}
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Zap className="w-3.5 h-3.5" />
        )}{" "}
        Deposit
      </Button>

      {error && (
        <Typography variant="small" className="text-red-400 text-xs bg-red-500/10 rounded p-2">
          {error}
        </Typography>
      )}
      {result?.xdr && (
        <div className="mt-1">
          <AquaTxCard
            tx={{
              operation: "add_liquidity",
              xdr: result.xdr,
              estimatedFee: result.estimatedFee,
              pool: poolAddr,
              from,
              amount: amountA,
              amounts: [amountA, amountB],
              route: { tokens: [tokenA, tokenB], pools: [], estimatedOutput: "" },
              context: isConcentrated
                ? ({
                    poolApy: null,
                    range: `${minPrice} - ${maxPrice}`,
                    ticks: currentTick != null ? `${currentTick}` : undefined,
                  } as any)
                : undefined,
            }}
            mode="playground"
          />
        </div>
      )}
    </div>
  );
}

// ── WithdrawPanel (supports constant_product/stable + concentrated) ──
function WithdrawPanel({
  poolAddress,
  walletAddress: userAddr,
}: {
  poolAddress: string;
  walletAddress: string;
}) {
  const { address } = useWallet();
  const from = address ?? userAddr;
  const [pool, setPool] = useState<any>(null);
  const [poolAddr, setPoolAddr] = useState(poolAddress);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Concentrated position
  const [position, setPosition] = useState<any>(null);
  const [posLoading, setPosLoading] = useState(false);
  const [withdrawPct, setWithdrawPct] = useState(100);
  // Standard pool
  const [shares, setShares] = useState("");
  const [standardShares, setStandardShares] = useState<string | null>(null);
  const [sharesLoading, setSharesLoading] = useState(false);
  const [sharesError, setSharesError] = useState<string | null>(null);

  useEffect(() => {
    if (!poolAddr) return;
    fetch(`${SDK_QUERY_URL}/pool-info?pool=${poolAddr}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.pool) setPool(d.pool);
      })
      .catch(() => {});
  }, [poolAddr]);
  useEffect(() => {
    if (poolAddress) setPoolAddr(poolAddress);
  }, [poolAddress]);

  const tokensStr = (pool?.tokens_str ?? []) as string[];
  const symParse = (s: string) => (s === "native" ? "XLM" : s.includes(":") ? s.split(":")[0]! : s);
  const tokenA = tokensStr[0] ? symParse(tokensStr[0]) : "Token A";
  const tokenB = tokensStr[1] ? symParse(tokensStr[1]) : "Token B";
  const isConcentrated = pool?.pool_type === "concentrated";

  // Fetch concentrated position (Full Range: -887200 to 887200)
  useEffect(() => {
    if (!isConcentrated || !poolAddr || !from) {
      setPosition(null);
      return;
    }
    setPosLoading(true);
    fetch(
      `${SDK_QUERY_URL}/position?pool=${poolAddr}&user=${from}&tickLower=-887200&tickUpper=887200`
    )
      .then((r) => r.json())
      .then((d) => {
        setPosition(d.success ? d.position : null);
      })
      .catch(() => setPosition(null))
      .finally(() => setPosLoading(false));
  }, [isConcentrated, poolAddr, from]);

  // Fetch standard (non-concentrated) LP shares for current pool/user.
  useEffect(() => {
    if (isConcentrated || !poolAddr || !from) {
      setStandardShares(null);
      setSharesError(null);
      return;
    }
    let cancelled = false;
    setSharesLoading(true);
    setSharesError(null);
    fetch(`${SDK_QUERY_URL}/my-liquidity?pool=${poolAddr}&user=${from}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (!d?.success) {
          setStandardShares(null);
          setSharesError(typeof d?.error === "string" ? d.error : "Failed to load LP position");
          return;
        }
        const nextShares = d?.positions?.[0]?.shares;
        if (typeof nextShares === "string") {
          setStandardShares(nextShares);
          // Prefill only when empty to avoid overwriting user's manual input.
          setShares((prev) => prev || nextShares);
        } else {
          setStandardShares(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStandardShares(null);
          setSharesError("Failed to load LP position");
        }
      })
      .finally(() => {
        if (!cancelled) setSharesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isConcentrated, poolAddr, from]);

  const liquidity = position ? BigInt(String(position.liquidity ?? "0").split(".")[0] ?? "0") : 0n;
  const withdrawLiquidity =
    liquidity > 0n ? ((liquidity * BigInt(withdrawPct)) / 100n).toString() : "0";

  // Estimate receive amounts (proportional from reserves)
  const reserves = pool?.reserves ?? [];
  const totalShare = pool?.total_share ? Number(pool.total_share) : 0;
  const estReceiveA =
    liquidity > 0n && totalShare > 0 && reserves[0]
      ? ((Number(reserves[0]) * Number(withdrawLiquidity)) / totalShare / 1e7).toFixed(7)
      : null;
  const estReceiveB =
    liquidity > 0n && totalShare > 0 && reserves[1]
      ? ((Number(reserves[1]) * Number(withdrawLiquidity)) / totalShare / 1e7).toFixed(7)
      : null;

  const build = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    const amt = isConcentrated ? withdrawLiquidity : shares;
    try {
      const r = await fetch(`${SDK_OP_URL}/withdraw-liquidity`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ poolAddress: poolAddr, shares: amt, from }),
      });
      const d = await r.json();
      if (!d.success) setError(d.error ?? "Failed");
      else setResult(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, [poolAddr, shares, withdrawLiquidity, from, isConcentrated]);

  const canBuild = isConcentrated ? liquidity > 0n && withdrawPct > 0 : !!shares;

  return (
    <div className={panelCls}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
          {isConcentrated ? "Concentrated Withdraw" : "Withdraw (Remove Liquidity)"}
        </span>
        {isConcentrated && (
          <span className="text-[9px] px-1.5 py-px rounded-full bg-violet-500/20 text-violet-400 font-medium">
            Concentrated
          </span>
        )}
      </div>

      <div>
        <label className={labelCls}>Pool Address</label>
        <input
          className={inputCls}
          value={poolAddr}
          onChange={(e) => setPoolAddr(e.target.value)}
          placeholder="C..."
        />
      </div>

      {isConcentrated ? (
        <>
          {posLoading && (
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" /> Loading position...
            </p>
          )}
          {position && liquidity > 0n && (
            <>
              <div className="rounded-lg border border-border bg-secondary/30 p-3 space-y-2">
                <p className="text-xs font-medium text-foreground">Your Position</p>
                <div className="flex justify-between text-[11px]">
                  <span className="text-muted-foreground">
                    Price range ({tokenA}/{tokenB})
                  </span>
                  <span className="text-foreground">Full Range</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-muted-foreground">Shares</span>
                  <span className="text-foreground tabular-nums">
                    {(Number(liquidity) / 1e6).toFixed(2)}M
                  </span>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className={labelCls}>Withdraw position</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={withdrawPct}
                      onChange={(e) =>
                        setWithdrawPct(Math.min(100, Math.max(1, Number(e.target.value))))
                      }
                      className="w-12 rounded bg-secondary border border-border px-1.5 py-0.5 text-sm text-foreground text-right tabular-nums"
                    />
                    <span className="text-xs text-muted-foreground">%</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={withdrawPct}
                  onChange={(e) => setWithdrawPct(Number(e.target.value))}
                  className="w-full h-1.5 bg-border rounded-full appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="flex justify-between mt-1.5">
                  {[25, 50, 75, 100].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setWithdrawPct(pct)}
                      className={`text-[10px] px-2.5 py-1 rounded-md font-medium transition-colors ${withdrawPct === pct ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "text-muted-foreground bg-secondary/50 hover:text-foreground"}`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
                {/* Will receive estimates */}
                {(estReceiveA || estReceiveB) && (
                  <div className="mt-2 space-y-1.5 pt-2 border-t border-border/30">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-muted-foreground">Will receive {tokenA}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-foreground tabular-nums font-medium">
                          {estReceiveA ?? "\u2014"}
                        </span>
                        <TokenImage src={null} alt={tokenA} className="h-4 w-4 rounded-full" />
                      </div>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-muted-foreground">Will receive {tokenB}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-foreground tabular-nums font-medium">
                          {estReceiveB ?? "\u2014"}
                        </span>
                        <TokenImage src={null} alt={tokenB} className="h-4 w-4 rounded-full" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
          {position && liquidity === 0n && !posLoading && (
            <div className="rounded-lg bg-secondary/30 p-3 text-xs text-muted-foreground text-center">
              No position found in this pool
            </div>
          )}
        </>
      ) : (
        <div className="space-y-2">
          <div>
            <label className={labelCls}>Shares</label>
            <input
              className={inputCls}
              value={shares}
              onChange={(e) => setShares(e.target.value)}
              placeholder="100"
              type="number"
              step="any"
            />
          </div>
          <div className="rounded-lg border border-border bg-secondary/30 p-2.5 text-[11px]">
            {sharesLoading ? (
              <p className="text-muted-foreground flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" /> Loading your position...
              </p>
            ) : sharesError ? (
              <p className="text-red-400">{sharesError}</p>
            ) : standardShares && Number(standardShares) > 0 ? (
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Your LP shares</span>
                  <span className="text-foreground tabular-nums">
                    {Number(standardShares).toLocaleString(undefined, { maximumFractionDigits: 7 })}
                  </span>
                </div>
                <div className="flex gap-1.5 pt-0.5">
                  {[25, 50, 75, 100].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setShares(((Number(standardShares) * pct) / 100).toFixed(7))}
                      className="text-[10px] px-2 py-1 rounded bg-secondary/60 text-muted-foreground hover:text-foreground"
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">
                No LP position found for this pool and wallet.
              </p>
            )}
          </div>
        </div>
      )}

      <div>
        <label className={labelCls}>From Address</label>
        <input className={inputCls} value={from} readOnly />
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 gap-1.5"
        onClick={build}
        disabled={loading || !pool || !canBuild}
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Zap className="w-3.5 h-3.5" />
        )}{" "}
        Withdraw
      </Button>

      {error && (
        <Typography variant="small" className="text-red-400 text-xs bg-red-500/10 rounded p-2">
          {error}
        </Typography>
      )}
      {result?.xdr && (
        <div className="mt-1">
          <AquaTxCard
            tx={{
              operation: "withdraw_liquidity",
              xdr: result.xdr,
              estimatedFee: result.estimatedFee,
              pool: poolAddr,
              from,
              amount: isConcentrated ? withdrawLiquidity : shares,
              route: { tokens: [tokenA, tokenB], pools: [], estimatedOutput: "" },
            }}
            mode="playground"
          />
        </div>
      )}
    </div>
  );
}

// ── Token symbol → contract mapping ─────────────────────────────
const TOKEN_CONTRACTS: Record<string, string> = {
  XLM: "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC",
  USDC: "CAZRY5GSFBFXD7H6GAFBA5YGYQTDXU4QKWKMYFWBAZFUCURN3WKX6LF5",
  USDT: "CBL6KD2LFMLAUKFFWNNXWOXFN73GAXLEA4WMJRLQ5L76DMYTM3KWQVJN",
  AQUA: "CDNVQW44C3HALYNVQ4SOBXY5EWYTGVYXX6JPESOLQDABJI5FC5LTRRUE",
  BLND: "CB22KRA3YZVCNCQI64JQ5WE7UY2VAV7WFLK6A2JN3HEX56T2EDAFO7QF",
  ICE: "CCQZWA6GDCNLEMNUYTCMYGIXLX3ECAXW7RICSUZWWXM5AMDWAANC4SZK",
};

// ── TrustlinePrecheck ───────────────────────────────────────────
// Shows warning + add buttons for missing trustlines before Build TX
export function TrustlinePrecheck({
  walletAddress,
  tokens,
  poolAddress: _poolAddress,
  gaugeEnabled,
}: {
  walletAddress: string;
  tokens: string[];
  poolAddress: string;
  gaugeEnabled?: boolean;
}) {
  // Build list: pool tokens + ICE if gauge enabled
  const allTokens = [...tokens];
  if (gaugeEnabled && !allTokens.includes("ICE")) allTokens.push("ICE");

  const tokenList = allTokens.map((sym) => ({
    contract: TOKEN_CONTRACTS[sym] ?? sym,
    symbol: sym,
  }));

  const { missing, hasMissing, checking, addTrustline, adding } = useMultiTrustlineCheck(
    walletAddress || undefined,
    tokenList
  );

  if (checking) {
    return (
      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
        <Loader2 className="h-3 w-3 animate-spin" /> Checking trustlines...
      </p>
    );
  }

  if (!hasMissing) return null;

  return (
    <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 space-y-2">
      <p className="text-xs text-amber-400 font-medium">
        Missing trustlines: {missing.map((t) => t.symbol).join(", ")}
      </p>
      <p className="text-[10px] text-muted-foreground">
        You need trustlines for all pool tokens before deposit/withdraw.
      </p>
      {missing.map((t) => (
        <button
          key={t.contract}
          type="button"
          onClick={() => addTrustline(t.contract, t.symbol)}
          disabled={adding}
          className="w-full rounded-lg py-1.5 text-xs font-semibold bg-amber-500/20 border border-amber-500/30 text-amber-400 hover:bg-amber-500/30 transition-all disabled:opacity-40 flex items-center justify-center gap-1.5"
        >
          {adding ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" /> Adding...
            </>
          ) : (
            `Add ${t.symbol} Trustline`
          )}
        </button>
      ))}
    </div>
  );
}

// ── Default pools ───────────────────────────────────────────────
const DEFAULT_LP_POOL = "CD3LFMMLBQ6RBJUD3Z2LFDFE6544WDRMWHEZYPI5YDVESYRSO2TT32BX"; // XLM/USDC constant_product
// Reserved for concentrated pool support:
// const DEFAULT_CL_POOL = "CAD5TBS4NKO35YDYZN3ULQFXDXVL7BPK4Q2RUG7N4DVPYNNOEAUAQJ6F"; // USDC/XLM concentrated

// ── Main playground ─────────────────────────────────────────────
export default function AquariusPlaygroundPage() {
  const { address: walletAddress } = useWallet();
  const [tab, setTab] = useState<"queries" | "operations">("queries");
  const [pools, setPools] = useState<KnownPool[]>([]);
  const [selectedPool, setSelectedPool] = useState("");
  const [networkInfo, setNetworkInfo] = useState<string>("");
  // Liquidity pool picker state
  const [lpPool, setLpPool] = useState(DEFAULT_LP_POOL);
  const [lpPoolInfo, setLpPoolInfo] = useState<any>(null);

  useEffect(() => {
    // Fetch first page of pools for the pool selector dropdown
    fetch(`${SDK_QUERY_URL}/pools?type=all&page=1&limit=50`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.pools?.length) {
          const symParse = (s: string) =>
            s === "native" ? "XLM" : s.includes(":") ? s.split(":")[0] : s;
          const mapped: KnownPool[] = d.pools.map((p: any) => {
            const strs = Array.isArray(p.tokens_str) ? p.tokens_str : [];
            const tokenSymbols = strs.map((s: string) => symParse(s));
            return {
              label: tokenSymbols.length
                ? `${tokenSymbols.join(" / ")} [${(p.pool_type ?? "amm").replace(/_/g, " ")}]`
                : p.address.slice(0, 10),
              address: p.address,
              tokens: tokenSymbols,
            };
          });
          setPools(mapped);
          setSelectedPool(mapped[0]!.address);
          setNetworkInfo(d.network ?? "");
        }
      })
      .catch(() => {});
  }, []);

  // Fetch pool info for liquidity pool picker
  useEffect(() => {
    if (!lpPool) return;
    fetch(`${SDK_QUERY_URL}/pool-info?pool=${lpPool}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.pool) setLpPoolInfo(d.pool);
      })
      .catch(() => setLpPoolInfo(null));
  }, [lpPool]);

  const poolAddress = selectedPool ?? "";
  const poolDefaults: Record<string, string> = { pool: poolAddress };
  const userDefaults: Record<string, string> = { pool: poolAddress, user: walletAddress ?? "" };

  const tabs = [
    { key: "queries" as const, label: "Queries (17)" },
    { key: "operations" as const, label: "Operations (6)" },
  ];

  return (
    <StreamContext.Provider value={MOCK_STREAM}>
      <div className="min-h-screen bg-background text-foreground p-6 space-y-6">
        {/* ── Header ── */}
        <div className="space-y-3">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <Typography as="h1" variant="h3" weight="bold" className="text-foreground">
                Aquarius AMM Playground
              </Typography>
              <Typography variant="p" className="text-muted-foreground text-sm mt-1">
                23 features: 6 operations + 17 queries.{" "}
                <span className="font-mono text-cyan-400 text-xs">/api/aquarius/...</span>
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
                  {walletAddress.slice(0, 8)}...
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
          {tabs.map((t) => (
            <Button
              key={t.key}
              variant="ghost"
              onClick={() => setTab(t.key)}
              className={`px-5 py-1.5 rounded-md text-sm font-medium transition-colors h-auto ${
                tab === t.key
                  ? "bg-accent text-foreground shadow hover:bg-accent"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </Button>
          ))}
        </div>

        {/* ═══════════════════════════════════════════════════════════
            QUERY TAB — 17 panels
        ═══════════════════════════════════════════════════════════ */}
        {tab === "queries" && (
          <div className="space-y-6">
            {/* ── Pool Queries ── */}
            <div>
              <Typography
                variant="small"
                className="text-muted-foreground/60 text-[11px] font-semibold uppercase tracking-wider mb-3"
              >
                Pool Queries
              </Typography>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {/* Q1. List All Pools (filter by type + pagination) */}
                <PoolsFilterPanel />

                {/* Q2. Get Details of a Pool */}
                <QueryPanel
                  title="Get Pool Details"
                  endpoint="pool-info"
                  fields={[{ key: "pool", label: "Pool Address", placeholder: "C..." }]}
                  defaults={poolDefaults}
                  autoFetch
                  renderResult={(d) => {
                    const pool = normalizeAquaPoolFromSdk(d);
                    return pool ? <AquaPoolDetailCard pool={pool} mode="playground" /> : null;
                  }}
                />

                {/* Q3. Historical Volume of Pool (real API) */}
                <QueryPanel
                  title="Historical Volume of Pool"
                  endpoint="pool-history"
                  fields={[
                    { key: "pool", label: "Pool Address", placeholder: "C..." },
                    { key: "size", label: "Days", placeholder: "30" },
                  ]}
                  defaults={{ ...poolDefaults, size: "14" }}
                  badge="daily history"
                  renderResult={(d) => {
                    const items = d.items ?? [];
                    return (
                      <div className="rounded-lg bg-secondary p-3 space-y-1 text-xs max-h-[200px] overflow-auto">
                        <div className="flex justify-between text-muted-foreground/60 font-medium pb-1 border-b border-border/50">
                          <span>Date</span>
                          <span>Volume (USD)</span>
                        </div>
                        {items.map((i: any) => (
                          <div key={i.date} className="flex justify-between">
                            <span className="text-muted-foreground">{i.date}</span>
                            <span className="text-foreground tabular-nums">
                              $
                              {Number(i.volume).toLocaleString(undefined, {
                                maximumFractionDigits: 0,
                              })}
                            </span>
                          </div>
                        ))}
                        {!items.length && <p className="text-muted-foreground">No history data</p>}
                      </div>
                    );
                  }}
                />

                {/* Q4. Historical Liquidity of Pool (real API) */}
                <QueryPanel
                  title="Historical Liquidity of Pool"
                  endpoint="pool-history"
                  fields={[
                    { key: "pool", label: "Pool Address", placeholder: "C..." },
                    { key: "size", label: "Days", placeholder: "30" },
                  ]}
                  defaults={{ ...poolDefaults, size: "14" }}
                  badge="daily history"
                  renderResult={(d) => {
                    const items = d.items ?? [];
                    return (
                      <div className="rounded-lg bg-secondary p-3 space-y-1 text-xs max-h-[200px] overflow-auto">
                        <div className="flex justify-between text-muted-foreground/60 font-medium pb-1 border-b border-border/50">
                          <span>Date</span>
                          <span>TVL (USD)</span>
                        </div>
                        {items.map((i: any) => (
                          <div key={i.date} className="flex justify-between">
                            <span className="text-muted-foreground">{i.date}</span>
                            <span className="text-foreground tabular-nums">
                              $
                              {Number(i.liquidity).toLocaleString(undefined, {
                                maximumFractionDigits: 0,
                              })}
                            </span>
                          </div>
                        ))}
                        {!items.length && <p className="text-muted-foreground">No history data</p>}
                      </div>
                    );
                  }}
                />

                {/* Q5. Pool Members (tokens + reserves from pool detail) */}
                <QueryPanel
                  title="Pool Members"
                  endpoint="pool-info"
                  fields={[{ key: "pool", label: "Pool Address", placeholder: "C..." }]}
                  defaults={poolDefaults}
                  badge="tokens + reserves"
                  renderResult={(d) => {
                    const pool = d.pool ?? d;
                    const strs = Array.isArray(pool.tokens_str) ? pool.tokens_str : [];
                    const addrs = Array.isArray(pool.tokens_addresses) ? pool.tokens_addresses : [];
                    const reserves = Array.isArray(pool.reserves) ? pool.reserves : [];
                    return (
                      <div className="rounded-lg bg-secondary p-3 space-y-1.5 text-xs">
                        <p className="text-muted-foreground/60 text-[10px] uppercase">
                          Token Members
                        </p>
                        {strs.map((s: string, i: number) => {
                          const symbol =
                            s === "native" ? "XLM" : s.includes(":") ? s.split(":")[0] : s;
                          const reserve = reserves[i]
                            ? (Number(reserves[i]) / 1e7).toLocaleString(undefined, {
                                maximumFractionDigits: 2,
                              })
                            : "—";
                          return (
                            <div key={addrs[i] || i} className="flex items-center justify-between">
                              <span className="text-foreground font-medium">{symbol}</span>
                              <div className="text-right">
                                <span className="text-muted-foreground tabular-nums">
                                  {reserve}
                                </span>
                                <span className="text-muted-foreground/40 font-mono text-[9px] ml-2">
                                  {addrs[i]?.slice(0, 8)}...
                                </span>
                              </div>
                            </div>
                          );
                        })}
                        {!strs.length && <p className="text-muted-foreground">No token data</p>}
                        {pool.total_share && (
                          <div className="flex justify-between pt-1 border-t border-border/50">
                            <span className="text-muted-foreground">Total Shares</span>
                            <span className="text-foreground tabular-nums">
                              {(Number(pool.total_share) / 1e7).toLocaleString(undefined, {
                                maximumFractionDigits: 0,
                              })}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  }}
                />

                {/* Q6. Transaction Members of Pool */}
                <QueryPanel
                  title="Transaction Members of Pool"
                  endpoint="pool-info"
                  fields={[{ key: "pool", label: "Pool Address", placeholder: "C..." }]}
                  defaults={poolDefaults}
                  badge="tx count"
                  renderResult={(d) => {
                    const pool = d.pool ?? d;
                    return (
                      <div className="rounded-lg bg-secondary p-3 space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total TXs</span>
                          <span className="text-foreground tabular-nums">
                            {pool.tx_count ?? "—"}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground/50 pt-1">
                          Detailed TX history requires Horizon indexer
                        </p>
                      </div>
                    );
                  }}
                />
              </div>
            </div>

            {/* ── Swap & Preview Queries ── */}
            <div>
              <Typography
                variant="small"
                className="text-muted-foreground/60 text-[11px] font-semibold uppercase tracking-wider mb-3"
              >
                Swap & Operation Previews
              </Typography>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {/* Q7. Get Info When Swap (Quote) */}
                <QueryPanel
                  title="Get Info When Swap"
                  endpoint="quote"
                  fields={[
                    { key: "tokenIn", label: "Token In", placeholder: "XLM or C..." },
                    { key: "tokenOut", label: "Token Out", placeholder: "USDC or C..." },
                    { key: "amount", label: "Amount", placeholder: "12" },
                  ]}
                  defaults={{ tokenIn: "XLM", tokenOut: "USDC", amount: "12" }}
                  renderResult={(d) => {
                    const quote = normalizeAquaQuoteFromSdk(d);
                    return quote ? <AquaQuoteCard quote={quote} mode="playground" /> : null;
                  }}
                />

                {/* Q8. Get Info When Deposit */}
                <QueryPanel
                  title="Get Info When Deposit"
                  endpoint="pool-info"
                  fields={[{ key: "pool", label: "Pool Address", placeholder: "C..." }]}
                  defaults={poolDefaults}
                  badge="pool reserves"
                  renderResult={(d) => {
                    const pool = d.pool ?? d;
                    return (
                      <div className="rounded-lg bg-secondary p-3 space-y-1.5 text-xs">
                        <p className="text-muted-foreground/60 text-[10px] uppercase">
                          Deposit Preview
                        </p>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Pool Type</span>
                          <span className="text-foreground capitalize">
                            {(pool.poolType ?? pool.pool_type ?? "CP").replace(/_/g, " ")}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Fee</span>
                          <span className="text-foreground">{pool.fee ?? "0.3%"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">TVL</span>
                          <span className="text-foreground tabular-nums">
                            ${Number(pool.tvl ?? 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Fee APY</span>
                          <span className="text-emerald-400 tabular-nums">
                            {pool.feeApy != null ? `${Number(pool.feeApy).toFixed(2)}%` : "—"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Reward APY</span>
                          <span className="text-emerald-400 tabular-nums">
                            {pool.rewardApy != null ? `${Number(pool.rewardApy).toFixed(2)}%` : "—"}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground/50 pt-1">
                          Deposit proportional amounts to receive LP shares
                        </p>
                      </div>
                    );
                  }}
                />

                {/* Q9. Get Info When Withdraw */}
                <QueryPanel
                  title="Get Info When Withdraw"
                  endpoint="pool-info"
                  fields={[{ key: "pool", label: "Pool Address", placeholder: "C..." }]}
                  defaults={poolDefaults}
                  badge="pool reserves"
                  renderResult={(d) => {
                    const pool = d.pool ?? d;
                    return (
                      <div className="rounded-lg bg-secondary p-3 space-y-1.5 text-xs">
                        <p className="text-muted-foreground/60 text-[10px] uppercase">
                          Withdraw Preview
                        </p>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Pool</span>
                          <span className="text-foreground">
                            {pool.tokens?.map((t: any) => t.symbol).join(" / ") ?? "—"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">TVL</span>
                          <span className="text-foreground tabular-nums">
                            ${Number(pool.tvl ?? 0).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground/50 pt-1">
                          Burn LP shares to receive tokens proportionally
                        </p>
                      </div>
                    );
                  }}
                />
              </div>
            </div>

            {/* ── Position & Reward Queries ── */}
            <div>
              <Typography
                variant="small"
                className="text-muted-foreground/60 text-[11px] font-semibold uppercase tracking-wider mb-3"
              >
                Positions & Rewards
              </Typography>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {/* Q10. Get My Liquidity */}
                <QueryPanel
                  title="Get My Liquidity"
                  endpoint="my-liquidity"
                  fields={[
                    { key: "pool", label: "Pool Address", placeholder: "C..." },
                    { key: "user", label: "User Address", placeholder: "G..." },
                  ]}
                  defaults={userDefaults}
                  renderResult={(d) => {
                    const pos = normalizeAquaPositionsFromSdk(d);
                    return pos ? <AquaPositionsCard data={pos} mode="playground" /> : null;
                  }}
                />

                {/* Q11. Get AQUA Daily Reward */}
                <QueryPanel
                  title="Get AQUA Daily Reward"
                  endpoint="rewards"
                  fields={[]}
                  autoFetch
                  renderResult={(d) => (
                    <AquaRewardsCard
                      data={{ rewards: d.rewards ?? [], totalDailyReward: d.totalDailyReward }}
                      mode="playground"
                    />
                  )}
                />

                {/* Q12. Get Pool Incentive */}
                <QueryPanel
                  title="Get Pool Incentive"
                  endpoint="rewards"
                  fields={[]}
                  badge="per-market rewards"
                  autoFetch
                  renderResult={(d) => {
                    const rewards = d.rewards ?? [];
                    const top = rewards.slice(0, 10);
                    return (
                      <div className="rounded-lg bg-secondary p-3 space-y-1.5 text-xs">
                        <p className="text-muted-foreground/60 text-[10px] uppercase">
                          Top Incentivized Pools
                        </p>
                        {top.map((r: any) => (
                          <div key={r.pair} className="flex justify-between">
                            <span className="text-foreground">{r.pair}</span>
                            <span className="text-emerald-400 tabular-nums">
                              {Number(r.dailyTotalReward).toFixed(0)} AQUA/day
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  }}
                />

                {/* Q13. Get Info Lock Aqua */}
                <QueryPanel
                  title="Get Info Lock Aqua"
                  endpoint="lock-info"
                  fields={[
                    { key: "amount", label: "AQUA Amount", placeholder: "1000" },
                    { key: "days", label: "Lock Period (days)", placeholder: "365" },
                  ]}
                  defaults={{ amount: "1000", days: "365" }}
                  renderResult={(d) =>
                    d.lockInfo ? <AquaLockInfoCard data={d.lockInfo} mode="playground" /> : null
                  }
                />
              </div>
            </div>

            {/* ── Protocol-Level & Governance Queries ── */}
            <div>
              <Typography
                variant="small"
                className="text-muted-foreground/60 text-[11px] font-semibold uppercase tracking-wider mb-3"
              >
                Protocol & Governance
              </Typography>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {/* Q14. Historical Volume of Protocol (real /statistics/ API) */}
                <QueryPanel
                  title="Historical Volume of Protocol"
                  endpoint="statistics?period=totals&size=14"
                  fields={[]}
                  autoFetch
                  badge="/statistics/totals"
                  renderResult={(d) => {
                    const items = d.items ?? [];
                    return (
                      <div className="rounded-lg bg-secondary p-3 space-y-1 text-xs max-h-[200px] overflow-auto">
                        <div className="flex justify-between text-muted-foreground/60 font-medium pb-1 border-b border-border/50">
                          <span>Date</span>
                          <span>Volume (USD)</span>
                        </div>
                        {items.map((i: any) => (
                          <div key={i.date} className="flex justify-between">
                            <span className="text-muted-foreground">{i.date}</span>
                            <span className="text-foreground tabular-nums">
                              $
                              {Number(i.volume).toLocaleString(undefined, {
                                maximumFractionDigits: 0,
                              })}
                            </span>
                          </div>
                        ))}
                        {!items.length && <p className="text-muted-foreground">No data</p>}
                      </div>
                    );
                  }}
                />

                {/* Q15. Historical Liquidity of Protocol (real /statistics/ API) */}
                <QueryPanel
                  title="Historical Liquidity of Protocol"
                  endpoint="statistics?period=totals&size=14"
                  fields={[]}
                  autoFetch
                  badge="/statistics/totals"
                  renderResult={(d) => {
                    const items = d.items ?? [];
                    return (
                      <div className="rounded-lg bg-secondary p-3 space-y-1 text-xs max-h-[200px] overflow-auto">
                        <div className="flex justify-between text-muted-foreground/60 font-medium pb-1 border-b border-border/50">
                          <span>Date</span>
                          <span>TVL (USD)</span>
                        </div>
                        {items.map((i: any) => (
                          <div key={i.date} className="flex justify-between">
                            <span className="text-muted-foreground">{i.date}</span>
                            <span className="text-foreground tabular-nums">
                              $
                              {Number(i.liquidity).toLocaleString(undefined, {
                                maximumFractionDigits: 0,
                              })}
                            </span>
                          </div>
                        ))}
                        {!items.length && <p className="text-muted-foreground">No data</p>}
                      </div>
                    );
                  }}
                />

                {/* Pooled Tokens */}
                <QueryPanel
                  title="Pooled Tokens"
                  endpoint="tokens?size=50"
                  fields={[]}
                  autoFetch
                  badge="/tokens"
                  renderResult={(d) => {
                    const tokens = d.tokens ?? [];
                    return (
                      <div className="rounded-lg bg-secondary p-3 space-y-1 text-xs max-h-[200px] overflow-auto">
                        <p className="text-muted-foreground/60 text-[10px] uppercase pb-1">
                          {d.total ?? tokens.length} tokens with pools
                        </p>
                        {tokens.slice(0, 20).map((t: any, i: number) => (
                          <div key={t.address || i} className="flex justify-between">
                            <span className="text-foreground font-medium">{t.code}</span>
                            <span className="text-muted-foreground font-mono text-[10px]">
                              {t.address?.slice(0, 12)}...
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  }}
                />

                {/* Q16. Get Aquarius Bribes */}
                <QueryPanel
                  title="Get Aquarius Bribes"
                  endpoint="rewards"
                  fields={[]}
                  badge="governance"
                  autoFetch
                  renderResult={(d) => (
                    <div className="rounded-lg bg-secondary p-3 space-y-1.5 text-xs">
                      <p className="text-muted-foreground/60 text-[10px] uppercase">
                        Bribes (via Reward API)
                      </p>
                      <p className="text-muted-foreground text-[10px]">
                        Total daily rewards across all markets:
                      </p>
                      <p className="text-foreground font-semibold tabular-nums">
                        {Number(d.totalDailyReward ?? 0).toLocaleString()} AQUA/day
                      </p>
                      <p className="text-[10px] text-muted-foreground/50">
                        Bribe distribution details require governance API integration
                      </p>
                    </div>
                  )}
                />

                {/* Q17. Get Markets Info in Vote */}
                <QueryPanel
                  title="Get Markets Info in Vote"
                  endpoint="rewards"
                  fields={[]}
                  badge="governance"
                  autoFetch
                  renderResult={(d) => {
                    const rewards = d.rewards ?? [];
                    return (
                      <div className="rounded-lg bg-secondary p-3 space-y-1.5 text-xs">
                        <p className="text-muted-foreground/60 text-[10px] uppercase">
                          Vote-Eligible Markets
                        </p>
                        {rewards.slice(0, 8).map((r: any) => (
                          <div key={r.pair} className="flex justify-between">
                            <span className="text-foreground">{r.pair}</span>
                            <span className="text-muted-foreground tabular-nums">
                              {Number(r.dailyTotalReward).toFixed(0)} AQUA/day
                            </span>
                          </div>
                        ))}
                        {rewards.length > 8 && (
                          <p className="text-muted-foreground/50 text-[10px]">
                            +{rewards.length - 8} more markets
                          </p>
                        )}
                      </div>
                    );
                  }}
                />
              </div>
            </div>

            {/* ── Yield (full table) ── */}
            <div>
              <Typography
                variant="small"
                className="text-muted-foreground/60 text-[11px] font-semibold uppercase tracking-wider mb-3"
              >
                Yield Discovery
              </Typography>
              <QueryPanel
                title="Yield Opportunities"
                endpoint="yield"
                fields={[]}
                autoFetch
                renderResult={(d) => <YieldTable data={d} />}
              />
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            OPERATIONS TAB — 6 panels
        ═══════════════════════════════════════════════════════════ */}
        {tab === "operations" && (
          <div className="space-y-4">
            {/* Swap */}
            <div>
              <Typography
                variant="small"
                className="text-muted-foreground/60 text-[11px] font-semibold uppercase tracking-wider mb-3"
              >
                Swap
              </Typography>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                <OpPanel
                  title="Swap (Slippage 1%)"
                  endpoint="swap"
                  operation="swap"
                  fields={[
                    {
                      key: "tokenIn",
                      label: "Token In (symbol or contract)",
                      placeholder: "XLM or C...",
                    },
                    {
                      key: "tokenOut",
                      label: "Token Out (symbol or contract)",
                      placeholder: "USDC or C...",
                    },
                    { key: "amount", label: "Amount", placeholder: "12" },
                    { key: "from", label: "From Address", placeholder: "G..." },
                    { key: "slippageBps", label: "Slippage (bps)", placeholder: "100 = 1%" },
                  ]}
                  defaults={{
                    tokenIn: "XLM",
                    tokenOut: "USDC",
                    amount: "12",
                    from: walletAddress ?? "",
                    slippageBps: "100",
                  }}
                />
              </div>
            </div>

            {/* Liquidity — pool picker + deposit/withdraw */}
            <div>
              <Typography
                variant="small"
                className="text-muted-foreground/60 text-[11px] font-semibold uppercase tracking-wider mb-3"
              >
                Liquidity
              </Typography>

              {/* Pool picker for liquidity ops */}
              <div className="mb-4 flex items-center gap-3 flex-wrap">
                <label className="text-muted-foreground text-xs font-medium">Liquidity Pool:</label>
                <div className="relative">
                  <select
                    className="appearance-none bg-secondary border border-border rounded px-3 py-1.5 pr-7 text-sm text-foreground focus:outline-none focus:border-primary/50 cursor-pointer"
                    value={lpPool}
                    onChange={(e) => setLpPool(e.target.value)}
                  >
                    {pools.map((p) => (
                      <option key={p.address} value={p.address}>
                        {p.label} — {p.address.slice(0, 8)}...
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                </div>
                {lpPoolInfo && (
                  <span
                    className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${
                      lpPoolInfo.pool_type === "concentrated"
                        ? "bg-violet-500/20 text-violet-400"
                        : lpPoolInfo.pool_type === "stable"
                          ? "bg-blue-500/20 text-blue-400"
                          : "bg-emerald-500/20 text-emerald-400"
                    }`}
                  >
                    {lpPoolInfo.pool_type?.replace(/_/g, " ") ?? "AMM"}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DepositPanel poolAddress={lpPool} walletAddress={walletAddress ?? ""} />
                <WithdrawPanel poolAddress={lpPool} walletAddress={walletAddress ?? ""} />
              </div>
            </div>

            {/* Other ops */}
            <div>
              <Typography
                variant="small"
                className="text-muted-foreground/60 text-[11px] font-semibold uppercase tracking-wider mb-3"
              >
                Governance
              </Typography>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {/* Op4. Lock AQUA */}
                <OpPanel
                  title="Lock AQUA for ICE"
                  endpoint="lock-aqua"
                  operation="lock_aqua"
                  fields={[
                    { key: "from", label: "From Address", placeholder: "G..." },
                    { key: "amount", label: "AQUA Amount", placeholder: "1000" },
                    { key: "lockPeriodDays", label: "Lock Period (days)", placeholder: "365" },
                  ]}
                  defaults={{ from: walletAddress ?? "", amount: "1000", lockPeriodDays: "365" }}
                />

                {/* Op5. Delegate my ICE */}
                <OpPanel
                  title="Delegate my ICE"
                  endpoint="delegate-ice"
                  operation="delegate_ice"
                  fields={[
                    { key: "from", label: "From Address", placeholder: "G..." },
                    { key: "delegateTo", label: "Delegate To", placeholder: "G..." },
                    { key: "amount", label: "ICE Amount", placeholder: "1000" },
                  ]}
                  defaults={{ from: walletAddress ?? "", delegateTo: "", amount: "1000" }}
                />

                {/* Op6. DownVote/Upvote */}
                <OpPanel
                  title="DownVote / Upvote"
                  endpoint="vote"
                  operation="vote"
                  fields={[
                    { key: "from", label: "From Address", placeholder: "G..." },
                    { key: "marketKey", label: "Market Key (pair)", placeholder: "XLM/USDC" },
                    { key: "amount", label: "Vote Amount (ICE)", placeholder: "100" },
                    { key: "direction", label: "Direction (up/down)", placeholder: "up" },
                  ]}
                  defaults={{
                    from: walletAddress ?? "",
                    marketKey: "",
                    amount: "100",
                    direction: "up",
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Footer ── */}
        <div className="border-t border-border pt-4 text-center">
          <Typography variant="small" className="text-muted-foreground/40 text-xs">
            Aquarius AMM Playground · 6 operations + 17 queries · SDK-backed queries · MCP-backed
            operations · Operations build XDR only — wallet signing required to submit on-chain
          </Typography>
        </div>
      </div>
    </StreamContext.Provider>
  );
}
