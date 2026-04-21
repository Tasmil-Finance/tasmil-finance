"use client";

/**
 * Allbridge Playground — /playground/allbridge
 *
 * Full-featured playground covering all Allbridge capabilities:
 * - Bridge: 3 queries (supported chains, routes, quote) + 1 operation (bridge transfer)
 * - LP Pools: 5 queries (pool list, pool info, user balance, deposit quote, withdraw quote) + 3 operations (deposit, withdraw, claim rewards)
 *
 * Total: 8 queries + 4 operations
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { Loader2, RefreshCw, Zap, Globe } from "lucide-react";
import { StreamContext, type StreamContextType } from "@/features/chat/providers/stream-provider";
import {
  AllbridgePoolsCard,
  AllbridgePoolInfoCard,
  AllbridgeUserBalanceCard,
  AllbridgeQuoteCard,
  AllbridgeRoutesCard,
  AllbridgeTxCard,
} from "@/features/protocols/cards/allbridge";
import {
  normalizeAllbridgePoolsFromSdk,
  normalizeAllbridgePoolInfoFromSdk,
  normalizeAllbridgeUserBalanceFromSdk,
  normalizeAllbridgeQuoteFromSdk,
  normalizeAllbridgeRoutesFromSdk,
  normalizeAllbridgeSupportedChainsFromSdk,
  normalizeAllbridgeDepositQuoteFromSdk,
  normalizeAllbridgeWithdrawQuoteFromSdk,
} from "@/features/protocols/adapters/allbridge-from-sdk";
import { useWallet } from "@/shared/context/wallet-context";
import { Button } from "@/shared/ui/button";
import { Typography } from "@/shared/ui/typography";

// ── Mock stream ─────────────────────────────────────────────────
const MOCK_STREAM = {
  messages: [], values: {}, isLoading: false, error: undefined,
  interrupt: undefined, submit: async () => {}, stop: () => {},
  getMessagesMetadata: () => undefined,
} as unknown as StreamContextType;

const SDK_QUERY_URL = "/api/allbridge";
const MCP_URL = process.env["NEXT_PUBLIC_MCP_STELLAR_URL"] ?? "http://localhost:3009";
const MCP_QUERY_URL = `${MCP_URL}/allbridge/query`;
const MCP_OP_URL = `${MCP_URL}/allbridge/op`;

// ── Styles ──────────────────────────────────────────────────────
const inputCls = "w-full rounded-lg bg-secondary border border-border px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20";
const labelCls = "block text-muted-foreground text-[11px] mb-0.5 font-medium";
const panelCls = "rounded-xl border border-border bg-card/80 p-4 space-y-3 flex flex-col";
const selectCls = "w-full rounded-lg bg-secondary border border-border px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-primary/50 cursor-pointer";

// ── Types ───────────────────────────────────────────────────────
interface Field {
  key: string;
  label: string;
  placeholder?: string;
  type?: "select";
  options?: { value: string; label: string }[];
}

// ── Supported chains ────────────────────────────────────────────
const CHAINS = [
  { value: "stellar", label: "Stellar" },
  { value: "ethereum", label: "Ethereum" },
  { value: "bsc", label: "BSC" },
  { value: "polygon", label: "Polygon" },
  { value: "avalanche", label: "Avalanche" },
  { value: "solana", label: "Solana" },
  { value: "arbitrum", label: "Arbitrum" },
  { value: "optimism", label: "Optimism" },
  { value: "base", label: "Base" },
  { value: "tron", label: "Tron" },
];

// ── QueryPanel ──────────────────────────────────────────────────
interface QueryPanelProps {
  title: string;
  endpoint: string;
  fields: Field[];
  defaults?: Record<string, string>;
  autoFetch?: boolean;
  renderResult?: (data: any) => React.ReactNode;
  badge?: string;
  /** Base URL — defaults to SDK route, set to MCP_QUERY_URL for on-chain queries */
  baseUrl?: string;
}

