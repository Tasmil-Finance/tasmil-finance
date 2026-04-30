"use client";

/**
 * DeFindex Playground — /playground/defindex
 *
 * Full-featured playground for DeFindex vault operations.
 * Queries tab: list vaults, vault detail, user balance, yield, history, performance
 * Operations tab: deposit, withdraw, withdraw by amounts
 *
 * Uses SDK-backed routes (/api/defindex/... and /api/protocols/defindex/...)
 * and renders results using shared card components.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { Loader2, RefreshCw, Zap, ChevronDown } from "lucide-react";
import { StreamContext, type StreamContextType } from "@/features/chat/providers/stream-provider";
import {
  DefindexVaultsCard,
  DefindexVaultDetailCard,
  DefindexBalanceCard,
  DefindexTxCard,
  DefindexYieldCard,
} from "@/features/protocols/cards/defindex";
import {
  normalizeVaultsFromSdk,
  normalizeVaultDetailFromSdk,
  normalizeVaultBalanceFromSdk,
} from "@/features/protocols/adapters/defindex-from-sdk";
import { useWallet } from "@/shared/context/wallet-context";
import { Button } from "@/shared/ui/button";
import { Typography } from "@/shared/ui/typography";
import { TokenImage } from "@/shared/components/token-image";
import { PROTOCOL_ICONS } from "@/shared/constants/asset-manifest";

// ── Mock stream so DefindexTxCard's useStreamContext() doesn't throw ─────────
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

const PROTOCOL_URL = "/api/protocols/defindex";
const DEFINDEX_URL = "/api/defindex";

// ── Styles ───────────────────────────────────────────────────────────────────
const inputCls =
  "w-full rounded-lg bg-secondary border border-border px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20";
const labelCls = "block text-muted-foreground text-[11px] mb-0.5 font-medium";
const panelCls =
  "rounded-xl border border-border bg-card/80 p-4 space-y-3 flex flex-col";

// ── Types ────────────────────────────────────────────────────────────────────
interface Field {
  key: string;
  label: string;
  placeholder?: string;
  isAmount?: boolean;
}

interface KnownVault {
  address: string;
  name: string;
  asset?: string;
}

// ── QueryPanel ───────────────────────────────────────────────────────────────
interface QueryPanelProps {
  title: string;
  url: string;
  fields: Field[];
  defaults?: Record<string, string>;
  autoFetch?: boolean;
  className?: string;
  renderResult?: (data: any) => React.ReactNode;
}

function QueryPanel({ title, url, fields, defaults = {}, autoFetch = false, className, renderResult }: QueryPanelProps) {
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
      const fullUrl = `${url}${params ? `?${params}` : ""}`;
      const r = await fetch(fullUrl);
      const d = await r.json();
      if (!d.success) setError(d.error ?? "Request failed");
      else setResult(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setLoading(false);
    }
  }, [form, url]);

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
    <div className={`${panelCls} ${className ?? ""}`}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wider">{title}</span>
        <span className="text-[10px] text-muted-foreground/60 font-mono">GET</span>
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
        <div className="mt-1">
          {renderResult ? renderResult(result) : (
            <pre className="max-h-[400px] overflow-auto rounded-lg bg-muted/30 p-3 text-xs text-muted-foreground font-mono">
              {JSON.stringify(result, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

// ── OpPanel ──────────────────────────────────────────────────────────────────
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
        if (k === "vaultAddress" || k === "from" || !prev[k]) {
          next[k] = v;
        }
      }
      if (address) next.from = address;
      return next;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(defaults), address]);

  /** Convert human-readable amounts to stroops (7 decimals) */
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
      const amountKeys = new Set(fields.filter((f) => f.isAmount).map((f) => f.key));
      const payload: Record<string, unknown> = { ...form };

      // For "amounts" field: split by comma, convert each to stroops, send as array
      if (amountKeys.has("amounts") && typeof payload.amounts === "string") {
        payload.amounts = (payload.amounts as string)
          .split(",")
          .map((a) => toStroops(a.trim()));
      }

      // For "shares" field: convert to stroops
      if (amountKeys.has("shares") && payload.shares) {
        payload.shares = toStroops(String(payload.shares));
      }

      const r = await fetch(`${DEFINDEX_URL}/op/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = await r.json();
      if (!d.success) setError(d.error ?? "Simulation failed");
      else setResult(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
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

      {result?.xdr && (
        <div className="mt-1">
          <DefindexTxCard
            tx={{
              operation: String(result.operation ?? operation),
              xdr: String(result.xdr ?? ""),
              estimatedFee: result.estimatedFee ? String(result.estimatedFee) : undefined,
              vaultAddress: result.vaultAddress ?? form.vaultAddress,
              // Amounts come from API response (already in stroops)
              amounts: result.amounts ?? (result.shares ? [String(result.shares)] : undefined),
              from: result.from ?? form.from,
              context: result.context ?? undefined,
            }}
            mode="playground"
          />
        </div>
      )}
    </div>
  );
}

// ── Vault selector ───────────────────────────────────────────────────────────
function VaultSelector({
  vaults,
  selected,
  onSelect,
}: {
  vaults: KnownVault[];
  selected: string;
  onSelect: (addr: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-muted-foreground text-xs font-medium whitespace-nowrap">Active Vault:</label>
      <div className="relative">
        <select
          className="appearance-none bg-secondary border border-border rounded px-3 py-1.5 pr-7 text-sm text-foreground focus:outline-none focus:border-primary/50 cursor-pointer"
          value={selected}
          onChange={(e) => onSelect(e.target.value)}
        >
          {vaults.map((v) => (
            <option key={v.address} value={v.address}>
              {v.name || "Vault"} — {v.address.slice(0, 8)}...
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
      </div>
      <span className="text-[10px] text-muted-foreground/60 font-mono hidden sm:block">{selected}</span>
    </div>
  );
}

// ── VaultDetailPanel ─────────────────────────────────────────────────────────
// Tries enriched API first; falls back to basic pool info on failure.
function VaultDetailPanel({ address }: { address: string }) {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputAddr, setInputAddr] = useState(address);
  const autoFetched = useRef(false);

  useEffect(() => {
    setInputAddr(address);
  }, [address]);

  const run = useCallback(async () => {
    if (!inputAddr) return;
    setLoading(true);
    setError(null);
    try {
      // Try enriched vault detail first
      const r = await fetch(`${DEFINDEX_URL}/vault-detail?address=${inputAddr}`);
      const d = await r.json();
      if (d.success) {
        setResult({ type: "detail", data: d });
        return;
      }
      // Fall back to basic pool info
      const r2 = await fetch(`${PROTOCOL_URL}/pool?address=${inputAddr}`);
      const d2 = await r2.json();
      if (d2.success) {
        setResult({ type: "basic", data: d2 });
        return;
      }
      setError(d2.error ?? d.error ?? "Failed to fetch vault info");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setLoading(false);
    }
  }, [inputAddr]);

  useEffect(() => {
    if (autoFetched.current || !inputAddr) return;
    autoFetched.current = true;
    run();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputAddr]);

  return (
    <div className={panelCls}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wider">Vault Detail</span>
        <span className="text-[10px] text-muted-foreground/60 font-mono">GET</span>
      </div>
      <div>
        <label className={labelCls}>Vault Address</label>
        <input
          className={inputCls}
          value={inputAddr}
          placeholder="C..."
          onChange={(e) => setInputAddr(e.target.value)}
        />
      </div>
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
        <div className="mt-1">
          {result.type === "detail" ? (
            (() => {
              const vault = normalizeVaultDetailFromSdk(result.data);
              return vault ? <DefindexVaultDetailCard vault={vault} mode="playground" /> : null;
            })()
          ) : (
            <pre className="max-h-[400px] overflow-auto rounded-lg bg-muted/30 p-3 text-xs text-muted-foreground font-mono">
              {JSON.stringify(result.data, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main playground ──────────────────────────────────────────────────────────
export default function DefindexPlaygroundPage() {
  const { address: walletAddress } = useWallet();
  const [tab, setTab] = useState<"queries" | "operations">("queries");
  const [vaults, setVaults] = useState<KnownVault[]>([]);
  const [selectedVault, setSelectedVault] = useState("");
  const [networkInfo, setNetworkInfo] = useState("");

  // Fetch vault list on mount
  useEffect(() => {
    fetch(`${PROTOCOL_URL}/pools`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.pools?.length) {
          const mapped: KnownVault[] = d.pools.map((p: any) => ({
            address: p.address,
            name: p.name ?? `Vault ${p.address.slice(0, 8)}`,
            asset: p.asset,
          }));
          setVaults(mapped);
          setSelectedVault(mapped[0]!.address);
          setNetworkInfo(d.network ?? "");
        }
      })
      .catch(() => {});
  }, []);

  const vault = selectedVault;
  const balanceDefaults: Record<string, string> = { vault, user: walletAddress ?? "" };
  const opDefaults: Record<string, string> = { vaultAddress: vault, from: walletAddress ?? "" };

  const queryCount = 6;
  const opCount = 3;

  return (
    <StreamContext.Provider value={MOCK_STREAM}>
      <div className="min-h-screen bg-background text-foreground p-6 space-y-6">

        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <TokenImage src={PROTOCOL_ICONS.defindex} alt="DeFindex" className="h-8 w-8 rounded-lg" />
              <div>
                <Typography as="h1" variant="h3" weight="bold" className="text-foreground">DeFindex Playground</Typography>
                <Typography variant="p" className="text-muted-foreground text-sm mt-1">
                  Direct SDK — vault operations via{" "}
                  <span className="font-mono text-emerald-400 text-xs">/api/defindex/...</span>
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
                  {walletAddress.slice(0, 8)}...
                </span>
              )}
            </div>
          </div>

          {vaults.length > 0 && (
            <VaultSelector vaults={vaults} selected={selectedVault} onSelect={setSelectedVault} />
          )}
        </div>

        {/* Tabs */}
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
              {t === "queries" ? `Queries (${queryCount})` : `Operations (${opCount})`}
            </Button>
          ))}
        </div>

        {/* ═══════════════════════════════════════
            QUERIES TAB
        ═══════════════════════════════════════ */}
        {tab === "queries" && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

            {/* 1. List Vaults */}
            <QueryPanel
              title="List Vaults"
              url={`${PROTOCOL_URL}/pools`}
              fields={[]}
              autoFetch
              renderResult={(d) => (
                <DefindexVaultsCard
                  vaults={normalizeVaultsFromSdk(d)}
                  mode="playground"
                />
              )}
            />

            {/* 2. Vault Detail (enriched — falls back to basic info) */}
            <VaultDetailPanel address={vault} />

            {/* 3. User Balance */}
            <QueryPanel
              title="User Balance"
              url={`${DEFINDEX_URL}/balance`}
              fields={[
                { key: "vault", label: "Vault Address", placeholder: "C..." },
                { key: "user", label: "User Address", placeholder: "G..." },
              ]}
              defaults={balanceDefaults}
              autoFetch
              renderResult={(d) => {
                const balance = normalizeVaultBalanceFromSdk(d);
                return balance ? <DefindexBalanceCard balance={balance} mode="playground" /> : null;
              }}
            />

            {/* 4. Yield Opportunities */}
            <QueryPanel
              title="Yield Opportunities"
              url={`${PROTOCOL_URL}/yield`}
              fields={[]}
              autoFetch
              renderResult={(d) => {
                const opps = (d.opportunities ?? []) as any[];
                return <DefindexYieldCard opportunities={opps} mode="playground" />;
              }}
            />

            {/* 5. Vault History */}
            <QueryPanel
              title="Vault History"
              url={`${DEFINDEX_URL}/history`}
              fields={[
                { key: "address", label: "Vault Address", placeholder: "C..." },
                { key: "period", label: "Period", placeholder: "7d | 30d | 90d | 1y | all" },
                { key: "interval", label: "Interval", placeholder: "hourly | daily | weekly | monthly" },
              ]}
              defaults={{ address: vault, period: "7d", interval: "daily" }}
            />

            {/* 6. Account Performance */}
            <QueryPanel
              title="Account Performance"
              url={`${DEFINDEX_URL}/performance`}
              fields={[
                { key: "wallet", label: "Wallet Address", placeholder: "G..." },
                { key: "vault", label: "Vault Address", placeholder: "C..." },
                { key: "interval", label: "Interval", placeholder: "daily | weekly | monthly" },
              ]}
              defaults={{ wallet: walletAddress ?? "", vault, interval: "daily" }}
            />
          </div>
        )}

        {/* ═══════════════════════════════════════
            OPERATIONS TAB
        ═══════════════════════════════════════ */}
        {tab === "operations" && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

            {/* 1. Deposit */}
            <OpPanel
              title="Deposit"
              endpoint="deposit"
              operation="vault_deposit"
              fields={[
                { key: "vaultAddress", label: "Vault Address", placeholder: "C..." },
                { key: "amounts", label: "Amount", placeholder: "1.0", isAmount: true },
                { key: "from", label: "From Address", placeholder: "G..." },
                { key: "slippageBps", label: "Slippage (bps)", placeholder: "100" },
              ]}
              defaults={{ ...opDefaults, amounts: "1", slippageBps: "100" }}
            />

            {/* 2. Withdraw (by shares) */}
            <OpPanel
              title="Withdraw (by Shares)"
              endpoint="withdraw"
              operation="vault_withdraw"
              fields={[
                { key: "vaultAddress", label: "Vault Address", placeholder: "C..." },
                { key: "shares", label: "Shares", placeholder: "0.5", isAmount: true },
                { key: "from", label: "From Address", placeholder: "G..." },
              ]}
              defaults={{ ...opDefaults, shares: "0.5" }}
            />

            {/* 3. Withdraw by Amounts */}
            <OpPanel
              title="Withdraw (by Amounts)"
              endpoint="withdraw-by-amounts"
              operation="vault_withdraw_amounts"
              fields={[
                { key: "vaultAddress", label: "Vault Address", placeholder: "C..." },
                { key: "amounts", label: "Amount", placeholder: "1.0", isAmount: true },
                { key: "from", label: "From Address", placeholder: "G..." },
              ]}
              defaults={{ ...opDefaults, amounts: "1" }}
            />
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-border pt-4 text-center">
          <Typography variant="small" className="text-muted-foreground/40 text-xs">
            DeFindex Playground · SDK-backed · Operations build XDR only — wallet signing required to submit on-chain
          </Typography>
        </div>
      </div>
    </StreamContext.Provider>
  );
}
