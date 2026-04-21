"use client";

import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { ArrowRightLeft, Droplets, Fuel, Loader2 } from "lucide-react";
import type { CardMode } from "../../schemas/common.schema";
import type { SoroswapTxCardProps } from "../../schemas/soroswap.schema";
import { ProtocolCard } from "../base/protocol-card";
import { DetailRow } from "../base/indicators";
import { fmtGas, trunc, fmt, resolveSymbol } from "../../lib/formatting";
import { useTxSigning } from "../../hooks/use-tx-signing";
import { useTrustlineCheck } from "../../hooks/use-trustline-check";
import { useWallet } from "@/shared/context/wallet-context";

interface OpConfig {
  label: string; action: string; title: string; buttonText: string;
  icon: LucideIcon; iconColor: string; iconBg: string;
}

const OP_CONFIG: Record<string, OpConfig> = {
  swap: { label: "Swap", action: "Sign & Swap", title: "Sign Soroswap Swap", buttonText: "Sign & Swap", icon: ArrowRightLeft, iconColor: "text-violet-500", iconBg: "bg-violet-500/10" },
  add_liquidity: { label: "Add Liquidity", action: "Sign & Add", title: "Sign Add Liquidity", buttonText: "Sign & Add Liquidity", icon: Droplets, iconColor: "text-violet-500", iconBg: "bg-violet-500/10" },
  remove_liquidity: { label: "Remove Liquidity", action: "Sign & Remove", title: "Sign Remove Liquidity", buttonText: "Sign & Remove", icon: Droplets, iconColor: "text-orange-500", iconBg: "bg-orange-500/10" },
};

const DEFAULT_OP: OpConfig = { label: "Transaction", action: "Sign", title: "Sign Transaction", buttonText: "Sign & Submit", icon: ArrowRightLeft, iconColor: "text-primary", iconBg: "bg-primary/10" };

interface Props {
  tx: SoroswapTxCardProps; mode?: CardMode;
  stream?: any; toolCallId?: string; respond?: (result: Record<string, unknown>) => void;
}

/**
 * Determine the output asset contract for trustline check.
 * - swap → tokenOut / assetOut
 * - remove_liquidity → both assetA + assetB (check assetA)
 */
function getOutputAsset(tx: SoroswapTxCardProps): { contract?: string; symbol?: string } {
  if (tx.operation === "swap" && (tx.tokenOut || tx.assetB)) {
    const c = tx.tokenOut ?? tx.assetB ?? "";
    return { contract: c, symbol: resolveSymbol(c) };
  }
  if (tx.operation === "remove_liquidity" && tx.assetA) {
    return { contract: tx.assetA, symbol: resolveSymbol(tx.assetA) };
  }
  return {};
}

