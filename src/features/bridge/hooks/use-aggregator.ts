"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useWallet } from "@/shared/context/wallet-context";
import { checkWalletNetwork, parseSigningError } from "@/lib/stellar-network-check";

// ─── Types matching MCP Stellar aggregator API ──────────────────

// Used only for execute/submit/verify/trustline (operations that still go through MCP server)
const MCP_STELLAR_URL =
  process.env["NEXT_PUBLIC_MCP_STELLAR_URL"] || "http://localhost:3009";

export interface ChainInfo {
  id: string;
  name: string;
  symbol: string;
  logo: string;
}

export interface TokenInfo {
  symbol: string;
  name: string;
  logo?: string;
  decimals: number;
  chains: string[];
  addresses: Record<string, string>;
  bridgeable: boolean;
  bridgeableVia: string[];
  swappableOn: string[];
}

export interface RouteQuote {
  protocol?: string;
  provider?: string;
  amountIn: string;
  amountOut: string;
  fee: string;
  feePercent: string;
  estimatedTime: string;
  route?: string[];
  poolAddress?: string;
  status: "ok" | "unavailable" | "no_route" | "error";
  error?: string;
}

export interface AggregatorState {
  chains: ChainInfo[];
  tokens: TokenInfo[];
  isLoadingRegistry: boolean;
  tokenIn: TokenInfo | null;
  tokenOut: TokenInfo | null;
  chainIn: string;
  chainOut: string;
  amount: string;
  filteredTokensOut: TokenInfo[];
  filteredChainsOut: string[];
  filteredTokensIn: TokenInfo[];
  filteredChainsIn: string[];
  quotes: RouteQuote[];
  bestQuote: RouteQuote | null;
  isLoadingQuotes: boolean;
  mode: "swap" | "bridge" | null;
  slippageBps: number;
  enabledProtocols: Set<string>;
  setTokenIn: (token: TokenInfo, chain: string) => void;
  setTokenOut: (token: TokenInfo, chain: string) => void;
  setAmount: (amount: string) => void;
  setSlippageBps: (bps: number) => void;
  toggleProtocol: (protocol: string) => void;
  swapDirection: () => void;
  refreshQuotes: () => void;
  executeSwap: (protocol: string) => Promise<void>;
  isExecuting: boolean;
  executeError: string | null;
  executeSuccess: string | null;
  destAddress: string;
  setDestAddress: (addr: string) => void;
  needsTrustline: boolean;
  trustlineToken: string | null;
  missingTrustlines: string[];
  addTrustline: () => Promise<void>;
  addTrustlineFor: (symbol: string) => Promise<void>;
  isAddingTrustline: boolean;
  signingTrustline: string | null;
}

// ─── API helpers ────────────────────────────────────────────────

// ── SDK-backed endpoints (Next.js API routes, no MCP server needed) ──

async function fetchRegistry(): Promise<{ chains: ChainInfo[]; tokens: TokenInfo[] }> {
  const res = await fetch(`/api/tokens`);
  if (!res.ok) throw new Error(`Registry fetch failed: ${res.status}`);
  return res.json();
}

async function fetchFilteredTokens(
  selectedToken: string,
  selectedChain: string,
  direction: "in" | "out",
): Promise<{ tokens: TokenInfo[]; chains: string[] }> {
  const res = await fetch(`/api/tokens/filter`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ selectedToken, selectedChain, direction }),
  });
  if (!res.ok) throw new Error(`Filter fetch failed: ${res.status}`);
  return res.json();
}

async function fetchQuotes(params: {
  tokenIn: string;
  tokenOut: string;
  amount: string;
  fromChain?: string;
  toChain?: string;
  from?: string;
  protocols?: string[];
}): Promise<{ mode: string; quotes: RouteQuote[]; best: string | null }> {
  const res = await fetch(`/api/aggregator/quote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`Quote fetch failed: ${res.status}`);
  return res.json();
}

async function fetchExecute(params: {
  mode: string;
  protocol: string;
  tokenIn: string;
  tokenOut: string;
  amount: string;
  from: string;
  to?: string;
  fromChain?: string;
  toChain?: string;
  slippageBps?: number;
}): Promise<{ success: boolean; xdr?: string; depositAddress?: string; error?: string }> {
  const res = await fetch(`${MCP_STELLAR_URL}/api/aggregator/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error || `Execute failed: ${res.status}`);
  }
  return res.json();
}

