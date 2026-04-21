"use client";

import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRightLeft,
  Droplets,
  Fuel,
  Loader2,
  Coins,
  Lock,
  Vote,
  Snowflake,
} from "lucide-react";
import { TokenImage } from "@/shared/components/token-image";
import type { CardMode } from "../../schemas/common.schema";
import type { AquaTxCardProps } from "../../schemas/aquarius.schema";
import { ProtocolCard } from "../base/protocol-card";
import { DetailRow } from "../base/indicators";
import { fmtGas, trunc, fmt, resolveSymbol } from "../../lib/formatting";
import { useTxSigning } from "../../hooks/use-tx-signing";
import { useTrustlineCheck } from "../../hooks/use-trustline-check";
import { useMultiTrustlineCheck } from "../../hooks/use-multi-trustline-check";
import { useWallet } from "@/shared/context/wallet-context";

// ─── Operation config ───────────────────────────────────────────

interface OpConfig {
  label: string;
  action: string;
  title: string;
  buttonText: string;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
}

const OP_CONFIG: Record<string, OpConfig> = {
  add_liquidity: {
    label: "Add Liquidity",
    action: "Sign & Add",
    title: "Sign Add Liquidity",
    buttonText: "Sign & Add Liquidity",
    icon: Droplets,
    iconColor: "text-cyan-500",
    iconBg: "bg-cyan-500/10",
  },
  withdraw_liquidity: {
    label: "Withdraw Liquidity",
    action: "Sign & Withdraw",
    title: "Sign Withdraw Liquidity",
    buttonText: "Sign & Withdraw",
    icon: Droplets,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
  },
  swap: {
    label: "Swap",
    action: "Sign & Swap",
    title: "Sign Aquarius Swap",
    buttonText: "Sign & Swap",
    icon: ArrowRightLeft,
    iconColor: "text-blue-500",
    iconBg: "bg-blue-500/10",
  },
  claim_rewards: {
    label: "Claim Rewards",
    action: "Sign & Claim",
    title: "Sign Claim AQUA Rewards",
    buttonText: "Sign & Claim",
    icon: Coins,
    iconColor: "text-green-500",
    iconBg: "bg-green-500/10",
  },
  lock_aqua: {
    label: "Lock AQUA",
    action: "Sign & Lock",
    title: "Sign Lock AQUA for ICE",
    buttonText: "Sign & Lock",
    icon: Lock,
    iconColor: "text-blue-500",
    iconBg: "bg-blue-500/10",
  },
  delegate_ice: {
    label: "Delegate ICE",
    action: "Sign & Delegate",
    title: "Sign ICE Delegation",
    buttonText: "Sign & Delegate",
    icon: Snowflake,
    iconColor: "text-indigo-500",
    iconBg: "bg-indigo-500/10",
  },
  vote: {
    label: "Vote",
    action: "Sign & Vote",
    title: "Sign Vote",
    buttonText: "Sign & Vote",
    icon: Vote,
    iconColor: "text-purple-500",
    iconBg: "bg-purple-500/10",
  },
};

const DEFAULT_OP_CONFIG: OpConfig = {
  label: "Transaction",
  action: "Sign",
  title: "Sign Transaction",
  buttonText: "Sign & Submit",
  icon: ArrowRightLeft,
  iconColor: "text-primary",
  iconBg: "bg-primary/10",
};

// ─── Props ──────────────────────────────────────────────────────

interface AquaTxCardComponentProps {
  tx: AquaTxCardProps;
  mode?: CardMode;
  stream?: any;
  toolCallId?: string;
  respond?: (result: Record<string, unknown>) => void;
}

// ─── Component ──────────────────────────────────────────────────

/**
 * Determine the output asset contract that needs a trustline.
 * - swap → tokenOut
 * - withdraw_liquidity → pool tokens (both)
 * - claim_rewards → AQUA token
 */
function getOutputAsset(tx: AquaTxCardProps): { contract?: string; symbol?: string } {
  if (tx.operation === "swap" && tx.tokenOut) {
    return { contract: tx.tokenOut, symbol: resolveSymbol(tx.tokenOut) };
  }
  if (tx.operation === "claim_rewards") {
    return { contract: "CDNVQW44C3HALYNVQ4SOBXY5EWYTGVYXX6JPESOLQDABJI5FC5LTRRUE", symbol: "AQUA" };
  }
  return {};
}