export function SoroswapTxCard({ tx, mode = "playground", stream, toolCallId, respond }: Props) {
  const cfg = OP_CONFIG[tx.operation] ?? DEFAULT_OP;
  const xdr = tx.xdr;
  const fee = tx.estimatedFee ?? "0";
  const { address: walletAddress } = useWallet();
  const { sign, signing, txResult, txError } = useTxSigning({ mode, stream, toolCallId, operation: tx.operation, respond });

  // ─── Trustline precheck for output asset ────────────────────
  const outputAsset = getOutputAsset(tx);
  const {
    needsTrustline,
    hasTrustline,
    checking: trustlineChecking,
    addTrustline,
    adding: trustlineAdding,
  } = useTrustlineCheck(walletAddress ?? tx.from, outputAsset.contract, outputAsset.symbol);
  const trustlineBlocking = needsTrustline && !hasTrustline && !trustlineChecking;
  const [showXdr, setShowXdr] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const handleSign = () => sign(xdr);

  if (mode === "chat") {
    return (
      <ProtocolCard mode="chat" title={cfg.title} icon={cfg.icon} iconColor={cfg.iconColor} iconBg={cfg.iconBg}>
        <div className="mb-2 space-y-2">
          <DetailRow label="Action" value={<span className="capitalize">{tx.operation.replace(/_/g, " ")}</span>} />
          {fee !== "0" && <DetailRow label="Est. Fee" value={fee} />}
          {tx.from && <DetailRow label="From" value={trunc(tx.from)} mono />}
          {tx.route && tx.route.length > 0 && <DetailRow label="Route" value={tx.route.join(" → ")} />}
          {tx.context?.amountOut && <DetailRow label="Est. Output" value={fmt(tx.context.amountOut)} />}
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
            <p className="text-green-700 text-sm dark:text-green-300">{txResult.message}{txResult.hash && <span className="ml-1 font-mono text-xs">({trunc(txResult.hash)})</span>}</p>
          </div>
        ) : txResult && !txResult.success ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3"><p className="text-destructive text-sm">{txResult.message}</p></div>
        ) : trustlineBlocking ? (
          <div className="mt-2 space-y-2">
            <p className="text-xs text-amber-400">Trustline required for {outputAsset.symbol ?? "output token"}</p>
            <button type="button" onClick={addTrustline} disabled={trustlineAdding}
              className="w-full rounded-lg bg-amber-500/20 py-2.5 text-sm font-semibold text-amber-400 hover:bg-amber-500/30 disabled:opacity-40 flex items-center justify-center gap-1.5">
              {trustlineAdding ? <><Loader2 className="h-4 w-4 animate-spin" /> Adding...</> : `Add ${outputAsset.symbol ?? ""} Trustline`}
            </button>
          </div>
        ) : (
          <button type="button" onClick={handleSign} disabled={signing || !xdr || trustlineChecking}
            className="mt-2 w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5">
            {trustlineChecking ? <><Loader2 className="h-4 w-4 animate-spin" /> Checking...</> : signing ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing...</> : cfg.buttonText}
          </button>
        )}
      </ProtocolCard>
    );
  }

  return (
    <div className="relative rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border"><p className="text-sm font-medium text-foreground">Transaction Overview</p></div>
      <div className="px-4 py-3 space-y-2.5">
        <div className="flex items-center gap-2">
          <cfg.icon className={`h-4 w-4 ${cfg.iconColor}`} />
          <span className="text-xs text-muted-foreground">Operation</span>
          <span className="ml-auto text-sm font-medium text-foreground capitalize">{tx.operation.replace(/_/g, " ")}</span>
        </div>
        <div className="flex items-center gap-2">
          <Fuel className="h-4 w-4 text-muted-foreground/50" />
          <span className="text-xs text-muted-foreground">Gas</span>
          <span className="ml-auto text-sm text-muted-foreground tabular-nums">{fmtGas(fee)}</span>
        </div>
        {tx.route && tx.route.length > 0 && (
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="h-4 w-4 text-muted-foreground/50" />
            <span className="text-xs text-muted-foreground">Route</span>
            <span className="ml-auto text-sm text-foreground">{tx.route.join(" → ")}</span>
          </div>
        )}
        {tx.context?.amountOut && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground ml-6">Est. Output</span>
            <span className="ml-auto text-sm font-medium text-emerald-400 tabular-nums">{fmt(tx.context.amountOut)}</span>
          </div>
        )}
        <button type="button" onClick={() => setShowXdr(!showXdr)} className="text-[10px] text-muted-foreground/50 hover:text-muted-foreground transition-colors">
          {showXdr ? "Hide XDR" : "Show XDR"}
        </button>
        {showXdr && <pre className="mt-1 max-h-[100px] overflow-auto rounded-lg bg-secondary p-2 text-[10px] text-muted-foreground font-mono break-all">{xdr}</pre>}
      </div>
      <div className="h-px bg-border" />
      <div className="px-4 py-3">
        {txResult?.success ? (
          <a href={`https://stellar.expert/explorer/testnet/tx/${txResult.hash}`} target="_blank" rel="noopener noreferrer"
            className="block w-full rounded-lg py-2 text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-center hover:bg-emerald-500/15 transition-colors">
            Transaction confirmed · {trunc(txResult.hash ?? "")}
          </a>
        ) : txError ? (
          <div className="rounded-lg py-2 px-3 text-xs bg-destructive/10 border border-destructive/20 text-destructive text-center">
            Failed · {txError.length > 80 ? txError.slice(0, 80) + "…" : txError}
          </div>
        ) : trustlineBlocking ? (
          <div className="space-y-2">
            <div className="rounded-lg py-2 px-3 text-xs bg-amber-500/10 border border-amber-500/20 text-amber-400 text-center">
              Trustline required for {outputAsset.symbol ?? "output token"}
            </div>
            <button type="button"
              className="w-full rounded-lg py-2 text-xs font-semibold bg-amber-500/20 border border-amber-500/30 text-amber-400 hover:bg-amber-500/30 transition-all active:scale-[0.98] disabled:opacity-40 flex items-center justify-center gap-1.5"
              onClick={addTrustline} disabled={trustlineAdding}>
              {trustlineAdding ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Adding...</> : `Add ${outputAsset.symbol ?? ""} Trustline`}
            </button>
          </div>
        ) : cancelled ? (
          <div className="rounded-lg py-2 px-3 text-xs bg-muted border border-border text-muted-foreground text-center">
            Transaction cancelled
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <button type="button" className="flex-1 rounded-lg py-2 text-xs font-semibold border border-border text-muted-foreground hover:bg-secondary hover:text-foreground transition-all active:scale-[0.98]" disabled={signing} onClick={() => { setCancelled(true); respond?.({ success: false, cancelled: true, reason: "User cancelled the operation" }); }}>Cancel</button>
            <button type="button" className="flex-1 rounded-lg py-2 text-xs font-semibold bg-gradient-to-b from-[#C5B5FF] to-[#7B61FF] text-white hover:from-[#D5C5FF] hover:to-[#8B71FF] transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5" onClick={handleSign} disabled={signing || !xdr || trustlineChecking}>
              {trustlineChecking ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Checking...</> : signing ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Signing...</> : cfg.action}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
