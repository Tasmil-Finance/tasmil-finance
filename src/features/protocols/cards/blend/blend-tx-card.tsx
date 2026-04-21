"use client";

import { useState, useRef } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  ArrowRightLeft,
  Loader2,
  AlertTriangle,
  Coins,
} from "lucide-react";
import { TokenImage } from "@/shared/components/token-image";
import type { CardMode } from "../../schemas/common.schema";
import type { TxCardProps } from "../../schemas/blend.schema";
import { ProtocolCard } from "../base/protocol-card";
import { DetailRow } from "../base/indicators";
import { resolveSymbol, fmtAmount, fmtGas, trunc } from "../../lib/formatting";
import { useTxSigning } from "../../hooks/use-tx-signing";

// ─── Operation config ───────────────────────────────────────────
// cancel / sign: true = beneficial or neutral -> no popup
//                false = detrimental to protocol -> show FOMO popup

interface OpConfig {
  label: string;
  verb: string;
  action: string;
  cancel: boolean;
  sign: boolean;
  title: string;
  buttonText: string;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
}

const OP_CONFIG: Record<string, OpConfig> = {
  blend_supply: { label: "Supply", verb: "to supply", action: "Sign & Supply", cancel: false, sign: true, title: "Sign Blend Deposit", buttonText: "Sign & Deposit", icon: Coins, iconColor: "text-green-500", iconBg: "bg-green-500/10" },
  blend_borrow: { label: "Borrow", verb: "to borrow", action: "Sign & Borrow", cancel: true, sign: true, title: "Sign Blend Borrow", buttonText: "Sign & Borrow", icon: Coins, iconColor: "text-blue-500", iconBg: "bg-blue-500/10" },
  blend_repay: { label: "Repay", verb: "to repay", action: "Sign & Repay", cancel: true, sign: true, title: "Sign Blend Repay", buttonText: "Sign & Repay", icon: Coins, iconColor: "text-purple-500", iconBg: "bg-purple-500/10" },
  blend_withdraw: { label: "Withdraw", verb: "to withdraw", action: "Sign & Withdraw", cancel: true, sign: false, title: "Sign Blend Withdrawal", buttonText: "Sign & Withdraw", icon: Coins, iconColor: "text-orange-500", iconBg: "bg-orange-500/10" },
  blend_toggle_collateral: { label: "Toggle Collateral", verb: "", action: "Sign & Toggle", cancel: true, sign: true, title: "Sign Collateral Toggle", buttonText: "Sign & Toggle", icon: Coins, iconColor: "text-yellow-500", iconBg: "bg-yellow-500/10" },
  blend_claim: { label: "Claim Emissions", verb: "to claim", action: "Sign & Claim", cancel: false, sign: true, title: "Sign Emissions Claim", buttonText: "Sign & Claim", icon: Coins, iconColor: "text-green-500", iconBg: "bg-green-500/10" },
  backstop_deposit: { label: "Backstop Deposit", verb: "to deposit", action: "Sign & Deposit", cancel: false, sign: true, title: "Sign Backstop Deposit", buttonText: "Sign & Deposit", icon: Coins, iconColor: "text-blue-500", iconBg: "bg-blue-500/10" },
  backstop_queue: { label: "Queue Withdrawal", verb: "to queue", action: "Sign & Queue", cancel: true, sign: false, title: "Sign Backstop Queue", buttonText: "Sign & Queue", icon: Coins, iconColor: "text-orange-500", iconBg: "bg-orange-500/10" },
  backstop_dequeue: { label: "Dequeue", verb: "to dequeue", action: "Sign & Dequeue", cancel: false, sign: true, title: "Sign Backstop Dequeue", buttonText: "Sign & Dequeue", icon: Coins, iconColor: "text-purple-500", iconBg: "bg-purple-500/10" },
  backstop_withdraw: { label: "Backstop Withdraw", verb: "to withdraw", action: "Sign & Withdraw", cancel: true, sign: false, title: "Sign Backstop Withdrawal", buttonText: "Sign & Withdraw", icon: Coins, iconColor: "text-green-500", iconBg: "bg-green-500/10" },
};

const DEFAULT_OP_CONFIG: OpConfig = {
  label: "Transaction", verb: "", action: "Sign", cancel: true, sign: true,
  title: "Sign Transaction", buttonText: "Sign & Submit",
  icon: ArrowRightLeft, iconColor: "text-primary", iconBg: "bg-primary/10",
};