const ALL_PROTOCOLS = new Set([
  "soroswap", "sdex", "aquarius", "phoenix", "templar", "allbridge",
]);

// ─── Hook ───────────────────────────────────────────────────────

export function useAggregator(): AggregatorState {
  const { address: stellarAddress, signTransaction } = useWallet();

  const [chains, setChains] = useState<ChainInfo[]>([]);
  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [isLoadingRegistry, setIsLoadingRegistry] = useState(true);

  const [tokenIn, setTokenInState] = useState<TokenInfo | null>(null);
  const [tokenOut, setTokenOutState] = useState<TokenInfo | null>(null);
  const [chainIn, setChainIn] = useState("stellar");
  const [chainOut, setChainOut] = useState("stellar");
  const [amount, setAmount] = useState("");
  const [destAddress, setDestAddress] = useState("");

  const [filteredTokensOut, setFilteredTokensOut] = useState<TokenInfo[]>([]);
  const [filteredChainsOut, setFilteredChainsOut] = useState<string[]>([]);
  const [filteredTokensIn, setFilteredTokensIn] = useState<TokenInfo[]>([]);
  const [filteredChainsIn, setFilteredChainsIn] = useState<string[]>([]);

  const [quotes, setQuotes] = useState<RouteQuote[]>([]);
  const [mode, setMode] = useState<"swap" | "bridge" | null>(null);
  const [isLoadingQuotes, setIsLoadingQuotes] = useState(false);

  const [slippageBps, setSlippageBps] = useState(100);
  const [enabledProtocols, setEnabledProtocols] = useState<Set<string>>(new Set(ALL_PROTOCOLS));

  const quoteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Load registry on mount ─────────────────────────────────

  useEffect(() => {
    let cancelled = false;
    setIsLoadingRegistry(true);

    fetchRegistry()
      .then(({ chains: c, tokens: t }) => {
        if (cancelled) return;
        setChains(c);
        setTokens(t);
        // Validate current selections against new token list, reset if invalid
        setTokenInState((prev) => {
          const valid = prev && t.find((tk) => tk.symbol === prev.symbol);
          return valid || t.find((tk) => tk.symbol === "XLM") || null;
        });
        setTokenOutState((prev) => {
          const valid = prev && t.find((tk) => tk.symbol === prev.symbol);
          return valid || t.find((tk) => tk.symbol === "USDC") || null;
        });
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setIsLoadingRegistry(false);
      });

    return () => { cancelled = true; };
  }, []);

  // ─── Filter tokens when tokenIn changes ─────────────────────

  useEffect(() => {
    if (!tokenIn) return;
    fetchFilteredTokens(tokenIn.symbol, chainIn, "in")
      .then(({ tokens: t, chains: c }) => {
        setFilteredTokensOut(t);
        setFilteredChainsOut(c);
      })
      .catch(() => {});
  }, [tokenIn, chainIn]);

  // ─── Filter tokens when tokenOut changes ────────────────────

  useEffect(() => {
    if (!tokenOut) return;
    fetchFilteredTokens(tokenOut.symbol, chainOut, "out")
      .then(({ tokens: t, chains: c }) => {
        setFilteredTokensIn(t);
        setFilteredChainsIn(c);
      })
      .catch(() => {});
  }, [tokenOut, chainOut]);

  // ─── Quote fetching ──────────────────────────────────────────
  // Use refs to avoid stale closures in setInterval

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fetchParamsRef = useRef({ tokenIn, tokenOut, amount, chainIn, chainOut, enabledProtocols, stellarAddress });

  // Keep ref in sync with latest state
  fetchParamsRef.current = { tokenIn, tokenOut, amount, chainIn, chainOut, enabledProtocols, stellarAddress };

  const doFetchQuotes = useCallback(async (showLoader = false) => {
    const { tokenIn: tIn, tokenOut: tOut, amount: amt, chainIn: cIn, chainOut: cOut, enabledProtocols: ep, stellarAddress: sa } = fetchParamsRef.current;
    const numAmount = Number.parseFloat(amt);
    if (!tIn || !tOut || !amt || Number.isNaN(numAmount) || numAmount <= 0) return;

    if (showLoader) setIsLoadingQuotes(true);

    try {
      const protocols = Array.from(ep);
      const result = await fetchQuotes({
        tokenIn: tIn.symbol,
        tokenOut: tOut.symbol,
        amount: String(Math.floor(numAmount * 10 ** tIn.decimals)),
        fromChain: cIn,
        toChain: cOut,
        from: sa ?? undefined,
        protocols: protocols.length < ALL_PROTOCOLS.size ? protocols : undefined,
      });
      setQuotes(result.quotes);
      setMode(result.mode as "swap" | "bridge");
    } catch {
      // keep existing quotes on refresh failure
    } finally {
      if (showLoader) setIsLoadingQuotes(false);
    }
  }, []); // no deps — always reads from ref

  // Debounced initial fetch + auto-refresh every 15s
  // Pauses when tab is hidden, resumes when visible
  useEffect(() => {
    if (quoteTimerRef.current) clearTimeout(quoteTimerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setQuotes([]);
    setMode(null);

    const numAmount = Number.parseFloat(amount);
    if (!tokenIn || !tokenOut || !amount || Number.isNaN(numAmount) || numAmount <= 0) {
      return;
    }

    setIsLoadingQuotes(true);

    function startInterval() {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => doFetchQuotes(false), 15000);
    }

    function stopInterval() {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    }

    function onVisibilityChange() {
      if (document.hidden) {
        stopInterval();
      } else {
        doFetchQuotes(false); // refresh immediately when tab becomes visible
        startInterval();
      }
    }

    // Initial fetch after 800ms debounce
    quoteTimerRef.current = setTimeout(() => {
      doFetchQuotes(true).then(() => {
        if (!document.hidden) startInterval();
      });
    }, 800);

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      if (quoteTimerRef.current) clearTimeout(quoteTimerRef.current);
      stopInterval();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [tokenIn, tokenOut, amount, chainIn, chainOut, enabledProtocols, stellarAddress, doFetchQuotes]);

  // Manual refresh
  const refreshQuotes = useCallback(() => {
    doFetchQuotes(true);
  }, [doFetchQuotes]);

  // ─── Best quote ─────────────────────────────────────────────

  const bestQuote = useMemo(() => {
    const ok = quotes.filter((q) => q.status === "ok");
    if (ok.length === 0) return null;
    return ok.reduce((best, q) => (parseFloat(q.amountOut) > parseFloat(best.amountOut) ? q : best));
  }, [quotes]);

  // ─── Actions ────────────────────────────────────────────────

  const setTokenIn = useCallback((token: TokenInfo, chain: string) => {
    setTokenInState(token);
    setChainIn(chain);
  }, []);

  const setTokenOut = useCallback((token: TokenInfo, chain: string) => {
    setTokenOutState(token);
    if (chain !== chainOut) setDestAddress(""); // clear dest when chain changes
    setChainOut(chain);
  }, [chainOut]);

  const toggleProtocol = useCallback((protocol: string) => {
    setEnabledProtocols((prev) => {
      const next = new Set(prev);
      if (next.has(protocol)) {
        if (next.size > 1) next.delete(protocol);
      } else {
        next.add(protocol);
      }
      return next;
    });
  }, []);

  const swapDirection = useCallback(() => {
    setTokenInState(tokenOut);
    setTokenOutState(tokenIn);
    setChainIn(chainOut);
    setChainOut(chainIn);
  }, [tokenIn, tokenOut, chainIn, chainOut]);

  // ─── Trustline check (both tokenIn and tokenOut) ─────────────

  const [needsTrustline, setNeedsTrustline] = useState(false);
  const [trustlineToken, setTrustlineToken] = useState<string | null>(null);
  const [missingTrustlines, setMissingTrustlines] = useState<string[]>([]);
  const [isAddingTrustline, setIsAddingTrustline] = useState(false);
  const [signingTrustline, setSigningTrustline] = useState<string | null>(null);

  useEffect(() => {
    // Clear error/signing states when tokens change
    setExecuteError(null);
    setExecuteSuccess(null);
    setIsAddingTrustline(false);
    setSigningTrustline(null);

    if (!stellarAddress) { setMissingTrustlines([]); setNeedsTrustline(false); return; }

    // Check trustline for both tokenIn (need it to hold/send) and tokenOut (need it to receive)
    const tokensToCheck: string[] = [];
    if (tokenIn && chainIn === "stellar" && tokenIn.symbol !== "XLM") tokensToCheck.push(tokenIn.symbol);
    if (tokenOut && chainOut === "stellar" && tokenOut.symbol !== "XLM" && tokenOut.symbol !== tokenIn?.symbol) tokensToCheck.push(tokenOut.symbol);

    if (tokensToCheck.length === 0) {
      setMissingTrustlines([]);
      setNeedsTrustline(false);
      setTrustlineToken(null);
      return;
    }

    Promise.all(
      tokensToCheck.map((sym) =>
        fetch(`${MCP_STELLAR_URL}/api/trustline/check`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address: stellarAddress, assetCode: sym }),
        })
          .then((r) => r.json())
          .then((d) => ({ symbol: sym, has: d.hasTrustline }))
          .catch(() => ({ symbol: sym, has: false }))
      )
    ).then((results) => {
      const missing = results.filter((r) => !r.has).map((r) => r.symbol);
      setMissingTrustlines(missing);
      setNeedsTrustline(missing.length > 0);
      setTrustlineToken(missing[0] ?? null);
    });
  }, [tokenIn, tokenOut, chainIn, chainOut, stellarAddress]);

  const addTrustlineFor = useCallback(async (sym: string) => {
    if (!sym || !stellarAddress) return;
    setIsAddingTrustline(true);
    setSigningTrustline(sym);
    try {
      const res = await fetch(`${MCP_STELLAR_URL}/api/trustline/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: stellarAddress, assetCode: sym }),
      });
      const data = await res.json();
      if (!data.xdr) throw new Error(data.error || "Failed to build trustline tx");

      await checkWalletNetwork();
      const signedXdr = await signTransaction(data.xdr);

      const submitRes = await fetch(`${MCP_STELLAR_URL}/api/aggregator/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signedXdr, protocol: "trustline" }),
      });
      const submitData = await submitRes.json();
      if (!submitData.success) throw new Error(submitData.error || "Trustline tx failed");

      // Remove from missing list
      const remaining = missingTrustlines.filter((s) => s !== sym);
      setMissingTrustlines(remaining);
      setNeedsTrustline(remaining.length > 0);
      setTrustlineToken(remaining[0] ?? null);
    } catch (err) {
      const msg = parseSigningError(err);
      // Don't show error for user rejection
      if (!msg.toLowerCase().includes("cancel") && !msg.toLowerCase().includes("reject") && !msg.toLowerCase().includes("denied")) {
        setExecuteError(msg);
      }
    } finally {
      setIsAddingTrustline(false);
      setSigningTrustline(null);
    }
  }, [missingTrustlines, stellarAddress, signTransaction]);

  const addTrustline = useCallback(() => {
    const sym = missingTrustlines[0];
    if (sym) return addTrustlineFor(sym);
    return Promise.resolve();
  }, [missingTrustlines, addTrustlineFor]);

  // ─── Execute swap/bridge ────────────────────────────────────

  const [isExecuting, setIsExecuting] = useState(false);
  const [executeError, setExecuteError] = useState<string | null>(null);
  const [executeSuccess, setExecuteSuccess] = useState<string | null>(null);

  const executeSwap = useCallback(async (protocol: string) => {
    if (!tokenIn || !tokenOut || !amount || !stellarAddress) return;

    setIsExecuting(true);
    setExecuteError(null);
    setExecuteSuccess(null);

    try {
      const numAmount = Number.parseFloat(amount);
      const rawAmount = String(Math.floor(numAmount * 10 ** tokenIn.decimals));

      // 1. Get unsigned XDR from aggregator
      const result = await fetchExecute({
        mode: mode || "swap",
        protocol,
        tokenIn: tokenIn.symbol,
        tokenOut: tokenOut.symbol,
        amount: rawAmount,
        from: stellarAddress,
        to: destAddress || stellarAddress,
        fromChain: chainIn,
        toChain: chainOut,
        slippageBps,
      });

      if (!result.success) {
        throw new Error(result.error || "Execute failed");
      }

      if (result.xdr) {
        // 2. Sign XDR with Stellar wallet (triggers wallet popup)
        await checkWalletNetwork();
        const signedXdr = await signTransaction(result.xdr);

        // 3. Submit signed transaction via Soroswap send API (handles Soroban submission)
        const MCP_URL = process.env["NEXT_PUBLIC_MCP_STELLAR_URL"] || "http://localhost:3009";
        const submitRes = await fetch(`${MCP_URL}/api/aggregator/submit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ signedXdr, protocol }),
        });
        const submitData = await submitRes.json();

        if (!submitData.success) {
          throw new Error(submitData.detail || submitData.error || "Transaction submission failed");
        }

        // Verify TX actually succeeded on-chain (submitted != successful)
        if (submitData.hash) {
          const MCP2 = process.env["NEXT_PUBLIC_MCP_STELLAR_URL"] || "http://localhost:3009";
          try {
            const verifyRes = await fetch(`${MCP2}/api/aggregator/verify?hash=${submitData.hash}`);
            const verifyData = await verifyRes.json();
            if (verifyData.successful === false) {
              throw new Error(verifyData.error || "Transaction failed on-chain");
            }
          } catch (verifyErr) {
            // If verify fails but TX was submitted, show hash anyway with warning
            if (verifyErr instanceof Error && verifyErr.message.includes("on-chain")) {
              throw verifyErr;
            }
          }
        }

        // Clear form after success
        setAmount("");
        setQuotes([]);
        setMode(null);
        setExecuteSuccess(submitData.hash);
      } else if (result.depositAddress) {
        // Bridge flow — show deposit instructions
        setExecuteSuccess(`Send funds to: ${result.depositAddress}`);
      }
    } catch (err) {
      const msg = parseSigningError(err);
      if (!msg.toLowerCase().includes("cancel") && !msg.toLowerCase().includes("reject") && !msg.toLowerCase().includes("denied")) {
        setExecuteError(msg);
      }
    } finally {
      setIsExecuting(false);
    }
  }, [tokenIn, tokenOut, amount, stellarAddress, mode, chainIn, chainOut, slippageBps, signTransaction]);

  return {
    chains, tokens, isLoadingRegistry,
    tokenIn, tokenOut, chainIn, chainOut, amount,
    filteredTokensOut, filteredChainsOut, filteredTokensIn, filteredChainsIn,
    quotes, bestQuote, isLoadingQuotes, mode,
    slippageBps, enabledProtocols,
    setTokenIn, setTokenOut, setAmount, setSlippageBps, toggleProtocol, swapDirection, refreshQuotes,
    executeSwap, isExecuting, executeError, executeSuccess,
    destAddress, setDestAddress,
    needsTrustline, trustlineToken, missingTrustlines, addTrustline, addTrustlineFor, isAddingTrustline, signingTrustline,
  };
}
