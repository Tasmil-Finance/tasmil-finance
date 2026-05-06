"use client";

import { ArrowRight, Loader2 } from "lucide-react";
import { useState } from "react";
import {
  connectEvmWallet,
  isEvmWalletAvailable,
  sendEvmTransaction,
  switchEvmChain,
} from "@/features/aggregator/lib/evm-wallet";
import { useTxSigning } from "@/features/protocols/hooks/use-tx-signing";
import { fmtAmount, fmtGas, trunc } from "@/features/protocols/lib/formatting";
import { TokenImage } from "@/shared/components/token-image";
import { getExplorerUrl } from "@/shared/config/stellar";

// ─── Chain name → display label ──────────────────────────────────

const CHAIN_LABELS: Record<string, string> = {
  stellar: "Stellar",
  ethereum: "Ethereum",
  eth: "Ethereum",
  arbitrum: "Arbitrum",
  arb: "Arbitrum",
  base: "Base",
  polygon: "Polygon",
  optimism: "Optimism",
  opt: "Optimism",
  bsc: "BSC",
  avalanche: "Avalanche",
  avax: "Avalanche",
  solana: "Solana",
  sol: "Solana",
  near: "NEAR",
  sui: "Sui",
  tron: "TRON",
};

function chainLabel(chain: string): string {
  return CHAIN_LABELS[chain.toLowerCase()] ?? chain;
}

// ─── Props ──────────────────────────────────────────────────────

export interface BridgeExecuteCardProps {
  operation: string;
  provider?: string;
  fromChain: string;
  toChain: string;
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  amountOut?: string | null;
  /** Stellar XDR (present when source = Stellar) */
  xdr?: string | null;
  /** EVM transaction (present when source = EVM) */
  evmTx?: {
    to: string;
    data: string;
    value?: string;
  } | null;
  /** NEAR Intents / Templar deposit-to-address pattern */
  depositAddress?: string | null;
  depositMemo?: string | null;
  depositInstruction?: string | null;
  estimatedFee?: string;
  estimatedTime?: string;
  fromAddress?: string;
  toAddress?: string;
  context?: Record<string, unknown>;
}

interface BridgeExecuteCardComponentProps {
  tx: BridgeExecuteCardProps;
  mode?: "chat" | "playground";
  stream?: any;
  toolCallId?: string;
  respond?: (result: Record<string, unknown>) => void;
}

// ─── Component ──────────────────────────────────────────────────