// ─── Props ──────────────────────────────────────────────────────

interface BlendTxCardComponentProps {
  tx: TxCardProps;
  mode?: CardMode;
  // Chat-specific
  stream?: any;
  toolCallId?: string;
  respond?: (result: Record<string, unknown>) => void;
}

// ─── Component ──────────────────────────────────────────────────

export function BlendTxCard({
  tx,
  mode = "playground",
  stream,
  toolCallId,
  respond,
}: BlendTxCardComponentProps) {
  const cfg = OP_CONFIG[tx.operation] ?? DEFAULT_OP_CONFIG;
  const isBackstopOp = tx.operation.startsWith("backstop_");
  const resolved = tx.symbol ?? tx.context?.symbol ?? resolveSymbol(tx.asset ?? "");
  const symbol = resolved || (isBackstopOp ? "BLNDUSDCLP" : "");
  const amount = tx.amount ?? "0";
  const fee = tx.estimatedFee ?? "0";
  const xdr = tx.xdr;
  const pool = tx.pool ?? "";
  const from = tx.from ?? "";

  const { sign, signing, txResult, txError } = useTxSigning({
    mode,
    stream,
    toolCallId,
    operation: tx.operation,
    respond,
  });

  const [showXdr, setShowXdr] = useState(false);
  const [showCancelWarning, setShowCancelWarning] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // ─── Derive APY + position from enriched context (no extra API calls) ───
  const ctx = tx.context;
  const isBorrowOp = tx.operation === "blend_borrow" || tx.operation === "blend_repay";
  const apy = ctx?.reserveApy
    ? (isBorrowOp ? ctx.reserveApy.borrowApy : ctx.reserveApy.supplyApy)
    : null;
  const current = ctx?.currentPosition
    ? (isBorrowOp ? ctx.currentPosition.borrowedAmount : ctx.currentPosition.suppliedAmount)
    : null;
  const delta = Number(amount) / 1e7;
  const isAdd = tx.operation === "blend_supply" || tx.operation === "blend_borrow" || tx.operation === "backstop_deposit";
  const newAmount = current != null ? (isAdd ? current + delta : Math.max(0, current - delta)) : null;
  const estimatedYearlyEarnings = apy != null && apy > 0 ? delta * (apy / 100) : null;

  const handleSign = () => sign(xdr);

  // ─── Chat mode ────────────────────────────────────────────────
  if (mode === "chat") {
    const effectiveResult = txResult;

    return (
      <ProtocolCard mode="chat" title={cfg.title} icon={cfg.icon} iconColor={cfg.iconColor} iconBg={cfg.iconBg}>
        <div className="mb-2 space-y-2">
          {tx.operation && (
            <DetailRow label="Action" value={<span className="capitalize">{tx.operation.replace(/_/g, " ")}</span>} />
          )}
          {fee !== "0" && <DetailRow label="Est. Fee" value={fee} />}
          {amount !== "0" && <DetailRow label="Amount" value={`${fmtAmount(amount)} ${symbol}`} />}
          {from && <DetailRow label="From" value={trunc(from)} mono />}
          {pool && <DetailRow label="Pool" value={trunc(pool)} mono />}
          {tx.asset && <DetailRow label="Asset" value={trunc(tx.asset)} mono />}
          {xdr && (
            <div className="mt-2 border-t pt-2">
              <div className="mb-1 text-muted-foreground text-xs">Transaction XDR</div>
              <div className="max-h-[60px] overflow-y-auto break-all rounded bg-muted/30 p-2 font-mono text-[10px] text-muted-foreground">
                {xdr.slice(0, 200)}{xdr.length > 200 ? "..." : ""}
              </div>
            </div>
          )}
        </div>
        {/* Result / action area */}
        {effectiveResult?.success ? (
          <div className="rounded-md border border-green-500/30 bg-green-500/20 p-3">
            <p className="text-green-700 text-sm dark:text-green-300">
              {effectiveResult.message}
              {effectiveResult.hash && <span className="ml-1 font-mono text-xs">({trunc(effectiveResult.hash)})</span>}
            </p>
          </div>
        ) : effectiveResult && !effectiveResult.success ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3">
            <p className="text-destructive text-sm">{effectiveResult.message}</p>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleSign}
            disabled={signing || !xdr}
            className="mt-2 w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            {signing ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing...</> : cfg.buttonText}
          </button>
        )}
      </ProtocolCard>
    );
  }

  // ─── Playground mode ──────────────────────────────────────────
  return (
    <div ref={cardRef} className="relative rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-2">
        <p className="text-lg font-semibold text-foreground">Confirm {cfg.label}</p>
        <p className="text-xs text-muted-foreground">Review details before signing</p>
      </div>

      {/* Detail rows */}
      <div className="px-5 pb-3 space-y-0">
        {/* Amount */}
        <div className="flex justify-between py-2.5 border-b border-border/30">
          <span className="text-sm text-muted-foreground">Amount {cfg.verb}</span>
          <span className="text-sm text-foreground font-medium tabular-nums flex items-center gap-1.5">
            <TokenImage src={null} alt={symbol} className="h-5 w-5 rounded-full" />
            {fmtAmount(amount)} {symbol}
          </span>
        </div>

        {/* Gas */}
        <div className="flex justify-between py-2.5 border-b border-border/30">
          <span className="text-sm text-muted-foreground">Maximum transaction fee</span>
          <span className="text-sm text-foreground tabular-nums">{fmtGas(fee)}</span>
        </div>

        {/* APY */}
        {apy != null && apy > 0 && (
          <div className="flex justify-between py-2.5 border-b border-border/30">
            <span className="text-sm text-muted-foreground">APY</span>
            <span className="text-sm font-medium text-emerald-400 tabular-nums">{apy.toFixed(2)}%</span>
          </div>
        )}

        {/* Estimated yearly earnings */}
        {estimatedYearlyEarnings != null && isAdd && (
          <div className="flex justify-between py-2.5 border-b border-border/30">
            <span className="text-sm text-muted-foreground">Est. yearly earnings</span>
            <span className="text-sm text-emerald-400/80 tabular-nums">+{estimatedYearlyEarnings.toFixed(4)} {symbol}</span>
          </div>
        )}

        {/* Position change: before -> after */}
        {current != null && newAmount != null && (
          <div className="flex justify-between py-2.5 border-b border-border/30">
            <span className="text-sm text-muted-foreground">
              {tx.operation.includes("borrow") || tx.operation === "blend_repay" ? "Your total borrowed" : "Your total supplied"}
            </span>
            <span className="text-sm text-foreground tabular-nums flex items-center gap-1.5">
              {current.toFixed(4)} {symbol}
              <ArrowRight className="h-3 w-3 text-muted-foreground/40 shrink-0" />
              {newAmount.toFixed(4)} {symbol}
            </span>
          </div>
        )}
      </div>

      {/* XDR toggle */}
      <div className="px-5 pb-2">
        <button type="button" onClick={() => setShowXdr(!showXdr)} className="text-[10px] text-muted-foreground/50 hover:text-muted-foreground transition-colors">
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
        ) : cancelled ? (
          <div className="rounded-lg py-2 px-3 text-xs bg-muted border border-border text-muted-foreground text-center">
            Transaction cancelled
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="flex-1 rounded-lg py-2 text-xs font-semibold border border-border text-muted-foreground hover:bg-secondary hover:text-foreground transition-all active:scale-[0.98]"
              onClick={() => {
                if (cfg.cancel) {
                  setCancelled(true);
                  respond?.({ success: false, cancelled: true, reason: "User cancelled the operation" });
                } else {
                  setShowCancelWarning(true);
                }
              }}
              disabled={signing}
            >
              Cancel
            </button>
            <button
              type="button"
              className="flex-1 rounded-lg py-2 text-xs font-semibold bg-gradient-to-b from-[#B5EAFF] to-[#00BFFF] text-black hover:from-[#C5F0FF] hover:to-[#1CCFFF] transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              onClick={() => {
                if (cfg.sign) {
                  handleSign();
                } else {
                  setShowCancelWarning(true);
                }
              }}
              disabled={signing || !xdr}
            >
              {signing ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Signing...</> : cfg.action}
            </button>
          </div>
        )}
      </div>

      {/* FOMO Warning popup (playground only) */}
      <CancelWarningPopup
        visible={showCancelWarning}
        onKeepEarning={() => setShowCancelWarning(false)}
        onConfirm={() => {
          setShowCancelWarning(false);
          if (!cfg.sign) {
            handleSign();
          } else {
            setCancelled(true);
            respond?.({ success: false, cancelled: true, reason: "User cancelled the operation" });
          }
        }}
        symbol={symbol}
        amount={fmtAmount(amount)}
        operation={tx.operation}
        apy={apy}
        estimatedYearlyEarnings={estimatedYearlyEarnings}
        signSafe={cfg.sign}
      />
    </div>
  );
}

