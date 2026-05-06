"use client";

import type { LucideIcon } from "lucide-react";
import { AlertTriangle, ArrowRight, ArrowRightLeft, Coins, Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import { useStreamContext } from "@/features/chat/hooks/use-stream";
import { TokenImage } from "@/shared/components/token-image";
import { getExplorerUrl } from "@/shared/config/stellar";
import { useTxSigning } from "../../hooks/use-tx-signing";
import { fmtAmount, fmtGas, resolveSymbol, trunc } from "../../lib/formatting";
import type { TxCardProps } from "../../schemas/blend.schema";
import type { CardMode } from "../../schemas/common.schema";

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
  blend_supply: {
    label: "Supply",
    verb: "to supply",
    action: "Sign & Supply",
    cancel: false,
    sign: true,
    title: "Sign Blend Deposit",
    buttonText: "Sign & Deposit",
    icon: Coins,
    iconColor: "text-green-500",
    iconBg: "bg-green-500/10",
  },
  blend_borrow: {
    label: "Borrow",
    verb: "to borrow",
    action: "Sign & Borrow",
    cancel: true,
    sign: true,
    title: "Sign Blend Borrow",
    buttonText: "Sign & Borrow",
    icon: Coins,
    iconColor: "text-blue-500",
    iconBg: "bg-blue-500/10",
  },
  blend_repay: {
    label: "Repay",
    verb: "to repay",
    action: "Sign & Repay",
    cancel: true,
    sign: true,
    title: "Sign Blend Repay",
    buttonText: "Sign & Repay",
    icon: Coins,
    iconColor: "text-purple-500",
    iconBg: "bg-purple-500/10",
  },
  blend_withdraw: {
    label: "Withdraw",
    verb: "to withdraw",
    action: "Sign & Withdraw",
    cancel: true,
    sign: false,
    title: "Sign Blend Withdrawal",
    buttonText: "Sign & Withdraw",
    icon: Coins,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
  },
  blend_toggle_collateral: {
    label: "Toggle Collateral",
    verb: "",
    action: "Sign & Toggle",
    cancel: true,
    sign: true,
    title: "Sign Collateral Toggle",
    buttonText: "Sign & Toggle",
    icon: Coins,
    iconColor: "text-yellow-500",
    iconBg: "bg-yellow-500/10",
  },
  blend_claim: {
    label: "Claim Emissions",
    verb: "to claim",
    action: "Sign & Claim",
    cancel: false,
    sign: true,
    title: "Sign Emissions Claim",
    buttonText: "Sign & Claim",
    icon: Coins,
    iconColor: "text-green-500",
    iconBg: "bg-green-500/10",
  },
  backstop_deposit: {
    label: "Backstop Deposit",
    verb: "to deposit",
    action: "Sign & Deposit",
    cancel: false,
    sign: true,
    title: "Sign Backstop Deposit",
    buttonText: "Sign & Deposit",
    icon: Coins,
    iconColor: "text-blue-500",
    iconBg: "bg-blue-500/10",
  },
  backstop_queue: {
    label: "Queue Withdrawal",
    verb: "to queue",
    action: "Sign & Queue",
    cancel: true,
    sign: false,
    title: "Sign Backstop Queue",
    buttonText: "Sign & Queue",
    icon: Coins,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
  },
  backstop_dequeue: {
    label: "Dequeue",
    verb: "to dequeue",
    action: "Sign & Dequeue",
    cancel: false,
    sign: true,
    title: "Sign Backstop Dequeue",
    buttonText: "Sign & Dequeue",
    icon: Coins,
    iconColor: "text-purple-500",
    iconBg: "bg-purple-500/10",
  },
  backstop_withdraw: {
    label: "Backstop Withdraw",
    verb: "to withdraw",
    action: "Sign & Withdraw",
    cancel: true,
    sign: false,
    title: "Sign Backstop Withdrawal",
    buttonText: "Sign & Withdraw",
    icon: Coins,
    iconColor: "text-green-500",
    iconBg: "bg-green-500/10",
  },
  join_comet_pool: {
    label: "Join Comet Pool",
    verb: "to deposit",
    action: "Sign & Join",
    cancel: false,
    sign: true,
    title: "Sign Comet Pool Join",
    buttonText: "Sign & Join",
    icon: Coins,
    iconColor: "text-cyan-500",
    iconBg: "bg-cyan-500/10",
  },
  exit_comet_pool: {
    label: "Exit Comet Pool",
    verb: "to withdraw",
    action: "Sign & Exit",
    cancel: true,
    sign: false,
    title: "Sign Comet Pool Exit",
    buttonText: "Sign & Exit",
    icon: Coins,
    iconColor: "text-amber-500",
    iconBg: "bg-amber-500/10",
  },
};