export function BridgeExecuteCard({
  tx,
  mode = "chat",
  stream,
  toolCallId,
  respond,
}: BridgeExecuteCardComponentProps) {
  const sourceLabel = chainLabel(tx.fromChain);
  const destLabel = chainLabel(tx.toChain);
  const isDepositPattern = !!tx.depositAddress;
  const isStellarSource = tx.fromChain.toLowerCase() === "stellar";
  const hasEvmTx = !!tx.evmTx;

  // ── Stellar signing ───────────────────────────────────────────
  const {
    sign: signStellar,
    cancel: cancelStellar,
    signing: stellarSigning,
    txResult,
    txError,
  } = useTxSigning({
    mode,
    stream,
    toolCallId,
    operation: tx.operation,
    respond,
    volumeContext: {
      protocol: tx.provider ?? "bridge",
      operation: tx.operation,
      asset: tx.tokenIn,
      amount: tx.amountIn,
    },
  });

  // ── EVM signing state ─────────────────────────────────────────
  const [evmSigning, setEvmSigning] = useState(false);
  const [evmHash, setEvmHash] = useState<string | null>(null);
  const [evmError, setEvmError] = useState<string | null>(null);
  const [evmAddress, setEvmAddress] = useState<string | null>(null);
  const [connectingEVM, setConnectingEVM] = useState(false);

  const handleConnectEVM = async () => {
    setConnectingEVM(true);
    try {
      const addr = await connectEvmWallet();
      setEvmAddress(addr);
    } catch (err: any) {
      setEvmError(err?.message ?? "Failed to connect EVM wallet");
    } finally {
      setConnectingEVM(false);
    }
  };

  const handleSignEVM = async () => {
    if (!tx.evmTx) return;
    setEvmSigning(true);
    setEvmError(null);
    try {
      // Switch chain if needed
      if (tx.fromChain) {
        await switchEvmChain(tx.fromChain);
      }
      const hash = await sendEvmTransaction(tx.evmTx);
      setEvmHash(hash);
      respond?.({ success: true, hash, chain: tx.fromChain });
    } catch (err: any) {
      const msg = err?.message ?? "EVM transaction failed";
      setEvmError(msg);
      respond?.({ success: false, error: msg });
    } finally {
      setEvmSigning(false);
    }
  };

  const [showData, setShowData] = useState(false);
  // Derive cancelled from persisted txResult so it survives page reloads
  const cancelled =
    txResult !== null && !txResult.success && txResult.message === "Transaction cancelled";

  const hasResult = txResult?.success || evmHash;
  const hasError = txError || evmError;
  const resultHash = txResult?.hash ?? evmHash;
  const errorMsg = txError ?? evmError;

  return (
    <div
      data-testid="card-bridge-execute"
      className="relative overflow-hidden rounded-xl border border-border bg-card"
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-2">
        <p className="font-semibold text-foreground text-lg">
          Confirm Bridge Transfer
          {tx.provider ? (
            <span className="ml-1.5 font-normal text-muted-foreground text-xs capitalize">
              via {tx.provider}
            </span>
          ) : null}
        </p>
        <p className="text-muted-foreground text-xs">Review chain route and fees before signing</p>
      </div>

      {/* Chain direction + token amounts */}
      <div className="px-5 pb-3">
        <div className="flex items-stretch gap-3">
          {/* Source */}
          <div className="flex-1 rounded-2xl bg-secondary/60 px-4 py-3">
            <p className="mb-1 text-[10px] text-muted-foreground uppercase tracking-wider">
              {sourceLabel}
            </p>
            <div className="flex items-center gap-2">
              <TokenImage src={null} alt={tx.tokenIn} className="h-8 w-8 rounded-full" />
              <div>
                <p className="font-medium text-base text-foreground tabular-nums">
                  {fmtAmount(tx.amountIn)} {tx.tokenIn}
                </p>
                <p className="text-[10px] text-muted-foreground">You send</p>
              </div>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex items-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card">
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          {/* Destination */}
          <div className="flex-1 rounded-2xl bg-secondary/60 px-4 py-3">
            <p className="mb-1 text-[10px] text-muted-foreground uppercase tracking-wider">
              {destLabel}
            </p>
            <div className="flex items-center gap-2">
              <TokenImage src={null} alt={tx.tokenOut} className="h-8 w-8 rounded-full" />
              <div>
                <p className="font-medium text-base text-foreground tabular-nums">
                  {tx.amountOut ? fmtAmount(tx.amountOut) : "\u2014"} {tx.tokenOut}
                </p>
                <p className="text-[10px] text-muted-foreground">You receive</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detail rows */}
      <div className="space-y-0 px-5 pb-3">
        {isDepositPattern ? (
          <>
            <div className="flex justify-between border-border/30 border-b py-2.5">
              <span className="text-muted-foreground text-sm">Deposit address</span>
              <span className="font-mono text-foreground text-xs tabular-nums">
                {trunc(tx.depositAddress ?? "")}
              </span>
            </div>
            {tx.depositMemo ? (
              <div className="flex justify-between border-border/30 border-b py-2.5">
                <span className="text-muted-foreground text-sm">Memo</span>
                <span className="font-mono text-foreground text-sm tabular-nums">
                  {tx.depositMemo}
                </span>
              </div>
            ) : null}
          </>
        ) : null}
        {tx.estimatedFee ? (
          <div className="flex justify-between border-border/30 border-b py-2.5">
            <span className="text-muted-foreground text-sm">Estimated fee</span>
            <span className="text-foreground text-sm tabular-nums">{fmtGas(tx.estimatedFee)}</span>
          </div>
        ) : null}
        {tx.estimatedTime ? (
          <div className="flex justify-between border-border/30 border-b py-2.5">
            <span className="text-muted-foreground text-sm">Estimated time</span>
            <span className="text-foreground text-sm tabular-nums">{tx.estimatedTime}</span>
          </div>
        ) : null}
        {tx.fromAddress ? (
          <div className="flex justify-between border-border/30 border-b py-2.5">
            <span className="text-muted-foreground text-sm">From</span>
            <span className="font-mono text-muted-foreground text-xs">{trunc(tx.fromAddress)}</span>
          </div>
        ) : null}
        {tx.toAddress ? (
          <div className="flex justify-between border-border/30 border-b py-2.5">
            <span className="text-muted-foreground text-sm">To</span>
            <span className="font-mono text-muted-foreground text-xs">{trunc(tx.toAddress)}</span>
          </div>
        ) : null}
      </div>

      {/* Transaction data toggle */}
      {tx.xdr || tx.evmTx ? (
        <div className="px-5 pb-2">
          <button
            type="button"
            onClick={() => setShowData(!showData)}
            className="text-[10px] text-muted-foreground/50 transition-colors hover:text-muted-foreground"
          >
            {showData ? "Hide transaction data" : "Show transaction data"}
          </button>
          {showData && (
            <pre className="mt-1 max-h-[100px] overflow-auto break-all rounded-lg bg-secondary p-2 font-mono text-[10px] text-muted-foreground">
              {tx.xdr
                ? tx.xdr.slice(0, 300) + (tx.xdr.length > 300 ? "..." : "")
                : JSON.stringify(tx.evmTx, null, 2)}
            </pre>
          )}
        </div>
      ) : null}

      {/* Divider */}
      <div className="h-px bg-border" />

      {/* Action area */}
      <div className="px-4 py-3">
        {hasResult ? (
          <a
            href={getExplorerUrl("tx", resultHash ?? "")}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full rounded-lg border border-emerald-500/20 bg-emerald-500/10 py-2 text-center font-semibold text-emerald-400 text-xs transition-colors hover:bg-emerald-500/15"
          >
            Transaction confirmed {"\u00B7"} {trunc(resultHash ?? "")}
          </a>
        ) : hasError ? (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-center text-destructive text-xs">
            Failed {"\u00B7"}{" "}
            {errorMsg && errorMsg.length > 80 ? `${errorMsg.slice(0, 80)}\u2026` : errorMsg}
          </div>
        ) : cancelled ? (
          <div className="rounded-lg border border-border bg-muted px-3 py-2 text-center text-muted-foreground text-xs">
            Transaction cancelled
          </div>
        ) : isDepositPattern ? (
          /* NEAR Intents / Templar: show deposit instruction, no signing */
          <div className="rounded-lg border border-border bg-secondary/50 p-3">
            <p className="text-muted-foreground text-xs leading-relaxed">
              {tx.depositInstruction ??
                `Send ${fmtAmount(tx.amountIn)} ${tx.tokenIn} to ${trunc(tx.depositAddress ?? "", 10, 10)}`}
            </p>
          </div>
        ) : isStellarSource && tx.xdr ? (
          /* Stellar source: use Stellar wallet signing */
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="flex-1 rounded-lg border border-border py-2 font-semibold text-muted-foreground text-xs transition-all hover:bg-secondary hover:text-foreground active:scale-[0.98]"
              disabled={stellarSigning}
              onClick={() => {
                cancelStellar();
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
              onClick={() => signStellar(tx.xdr!)}
              disabled={stellarSigning || !tx.xdr}
            >
              {stellarSigning ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Signing...
                </>
              ) : (
                "Sign & Bridge"
              )}
            </button>
          </div>
        ) : hasEvmTx ? (
          /* EVM source: use MetaMask */
          <div>
            {!isEvmWalletAvailable() ? (
              <div className="rounded-lg border border-border bg-secondary/50 p-3 text-center">
                <p className="mb-2 text-muted-foreground text-xs">
                  MetaMask or an EVM wallet is required to sign
                </p>
                <p className="text-[10px] text-muted-foreground/70">
                  Please install MetaMask and reload the page
                </p>
              </div>
            ) : !evmAddress ? (
              <button
                type="button"
                className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-gradient-to-b from-[#B5EAFF] to-[#00BFFF] py-2 font-semibold text-black text-xs transition-all hover:from-[#C5F0FF] hover:to-[#1CCFFF] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                onClick={handleConnectEVM}
                disabled={connectingEVM}
              >
                {connectingEVM ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Connecting...
                  </>
                ) : (
                  "Connect MetaMask"
                )}
              </button>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary/50 px-3 py-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-muted-foreground text-xs">
                    Connected: {trunc(evmAddress, 6, 4)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="flex-1 rounded-lg border border-border py-2 font-semibold text-muted-foreground text-xs transition-all hover:bg-secondary hover:text-foreground active:scale-[0.98]"
                    disabled={evmSigning}
                    onClick={() => {
                      cancelStellar();
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
                    onClick={handleSignEVM}
                    disabled={evmSigning}
                  >
                    {evmSigning ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Signing...
                      </>
                    ) : (
                      "Sign with MetaMask"
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-muted px-3 py-2 text-center text-muted-foreground text-xs">
            No transaction data available
          </div>
        )}
      </div>
    </div>
  );
}
