"use client";

import type { LucideIcon } from "lucide-react";
import {
  ArrowRightLeft,
  Coins,
  Droplets,
  FileCode,
  Globe,
  Loader2,
  Lock,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { useTxSigning } from "@/features/protocols/hooks/use-tx-signing";
import { fmtAmount, fmtGas, trunc } from "@/features/protocols/lib/formatting";
import { TokenImage } from "@/shared/components/token-image";
import { getExplorerUrl } from "@/shared/config/stellar";

// ─── Props ──────────────────────────────────────────────────────

export interface GenericExecuteCardProps {
  operation: string;
  protocol?: string;
  xdr: string;
  amount?: string | null;
  symbol?: string | null;
  estimatedFee?: string;
  asset?: string | null;
  pool?: string | null;
  from?: string | null;
  /** Additional context for detail rows */
  extraRows?: Array<{ label: string; value: string; mono?: boolean }>;
  context?: Record<string, unknown>;
}

interface GenericExecuteCardComponentProps {
  tx?: GenericExecuteCardProps;
  /** Legacy props — still supported for use-defi-tool-renderers direct usage */
  operation?: string;
  args?: Record<string, any>;
  result?: unknown;
  toolCallId?: string;
  status?: "pending" | "executing" | "complete" | "error" | "inProgress";
  respond?: (result: Record<string, unknown>) => void;
}

// ─── Operation config ───────────────────────────────────────────

interface OpConfig {
  label: string;
  buttonText: string;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
}

const OP_CONFIG: Record<string, OpConfig> = {
  add_liquidity: {
    label: "Add Liquidity",
    buttonText: "Sign & Add",
    icon: Droplets,
    iconColor: "text-cyan-500",
    iconBg: "bg-cyan-500/10",
  },
  remove_liquidity: {
    label: "Withdraw Liquidity",
    buttonText: "Sign & Withdraw",
    icon: Droplets,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
  },
  provide_liquidity: {
    label: "Provide Liquidity",
    buttonText: "Sign & Provide",
    icon: Droplets,
    iconColor: "text-cyan-500",
    iconBg: "bg-cyan-500/10",
  },
  withdraw_liquidity: {
    label: "Withdraw Liquidity",
    buttonText: "Sign & Withdraw",
    icon: Droplets,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
  },
  stake_bond: {
    label: "Stake",
    buttonText: "Sign & Stake",
    icon: TrendingUp,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
  },
  stake_unbond: {
    label: "Unstake",
    buttonText: "Sign & Unstake",
    icon: TrendingUp,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
  },
  claim_rewards: {
    label: "Claim Rewards",
    buttonText: "Sign & Claim",
    icon: Coins,
    iconColor: "text-green-500",
    iconBg: "bg-green-500/10",
  },
  stake_claim_rewards: {
    label: "Claim Staking Rewards",
    buttonText: "Sign & Claim",
    icon: Coins,
    iconColor: "text-green-500",
    iconBg: "bg-green-500/10",
  },
  vault_deposit: {
    label: "Vault Deposit",
    buttonText: "Sign & Deposit",
    icon: Coins,
    iconColor: "text-green-500",
    iconBg: "bg-green-500/10",
  },
  vault_withdraw: {
    label: "Vault Withdraw",
    buttonText: "Sign & Withdraw",
    icon: Coins,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
  },
  vault_withdraw_by_amounts: {
    label: "Vault Withdraw",
    buttonText: "Sign & Withdraw",
    icon: Coins,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
  },
  lock_aqua: {
    label: "Lock AQUA",
    buttonText: "Sign & Lock",
    icon: Lock,
    iconColor: "text-blue-500",
    iconBg: "bg-blue-500/10",
  },
  templar_supply: {
    label: "Templar Supply",
    buttonText: "Sign & Supply",
    icon: Coins,
    iconColor: "text-green-500",
    iconBg: "bg-green-500/10",
  },
  templar_borrow: {
    label: "Templar Borrow",
    buttonText: "Sign & Borrow",
    icon: Coins,
    iconColor: "text-blue-500",
    iconBg: "bg-blue-500/10",
  },
  supply: {
    label: "Supply",
    buttonText: "Sign & Supply",
    icon: Coins,
    iconColor: "text-green-500",
    iconBg: "bg-green-500/10",
  },
  borrow: {
    label: "Borrow",
    buttonText: "Sign & Borrow",
    icon: Coins,
    iconColor: "text-blue-500",
    iconBg: "bg-blue-500/10",
  },
  repay: {
    label: "Repay",
    buttonText: "Sign & Repay",
    icon: Coins,
    iconColor: "text-purple-500",
    iconBg: "bg-purple-500/10",
  },
  withdraw: {
    label: "Withdraw",
    buttonText: "Sign & Withdraw",
    icon: Coins,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
  },
  vault_execute: {
    label: "Vault Operation",
    buttonText: "Sign & Execute",
    icon: Coins,
    iconColor: "text-green-500",
    iconBg: "bg-green-500/10",
  },
  staking_execute: {
    label: "Staking Operation",
    buttonText: "Sign & Stake",
    icon: TrendingUp,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
  },
  swap_execute: {
    label: "Swap",
    buttonText: "Sign & Swap",
    icon: ArrowRightLeft,
    iconColor: "text-blue-500",
    iconBg: "bg-blue-500/10",
  },
  bridge_execute: {
    label: "Bridge Transfer",
    buttonText: "Sign & Bridge",
    icon: Globe,
    iconColor: "text-purple-500",
    iconBg: "bg-purple-500/10",
  },
  execute_earn: {
    label: "Earn",
    buttonText: "Sign & Execute",
    icon: Coins,
    iconColor: "text-green-500",
    iconBg: "bg-green-500/10",
  },
  execute_lending: {
    label: "Lending",
    buttonText: "Sign & Execute",
    icon: Coins,
    iconColor: "text-blue-500",
    iconBg: "bg-blue-500/10",
  },
};

const DEFAULT_OP_CONFIG: OpConfig = {
  label: "Transaction",
  buttonText: "Sign & Submit",
  icon: FileCode,
  iconColor: "text-primary",
  iconBg: "bg-primary/10",
};

// ─── Normalize result (MCP response) ────────────────────────────

function normalizeResult(result: unknown): Record<string, unknown> | null {
  if (!result) return null;
  // MCP content-block array
  if (Array.isArray(result)) {
    const block = (result as any[]).find((b) => b?.type === "text" && typeof b?.text === "string");
    if (!block) return null;
    try {
      return JSON.parse(block.text);
    } catch {
      return { raw: block.text };
    }
  }
  if (typeof result === "object" && !Array.isArray(result)) {
    return result as Record<string, unknown>;
  }
  if (typeof result === "string") {
    try {
      return JSON.parse(result);
    } catch {
      return { raw: result };
    }
  }
  return null;
}

function extractTx(result: unknown, args?: Record<string, any>): GenericExecuteCardProps {
  const data = normalizeResult(result) ?? {};
  const merged = { ...data, ...(args ?? {}) };

  // Detect operation: try operation → action → protocol inference
  const operation = String(merged.operation ?? merged.action ?? merged.op ?? "execute");

  const symbol =
    ((merged.context as Record<string, unknown>)?.tokenIn as string) ??
    ((merged.context as Record<string, unknown>)?.symbol as string) ??
    (merged.symbol as string) ??
    (merged.asset as string) ??
    null;

  return {
    operation,
    protocol: merged.protocol as string | undefined,
    xdr: String(merged.xdr ?? ""),
    amount: merged.amount != null ? String(merged.amount) : null,
    symbol,
    estimatedFee: merged.estimatedFee != null ? String(merged.estimatedFee) : undefined,
    asset: merged.asset as string | null,
    pool: (merged.poolAddress ?? merged.pool ?? merged.pool_address) as string | null,
    from: merged.from as string | null,
    context: merged.context as Record<string, unknown> | undefined,
  };
}

// ─── Component ──────────────────────────────────────────────────

export function StellarExecuteCard({
  tx,
  operation: _operation,
  args,
  result,
  status: _status,
  respond,
  toolCallId,
}: GenericExecuteCardComponentProps) {
  // Support both new typed tx prop and legacy args/result/operation props
  const resolved = tx ?? extractTx(result, args);
  const op = resolved.operation;

  const cfg = OP_CONFIG[op] ?? DEFAULT_OP_CONFIG;
  const xdr = resolved.xdr;
  const symbol = resolved.symbol ?? "";
  const amount = resolved.amount ?? null;
  const fee = resolved.estimatedFee ?? "0";
  const protocol = resolved.protocol;
  const pool = resolved.pool;
  const from = resolved.from;

  const { sign, cancel, signing, txResult, txError } = useTxSigning({
    mode: "chat",
    stream: undefined,
    toolCallId,
    operation: op,
    respond,
    volumeContext: {
      protocol: protocol ?? "generic",
      operation: op,
      asset: symbol,
      amount: amount ?? "0",
    },
  });

  const [showXdr, setShowXdr] = useState(false);
  // Derive cancelled from persisted txResult so it survives page reloads
  const cancelled =
    txResult !== null && !txResult.success && txResult.message === "Transaction cancelled";

  const handleSign = () => sign(xdr);

  return (
    <div
      data-testid="card-stellar-execute"
      className="relative overflow-hidden rounded-xl border border-border bg-card"
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-2">
        <p className="font-semibold text-foreground text-lg">
          Confirm {cfg.label}
          {protocol ? (
            <span className="ml-1.5 font-normal text-muted-foreground text-xs capitalize">
              via {protocol}
            </span>
          ) : null}
        </p>
        <p className="text-muted-foreground text-xs">Review details before signing</p>
      </div>

      {/* Detail rows */}
      <div className="space-y-0 px-5 pb-3">
        {/* Amount with token icon */}
        {amount && symbol ? (
          <div className="flex justify-between border-border/30 border-b py-2.5">
            <span className="text-muted-foreground text-sm">Amount</span>
            <span className="flex items-center gap-1.5 font-medium text-foreground text-sm tabular-nums">
              <TokenImage src={null} alt={symbol} className="h-5 w-5 rounded-full" />
              {fmtAmount(amount)} {symbol}
            </span>
          </div>
        ) : amount ? (
          <div className="flex justify-between border-border/30 border-b py-2.5">
            <span className="text-muted-foreground text-sm">Amount</span>
            <span className="font-medium text-foreground text-sm tabular-nums">
              {fmtAmount(amount)}
            </span>
          </div>
        ) : null}

        {/* Fee */}
        {fee !== "0" ? (
          <div className="flex justify-between border-border/30 border-b py-2.5">
            <span className="text-muted-foreground text-sm">Maximum transaction fee</span>
            <span className="text-foreground text-sm tabular-nums">{fmtGas(fee)}</span>
          </div>
        ) : null}

        {/* Protocol */}
        {protocol ? (
          <div className="flex justify-between border-border/30 border-b py-2.5">
            <span className="text-muted-foreground text-sm">Protocol</span>
            <span className="text-foreground text-sm capitalize">{protocol}</span>
          </div>
        ) : null}

        {/* Pool */}
        {pool ? (
          <div className="flex justify-between border-border/30 border-b py-2.5">
            <span className="text-muted-foreground text-sm">Pool</span>
            <span className="font-mono text-muted-foreground text-xs">{trunc(pool)}</span>
          </div>
        ) : null}

        {/* From address */}
        {from ? (
          <div className="flex justify-between border-border/30 border-b py-2.5">
            <span className="text-muted-foreground text-sm">From</span>
            <span className="font-mono text-muted-foreground text-xs">{trunc(from)}</span>
          </div>
        ) : null}

        {/* Extra context rows */}
        {resolved.extraRows?.map((row) => (
          <div key={row.label} className="flex justify-between border-border/30 border-b py-2.5">
            <span className="text-muted-foreground text-sm">{row.label}</span>
            <span
              className={`text-foreground text-sm tabular-nums ${
                row.mono ? "font-mono text-xs" : ""
              }`}
            >
              {row.value}
            </span>
          </div>
        ))}
      </div>

      {/* XDR toggle */}
      {xdr ? (
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
      ) : null}

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
                cancel();
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
                cfg.buttonText
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
