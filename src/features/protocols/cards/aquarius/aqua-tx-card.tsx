"use client";

import type { LucideIcon } from "lucide-react";
import { ArrowRightLeft, Coins, Droplets, Loader2, Lock, Snowflake, Vote } from "lucide-react";
import { useState } from "react";
import { TokenImage } from "@/shared/components/token-image";
import { getExplorerUrl } from "@/shared/config/stellar";
import { useTxSigning } from "../../hooks/use-tx-signing";
import { fmt, fmtGas, trunc } from "../../lib/formatting";
import type { AquaTxCardProps } from "../../schemas/aquarius.schema";
import type { CardMode } from "../../schemas/common.schema";
import { DetailRow } from "../base/indicators";
import { ProtocolCard } from "../base/protocol-card";

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

  const { sign, signing, txResult, txError } = useTxSigning({
    mode,
    stream,
    toolCallId,
    operation: tx.operation,
    respond,
    volumeContext: {
      protocol: "aquarius",
      operation: tx.operation,
      asset: tx.tokenIn ?? "",
      amount: tx.amount ?? tx.amounts?.[0] ?? "0",
    },
  });

  const _isLiquidityOp = tx.operation === "add_liquidity" || tx.operation === "withdraw_liquidity";
  void _isLiquidityOp;

  const [showXdr, setShowXdr] = useState(false);
  const [cancelled, setCancelled] = useState(false);

  const handleSign = () => sign(xdr);

  // ─── Chat mode ────────────────────────────────────────────────
  if (mode === "chat") {
    return (
      <ProtocolCard
        data-testid="card-aqua-tx"
        mode="chat"
        title={cfg.title}
        icon={cfg.icon}
        iconColor={cfg.iconColor}
        iconBg={cfg.iconBg}
      >
        <div className="mb-2 space-y-2">
          <DetailRow
            label="Action"
            value={<span className="capitalize">{tx.operation.replace(/_/g, " ")}</span>}
          />
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
                {xdr.slice(0, 200)}
                {xdr.length > 200 ? "..." : ""}
              </div>
            </div>
          )}
        </div>
        {txResult?.success ? (
          <div className="rounded-md border border-green-500/30 bg-green-500/20 p-3">
            <p className="text-green-700 text-sm dark:text-green-300">
              {txResult.message}
              {txResult.hash && (
                <span className="ml-1 font-mono text-xs">({trunc(txResult.hash)})</span>
              )}
            </p>
          </div>
        ) : txResult && !txResult.success ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3">
            <p className="text-destructive text-sm">{txResult.message}</p>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleSign}
            disabled={signing || !xdr}
            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary py-2.5 font-semibold text-primary-foreground text-sm hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {signing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Signing...
              </>
            ) : (
              cfg.buttonText
            )}
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
    <div className="relative overflow-hidden rounded-xl border border-border bg-card">
      {/* Title */}
      <div className="px-5 pt-5 pb-2">
        <p className="font-semibold text-foreground text-lg">Confirm {cfg.label}</p>
        <p className="text-muted-foreground text-xs">
          Review amounts, rate, and fees before confirming
        </p>
      </div>

      {isLiquidity && routeTokens.length >= 2 ? (
        /* ─── Liquidity layout: show both token amounts ─── */
        <div className="space-y-0 px-5 pb-3">
          {/* Amount rows with token icons */}
          <div className="flex items-center justify-between border-border/30 border-b py-3">
            <span className="text-muted-foreground text-sm">{firstToken} Amount</span>
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground text-sm tabular-nums">
                {txAmounts[0] ?? fmt(amountIn, 7)}
              </span>
              <TokenImage src={null} alt={firstToken} className="h-5 w-5 rounded-full" />
              <span className="text-muted-foreground text-xs">{firstToken}</span>
            </div>
          </div>
          <div className="flex items-center justify-between border-border/30 border-b py-3">
            <span className="text-muted-foreground text-sm">{lastToken} Amount</span>
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground text-sm tabular-nums">
                {txAmounts[1] ?? "—"}
              </span>
              <TokenImage src={null} alt={lastToken} className="h-5 w-5 rounded-full" />
              <span className="text-muted-foreground text-xs">{lastToken}</span>
            </div>
          </div>
          <div className="flex justify-between border-border/30 border-b py-2.5">
            <span className="text-muted-foreground text-sm">Maximum transaction fee</span>
            <span className="text-foreground text-sm tabular-nums">{fmtGas(fee)}</span>
          </div>

          {/* Concentrated range info */}
          {ctxAny?.range != null ? (
            <>
              <div className="flex justify-between border-border/30 border-b py-2.5">
                <span className="text-muted-foreground text-sm">
                  Selected range ({firstToken}/{lastToken})
                </span>
                <span className="text-foreground text-sm tabular-nums">{String(ctxAny.range)}</span>
              </div>
              {ctxAny.ticks != null ? (
                <div className="flex justify-between border-border/30 border-b py-2.5">
                  <span className="text-muted-foreground text-sm">Current tick</span>
                  <span className="text-foreground text-sm tabular-nums">
                    {String(ctxAny.ticks)}
                  </span>
                </div>
              ) : null}
            </>
          ) : null}

          {/* Pool APY */}
          {tx.context?.poolApy && (
            <div className="flex justify-between py-2.5">
              <span className="text-muted-foreground text-sm">Pool APY</span>
              <span className="text-emerald-400 text-sm tabular-nums">
                {((tx.context.poolApy.feeApy ?? 0) + (tx.context.poolApy.rewardApy ?? 0)).toFixed(
                  2
                )}
                %
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
                <div className="flex flex-1 items-center gap-2.5 rounded-2xl bg-secondary/60 px-4 py-3">
                  <TokenImage src={null} alt={firstToken} className="h-8 w-8 rounded-full" />
                  <p className="font-medium text-base text-foreground">{firstToken}</p>
                </div>
                <div className="-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card">
                  <span className="text-muted-foreground text-sm">{"\u2192"}</span>
                </div>
                <div className="flex flex-1 items-center gap-2.5 rounded-2xl bg-secondary/60 px-4 py-3">
                  <TokenImage src={null} alt={lastToken} className="h-8 w-8 rounded-full" />
                  <p className="font-medium text-base text-foreground">{lastToken}</p>
                </div>
              </div>
            </div>
          )}

          {/* Detail rows */}
          <div className="space-y-0 px-5 pb-3">
            <div className="flex justify-between border-border/30 border-b py-2.5">
              <span className="text-muted-foreground text-sm">You give</span>
              <span className="font-medium text-foreground text-sm tabular-nums">
                {fmt(amountIn, 7)} {firstToken}
              </span>
            </div>
            {estOutput != null && estOutput > 0 && (
              <div className="flex justify-between border-border/30 border-b py-2.5">
                <span className="text-muted-foreground text-sm">You get (estimate)</span>
                <span className="font-medium text-foreground text-sm tabular-nums">
                  {fmt(estOutput, 7)} {lastToken}
                </span>
              </div>
            )}
            {exchangeRate != null && exchangeRate > 0 && (
              <div className="flex justify-between border-border/30 border-b py-2.5">
                <span className="text-muted-foreground text-sm">Exchange rate</span>
                <span className="text-foreground text-sm tabular-nums">
                  1 {firstToken} = {exchangeRate.toFixed(7)} {lastToken}
                </span>
              </div>
            )}
            <div className="flex justify-between border-border/30 border-b py-2.5">
              <span className="text-muted-foreground text-sm">Maximum transaction fee</span>
              <span className="text-foreground text-sm tabular-nums">{fmtGas(fee)}</span>
            </div>
            {tx.context?.poolApy && (
              <div className="flex justify-between py-2.5">
                <span className="text-muted-foreground text-sm">Pool APY</span>
                <span className="text-emerald-400 text-sm tabular-nums">
                  {((tx.context.poolApy.feeApy ?? 0) + (tx.context.poolApy.rewardApy ?? 0)).toFixed(
                    2
                  )}
                  %
                </span>
              </div>
            )}
          </div>

          {/* Pools route */}
          {pools && pools.length > 0 && routeTokens.length > 1 && (
            <div className="px-5 pb-3">
              <p className="mb-2 text-muted-foreground text-sm">Pools:</p>
              <div className="flex flex-wrap items-center gap-1.5">
                {pools.map((pool, i) => (
                  <span key={pool} className="flex items-center gap-1.5">
                    <span className="flex items-center gap-1 rounded-full border border-border/50 bg-secondary/40 px-2.5 py-1.5">
                      <TokenImage
                        src={null}
                        alt={routeTokens[i] ?? "?"}
                        className="h-6 w-6 rounded-full"
                      />
                      <TokenImage
                        src={null}
                        alt={routeTokens[i + 1] ?? "?"}
                        className="h-6 w-6 rounded-full"
                      />
                    </span>
                    {i < pools.length - 1 && (
                      <span className="text-muted-foreground/40 text-sm">{"\u2192"}</span>
                    )}
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
          className="text-[10px] text-muted-foreground/50 transition-colors hover:text-muted-foreground"
        >
          {showXdr ? "Hide XDR" : "Show XDR"}
        </button>
        {showXdr && (
          <pre className="mt-1 max-h-[100px] overflow-auto break-all rounded-lg bg-secondary p-2 font-mono text-[10px] text-muted-foreground">
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
            href={getExplorerUrl("tx", txResult.hash ?? "")}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full rounded-lg border border-emerald-500/20 bg-emerald-500/10 py-2 text-center font-semibold text-emerald-400 text-xs transition-colors hover:bg-emerald-500/15"
          >
            Transaction confirmed {"\u00B7"} {trunc(txResult.hash ?? "")}
          </a>
        ) : txError ? (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-center text-destructive text-xs">
            Failed {"\u00B7"} {txError.length > 80 ? `${txError.slice(0, 80)}\u2026` : txError}
          </div>
        ) : cancelled ? (
          <div className="rounded-lg border border-border bg-muted px-3 py-2 text-center text-muted-foreground text-xs">
            Transaction cancelled
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="flex-1 rounded-lg border border-border py-2 font-semibold text-muted-foreground text-xs transition-all hover:bg-secondary hover:text-foreground active:scale-[0.98]"
              disabled={signing}
              onClick={() => {
                setCancelled(true);
                respond?.({
                  success: false,
                  cancelled: true,
                  reason: "User cancelled the operation",
                });
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-gradient-to-b from-[#B5EAFF] to-[#00BFFF] py-2 font-semibold text-black text-xs transition-all hover:from-[#C5F0FF] hover:to-[#1CCFFF] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
              onClick={handleSign}
              disabled={signing || !xdr}
            >
              {signing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Signing...
                </>
              ) : (
                cfg.action
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