const DEFAULT_OP_CONFIG: OpConfig = {
  label: "Transaction",
  verb: "",
  action: "Sign",
  cancel: true,
  sign: true,
  title: "Sign Transaction",
  buttonText: "Sign & Submit",
  icon: ArrowRightLeft,
  iconColor: "text-primary",
  iconBg: "bg-primary/10",
};

interface BlendTxCardComponentProps {
  tx: TxCardProps;
  mode?: CardMode;
  stream?: any;
  toolCallId?: string;
  respond?: (result: Record<string, unknown>) => void;
}

export function BlendTxCard({
  tx,
  mode = "playground",
  stream: streamProp,
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
  const _pool = tx.pool ?? "";
  void _pool;
  const _from = tx.from ?? "";
  void _from;

  const chatStream = useStreamContext();
  const stream = mode === "chat" ? chatStream : streamProp;

  const { sign, cancel, signing, txResult, txError } = useTxSigning({
    mode,
    stream,
    toolCallId,
    operation: tx.operation,
    respond,
    volumeContext: { protocol: "blend", operation: tx.operation, asset: symbol, amount },
  });

  const [showXdr, setShowXdr] = useState(false);
  const [showCancelWarning, setShowCancelWarning] = useState(false);
  // Derive cancelled from persisted txResult so it survives page reloads
  const cancelled =
    txResult !== null && !txResult.success && txResult.message === "Transaction cancelled";
  const cardRef = useRef<HTMLDivElement>(null);

  const ctx = tx.context;
  const isBorrowOp = tx.operation === "blend_borrow" || tx.operation === "blend_repay";
  const apyNum = ctx?.reserveApy
    ? isBorrowOp
      ? ctx.reserveApy.borrowApy
      : ctx.reserveApy.supplyApy
    : null;
  const apy = apyNum != null ? (apyNum < 1 ? apyNum * 100 : apyNum) : null;
  const current = ctx?.currentPosition
    ? isBorrowOp
      ? ctx.currentPosition.borrowedAmount
      : ctx.currentPosition.suppliedAmount
    : null;
  const delta = Number(amount) / 1e7;
  const isAdd =
    tx.operation === "blend_supply" ||
    tx.operation === "blend_borrow" ||
    tx.operation === "backstop_deposit";
  const newAmount =
    current != null ? (isAdd ? current + delta : Math.max(0, current - delta)) : null;
  const estimatedYearlyEarnings = apy != null && apy > 0 ? delta * (apy / 100) : null;

  const handleSign = () => sign(xdr);
  const handleCancel = () => cancel();

  return (
    <div
      data-testid="card-blend-tx"
      ref={cardRef}
      className="relative overflow-hidden rounded-xl border border-border bg-card"
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-2">
        <p className="font-semibold text-foreground text-lg">Confirm {cfg.label}</p>
        <p className="text-muted-foreground text-xs">Review details before signing</p>
      </div>

      {/* Detail rows */}
      <div className="space-y-0 px-5 pb-3">
        <div className="flex justify-between border-border/30 border-b py-2.5">
          <span className="text-muted-foreground text-sm">Amount {cfg.verb}</span>
          <span className="flex items-center gap-1.5 font-medium text-foreground text-sm tabular-nums">
            <TokenImage src={null} alt={symbol} className="h-5 w-5 rounded-full" />
            {fmtAmount(amount)} {symbol}
          </span>
        </div>
        <div className="flex justify-between border-border/30 border-b py-2.5">
          <span className="text-muted-foreground text-sm">Maximum transaction fee</span>
          <span className="text-foreground text-sm tabular-nums">{fmtGas(fee)}</span>
        </div>
        {apy != null && apy > 0 && (
          <div className="flex justify-between border-border/30 border-b py-2.5">
            <span className="text-muted-foreground text-sm">APY</span>
            <span className="font-medium text-emerald-400 text-sm tabular-nums">
              {apy.toFixed(2)}%
            </span>
          </div>
        )}
        {estimatedYearlyEarnings != null && isAdd && (
          <div className="flex justify-between border-border/30 border-b py-2.5">
            <span className="text-muted-foreground text-sm">Est. yearly earnings</span>
            <span className="text-emerald-400/80 text-sm tabular-nums">
              +{estimatedYearlyEarnings.toFixed(4)} {symbol}
            </span>
          </div>
        )}
        {current != null && newAmount != null && (
          <div className="flex justify-between border-border/30 border-b py-2.5">
            <span className="text-muted-foreground text-sm">
              {isBorrowOp ? "Your total borrowed" : "Your total supplied"}
            </span>
            <span className="flex items-center gap-1.5 text-foreground text-sm tabular-nums">
              {current.toFixed(4)} {symbol}
              <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground/40" />
              {newAmount.toFixed(4)} {symbol}
            </span>
          </div>
        )}
      </div>

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
            Transaction confirmed · {trunc(txResult.hash ?? "")}
          </a>
        ) : txError ? (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-center text-destructive text-xs">
            Failed · {txError.length > 80 ? `${txError.slice(0, 80)}…` : txError}
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
              onClick={() => {
                if (cfg.cancel) {
                  handleCancel();
                } else setShowCancelWarning(true);
              }}
              disabled={signing}
            >
              Cancel
            </button>
            <button
              type="button"
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-gradient-to-b from-[#B5EAFF] to-[#00BFFF] py-2 font-semibold text-black text-xs transition-all hover:from-[#C5F0FF] hover:to-[#1CCFFF] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
              onClick={() => {
                if (cfg.sign) handleSign();
                else setShowCancelWarning(true);
              }}
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

      <CancelWarningPopup
        visible={showCancelWarning}
        onKeepEarning={() => setShowCancelWarning(false)}
        onConfirm={() => {
          setShowCancelWarning(false);
          if (!cfg.sign) {
            handleSign();
          } else {
            handleCancel();
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

// ─── Cancel Warning Popup ────────────────────────────────────────

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

  return (
    <>
      <div
        className={`absolute inset-0 z-10 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${visible ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={onKeepEarning}
      />
      <div
        className={`absolute right-0 bottom-0 left-0 z-20 h-[80%] rounded-t-2xl border-border border-t bg-card transition-transform duration-300 ease-out ${visible ? "translate-y-0" : "translate-y-full"}`}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
        </div>
        <div className="flex h-[calc(100%-2rem)] flex-col px-4">
          <div className="flex items-start gap-3 pt-2 pb-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/15">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">{title}</p>
              <p className="text-muted-foreground text-xs">Please read carefully</p>
            </div>
          </div>
          <div className="flex-1 space-y-3 overflow-auto pb-3">
            {!signSafe ? (
              <>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  This action means you will{" "}
                  <span className="font-medium text-red-400">lose unclaimed rewards</span> and any{" "}
                  <span className="font-medium text-foreground">
                    unvested portion of your welcome reward
                  </span>
                  .
                </p>
                <div className="space-y-1.5 rounded-lg border border-border bg-secondary/50 p-3">
                  <p className="text-muted-foreground text-xs">
                    Amount:{" "}
                    <span className="font-medium text-foreground">
                      {amount} {symbol}
                    </span>
                  </p>
                  {apy != null && apy > 0 && (
                    <p className="text-muted-foreground text-xs">
                      Current APY:{" "}
                      <span className="font-medium text-emerald-400">{apy.toFixed(2)}%</span>
                    </p>
                  )}
                </div>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  You will also forfeit{" "}
                  <span className="font-medium text-foreground">accumulated referral points</span>{" "}
                  tied to this pool position. This action cannot be undone.
                </p>
              </>
            ) : apy != null && apy > 0 ? (
              <>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  By cancelling, you're giving up earning{" "}
                  <span className="font-medium text-emerald-400">{apy.toFixed(2)}% APY</span> on
                  your{" "}
                  <span className="font-medium text-foreground">
                    {amount} {symbol}
                  </span>
                  .
                </p>
                {estimatedYearlyEarnings != null && (
                  <div className="space-y-2 rounded-lg border border-emerald-500/15 bg-emerald-500/5 p-3">
                    <p className="font-medium text-[10px] text-emerald-400/70 uppercase tracking-wider">
                      Estimated earnings you'll miss
                    </p>
                    <div className="flex items-baseline justify-between">
                      <span className="text-muted-foreground text-xs">After 1 year</span>
                      <span className="font-semibold text-emerald-400 text-sm tabular-nums">
                        +{estimatedYearlyEarnings.toFixed(4)} {symbol}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-muted-foreground text-xs">After 30 days</span>
                      <span className="text-emerald-400/80 text-xs tabular-nums">
                        +{(estimatedYearlyEarnings / 12).toFixed(4)} {symbol}
                      </span>
                    </div>
                  </div>
                )}
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Your {symbol} will remain idle and earn nothing. Are you sure?
                </p>
              </>
            ) : (
              <p className="text-muted-foreground text-xs leading-relaxed">
                Are you sure you want to cancel this{" "}
                <span className="font-medium text-foreground">
                  {amount} {symbol}
                </span>{" "}
                transaction? You may miss out on potential rewards.
              </p>
            )}
          </div>
          <div className="flex items-center gap-3 pt-2 pb-4">
            <button
              type="button"
              className="flex-1 rounded-lg border border-border py-2.5 font-semibold text-foreground text-xs transition-all hover:bg-secondary active:scale-[0.98]"
              onClick={onKeepEarning}
            >
              Keep earning
            </button>
            <button
              type="button"
              className="flex-1 rounded-lg border border-red-500/30 py-2.5 font-semibold text-red-400 text-xs transition-all hover:bg-red-500/10 active:scale-[0.98]"
              onClick={onConfirm}
            >
              {signSafe ? "Cancel anyway" : `${opLabel} anyway`}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
