"use client";

/**
 * Soroswap DEX Playground — /playground/soroswap
 *
 * Features: 3 Operations (Swap, Add Liquidity, Remove Liquidity)
 *           8 Queries (Pools, Pool Detail, Quote, Positions, Yield, Price, Pairs, Pool Liquidity)
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { Loader2, RefreshCw, Zap } from "lucide-react";
import { StreamContext, type StreamContextType } from "@/features/chat/providers/stream-provider";
import {
  SoroswapPoolsCard,
  SoroswapPoolDetailCard,
  SoroswapPositionsCard,
  SoroswapTxCard,
} from "@/features/protocols/cards/soroswap";
import {
  normalizeSoroswapPoolsFromSdk,
  normalizeSoroswapQuoteFromSdk,
  normalizeSoroswapPositionsFromSdk,
  normalizeSoroswapYieldFromSdk,
} from "@/features/protocols/adapters/soroswap-from-sdk";
import { useWallet } from "@/shared/context/wallet-context";
import { Button } from "@/shared/ui/button";
import { Typography } from "@/shared/ui/typography";

const MOCK_STREAM = {
  messages: [], values: {}, isLoading: false, error: undefined, interrupt: undefined,
  submit: async () => {}, stop: () => {}, getMessagesMetadata: () => undefined,
} as unknown as StreamContextType;

const SDK_URL = "/api/soroswap";
const OP_URL = "/api/soroswap/op";

const inputCls = "w-full rounded-lg bg-secondary border border-border px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20";
const labelCls = "block text-muted-foreground text-[11px] mb-0.5 font-medium";
const panelCls = "rounded-xl border border-border bg-card/80 p-4 space-y-3 flex flex-col";
const selectCls = "w-full rounded-lg bg-secondary border border-border px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-primary/50 cursor-pointer";

interface Field { key: string; label: string; placeholder?: string }

// ── QueryPanel ──────────────────────────────────────────────────
function QueryPanel({ title, endpoint, fields, defaults = {}, autoFetch = false, badge, renderResult }: {
  title: string; endpoint: string; fields: Field[]; defaults?: Record<string, string>;
  autoFetch?: boolean; badge?: string; renderResult?: (d: any) => React.ReactNode;
}) {
  const [form, setForm] = useState<Record<string, string>>(defaults);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autoFetched = useRef(false);

  useEffect(() => { setForm((p) => ({ ...defaults, ...p })); }, [JSON.stringify(defaults)]);

  const run = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams(Object.fromEntries(Object.entries(form).filter(([, v]) => v.trim()))).toString();
      const r = await fetch(`${SDK_URL}/${endpoint}${params ? `?${params}` : ""}`);
      const d = await r.json();
      if (!d.success) setError(d.error ?? "Failed"); else setResult(d);
    } catch (e) { setError(e instanceof Error ? e.message : "Network error"); }
    finally { setLoading(false); }
  }, [form, endpoint]);

  useEffect(() => {
    if (!autoFetch || autoFetched.current) return;
    if (fields.length === 0 || fields.every((f) => (form[f.key] ?? "").trim())) { autoFetched.current = true; run(); }
  }, [autoFetch, form]);

  return (
    <div className={panelCls}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-violet-400 uppercase tracking-wider">{title}</span>
          {badge && <span className="text-[9px] px-1.5 py-px rounded-full bg-muted text-muted-foreground font-medium">{badge}</span>}
        </div>
        <span className="text-[10px] text-muted-foreground/60 font-mono">GET /{endpoint}</span>
      </div>
      {fields.map((f) => (
        <div key={f.key}><label className={labelCls}>{f.label}</label>
          <input className={inputCls} value={form[f.key] ?? ""} placeholder={f.placeholder ?? f.label}
            onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))} /></div>
      ))}
      <Button variant="ghost" size="sm" className="border border-violet-500/30 bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 gap-1.5" onClick={run} disabled={loading}>
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />} Fetch
      </Button>
      {error && <Typography variant="small" className="text-red-400 text-xs bg-red-500/10 rounded p-2">{error}</Typography>}
      {result && <div className="mt-1">{renderResult ? renderResult(result) : <pre className="max-h-[300px] overflow-auto rounded-lg bg-muted/30 p-3 text-xs text-muted-foreground font-mono">{JSON.stringify(result, null, 2)}</pre>}</div>}
    </div>
  );
}

// ── OpPanel ─────────────────────────────────────────────────────
function OpPanel({ title, endpoint, operation, fields, defaults = {} }: {
  title: string; endpoint: string; operation: string; fields: Field[]; defaults?: Record<string, string>;
}) {
  const { address } = useWallet();
  const [form, setForm] = useState<Record<string, string>>({ ...defaults, fromAddress: address ?? "" });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (address) setForm((p) => ({ ...p, fromAddress: address, to: address })); }, [address]);
  useEffect(() => {
    setForm((p) => { const n = { ...p }; for (const [k, v] of Object.entries(defaults)) { if (!p[k]) n[k] = v; } if (address) { n.fromAddress = address; n.to = address; } return n; });
  }, [JSON.stringify(defaults), address]);

  const build = useCallback(async () => {
    setLoading(true); setError(null); setResult(null);
    try {
      const r = await fetch(`${OP_URL}/${endpoint}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const d = await r.json();
      if (!d.success) setError(d.error ?? "Failed"); else setResult(d);
    } catch (e) { setError(e instanceof Error ? e.message : "Network error"); }
    finally { setLoading(false); }
  }, [form, endpoint]);

  return (
    <div className={panelCls}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">{title}</span>
        <span className="text-[10px] text-muted-foreground/60 font-mono">POST /op/{endpoint}</span>
      </div>
      {fields.map((f) => (
        <div key={f.key}><label className={labelCls}>{f.label}</label>
          <input className={inputCls} value={form[f.key] ?? ""} placeholder={f.placeholder ?? f.label}
            onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))} /></div>
      ))}
      <Button variant="ghost" size="sm" className="border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 gap-1.5" onClick={build} disabled={loading}>
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />} Build TX
      </Button>
      {error && <Typography variant="small" className="text-red-400 text-xs bg-red-500/10 rounded p-2">{error}</Typography>}
      {result?.xdr && (
        <div className="mt-1">
          <SoroswapTxCard tx={{
            operation: String(result.operation ?? operation),
            xdr: String(result.xdr ?? ""),
            estimatedFee: result.estimatedFee ? String(result.estimatedFee) : undefined,
            from: form.fromAddress ?? form.to ?? undefined,
            tokenIn: form.assetIn ?? undefined,
            tokenOut: form.assetOut ?? undefined,
            amount: form.amount ?? undefined,
            amountA: form.amountA ?? undefined,
            amountB: form.amountB ?? undefined,
            assetA: form.assetA ?? undefined,
            assetB: form.assetB ?? undefined,
            route: result.route ?? undefined,
            context: result.context,
          }} mode="playground" />
        </div>
      )}
    </div>
  );
}

// ── PoolsFilterPanel ────────────────────────────────────────────
function PoolsFilterPanel() {
  const [protocol, setProtocol] = useState("soroswap");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const limit = 10;

  const fetchPools = useCallback(async (proto: string, pg: number) => {
    setLoading(true); setError(null);
    try {
      const r = await fetch(`${SDK_URL}/pools?protocol=${proto}&page=${pg}&limit=${limit}`);
      const d = await r.json();
      if (!d.success) setError(d.error ?? "Failed"); else setResult(d);
    } catch (e) { setError(e instanceof Error ? e.message : "Network error"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPools(protocol, page); }, [protocol, page, fetchPools]);

  const pagination = result?.pagination;
  const pools = result ? normalizeSoroswapPoolsFromSdk(result) : [];

  return (
    <div className={panelCls}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-violet-400 uppercase tracking-wider">List Pools</span>
        <span className="text-[10px] text-muted-foreground/60 font-mono">GET /pools</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <label className={labelCls}>Protocol</label>
          <select className={selectCls} value={protocol} onChange={(e) => { setProtocol(e.target.value); setPage(1); }}>
            <option value="soroswap">Soroswap</option>
            <option value="phoenix">Phoenix</option>
            <option value="aqua">Aquarius</option>
            <option value="sdex">SDEX</option>
            <option value="all">All Protocols</option>
          </select>
        </div>
        {pagination && <div className="text-right pt-4"><p className="text-[10px] text-muted-foreground">{pagination.totalCount} pools</p></div>}
      </div>
      <Button variant="ghost" size="sm" className="border border-violet-500/30 bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 gap-1.5" onClick={() => fetchPools(protocol, page)} disabled={loading}>
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />} Fetch
      </Button>
      {error && <Typography variant="small" className="text-red-400 text-xs bg-red-500/10 rounded p-2">{error}</Typography>}
      {pools.length > 0 && <div className="mt-1"><SoroswapPoolsCard pools={pools} mode="playground" /></div>}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <Button variant="ghost" size="sm" className="text-xs h-7 px-3" disabled={!pagination.hasPrev || loading} onClick={() => setPage((p) => p - 1)}>Prev</Button>
          <span className="text-[10px] text-muted-foreground tabular-nums">Page {pagination.page} / {pagination.totalPages}</span>
          <Button variant="ghost" size="sm" className="text-xs h-7 px-3" disabled={!pagination.hasNext || loading} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}

// ── YieldTable ──────────────────────────────────────────────────
function YieldTable({ data }: { data: any }) {
  const yields = normalizeSoroswapYieldFromSdk(data);
  if (!yields.length) return <p className="text-xs text-muted-foreground">No yield opportunities.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead><tr className="text-muted-foreground/60 border-b border-border">
          <th className="text-left py-1.5 font-medium">Pool</th>
          <th className="text-right py-1.5 font-medium">Fee APY</th>
          <th className="text-right py-1.5 font-medium">TVL</th>
          <th className="text-right py-1.5 font-medium">Fee</th>
        </tr></thead>
        <tbody>
          {yields.slice(0, 20).map((y) => (
            <tr key={y.poolAddress ?? y.name} className="border-b border-border/50 hover:bg-muted/20">
              <td className="py-1.5 text-foreground font-medium">{y.assets.join(" / ")}</td>
              <td className="py-1.5 text-right tabular-nums">{y.apy.base != null ? `${Number(y.apy.base).toFixed(2)}%` : "—"}</td>
              <td className="py-1.5 text-right tabular-nums text-muted-foreground">{y.tvl != null ? `$${Number(y.tvl).toLocaleString()}` : "—"}</td>
              <td className="py-1.5 text-right tabular-nums text-muted-foreground">{y.fee ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Main ────────────────────────────────────────────────────────
export default function SoroswapPlaygroundPage() {
  const { address: walletAddress } = useWallet();
  const [tab, setTab] = useState<"queries" | "operations">("queries");
  const [networkInfo, setNetworkInfo] = useState("");

  useEffect(() => {
    fetch(`${SDK_URL}/pools?limit=1`).then((r) => r.json()).then((d) => { if (d.network) setNetworkInfo(d.network); }).catch(() => {});
  }, []);

  const XLM = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC";
  const USDC = "CAQCFVLOBK5GIULPNZRGATJJMIZL5BSP7X5YJVMGCPTUEPFM4AVSRCJU";

  return (
    <StreamContext.Provider value={MOCK_STREAM}>
      <div className="min-h-screen bg-background text-foreground p-6 space-y-6">

        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <Typography as="h1" variant="h3" weight="bold" className="text-foreground">Soroswap DEX Playground</Typography>
              <Typography variant="p" className="text-muted-foreground text-sm mt-1">
                Aggregator: Soroswap + Phoenix + Aquarius + SDEX.{" "}
                <span className="font-mono text-violet-400 text-xs">/api/soroswap/...</span>
              </Typography>
            </div>
            <div className="flex items-center gap-2">
              {networkInfo && <span className="text-[11px] px-2 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-medium uppercase">{networkInfo}</span>}
              {walletAddress && <span className="text-[11px] px-2 py-0.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-400 font-mono">{walletAddress.slice(0, 8)}...</span>}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-card rounded-lg p-1 w-fit border border-border">
          {([{ key: "queries" as const, label: "Queries (8)" }, { key: "operations" as const, label: "Operations (3)" }]).map((t) => (
            <Button key={t.key} variant="ghost" onClick={() => setTab(t.key)}
              className={`px-5 py-1.5 rounded-md text-sm font-medium transition-colors h-auto ${tab === t.key ? "bg-accent text-foreground shadow hover:bg-accent" : "text-muted-foreground hover:text-foreground"}`}>
              {t.label}
            </Button>
          ))}
        </div>

        {/* ═══ Queries ═══ */}
        {tab === "queries" && (
          <div className="space-y-6">
            <div>
              <Typography variant="small" className="text-muted-foreground/60 text-[11px] font-semibold uppercase tracking-wider mb-3">Pool Queries</Typography>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                <PoolsFilterPanel />

                <QueryPanel title="Pool Detail" endpoint="pools" badge="by pair"
                  fields={[
                    { key: "tokenA", label: "Token A", placeholder: "XLM or C..." },
                    { key: "tokenB", label: "Token B", placeholder: "USDC or C..." },
                  ]}
                  defaults={{ tokenA: "XLM", tokenB: "USDC" }}
                  renderResult={(d) => {
                    const pools = normalizeSoroswapPoolsFromSdk(d);
                    return pools.length ? <SoroswapPoolDetailCard pool={pools[0]!} mode="playground" /> : <p className="text-xs text-muted-foreground">No pool found</p>;
                  }}
                />

                <QueryPanel title="Pool Liquidity" endpoint="pools" badge="reserves"
                  fields={[
                    { key: "tokenA", label: "Token A", placeholder: "XLM" },
                    { key: "tokenB", label: "Token B", placeholder: "USDC" },
                  ]}
                  defaults={{ tokenA: "XLM", tokenB: "USDC" }}
                  renderResult={(d) => {
                    const pools = normalizeSoroswapPoolsFromSdk(d);
                    if (!pools.length) return <p className="text-xs text-muted-foreground">No pool found</p>;
                    const p = pools[0]!;
                    return (
                      <div className="rounded-lg bg-secondary p-3 space-y-1 text-xs">
                        <div className="flex justify-between"><span className="text-muted-foreground">Reserve {p.tokenA}</span><span className="text-foreground tabular-nums">{p.reserveA != null ? (Number(p.reserveA) / 1e7).toLocaleString() : "—"}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Reserve {p.tokenB}</span><span className="text-foreground tabular-nums">{p.reserveB != null ? (Number(p.reserveB) / 1e7).toLocaleString() : "—"}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">TVL</span><span className="text-foreground tabular-nums">{p.tvl != null ? `$${Number(p.tvl).toLocaleString()}` : "—"}</span></div>
                      </div>
                    );
                  }}
                />
              </div>
            </div>

            <div>
              <Typography variant="small" className="text-muted-foreground/60 text-[11px] font-semibold uppercase tracking-wider mb-3">Swap & Pricing</Typography>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                <QueryPanel title="Swap Quote" endpoint="quote"
                  fields={[
                    { key: "tokenIn", label: "Token In", placeholder: "XLM" },
                    { key: "tokenOut", label: "Token Out", placeholder: "USDC" },
                    { key: "amount", label: "Amount", placeholder: "12" },
                  ]}
                  defaults={{ tokenIn: "XLM", tokenOut: "USDC", amount: "12" }}
                  renderResult={(d) => {
                    const q = normalizeSoroswapQuoteFromSdk(d);
                    if (!q) return null;
                    return (
                      <div className="rounded-lg bg-secondary p-3 space-y-1 text-xs">
                        <div className="flex justify-between"><span className="text-muted-foreground">Amount In</span><span className="text-foreground tabular-nums">{q.amountIn}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Amount Out</span><span className="text-foreground tabular-nums font-semibold">{q.amountOut}</span></div>
                        {q.feePercent && <div className="flex justify-between"><span className="text-muted-foreground">Fee</span><span className="text-foreground">{q.feePercent}</span></div>}
                        {q.route && q.route.length > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Route</span><span className="text-foreground">{q.route.join(" → ")}</span></div>}
                        {q.estimatedTime && <div className="flex justify-between"><span className="text-muted-foreground">Est. Time</span><span className="text-foreground">{q.estimatedTime}</span></div>}
                      </div>
                    );
                  }}
                />

                <QueryPanel title="Get Price" endpoint="price"
                  fields={[
                    { key: "asset", label: "Asset", placeholder: "XLM" },
                    { key: "currency", label: "Currency", placeholder: "USD" },
                  ]}
                  defaults={{ asset: "XLM", currency: "USD" }}
                />
              </div>
            </div>

            <div>
              <Typography variant="small" className="text-muted-foreground/60 text-[11px] font-semibold uppercase tracking-wider mb-3">Positions & Yield</Typography>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                <QueryPanel title="My LP Positions" endpoint="positions"
                  fields={[{ key: "user", label: "User Address", placeholder: "G..." }]}
                  defaults={{ user: walletAddress ?? "" }}
                  renderResult={(d) => {
                    const pos = normalizeSoroswapPositionsFromSdk(d);
                    return pos ? <SoroswapPositionsCard data={pos} mode="playground" /> : null;
                  }}
                />

                <div className="md:col-span-2">
                  <QueryPanel title="Yield Opportunities" endpoint="yield" fields={[]} autoFetch
                    renderResult={(d) => <YieldTable data={d} />}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ Operations ═══ */}
        {tab === "operations" && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <OpPanel title="Swap" endpoint="swap" operation="swap"
              fields={[
                { key: "assetIn", label: "Asset In (contract)", placeholder: "C... or XLM" },
                { key: "assetOut", label: "Asset Out (contract)", placeholder: "C... or USDC" },
                { key: "amount", label: "Amount", placeholder: "12" },
                { key: "tradeType", label: "Trade Type", placeholder: "EXACT_IN" },
                { key: "fromAddress", label: "From Address", placeholder: "G..." },
                { key: "slippageBps", label: "Slippage (bps)", placeholder: "100" },
              ]}
              defaults={{ assetIn: XLM, assetOut: USDC, amount: "12", tradeType: "EXACT_IN", fromAddress: walletAddress ?? "", slippageBps: "100" }}
            />

            <OpPanel title="Add Liquidity" endpoint="add-liquidity" operation="add_liquidity"
              fields={[
                { key: "assetA", label: "Asset A (contract)", placeholder: "C..." },
                { key: "assetB", label: "Asset B (contract)", placeholder: "C..." },
                { key: "amountA", label: "Amount A", placeholder: "12" },
                { key: "amountB", label: "Amount B", placeholder: "5" },
                { key: "to", label: "To Address", placeholder: "G..." },
              ]}
              defaults={{ assetA: XLM, assetB: USDC, amountA: "10", amountB: "5", to: walletAddress ?? "" }}
            />

            <OpPanel title="Remove Liquidity" endpoint="remove-liquidity" operation="remove_liquidity"
              fields={[
                { key: "assetA", label: "Asset A (contract)", placeholder: "C..." },
                { key: "assetB", label: "Asset B (contract)", placeholder: "C..." },
                { key: "liquidity", label: "LP Tokens", placeholder: "100" },
                { key: "amountA", label: "Min Amount A", placeholder: "0" },
                { key: "amountB", label: "Min Amount B", placeholder: "0" },
                { key: "to", label: "To Address", placeholder: "G..." },
              ]}
              defaults={{ assetA: XLM, assetB: USDC, liquidity: "100", amountA: "0", amountB: "0", to: walletAddress ?? "" }}
            />
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-border pt-4 text-center">
          <Typography variant="small" className="text-muted-foreground/40 text-xs">
            Soroswap DEX Playground · Aggregator: Soroswap + Phoenix + Aquarius + SDEX ·
            {" "}Operations build XDR only — wallet signing required
          </Typography>
        </div>
      </div>
    </StreamContext.Provider>
  );
}
