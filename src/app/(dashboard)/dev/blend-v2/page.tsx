"use client";

/**
 * Blend v2 Playground — /dev/blend-v2
 *
 * Direct HTTP playground for all Blend v2 operations and queries.
 * Calls mcp-stellar REST endpoints (/blend-v2/query/... and /blend-v2/op/...)
 * and renders results using the SAME card components as the AI chat —
 * StellarInfoDispatcher for queries, StellarOperationDispatcher for operations.
 */

import { useState, useEffect, useCallback } from "react";
import { Loader2, RefreshCw, Zap, ChevronDown } from "lucide-react";
import { StellarInfoDispatcher } from "@/features/chat/actions/components/stellar/stellar-info-dispatcher";
import { StellarOperationDispatcher } from "@/features/chat/actions/components/stellar/stellar-operation-dispatcher";
import { StreamContext, type StreamContextType } from "@/features/chat/providers/stream-provider";
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
// SDK-backed query routes (no MCP server needed)
const SDK_QUERY_URL = "/api/blend";

// ── Styles ────────────────────────────────────────────────────────────────────
const inputCls =
  "w-full rounded bg-zinc-800 border border-zinc-600 px-3 py-1.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-cyan-500/60";
const labelCls = "block text-zinc-400 text-[11px] mb-0.5 font-medium";
const panelCls =
  "rounded-xl border border-zinc-700/50 bg-zinc-900/80 p-4 space-y-3 flex flex-col";

// ── Types ──────────────────────────────────────────────────────────────────────
interface KnownPool { name: string; address: string }
interface Field { key: string; label: string; placeholder?: string }

// ── QueryPanel ────────────────────────────────────────────────────────────────
// Thin form wrapper: collects params, fetches, passes result to StellarInfoDispatcher.
interface QueryPanelProps {
  title: string;
  endpoint: string;
  infoType: string;              // passed to StellarInfoDispatcher as `type`
  fields: Field[];
  defaults?: Record<string, string>;
  /** Base URL for query — defaults to SDK route (/api/blend), falls back to MCP for unsupported endpoints */
  baseUrl?: string;
}

function QueryPanel({ title, endpoint, infoType, fields, defaults = {}, baseUrl = SDK_QUERY_URL }: QueryPanelProps) {
  const [form, setForm] = useState<Record<string, string>>(defaults);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className={panelCls}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wider">{title}</span>
        <span className="text-[10px] text-zinc-500 font-mono">{isSdk ? "SDK" : "MCP"} GET /{endpoint}</span>
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

      {/* Render using the EXACT same dispatcher the AI chat uses */}
      {result && (
        <div className="mt-1">
          <StellarInfoDispatcher
            type={infoType}
            result={result}
            args={{ protocol: "blend", query: infoType, poolAddress: form["pool"] }}
          />
        </div>
      )}
    </div>
  );
}

// ── OpPanel ───────────────────────────────────────────────────────────────────
// Thin form wrapper: collects params, posts to op endpoint, passes result to
// StellarOperationDispatcher — same as when the AI builds the TX.
interface OpPanelProps {
  title: string;
  endpoint: string;
  operation: string;             // passed to StellarOperationDispatcher as `operation`
  fields: Field[];
  defaults?: Record<string, string>;
}