function QueryPanel({ title, endpoint, fields, defaults = {}, autoFetch = false, renderResult, badge, baseUrl = SDK_QUERY_URL }: QueryPanelProps) {
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
      const url = `${baseUrl}/${endpoint}${params ? `?${params}` : ""}`;
      const r = await fetch(url);
      const d = await r.json();
      if (!d.success) setError(d.error ?? "Request failed");
      else setResult(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : baseUrl !== SDK_QUERY_URL ? "Network error — is mcp-stellar running?" : "Network error");
    } finally {
      setLoading(false);
    }
  }, [form, endpoint, baseUrl]);

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
          <span className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wider">{title}</span>
          {badge && <span className="text-[9px] px-1.5 py-px rounded-full bg-muted text-muted-foreground font-medium">{badge}</span>}
        </div>
        <span className="text-[10px] text-muted-foreground/60 font-mono">{baseUrl === SDK_QUERY_URL ? "SDK" : "MCP"} GET /{endpoint}</span>
      </div>
      {fields.map((f) => (
        <div key={f.key}>
          <label className={labelCls}>{f.label}</label>
          {f.type === "select" && f.options ? (
            <select className={selectCls} value={form[f.key] ?? ""} onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}>
              {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          ) : (
            <input className={inputCls} value={form[f.key] ?? ""} placeholder={f.placeholder ?? f.label}
              onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))} />
          )}
        </div>
      ))}
      <Button variant="ghost" size="sm" className="border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 gap-1.5"
        onClick={run} disabled={loading}>
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
        Fetch
      </Button>
      {error && <Typography variant="small" className="text-red-400 text-xs bg-red-500/10 rounded p-2">{error}</Typography>}
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
        if (k === "from" || !prev[k]) next[k] = v;
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
      const r = await fetch(`${MCP_OP_URL}/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          // MCP REST routes expect accountAddress, fromAddress, toAddress
          accountAddress: form.from ?? form.accountAddress,
          fromAddress: form.from ?? form.fromAddress,
          toAddress: form.to ?? form.toAddress,
        }),
      });
      const d = await r.json();
      if (!d.success) setError(d.error ?? "Build failed");
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
        <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">{title}</span>
        <span className="text-[10px] text-muted-foreground/60 font-mono">MCP POST /op/{endpoint}</span>
      </div>
      {fields.map((f) => (
        <div key={f.key}>
          <label className={labelCls}>{f.label}</label>
          {f.type === "select" && f.options ? (
            <select className={selectCls} value={form[f.key] ?? ""} onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}>
              {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          ) : (
            <input className={inputCls} value={form[f.key] ?? ""} placeholder={f.placeholder ?? f.label}
              onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))} />
          )}
        </div>
      ))}
      <Button variant="ghost" size="sm" className="border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 gap-1.5"
        onClick={build} disabled={loading}>
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
        Build TX
      </Button>
      {error && <Typography variant="small" className="text-red-400 text-xs bg-red-500/10 rounded p-2">{error}</Typography>}
      {result && (result.xdr || result.transaction) && (
        <div className="mt-1">
          <AllbridgeTxCard
            tx={{
              operation,
              xdr: result.xdr ?? null,
              transaction: result.transaction,
              chain: form.chain ?? result.chain,
              symbol: form.symbol ?? result.symbol,
              amount: form.amount ?? result.amount,
              fromChain: form.fromChain ?? result.fromChain,
              toChain: form.toChain ?? result.toChain,
              asset: form.asset ?? result.asset,
              fromAddress: form.from ?? form.fromAddress ?? result.fromAddress,
              toAddress: form.to ?? form.toAddress ?? result.toAddress,
              poolAddress: result.poolAddress,
              provider: result.provider,
              earnedRewards: result.earnedRewards,
              note: result.note,
            }}
            mode="playground"
          />
        </div>
      )}
    </div>
  );
}

// ── Supported Chains Table ──────────────────────────────────────
function SupportedChainsTable({ data }: { data: any }) {
  const chains = normalizeAllbridgeSupportedChainsFromSdk(data);
  if (!chains.length) return <p className="text-xs text-muted-foreground">No chain data.</p>;

  return (
    <div className="space-y-2 max-h-[400px] overflow-auto">
      {chains.map((c) => (
        <div key={c.chain} className="rounded-lg border border-border/50 bg-secondary/30 p-3">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <Globe className="h-3.5 w-3.5 text-blue-400" />
              <span className="text-sm font-semibold text-foreground capitalize">{c.chain}</span>
            </div>
            <span className="text-[10px] text-muted-foreground font-mono">{c.chainSymbol}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {c.tokens.map((t) => (
              <span key={t.symbol} className="rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-foreground">
                {t.symbol}
              </span>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground/60 mt-1">{c.tokenCount} tokens</p>
        </div>
      ))}
    </div>
  );
}

// ── Main Playground ─────────────────────────────────────────────
export default function AllbridgePlaygroundPage() {
  const { address: walletAddress } = useWallet();
  const [tab, setTab] = useState<"queries" | "operations">("queries");
  const [networkInfo, setNetworkInfo] = useState("");

  // Load network info
  useEffect(() => {
    fetch(`${SDK_QUERY_URL}/supported-chains`)
      .then((r) => r.json())
      .then((d) => { if (d.network) setNetworkInfo(d.network); })
      .catch(() => {});
  }, []);

  const chainOptions = CHAINS;
  const tabs = [
    { key: "queries" as const, label: "Queries (8)" },
    { key: "operations" as const, label: "Operations (4)" },
  ];

  return (
    <StreamContext.Provider value={MOCK_STREAM}>
      <div className="min-h-screen bg-background text-foreground p-6 space-y-6">

        {/* ── Header ── */}
        <div className="space-y-3">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <Typography as="h1" variant="h3" weight="bold" className="text-foreground">
                Allbridge Playground
              </Typography>
              <Typography variant="p" className="text-muted-foreground text-sm mt-1">
                Cross-chain bridge + LP pools. 8 queries + 4 operations.{" "}
                <span className="font-mono text-cyan-400 text-xs">/api/allbridge/...</span>
                <span className="ml-2 text-[10px] text-amber-400">Mainnet only (LP pools)</span>
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
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-1 bg-card rounded-lg p-1 w-fit border border-border">
          {tabs.map((t) => (
            <Button key={t.key} variant="ghost" onClick={() => setTab(t.key)}
              className={`px-5 py-1.5 rounded-md text-sm font-medium transition-colors h-auto ${
                tab === t.key ? "bg-accent text-foreground shadow hover:bg-accent" : "text-muted-foreground hover:text-foreground"
              }`}>
              {t.label}
            </Button>
          ))}
        </div>

        {/* ═══════════════════════════════════════════════════════
            QUERY TAB — 8 panels
        ═══════════════════════════════════════════════════════ */}
        {tab === "queries" && (
          <div className="space-y-6">

            {/* ── Bridge Queries ── */}
            <div>
              <Typography variant="small" className="text-muted-foreground/60 text-[11px] font-semibold uppercase tracking-wider mb-3">
                Bridge Queries
              </Typography>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

                {/* Q1. Supported Chains (MCP — calls Allbridge API) */}
                <QueryPanel
                  title="Supported Chains"
                  endpoint="supported-chains"
                  baseUrl={MCP_QUERY_URL}
                  fields={[]}
                  autoFetch
                  renderResult={(d) => <SupportedChainsTable data={d} />}
                />

                {/* Q2. Bridge Routes (MCP) */}
                <QueryPanel
                  title="Bridge Routes"
                  endpoint="routes"
                  baseUrl={MCP_QUERY_URL}
                  fields={[
                    { key: "fromChain", label: "From Chain", type: "select", options: chainOptions },
                    { key: "toChain", label: "To Chain", type: "select", options: chainOptions },
                    { key: "asset", label: "Asset (optional)", placeholder: "USDC" },
                  ]}
                  defaults={{ fromChain: "stellar", toChain: "ethereum", asset: "" }}
                  renderResult={(d) => {
                    const routes = normalizeAllbridgeRoutesFromSdk(d);
                    return <AllbridgeRoutesCard routes={routes} mode="playground" />;
                  }}
                />

                {/* Q3. Bridge Quote (MCP) */}
                <QueryPanel
                  title="Bridge Quote"
                  endpoint="quote"
                  baseUrl={MCP_QUERY_URL}
                  fields={[
                    { key: "fromChain", label: "From Chain", type: "select", options: chainOptions },
                    { key: "toChain", label: "To Chain", type: "select", options: chainOptions },
                    { key: "asset", label: "Asset", placeholder: "USDC" },
                    { key: "amount", label: "Amount", placeholder: "100" },
                  ]}
                  defaults={{ fromChain: "stellar", toChain: "ethereum", asset: "USDC", amount: "100" }}
                  renderResult={(d) => {
                    const quote = normalizeAllbridgeQuoteFromSdk(d);
                    return quote
                      ? <AllbridgeQuoteCard quote={quote} fromChain={d.quote?.fromChain ?? "stellar"} toChain={d.quote?.toChain ?? "ethereum"} asset={d.quote?.asset ?? "USDC"} mode="playground" />
                      : null;
                  }}
                />
              </div>
            </div>

            {/* ── LP Pool Queries ── */}
            <div>
              <Typography variant="small" className="text-muted-foreground/60 text-[11px] font-semibold uppercase tracking-wider mb-3">
                Liquidity Pool Queries
              </Typography>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

                {/* Q4. LP Pools by Chain (MCP) */}
                <QueryPanel
                  title="LP Pools by Chain"
                  endpoint="pools"
                  baseUrl={MCP_QUERY_URL}
                  fields={[
                    { key: "chain", label: "Chain", type: "select", options: [{ value: "all", label: "All Chains" }, ...chainOptions] },
                  ]}
                  defaults={{ chain: "stellar" }}
                  autoFetch
                  renderResult={(d) => {
                    const pools = normalizeAllbridgePoolsFromSdk(d);
                    return <AllbridgePoolsCard pools={pools} mode="playground" />;
                  }}
                />

                {/* Q5. Pool Info (on-chain state via MCP) */}
                <QueryPanel
                  title="Pool Info (On-Chain)"
                  endpoint="pool-info"
                  baseUrl={MCP_QUERY_URL}
                  fields={[
                    { key: "chain", label: "Chain", type: "select", options: chainOptions },
                    { key: "symbol", label: "Token Symbol", placeholder: "USDC" },
                  ]}
                  defaults={{ chain: "stellar", symbol: "USDC" }}
                  renderResult={(d) => {
                    const info = normalizeAllbridgePoolInfoFromSdk(d);
                    return info ? <AllbridgePoolInfoCard data={info} mode="playground" /> : null;
                  }}
                />

                {/* Q6. User LP Balance (MCP) */}
                <QueryPanel
                  title="User LP Balance"
                  endpoint="user-balance"
                  baseUrl={MCP_QUERY_URL}
                  fields={[
                    { key: "chain", label: "Chain", type: "select", options: chainOptions },
                    { key: "symbol", label: "Token Symbol", placeholder: "USDC" },
                    { key: "accountAddress", label: "Wallet Address", placeholder: "G..." },
                  ]}
                  defaults={{ chain: "stellar", symbol: "USDC", accountAddress: walletAddress ?? "" }}
                  renderResult={(d) => {
                    const balance = normalizeAllbridgeUserBalanceFromSdk(d);
                    return balance ? <AllbridgeUserBalanceCard data={balance} mode="playground" /> : null;
                  }}
                />

                {/* Q7. Deposit Quote (MCP) */}
                <QueryPanel
                  title="Deposit Quote"
                  endpoint="deposit-quote"
                  baseUrl={MCP_QUERY_URL}
                  fields={[
                    { key: "chain", label: "Chain", type: "select", options: chainOptions },
                    { key: "symbol", label: "Token Symbol", placeholder: "USDC" },
                    { key: "amount", label: "Amount", placeholder: "100" },
                  ]}
                  defaults={{ chain: "stellar", symbol: "USDC", amount: "100" }}
                  renderResult={(d) => {
                    const quote = normalizeAllbridgeDepositQuoteFromSdk(d);
                    if (!quote) return null;
                    return (
                      <div className="rounded-lg bg-secondary p-3 space-y-1.5 text-xs">
                        <p className="text-muted-foreground/60 text-[10px] uppercase">Deposit Preview</p>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Deposit</span>
                          <span className="text-foreground font-medium">{quote.amountIn} {quote.symbol}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">LP Tokens Received</span>
                          <span className="text-emerald-400 font-semibold tabular-nums">{quote.lpTokensReceived}</span>
                        </div>
                        {quote.apr7d != null && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">APR (7d)</span>
                            <span className="text-foreground">{String(quote.apr7d)}</span>
                          </div>
                        )}
                        {quote.note && <p className="text-[10px] text-muted-foreground/70 pt-1">{quote.note}</p>}
                      </div>
                    );
                  }}
                />

                {/* Q8. Withdraw Quote (MCP) */}
                <QueryPanel
                  title="Withdraw Quote"
                  endpoint="withdraw-quote"
                  baseUrl={MCP_QUERY_URL}
                  fields={[
                    { key: "chain", label: "Chain", type: "select", options: chainOptions },
                    { key: "symbol", label: "Token Symbol", placeholder: "USDC" },
                    { key: "amount", label: "LP Amount", placeholder: "100" },
                    { key: "accountAddress", label: "Wallet Address", placeholder: "G..." },
                  ]}
                  defaults={{ chain: "stellar", symbol: "USDC", amount: "100", accountAddress: walletAddress ?? "" }}
                  renderResult={(d) => {
                    const quote = normalizeAllbridgeWithdrawQuoteFromSdk(d);
                    if (!quote) return null;
                    return (
                      <div className="rounded-lg bg-secondary p-3 space-y-1.5 text-xs">
                        <p className="text-muted-foreground/60 text-[10px] uppercase">Withdraw Preview</p>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">LP Tokens Burned</span>
                          <span className="text-foreground font-medium">{quote.lpAmountIn}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Tokens Received</span>
                          <span className="text-emerald-400 font-semibold tabular-nums">{quote.tokensReceived} {quote.symbol}</span>
                        </div>
                        {quote.note && <p className="text-[10px] text-muted-foreground/70 pt-1">{quote.note}</p>}
                      </div>
                    );
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
            OPERATIONS TAB — 4 panels
        ═══════════════════════════════════════════════════════ */}
        {tab === "operations" && (
          <div className="space-y-6">

            {/* ── Bridge Transfer ── */}
            <div>
              <Typography variant="small" className="text-muted-foreground/60 text-[11px] font-semibold uppercase tracking-wider mb-3">
                Bridge Transfer
              </Typography>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                <OpPanel
                  title="Bridge Transfer"
                  endpoint="bridge"
                  operation="bridge"
                  fields={[
                    { key: "fromChain", label: "From Chain", type: "select", options: chainOptions },
                    { key: "toChain", label: "To Chain", type: "select", options: chainOptions },
                    { key: "asset", label: "Asset", placeholder: "USDC" },
                    { key: "amount", label: "Amount", placeholder: "100" },
                    { key: "from", label: "From Address", placeholder: "G... (source)" },
                    { key: "to", label: "To Address", placeholder: "0x... (destination)" },
                  ]}
                  defaults={{ fromChain: "stellar", toChain: "ethereum", asset: "USDC", amount: "100", from: walletAddress ?? "", to: "" }}
                />
              </div>
            </div>

            {/* ── LP Operations ── */}
            <div>
              <Typography variant="small" className="text-muted-foreground/60 text-[11px] font-semibold uppercase tracking-wider mb-3">
                Liquidity Pool Operations
              </Typography>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

                {/* Op2. Pool Deposit */}
                <OpPanel
                  title="Pool Deposit"
                  endpoint="pool-deposit"
                  operation="pool-deposit"
                  fields={[
                    { key: "chain", label: "Chain", type: "select", options: chainOptions },
                    { key: "symbol", label: "Token Symbol", placeholder: "USDC" },
                    { key: "amount", label: "Amount", placeholder: "100" },
                    { key: "from", label: "Wallet Address", placeholder: "G..." },
                  ]}
                  defaults={{ chain: "stellar", symbol: "USDC", amount: "100", from: walletAddress ?? "" }}
                />

                {/* Op3. Pool Withdraw */}
                <OpPanel
                  title="Pool Withdraw"
                  endpoint="pool-withdraw"
                  operation="pool-withdraw"
                  fields={[
                    { key: "chain", label: "Chain", type: "select", options: chainOptions },
                    { key: "symbol", label: "Token Symbol", placeholder: "USDC" },
                    { key: "amount", label: "LP Amount", placeholder: "100" },
                    { key: "from", label: "Wallet Address", placeholder: "G..." },
                  ]}
                  defaults={{ chain: "stellar", symbol: "USDC", amount: "100", from: walletAddress ?? "" }}
                />

                {/* Op4. Claim Rewards */}
                <OpPanel
                  title="Claim Rewards"
                  endpoint="claim-rewards"
                  operation="claim-rewards"
                  fields={[
                    { key: "chain", label: "Chain", type: "select", options: chainOptions },
                    { key: "symbol", label: "Token Symbol", placeholder: "USDC" },
                    { key: "from", label: "Wallet Address", placeholder: "G..." },
                  ]}
                  defaults={{ chain: "stellar", symbol: "USDC", from: walletAddress ?? "" }}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Footer ── */}
        <div className="border-t border-border pt-4 text-center">
          <Typography variant="small" className="text-muted-foreground/40 text-xs">
            Allbridge Playground · 8 queries + 4 operations · SDK-backed pool listing · MCP-backed on-chain queries & operations ·
            {" "}LP pools are mainnet only · Operations build XDR only — wallet signing required
          </Typography>
        </div>
      </div>
    </StreamContext.Provider>
  );
}