export function AquaTxCard({
  tx,
  mode = "playground",
  stream,
  toolCallId,
  respond,
}: AquaTxCardComponentProps) {
  const cfg = OP_CONFIG[tx.operation] ?? DEFAULT_OP_CONFIG;
  const xdr = tx.xdr;
  const fee = tx.estimatedFee ?? "0";
  const { address: walletAddress } = useWallet();

  const { sign, signing, txResult, txError } = useTxSigning({
    mode,
    stream,
    toolCallId,
    operation: tx.operation,
    respond,
  });

  // ─── Trustline precheck ─────────────────────────────────────
  // Swap: check output token. Deposit/Withdraw: check ALL pool tokens.
  const outputAsset = getOutputAsset(tx);
  const swapTl = useTrustlineCheck(walletAddress ?? tx.from, outputAsset.contract, outputAsset.symbol);

  // For liquidity ops: check all tokens in the route (pool tokens)
  const isLiquidityOp = tx.operation === "add_liquidity" || tx.operation === "withdraw_liquidity";
  const routeTokenAddrs = (tx.route?.pools ?? []) as string[]; // not actual, need token addresses
  // Build token list from route tokens + any known addresses
  const poolTokens = (tx.route?.tokens ?? []).map((sym: string) => {
    // Try to find contract address from known symbols
    const knownMap: Record<string, string> = {
      XLM: "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC",
      USDC: "CAZRY5GSFBFXD7H6GAFBA5YGYQTDXU4QKWKMYFWBAZFUCURN3WKX6LF5",
      USDT: "CBL6KD2LFMLAUKFFWNNXWOXFN73GAXLEA4WMJRLQ5L76DMYTM3KWQVJN",
      AQUA: "CDNVQW44C3HALYNVQ4SOBXY5EWYTGVYXX6JPESOLQDABJI5FC5LTRRUE",
      BLND: "CB22KRA3YZVCNCQI64JQ5WE7UY2VAV7WFLK6A2JN3HEX56T2EDAFO7QF",
      ICE: "CCQZWA6GDCNLEMNUYTCMYGIXLX3ECAXW7RICSUZWWXM5AMDWAANC4SZK",
    };
    return { contract: knownMap[sym] ?? sym, symbol: sym };
  });
  const multiTl = useMultiTrustlineCheck(
    isLiquidityOp ? (walletAddress ?? tx.from) : undefined,
    isLiquidityOp ? poolTokens : [],
  );

  const trustlineChecking = isLiquidityOp ? multiTl.checking : swapTl.checking;
  const trustlineBlocking = isLiquidityOp
    ? multiTl.hasMissing && !multiTl.checking
    : swapTl.needsTrustline && !swapTl.hasTrustline && !swapTl.checking;

  const [showXdr, setShowXdr] = useState(false);
  const [cancelled, setCancelled] = useState(false);

  const handleSign = () => sign(xdr);

  // ─── Chat mode ────────────────────────────────────────────────
  if (mode === "chat") {
    return (
      <ProtocolCard mode="chat" title={cfg.title} icon={cfg.icon} iconColor={cfg.iconColor} iconBg={cfg.iconBg}>
        <div className="mb-2 space-y-2">
          <DetailRow label="Action" value={<span className="capitalize">{tx.operation.replace(/_/g, " ")}</span>} />
          {fee !== "0" && <DetailRow label="Est. Fee" value={fee} />}
          {tx.pool && <DetailRow label="Pool" value={trunc(tx.pool)} mono />}
          {tx.from && <DetailRow label="From" value={trunc(tx.from)} mono />}
          {tx.amount && <DetailRow label="Amount" value={fmt(tx.amount)} />}
          {tx.route?.estimatedOutput && (
            <DetailRow label="Est. Output" value={fmt(tx.route.estimatedOutput)} />
          )}
          {tx.route?.tokens && tx.route.tokens.length > 0 && (
            <DetailRow label="Route" value={tx.route.tokens.join(" → ")} />
          )}
          {xdr && (
            <div className="mt-2 border-t pt-2">
              <div className="mb-1 text-muted-foreground text-xs">Transaction XDR</div>
              <div className="max-h-[60px] overflow-y-auto break-all rounded bg-muted/30 p-2 font-mono text-[10px] text-muted-foreground">
                {xdr.slice(0, 200)}{xdr.length > 200 ? "..." : ""}
              </div>
            </div>
          )}
        </div>
        {txResult?.success ? (
          <div className="rounded-md border border-green-500/30 bg-green-500/20 p-3">
            <p className="text-green-700 text-sm dark:text-green-300">
              {txResult.message}
              {txResult.hash && <span className="ml-1 font-mono text-xs">({trunc(txResult.hash)})</span>}
            </p>
          </div>
        ) : txResult && !txResult.success ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3">
            <p className="text-destructive text-sm">{txResult.message}</p>
          </div>
        ) : trustlineBlocking ? (
          <div className="mt-2 space-y-2">
            {isLiquidityOp ? (
              <>
                <p className="text-xs text-amber-400">Missing trustlines for: {multiTl.missing.map((t) => t.symbol).join(", ")}</p>
                {multiTl.missing.map((t) => (
                  <button key={t.contract} type="button" onClick={() => multiTl.addTrustline(t.contract, t.symbol)} disabled={multiTl.adding}
                    className="w-full rounded-lg bg-amber-500/20 py-2 text-sm font-semibold text-amber-400 hover:bg-amber-500/30 disabled:opacity-40 flex items-center justify-center gap-1.5">
                    {multiTl.adding ? <><Loader2 className="h-4 w-4 animate-spin" /> Adding...</> : `Add ${t.symbol} Trustline`}
                  </button>
                ))}
              </>
            ) : (
              <>
                <p className="text-xs text-amber-400">Trustline required for {outputAsset.symbol ?? "output token"}</p>
                <button type="button" onClick={() => swapTl.addTrustline()} disabled={swapTl.adding}
                  className="w-full rounded-lg bg-amber-500/20 py-2.5 text-sm font-semibold text-amber-400 hover:bg-amber-500/30 disabled:opacity-40 flex items-center justify-center gap-1.5">
                  {swapTl.adding ? <><Loader2 className="h-4 w-4 animate-spin" /> Adding...</> : `Add ${outputAsset.symbol ?? ""} Trustline`}
                </button>
              </>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={handleSign}
            disabled={signing || !xdr || trustlineChecking}
            className="mt-2 w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            {trustlineChecking ? <><Loader2 className="h-4 w-4 animate-spin" /> Checking...</> : signing ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing...</> : cfg.buttonText}
          </button>
        )}
      </ProtocolCard>
    );
  }

  // ─── Playground mode (Aquarius-style confirm card) ─────────────
  const routeTokens = tx.route?.tokens ?? [];
  const firstToken = routeTokens[0] ?? "";
  const lastToken = routeTokens[routeTokens.length - 1] ?? "";
  const amountIn = Number(tx.amount ?? 0);
  const estOutput = tx.route?.estimatedOutput ? Number(tx.route.estimatedOutput) / 1e7 : null;
  const exchangeRate = amountIn > 0 && estOutput != null ? estOutput / amountIn : null;
  const pools = tx.route?.pools as string[] | undefined;
  const isLiquidity = tx.operation === "add_liquidity" || tx.operation === "withdraw_liquidity";
  const txAmounts = tx.amounts ?? [];
  const ctxAny = tx.context as Record<string, unknown> | undefined;

  return (
    <div className="relative rounded-xl border border-border bg-card overflow-hidden">
      {/* Title */}
      <div className="px-5 pt-5 pb-2">
        <p className="text-lg font-semibold text-foreground">Confirm {cfg.label}</p>
        <p className="text-xs text-muted-foreground">Review amounts, rate, and fees before confirming</p>
      </div>

      {isLiquidity && routeTokens.length >= 2 ? (
        /* ─── Liquidity layout: show both token amounts ─── */
        <div className="px-5 pb-3 space-y-0">
          {/* Amount rows with token icons */}
          <div className="flex justify-between items-center py-3 border-b border-border/30">
            <span className="text-sm text-muted-foreground">{firstToken} Amount</span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-foreground font-medium tabular-nums">{txAmounts[0] ?? fmt(amountIn, 7)}</span>
              <TokenImage src={null} alt={firstToken} className="h-5 w-5 rounded-full" />
              <span className="text-xs text-muted-foreground">{firstToken}</span>
            </div>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-border/30">
            <span className="text-sm text-muted-foreground">{lastToken} Amount</span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-foreground font-medium tabular-nums">{txAmounts[1] ?? "—"}</span>
              <TokenImage src={null} alt={lastToken} className="h-5 w-5 rounded-full" />
              <span className="text-xs text-muted-foreground">{lastToken}</span>
            </div>
          </div>
          <div className="flex justify-between py-2.5 border-b border-border/30">
            <span className="text-sm text-muted-foreground">Maximum transaction fee</span>
            <span className="text-sm text-foreground tabular-nums">{fmtGas(fee)}</span>
          </div>

          {/* Concentrated range info */}
          {ctxAny?.range && (
            <>
              <div className="flex justify-between py-2.5 border-b border-border/30">
                <span className="text-sm text-muted-foreground">Selected range ({firstToken}/{lastToken})</span>
                <span className="text-sm text-foreground tabular-nums">{String(ctxAny.range)}</span>
              </div>
              {ctxAny.ticks && (
                <div className="flex justify-between py-2.5 border-b border-border/30">
                  <span className="text-sm text-muted-foreground">Current tick</span>
                  <span className="text-sm text-foreground tabular-nums">{String(ctxAny.ticks)}</span>
                </div>
              )}
            </>
          )}

          {/* Pool APY */}
          {tx.context?.poolApy && (
            <div className="flex justify-between py-2.5">
              <span className="text-sm text-muted-foreground">Pool APY</span>
              <span className="text-sm text-emerald-400 tabular-nums">
                {((tx.context.poolApy.feeApy ?? 0) + (tx.context.poolApy.rewardApy ?? 0)).toFixed(2)}%
              </span>
            </div>
          )}
        </div>
      ) : (
        /* ─── Swap layout ─── */
        <>
          {/* Token direction */}
          {routeTokens.length >= 2 && (
            <div className="px-5 py-3">
              <div className="relative flex items-center gap-3">
                <div className="flex-1 flex items-center gap-2.5 rounded-2xl bg-secondary/60 px-4 py-3">
                  <TokenImage src={null} alt={firstToken} className="h-8 w-8 rounded-full" />
                  <p className="text-base font-medium text-foreground">{firstToken}</p>
                </div>
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-card border border-border flex items-center justify-center z-10">
                  <span className="text-muted-foreground text-sm">{"\u2192"}</span>
                </div>
                <div className="flex-1 flex items-center gap-2.5 rounded-2xl bg-secondary/60 px-4 py-3">
                  <TokenImage src={null} alt={lastToken} className="h-8 w-8 rounded-full" />
                  <p className="text-base font-medium text-foreground">{lastToken}</p>
                </div>
              </div>
            </div>
          )}

          {/* Detail rows */}
          <div className="px-5 pb-3 space-y-0">
            <div className="flex justify-between py-2.5 border-b border-border/30">
              <span className="text-sm text-muted-foreground">You give</span>
              <span className="text-sm text-foreground font-medium tabular-nums">{fmt(amountIn, 7)} {firstToken}</span>
            </div>
            {estOutput != null && estOutput > 0 && (
              <div className="flex justify-between py-2.5 border-b border-border/30">
                <span className="text-sm text-muted-foreground">You get (estimate)</span>
                <span className="text-sm text-foreground font-medium tabular-nums">{fmt(estOutput, 7)} {lastToken}</span>
              </div>
            )}
            {exchangeRate != null && exchangeRate > 0 && (
              <div className="flex justify-between py-2.5 border-b border-border/30">
                <span className="text-sm text-muted-foreground">Exchange rate</span>
                <span className="text-sm text-foreground tabular-nums">1 {firstToken} = {exchangeRate.toFixed(7)} {lastToken}</span>
              </div>
            )}
            <div className="flex justify-between py-2.5 border-b border-border/30">
              <span className="text-sm text-muted-foreground">Maximum transaction fee</span>
              <span className="text-sm text-foreground tabular-nums">{fmtGas(fee)}</span>
            </div>
            {tx.context?.poolApy && (
              <div className="flex justify-between py-2.5">
                <span className="text-sm text-muted-foreground">Pool APY</span>
                <span className="text-sm text-emerald-400 tabular-nums">
                  {((tx.context.poolApy.feeApy ?? 0) + (tx.context.poolApy.rewardApy ?? 0)).toFixed(2)}%
                </span>
              </div>
            )}
          </div>

          {/* Pools route */}
          {pools && pools.length > 0 && routeTokens.length > 1 && (
            <div className="px-5 pb-3">
              <p className="text-sm text-muted-foreground mb-2">Pools:</p>
              <div className="flex items-center gap-1.5 flex-wrap">
                {pools.map((pool, i) => (
                  <span key={pool} className="flex items-center gap-1.5">
                    <span className="flex items-center gap-1 rounded-full border border-border/50 bg-secondary/40 px-2.5 py-1.5">
                      <TokenImage src={null} alt={routeTokens[i] ?? "?"} className="h-6 w-6 rounded-full" />
                      <TokenImage src={null} alt={routeTokens[i + 1] ?? "?"} className="h-6 w-6 rounded-full" />
                    </span>
                    {i < pools.length - 1 && <span className="text-muted-foreground/40 text-sm">{"\u2192"}</span>}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* XDR toggle */}
      <div className="px-5 pb-2">
        <button
          type="button"
          onClick={() => setShowXdr(!showXdr)}
          className="text-[10px] text-muted-foreground/50 hover:text-muted-foreground transition-colors"
        >
          {showXdr ? "Hide XDR" : "Show XDR"}
        </button>
        {showXdr && (
          <pre className="mt-1 max-h-[100px] overflow-auto rounded-lg bg-secondary p-2 text-[10px] text-muted-foreground font-mono break-all">
            {xdr}
          </pre>
        )}
      </div>

      {/* Divider */}
      <div className="h-px bg-border" />

      {/* Action area */}
      <div className="px-4 py-3">
        {txResult?.success ? (
          <a
            href={`https://stellar.expert/explorer/testnet/tx/${txResult.hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full rounded-lg py-2 text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-center hover:bg-emerald-500/15 transition-colors"
          >
            Transaction confirmed {"\u00B7"} {trunc(txResult.hash ?? "")}
          </a>
        ) : txError ? (
          <div className="rounded-lg py-2 px-3 text-xs bg-destructive/10 border border-destructive/20 text-destructive text-center">
            Failed {"\u00B7"} {txError.length > 80 ? txError.slice(0, 80) + "\u2026" : txError}
          </div>
        ) : trustlineBlocking ? (
          <div className="space-y-2">
            {isLiquidityOp ? (
              <>
                <div className="rounded-lg py-2 px-3 text-xs bg-amber-500/10 border border-amber-500/20 text-amber-400 text-center">
                  Missing trustlines: {multiTl.missing.map((t) => t.symbol).join(", ")}
                </div>
                {multiTl.missing.map((t) => (
                  <button key={t.contract} type="button"
                    className="w-full rounded-lg py-2 text-xs font-semibold bg-amber-500/20 border border-amber-500/30 text-amber-400 hover:bg-amber-500/30 transition-all active:scale-[0.98] disabled:opacity-40 flex items-center justify-center gap-1.5"
                    onClick={() => multiTl.addTrustline(t.contract, t.symbol)} disabled={multiTl.adding}>
                    {multiTl.adding ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Adding...</> : `Add ${t.symbol} Trustline`}
                  </button>
                ))}
              </>
            ) : (
              <>
                <div className="rounded-lg py-2 px-3 text-xs bg-amber-500/10 border border-amber-500/20 text-amber-400 text-center">
                  Trustline required for {outputAsset.symbol ?? "output token"}
                </div>
                <button type="button"
                  className="w-full rounded-lg py-2 text-xs font-semibold bg-amber-500/20 border border-amber-500/30 text-amber-400 hover:bg-amber-500/30 transition-all active:scale-[0.98] disabled:opacity-40 flex items-center justify-center gap-1.5"
                  onClick={() => swapTl.addTrustline()} disabled={swapTl.adding}>
                  {swapTl.adding ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Adding...</> : `Add ${outputAsset.symbol ?? ""} Trustline`}
                </button>
              </>
            )}
          </div>
        ) : cancelled ? (
          <div className="rounded-lg py-2 px-3 text-xs bg-muted border border-border text-muted-foreground text-center">
            Transaction cancelled
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="flex-1 rounded-lg py-2 text-xs font-semibold border border-border text-muted-foreground hover:bg-secondary hover:text-foreground transition-all active:scale-[0.98]"
              disabled={signing}
              onClick={() => { setCancelled(true); respond?.({ success: false, cancelled: true, reason: "User cancelled the operation" }); }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="flex-1 rounded-lg py-2 text-xs font-semibold bg-gradient-to-b from-[#B5EAFF] to-[#00BFFF] text-black hover:from-[#C5F0FF] hover:to-[#1CCFFF] transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              onClick={handleSign}
              disabled={signing || !xdr || trustlineChecking}
            >
              {trustlineChecking ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Checking...</> : signing ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Signing...</> : cfg.action}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