function OpPanel({ title, endpoint, operation, fields, defaults = {} }: OpPanelProps) {
  const { address } = useWallet();
  const [form, setForm] = useState<Record<string, string>>({ from: address ?? "", ...defaults });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (address) setForm((prev) => ({ ...prev, from: address }));
  }, [address]);

  useEffect(() => {
    setForm((prev) => ({ from: address ?? "", ...defaults, ...prev }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(defaults)]);

  const build = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const r = await fetch(`${MCP_URL}/blend-v2/op/${endpoint}`, {
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
        <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">{title}</span>
        <span className="text-[10px] text-zinc-500 font-mono">POST /op/{endpoint}</span>
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
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
        Build TX
      </Button>

      {error && <Typography variant="small" className="text-red-400 text-xs bg-red-500/10 rounded p-2">{error}</Typography>}

      {/* Render using the EXACT same dispatcher the AI chat uses */}
      {result?.xdr && (
        <div className="mt-1">
          <StellarOperationDispatcher
            operation={result.operation ?? operation}
            result={result}
            args={{ ...form, ...result }}
            status="executing"
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
      <label className="text-zinc-400 text-xs font-medium whitespace-nowrap">Active Pool:</label>
      <div className="relative">
        <select
          className="appearance-none bg-zinc-800 border border-zinc-600 rounded px-3 py-1.5 pr-7 text-sm text-white focus:outline-none focus:border-cyan-500/60 cursor-pointer"
          value={selected}
          onChange={(e) => onSelect(e.target.value)}
        >
          {pools.map((p) => (
            <option key={p.address} value={p.address}>
              {p.name} — {p.address.slice(0, 8)}…
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
      </div>
      <span className="text-[10px] text-zinc-500 font-mono hidden sm:block">{selected}</span>
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

  useEffect(() => {
    fetch(`${SDK_QUERY_URL}/pools`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.pools?.length) {
          setPools(d.pools);
          setSelectedPool(d.pools[0].address);
          setNetworkInfo(d.network ?? "");
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

  // Known testnet assets
  const XLM_SAC = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC";
  const USDC    = "CAQCFVLOBK5GIULPNZRGATJJMIZL5BSP7X5YJVMGCPTUEPFM4AVSRCJU";

  return (
    <StreamContext.Provider value={MOCK_STREAM}>
      <div className="min-h-screen bg-zinc-950 text-white p-6 space-y-6">

        {/* ── Header ── */}
        <div className="space-y-3">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <Typography as="h1" variant="h3" weight="bold" className="text-white">Blend v2 Playground</Typography>
              <Typography variant="p" className="text-zinc-400 text-sm mt-1">
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
        <div className="flex gap-1 bg-zinc-900 rounded-lg p-1 w-fit border border-zinc-800">
          {(["queries", "operations"] as const).map((t) => (
            <Button
              key={t}
              variant="ghost"
              onClick={() => setTab(t)}
              className={`px-5 py-1.5 rounded-md text-sm font-medium transition-colors capitalize h-auto ${
                tab === t ? "bg-zinc-700 text-white shadow hover:bg-zinc-700" : "text-zinc-400 hover:text-zinc-200"
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

            {/* 1. List Pools — blend_pool_info → PoolInfoCard → pools list view */}
            <QueryPanel
              title="List Pools"
              endpoint="pools"
              infoType="blend_pool_info"
              fields={[]}
            />

            {/* 2. Pool Info — blend_pool_info → PoolInfoCard → SinglePoolView */}
            <QueryPanel
              title="Pool Info"
              endpoint="pool-info"
              infoType="blend_pool_info"
              fields={[{ key: "pool", label: "Pool Address", placeholder: "C..." }]}
              defaults={poolDefaults}
            />

            {/* 3. Assets — blend_pool_info → PoolInfoCard → SinglePoolView (reserves list) */}
            <QueryPanel
              title="Assets List"
              endpoint="assets"
              infoType="blend_pool_info"
              fields={[{ key: "pool", label: "Pool Address", placeholder: "C..." }]}
              defaults={poolDefaults}
            />

            {/* 4. Reserve Detail — blend_reserve_info → PoolInfoCard → ReserveInfoView */}
            <QueryPanel
              title="Reserve Detail"
              endpoint="reserve"
              infoType="blend_reserve_info"
              fields={[
                { key: "pool",  label: "Pool Address",  placeholder: "C..." },
                { key: "asset", label: "Asset Contract", placeholder: "C..." },
              ]}
              defaults={{ ...poolDefaults, asset: XLM_SAC }}
            />

            {/* 5. User Positions — blend_user_position → AccountInfoCard → BlendPositionView */}
            <QueryPanel
              title="User Positions"
              endpoint="positions"
              infoType="blend_user_position"
              fields={[
                { key: "pool", label: "Pool Address", placeholder: "C..." },
                { key: "user", label: "User Address", placeholder: "G..." },
              ]}
              defaults={userDefaults}
            />

            {/* 6. Backstop — blend_backstop_info → PoolInfoCard → BackstopInfoView (MCP only) */}
            <QueryPanel
              title="Backstop Details"
              endpoint="backstop"
              infoType="blend_backstop_info"
              fields={[{ key: "pool", label: "Pool Address", placeholder: "C..." }]}
              defaults={poolDefaults}
              baseUrl={MCP_URL}
            />

            {/* 7. Q4W Balance — blend_backstop_balance → AccountInfoCard → BlendBackstopBalanceView (MCP only) */}
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
                { key: "amount", label: "Amount (stroops)", placeholder: "10000000 = 1 XLM" },
                { key: "from",   label: "From Address",  placeholder: "G..." },
              ]}
              defaults={{ ...fromDefaults, asset: XLM_SAC, amount: "10000000" }}
            />

            {/* 2. Withdraw → blend_withdraw → BlendExecuteCard */}
            <OpPanel
              title="Withdraw"
              endpoint="withdraw"
              operation="blend_withdraw"
              fields={[
                { key: "pool",   label: "Pool Address",  placeholder: "C..." },
                { key: "asset",  label: "Asset Contract", placeholder: "C..." },
                { key: "amount", label: "Amount (stroops)", placeholder: "5000000" },
                { key: "from",   label: "From Address",  placeholder: "G..." },
              ]}
              defaults={{ ...fromDefaults, asset: XLM_SAC, amount: "5000000" }}
            />

            {/* 3. Borrow → blend_borrow → BlendExecuteCard */}
            <OpPanel
              title="Borrow"
              endpoint="borrow"
              operation="blend_borrow"
              fields={[
                { key: "pool",   label: "Pool Address",  placeholder: "C..." },
                { key: "asset",  label: "Asset Contract", placeholder: "C..." },
                { key: "amount", label: "Amount (stroops)", placeholder: "1000000 = 0.1 USDC" },
                { key: "from",   label: "From Address",  placeholder: "G..." },
              ]}
              defaults={{ ...fromDefaults, asset: USDC, amount: "1000000" }}
            />

            {/* 4. Repay → blend_repay → BlendExecuteCard */}
            <OpPanel
              title="Repay"
              endpoint="repay"
              operation="blend_repay"
              fields={[
                { key: "pool",   label: "Pool Address",  placeholder: "C..." },
                { key: "asset",  label: "Asset Contract", placeholder: "C..." },
                { key: "amount", label: "Amount (stroops)", placeholder: "500000" },
                { key: "from",   label: "From Address",  placeholder: "G..." },
              ]}
              defaults={{ ...fromDefaults, asset: USDC, amount: "500000" }}
            />

            {/* 5. Enable/Disable Collateral → blend_toggle_collateral → BlendExecuteCard */}
            <OpPanel
              title="Toggle Collateral"
              endpoint="enable-collateral"
              operation="blend_toggle_collateral"
              fields={[
                { key: "pool",   label: "Pool Address",  placeholder: "C..." },
                { key: "asset",  label: "Asset Contract", placeholder: "C..." },
                { key: "amount", label: "Amount (stroops)", placeholder: "5000000" },
                { key: "from",   label: "From Address",  placeholder: "G..." },
                { key: "enable", label: "Enable? (true/false)", placeholder: "true" },
              ]}
              defaults={{ ...fromDefaults, asset: XLM_SAC, amount: "5000000", enable: "true" }}
            />

            {/* 6. Join Pool (Comet LP) → backstop_deposit → BlendExecuteCard */}
            <OpPanel
              title="Join Pool (Comet LP)"
              endpoint="join-pool"
              operation="backstop_deposit"
              fields={[
                { key: "asset",    label: "Token In (USDC or BLND)", placeholder: "C..." },
                { key: "amount",   label: "Amount (stroops)", placeholder: "10000000" },
                { key: "minLpOut", label: "Min LP Out (0 = no slippage check)", placeholder: "0" },
                { key: "from",     label: "From Address",  placeholder: "G..." },
              ]}
              defaults={{ asset: USDC, amount: "10000000", minLpOut: "0", from: walletAddress ?? "" }}
            />

            {/* 7. Exit Pool (Comet LP) → backstop_withdraw → BlendExecuteCard */}
            <OpPanel
              title="Exit Pool (Comet LP)"
              endpoint="exit-pool"
              operation="backstop_withdraw"
              fields={[
                { key: "lpAmount",   label: "LP Amount (stroops)", placeholder: "1000000" },
                { key: "minBlndOut", label: "Min BLND Out", placeholder: "0" },
                { key: "minUsdcOut", label: "Min USDC Out", placeholder: "0" },
                { key: "from",       label: "From Address", placeholder: "G..." },
              ]}
              defaults={{ lpAmount: "1000000", minBlndOut: "0", minUsdcOut: "0", from: walletAddress ?? "" }}
            />

            {/* 8. Backstop Deposit → backstop_deposit → BlendExecuteCard */}
            <OpPanel
              title="Backstop Deposit (LP Tokens)"
              endpoint="backstop-deposit"
              operation="backstop_deposit"
              fields={[
                { key: "pool",   label: "Pool Address",  placeholder: "C..." },
                { key: "amount", label: "LP Amount (stroops)", placeholder: "1000000" },
                { key: "from",   label: "From Address",  placeholder: "G..." },
              ]}
              defaults={{ ...fromDefaults, amount: "1000000" }}
            />

            {/* 9. Queue Withdrawal → backstop_queue → BlendExecuteCard */}
            <OpPanel
              title="Queue Withdrawal (21-day)"
              endpoint="queue-withdrawal"
              operation="backstop_queue"
              fields={[
                { key: "pool",   label: "Pool Address",  placeholder: "C..." },
                { key: "amount", label: "Shares (stroops)", placeholder: "500000" },
                { key: "from",   label: "From Address",  placeholder: "G..." },
              ]}
              defaults={{ ...fromDefaults, amount: "500000" }}
            />

            {/* 10. Dequeue Withdrawal → backstop_dequeue → BlendExecuteCard */}
            <OpPanel
              title="Dequeue Withdrawal (Cancel)"
              endpoint="dequeue-withdrawal"
              operation="backstop_dequeue"
              fields={[
                { key: "pool",   label: "Pool Address",  placeholder: "C..." },
                { key: "amount", label: "Shares (stroops)", placeholder: "500000" },
                { key: "from",   label: "From Address",  placeholder: "G..." },
              ]}
              defaults={{ ...fromDefaults, amount: "500000" }}
            />
          </div>
        )}

        {/* ── Footer ── */}
        <div className="border-t border-zinc-800 pt-4 text-center">
          <Typography variant="small" className="text-zinc-600 text-xs">
            Blend v2 Playground · mcp-stellar{" "}
            <span className="font-mono text-zinc-500">{MCP_URL}</span>
            {" · "}Operations build XDR only — wallet signing required to submit on-chain
          </Typography>
        </div>
      </div>
    </StreamContext.Provider>
  );
}