// ─── Cancel Warning Popup (playground only) ─────────────────────

function CancelWarningPopup({
  visible,
  onKeepEarning,
  onConfirm,
  symbol,
  amount,
  operation,
  apy,
  estimatedYearlyEarnings,
  signSafe,
}: {
  visible: boolean;
  onKeepEarning: () => void;
  onConfirm: () => void;
  symbol: string;
  amount: string;
  operation: string;
  apy: number | null;
  estimatedYearlyEarnings: number | null;
  signSafe: boolean;
}) {
  const opLabel = OP_CONFIG[operation]?.label ?? operation;
  const title = signSafe ? "You're about to miss out" : `Before you ${opLabel.toLowerCase()}`;
  const dismissLabel = "Keep earning";
  const confirmLabel = signSafe ? "Cancel anyway" : `${opLabel} anyway`;

  return (
    <>
      <div
        className={`absolute inset-0 z-10 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={onKeepEarning}
      />
      <div
        className={`absolute bottom-0 left-0 right-0 z-20 h-[80%] rounded-t-2xl border-t border-border bg-card transition-transform duration-300 ease-out ${visible ? "translate-y-0" : "translate-y-full"}`}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
        </div>
        <div className="flex flex-col h-[calc(100%-2rem)] px-4">
          <div className="flex items-start gap-3 pt-2 pb-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/15">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{title}</p>
              <p className="text-xs text-muted-foreground">Please read carefully</p>
            </div>
          </div>
          <div className="flex-1 overflow-auto space-y-3 pb-3">
            {!signSafe ? (
              <>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  This action means you will{" "}
                  <span className="text-red-400 font-medium">lose unclaimed rewards</span> and any{" "}
                  <span className="font-medium text-foreground">unvested portion of your welcome reward</span>.
                </p>
                <div className="rounded-lg bg-secondary/50 border border-border p-3 space-y-1.5">
                  <p className="text-xs text-muted-foreground">Amount: <span className="text-foreground font-medium">{amount} {symbol}</span></p>
                  {apy != null && apy > 0 && (
                    <p className="text-xs text-muted-foreground">Current APY: <span className="text-emerald-400 font-medium">{apy.toFixed(2)}%</span></p>
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  You will also forfeit <span className="font-medium text-foreground">accumulated referral points</span>{" "}
                  tied to this pool position. This action cannot be undone.
                </p>
              </>
            ) : apy != null && apy > 0 ? (
              <>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  By cancelling, you're giving up earning{" "}
                  <span className="text-emerald-400 font-medium">{apy.toFixed(2)}% APY</span> on your{" "}
                  <span className="font-medium text-foreground">{amount} {symbol}</span>.
                </p>
                {estimatedYearlyEarnings != null && (
                  <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/15 p-3 space-y-2">
                    <p className="text-[10px] uppercase tracking-wider text-emerald-400/70 font-medium">Estimated earnings you'll miss</p>
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-muted-foreground">After 1 year</span>
                      <span className="text-sm font-semibold text-emerald-400 tabular-nums">+{estimatedYearlyEarnings.toFixed(4)} {symbol}</span>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-muted-foreground">After 30 days</span>
                      <span className="text-xs text-emerald-400/80 tabular-nums">+{(estimatedYearlyEarnings / 12).toFixed(4)} {symbol}</span>
                    </div>
                  </div>
                )}
                <p className="text-xs text-muted-foreground leading-relaxed">Your {symbol} will remain idle and earn nothing. Are you sure?</p>
              </>
            ) : (
              <p className="text-xs text-muted-foreground leading-relaxed">
                Are you sure you want to cancel this <span className="font-medium text-foreground">{amount} {symbol}</span> transaction? You may miss out on potential rewards.
              </p>
            )}
          </div>
          <div className="flex items-center gap-3 pb-4 pt-2">
            <button type="button" className="flex-1 rounded-lg py-2.5 text-xs font-semibold border border-border text-foreground hover:bg-secondary transition-all active:scale-[0.98]" onClick={onKeepEarning}>
              {dismissLabel}
            </button>
            <button type="button" className="flex-1 rounded-lg py-2.5 text-xs font-semibold border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all active:scale-[0.98]" onClick={onConfirm}>
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
