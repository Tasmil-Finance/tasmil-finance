"use client";

import { ArrowRightLeft, Check, ChevronDown, Loader2, Pencil, Plus, Wallet, X } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { connectEvmWallet, isEvmWalletAvailable } from "@/features/aggregator/lib/evm-wallet";
import { useWalletTokens } from "@/features/profile/hooks/use-wallet-tokens";
import { useTxSigning } from "@/features/protocols/hooks/use-tx-signing";
import { fmt, trunc } from "@/features/protocols/lib/formatting";
import { TokenImage } from "@/shared/components/token-image";
import { getExplorerUrl } from "@/shared/config/stellar";
import { Input } from "@/shared/ui/input";
import { useWalletStore } from "@/store/use-wallet";

// ─── Chain labels (mirrors aggregator) ───────────────────────────────

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

// ─── Protocol colors ──────────────────────────────────────────────

const PROTOCOL_COLOR: Record<string, string> = {
  soroswap: "text-violet-500",
  aquarius: "text-blue-500",
  phoenix: "text-amber-500",
  sdex: "text-cyan-500",
  templar: "text-indigo-500",
  allbridge: "text-purple-500",
};

const PROTOCOL_BG: Record<string, string> = {
  soroswap: "bg-violet-500/10",
  aquarius: "bg-blue-500/10",
  phoenix: "bg-amber-500/10",
  sdex: "bg-cyan-500/10",
  templar: "bg-indigo-500/10",
  allbridge: "bg-purple-500/10",
};

// ─── Operation config ─────────────────────────────────────────────

interface OpConfig {
  label: string;
  action: string;
  buttonText: string;
  iconColor: string;
  iconBg: string;
}

const OP_CONFIG: Record<string, OpConfig> = {
  swap: {
    label: "Swap",
    action: "Sign & Swap",
    buttonText: "Sign & Swap",
    iconColor: "text-blue-500",
    iconBg: "bg-blue-500/10",
  },
  bridge: {
    label: "Bridge Transfer",
    action: "Sign & Bridge",
    buttonText: "Sign & Bridge",
    iconColor: "text-purple-500",
    iconBg: "bg-purple-500/10",
  },
  add_liquidity: {
    label: "Add Liquidity",
    action: "Sign & Add",
    buttonText: "Sign & Add Liquidity",
    iconColor: "text-cyan-500",
    iconBg: "bg-cyan-500/10",
  },
  remove_liquidity: {
    label: "Remove Liquidity",
    action: "Sign & Remove",
    buttonText: "Sign & Remove",
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
  },
};

const DEFAULT_OP: OpConfig = {
  label: "Transaction",
  action: "Sign & Submit",
  buttonText: "Sign & Submit",
  iconColor: "text-primary",
  iconBg: "bg-primary/10",
};

// ─── Props ────────────────────────────────────────────────────────

export interface SwapExecuteCardProps {
  operation: string;
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  amountOut?: string | null;
  routeTokens?: string[];
  routePools?: string[];
  xdr: string;
  protocol?: string;
  provider?: string;
  estimatedFee?: string;
  feePercent?: string;
  priceImpact?: string;
  expectedRate?: string;
  estimatedTime?: string;
  fromChain?: string;
  toChain?: string;
  fromAddress?: string;
  toAddress?: string;
  context?: Record<string, unknown>;
}

interface SwapExecuteCardComponentProps {
  tx: SwapExecuteCardProps;
  mode?: "chat" | "playground";
  stream?: any;
  toolCallId?: string;
  respond?: (result: Record<string, unknown>) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────

function priceImpactColor(impact: string): string {
  const n = parseFloat(impact);
  if (Number.isNaN(n)) return "text-foreground";
  if (n > 5) return "text-red-400";
  if (n > 1) return "text-amber-400";
  return "text-emerald-400";
}

function resolveTokenSymbol(raw: string): string {
  if (!raw) return "?";
  if (raw.startsWith("C") && raw.length === 56) return raw;
  if (raw.length <= 10 && !raw.includes(":")) return raw;
  if (raw.includes(":")) return raw.split(":")[0] ?? raw;
  return raw;
}

// ─── Sub-components ───────────────────────────────────────────────

function SwapBridgeHeader({
  cfg,
  isBridge,
  protoKey,
  protocolIconColor,
  protocolIconBg,
}: {
  cfg: OpConfig;
  isBridge: boolean;
  protoKey: string;
  protocolIconColor: string;
  protocolIconBg: string;
}) {
  return (
    <div className="px-5 pt-5 pb-3">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl ${protocolIconBg}`}
        >
          {protoKey ? (
            <TokenImage alt={protoKey} className="h-6 w-6 rounded-md" />
          ) : (
            <ArrowRightLeft className={`h-5 w-5 ${protocolIconColor}`} />
          )}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-foreground text-lg leading-tight">Confirm {cfg.label}</p>
          <p className="mt-0.5 text-muted-foreground text-xs">
            {isBridge
              ? "Review chain route and fees before signing"
              : "Review amounts, rate, and fees before confirming"}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Bridge address picker (matches aggregator AddressPicker) ──────

type ChainType = "stellar" | "evm";

interface AddressEntry {
  address: string;
  label: string;
  source: "connected" | "manual";
}

function validateAddress(chainType: ChainType, addr: string): boolean {
  if (chainType === "stellar") return /^G[A-Z2-7]{55}$/.test(addr);
  return /^0x[a-fA-F0-9]{40}$/.test(addr);
}

function BridgeAddressPicker({
  chainType,
  direction,
  selectedAddress,
  connectedAddresses,
  onSelect,
  onConnectWallet,
  connecting,
  onDisconnect,
  onOpenChange,
}: {
  chainType: ChainType;
  direction: "source" | "dest";
  selectedAddress: string | null;
  connectedAddresses: AddressEntry[];
  onSelect: (address: string) => void;
  onConnectWallet?: () => void;
  connecting?: boolean;
  onDisconnect?: () => void;
  onOpenChange?: (open: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const [manualInput, setManualInput] = useState("");
  const [manualError, setManualError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const isValidManual =
    manualInput.trim().length > 0 && validateAddress(chainType, manualInput.trim());

  const handleOpen = (v: boolean) => {
    setOpen(v);
    onOpenChange?.(v);
  };

  const handleManualSubmit = () => {
    const addr = manualInput.trim();
    if (!validateAddress(chainType, addr)) {
      setManualError(`Invalid ${chainType === "stellar" ? "Stellar" : "EVM"} address`);
      return;
    }
    setManualError(null);
    onSelect(addr);
    setManualInput("");
    handleOpen(false);
  };

  const handleSelectEntry = (addr: string) => {
    onSelect(addr);
    handleOpen(false);
  };

  const handleConnectNew = () => {
    handleOpen(false);
    setTimeout(() => onConnectWallet?.(), 200);
  };

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        handleOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, handleOpen]);

  const label = direction === "source" ? "From Address" : "To Address";
  const chainLabel = chainType === "stellar" ? "Stellar" : "EVM";
  const placeholder = chainType === "stellar" ? "G..." : "0x...";

  return (
    <div ref={containerRef}>
      {/* Trigger */}
      <button
        type="button"
        className="flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1 text-muted-foreground text-sm transition-colors hover:bg-input/50"
        onClick={() => handleOpen(!open)}
      >
        {selectedAddress ? (
          <>
            <TokenImage alt={chainType} className="h-4 w-4 shrink-0 rounded-full" />
            <span className="font-mono text-sm">{trunc(selectedAddress, 6, 4)}</span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0" />
          </>
        ) : (
          <>
            <Plus className="h-4 w-4" />
            <span>Add Address</span>
          </>
        )}
      </button>

      {/* Popover inside card — backdrop handled at card level */}
      {open && (
        <div className="-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2 z-50 w-[420px] max-w-[calc(100%-2rem)] rounded-2xl border border-border bg-card p-4 shadow-2xl">
          {/* Header */}
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-lg">{label}</h3>
            <button
              type="button"
              className="rounded p-1 transition-colors hover:bg-secondary"
              onClick={() => handleOpen(false)}
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          <div className="flex flex-col gap-4">
            {/* Manual input */}
            <div className="space-y-2">
              <span className="font-medium text-muted-foreground text-sm">
                Enter {chainLabel} address
              </span>
              <div className="relative">
                <Pencil className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground/50" />
                <Input
                  value={manualInput}
                  onChange={(e) => {
                    setManualInput(e.target.value);
                    setManualError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && isValidManual) handleManualSubmit();
                  }}
                  placeholder={placeholder}
                  className="pr-9 pl-9"
                />
                {manualInput.length > 0 && (
                  <button
                    type="button"
                    className="-translate-y-1/2 absolute top-1/2 right-3"
                    onClick={() => setManualInput("")}
                  >
                    <X className="h-4 w-4 text-muted-foreground/50" />
                  </button>
                )}
              </div>
              {manualError && <p className="text-destructive text-xs">{manualError}</p>}
              {isValidManual && (
                <button
                  type="button"
                  className="w-full rounded-lg bg-secondary px-3 py-2 text-left font-mono text-muted-foreground text-sm transition-colors hover:bg-secondary/80"
                  onClick={handleManualSubmit}
                >
                  Use {trunc(manualInput.trim(), 10, 10)}
                </button>
              )}
            </div>

            {/* Connected wallets */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-medium text-muted-foreground text-sm">
                  <Wallet className="h-4 w-4" />
                  <span>Connected Wallets</span>
                </div>
                {onConnectWallet && (
                  <button
                    type="button"
                    className="text-blue-400 text-xs transition-colors hover:text-blue-300 disabled:opacity-50"
                    onClick={handleConnectNew}
                    disabled={connecting}
                  >
                    {connecting ? "Connecting..." : "Connect new"}
                  </button>
                )}
              </div>

              <div className="max-h-[280px] space-y-1.5 overflow-y-auto">
                {connectedAddresses.length === 0 ? (
                  <p className="py-6 text-center text-muted-foreground/50 text-sm">
                    No wallets connected
                  </p>
                ) : (
                  connectedAddresses.map((entry) => {
                    const isSelected = entry.address === selectedAddress;
                    return (
                      <button
                        key={entry.address}
                        type="button"
                        className="flex w-full items-center gap-3 rounded-xl bg-secondary p-3 text-left transition-colors hover:bg-secondary/80"
                        onClick={() => handleSelectEntry(entry.address)}
                      >
                        <TokenImage alt={chainType} className="h-9 w-9 shrink-0 rounded-full" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-foreground text-sm">
                            {trunc(entry.address, 6, 4)}
                          </p>
                          <div className="mt-0.5 flex items-center gap-1 text-muted-foreground text-xs">
                            {entry.source === "connected" ? (
                              <>
                                <Wallet className="h-3 w-3" />
                                <span>Connected {chainLabel}</span>
                              </>
                            ) : (
                              <>
                                <Pencil className="h-3 w-3" />
                                <span>Manual {chainLabel}</span>
                              </>
                            )}
                          </div>
                        </div>
                        {isSelected && <Check className="h-5 w-5 shrink-0 text-blue-400" />}
                        {entry.source === "connected" && onDisconnect ? (
                          <button
                            type="button"
                            className="shrink-0 rounded p-1 transition-colors hover:bg-destructive/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDisconnect();
                            }}
                          >
                            <X className="h-4 w-4 text-muted-foreground transition-colors hover:text-destructive" />
                          </button>
                        ) : null}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Balance formatter (mirrors aggregator) ──────────────────────────

function formatBalanceShort(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(2)}K`;
  if (value > 0) return value.toFixed(6);
  return "0";
}

// ─── Aggregate-style bridge direction ─────────────────────────────
// Mirrors aggregator-page.tsx layout exactly:
//   label + AddressPicker on top row,
//   amount (big) on left + token/chain stacked on right,
//   $value | Balance row below.

function BridgeDirectionCard({
  sourceChain,
  destChain,
  sourceAddress: sourceAddrProp,
  destAddress: destAddrProp,
  firstToken,
  lastToken,
  humanAmount,
  humanOutput,
  evmAddress,
  connectingEVM,
  evmError,
  onConnectEVM,
  onPickerOpenChange,
  sourceBalance,
}: {
  sourceChain: string;
  destChain: string;
  sourceAddress?: string;
  destAddress?: string;
  firstToken: string;
  lastToken: string;
  humanAmount: number;
  humanOutput: number | null;
  evmAddress: string | null;
  connectingEVM: boolean;
  evmError: string | null;
  onConnectEVM: () => void;
  onPickerOpenChange?: (open: boolean) => void;
  sourceBalance?: number | null;
}) {
  const isDestEvm = destChain.toLowerCase() !== "stellar" && destChain.toLowerCase() !== "near";
  const isSourceStellar = sourceChain.toLowerCase() === "stellar";
  const walletStore = useWalletStore();

  // Source address: prefer prop, fallback to connected Stellar wallet
  const sourceAddress = sourceAddrProp ?? (isSourceStellar ? walletStore.account : null);

  // Destination address: prefer connected EVM, fallback to prop
  const destAddress = evmAddress ?? (isDestEvm ? (destAddrProp ?? null) : (destAddrProp ?? null));

  // Connected addresses for source picker
  const sourceConnected: AddressEntry[] = [];
  if (walletStore.account) {
    sourceConnected.push({
      address: walletStore.account,
      label: "Connected Stellar",
      source: "connected",
    });
  }
  if (sourceAddrProp && sourceAddrProp !== walletStore.account) {
    sourceConnected.push({ address: sourceAddrProp, label: "Manual Stellar", source: "manual" });
  }

  // Connected addresses for dest picker
  const destConnected: AddressEntry[] = [];
  if (evmAddress) {
    destConnected.push({ address: evmAddress, label: "Connected EVM", source: "connected" });
  }
  if (destAddrProp && destAddrProp !== evmAddress) {
    destConnected.push({ address: destAddrProp, label: "Manual EVM", source: "manual" });
  }

  // Derive chain type for address pickers
  const sourceChainType: ChainType = isSourceStellar ? "stellar" : "evm";
  const destChainType: ChainType = isDestEvm ? "evm" : "stellar";

  const srcChainLabel = chainLabel(sourceChain);
  const dstChainLabel = chainLabel(destChain);

  return (
    <div className="flex flex-col px-5 pb-1">
      {/* ── You pay ── */}
      <div className="rounded-2xl bg-secondary p-4 pb-[15px]">
        <div className="grid h-7 grid-cols-9 items-center gap-2">
          <span className="col-span-5 font-normal text-muted-foreground text-sm">You pay</span>
          <div className="col-span-4 justify-self-end">
            <BridgeAddressPicker
              chainType={sourceChainType}
              direction="source"
              selectedAddress={sourceAddress}
              connectedAddresses={sourceConnected}
              onSelect={() => {}}
              onOpenChange={onPickerOpenChange}
            />
          </div>
        </div>
        <div className="mt-[10px] grid w-full grid-cols-[1fr_auto] gap-1">
          <div className="min-w-0 overflow-hidden">
            <span className="block truncate font-normal text-2xl text-foreground tabular-nums">
              {fmt(humanAmount, 7)}
            </span>
            <div className="mt-0.5 flex h-5 items-center gap-1.5">
              <span className="font-medium text-muted-foreground text-sm leading-5">$0</span>
              {sourceBalance != null && sourceBalance > 0 ? (
                <>
                  <span className="text-muted-foreground/40 text-sm leading-5">|</span>
                  <span className="font-medium text-muted-foreground text-sm leading-5">
                    Balance: {formatBalanceShort(sourceBalance)} {firstToken}
                  </span>
                </>
              ) : null}
            </div>
          </div>
          <div className="shrink-0 self-start justify-self-end">
            <div className="flex items-center gap-2.5">
              <TokenImage alt={firstToken} className="h-8 w-8 rounded-full" />
              <span className="flex min-w-0 flex-col text-left">
                <span className="font-semibold text-base text-foreground leading-5">
                  {firstToken}
                </span>
                <span className="truncate font-normal text-muted-foreground text-sm leading-4">
                  {srcChainLabel}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Arrow ── */}
      <div className="-my-2 relative z-10 flex justify-center">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">
          <ArrowRightLeft className="h-5 w-5 text-muted-foreground" />
        </div>
      </div>

      {/* ── You receive ── */}
      <div className="rounded-2xl bg-secondary p-4 pb-[15px]">
        <div className="grid h-7 grid-cols-9 items-center gap-2">
          <span className="col-span-5 font-normal text-muted-foreground text-sm">You receive</span>
          <div className="col-span-4 justify-self-end">
            {isDestEvm && !isEvmWalletAvailable() ? (
              <span className="text-muted-foreground/60 text-sm">Wallet not detected</span>
            ) : (
              <BridgeAddressPicker
                chainType={destChainType}
                direction="dest"
                selectedAddress={destAddress}
                connectedAddresses={destConnected}
                onSelect={() => {}}
                onConnectWallet={onConnectEVM}
                connecting={connectingEVM}
                onOpenChange={onPickerOpenChange}
              />
            )}
          </div>
        </div>
        <div className="mt-[10px] grid w-full grid-cols-[1fr_auto] gap-1">
          <div className="min-w-0 overflow-hidden">
            <span className="block truncate font-normal text-2xl text-foreground tabular-nums">
              {humanOutput != null ? fmt(humanOutput, 7) : "\u2014"}
            </span>
            <div className="mt-0.5 flex h-5 items-center gap-1.5">
              <span className="font-medium text-muted-foreground text-sm leading-5">$0</span>
            </div>
          </div>
          <div className="shrink-0 self-start justify-self-end">
            <div className="flex items-center gap-2.5">
              <TokenImage alt={lastToken} className="h-8 w-8 rounded-full" />
              <span className="flex min-w-0 flex-col text-left">
                <span className="font-semibold text-base text-foreground leading-5">
                  {lastToken}
                </span>
                <span className="truncate font-normal text-muted-foreground text-sm leading-4">
                  {dstChainLabel}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {evmError ? (
        <p className="mt-1 text-center text-[10px] text-destructive/80">{evmError}</p>
      ) : null}
    </div>
  );
}

function TokenDirectionDisplay({
  firstToken,
  lastToken,
}: {
  firstToken: string;
  lastToken: string;
}) {
  return (
    <div className="px-5 py-2">
      <div className="relative flex items-center gap-3">
        <div className="flex flex-1 items-center gap-2.5 rounded-2xl bg-secondary/60 px-4 py-3">
          <TokenImage alt={firstToken} className="h-8 w-8 rounded-full" />
          <p className="truncate font-medium text-base text-foreground">{firstToken}</p>
        </div>
        <div className="-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card shadow-sm">
          <span className="text-muted-foreground text-sm">{"\u2192"}</span>
        </div>
        <div className="flex flex-1 items-center gap-2.5 rounded-2xl bg-secondary/60 px-4 py-3">
          <TokenImage alt={lastToken} className="h-8 w-8 rounded-full" />
          <p className="truncate font-medium text-base text-foreground">{lastToken}</p>
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  label,
  children,
  last,
}: {
  label: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div className={`flex justify-between py-2.5 ${last ? "" : "border-border/30 border-b"}`}>
      <span className="text-muted-foreground text-sm">{label}</span>
      {children}
    </div>
  );
}

function SwapDetailRows({
  tx,
  isBridge,
  firstToken,
  lastToken,
  humanAmount,
  humanOutput,
  exchangeRate,
}: {
  tx: SwapExecuteCardProps;
  isBridge: boolean;
  firstToken: string;
  lastToken: string;
  humanAmount: number;
  humanOutput: number | null;
  exchangeRate: number | null;
}) {
  return (
    <div className="space-y-0 px-5 pb-1">
      {!isBridge ? (
        <>
          <DetailRow label="You send">
            <span className="font-medium text-foreground text-sm tabular-nums">
              {fmt(humanAmount, 7)} {firstToken}
            </span>
          </DetailRow>

          {humanOutput != null && humanOutput > 0 ? (
            <DetailRow label="You receive">
              <span className="font-medium text-foreground text-sm tabular-nums">
                {fmt(humanOutput, 7)} {lastToken}
              </span>
            </DetailRow>
          ) : null}
        </>
      ) : null}

      {!isBridge && exchangeRate != null && exchangeRate > 0 ? (
        <DetailRow label="Exchange rate">
          <span className="text-foreground text-sm tabular-nums">
            1 {firstToken} = {exchangeRate.toFixed(7)} {lastToken}
          </span>
        </DetailRow>
      ) : null}

      {tx.feePercent ? (
        <DetailRow label="Fee">
          <span className="text-foreground text-sm tabular-nums">{tx.feePercent}</span>
        </DetailRow>
      ) : null}

      {!isBridge && tx.priceImpact ? (
        <DetailRow label="Price impact">
          <span className={`font-medium text-sm tabular-nums ${priceImpactColor(tx.priceImpact)}`}>
            {tx.priceImpact}
          </span>
        </DetailRow>
      ) : null}

      {tx.estimatedTime ? (
        <DetailRow label="Est. time">
          <span className="text-foreground text-sm tabular-nums">{tx.estimatedTime}</span>
        </DetailRow>
      ) : null}

      {tx.fromAddress ? (
        <DetailRow label="From">
          <span className="font-mono text-muted-foreground text-xs">{trunc(tx.fromAddress)}</span>
        </DetailRow>
      ) : null}
      {tx.toAddress ? (
        <DetailRow label="To">
          <span className="font-mono text-muted-foreground text-xs">{trunc(tx.toAddress)}</span>
        </DetailRow>
      ) : null}

      {tx.context?.poolApy ? (
        <div className="flex justify-between py-2.5">
          <span className="text-muted-foreground text-sm">Pool APY</span>
          <span className="font-medium text-emerald-400 text-sm tabular-nums">
            {(
              ((tx.context.poolApy as Record<string, number>).feeApy ?? 0) +
              ((tx.context.poolApy as Record<string, number>).rewardApy ?? 0)
            ).toFixed(2)}
            %
          </span>
        </div>
      ) : null}
    </div>
  );
}

function RouteVisualization({
  displayTokens,
  routePools,
}: {
  displayTokens: string[];
  routePools?: string[];
}) {
  return (
    <div className="px-5 pt-2 pb-2">
      <p className="mb-2 font-medium text-muted-foreground text-xs">Route</p>
      <div className="flex flex-wrap items-center gap-2">
        {displayTokens.map((token, i) => (
          <span key={`${token}-${i}`} className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full border border-border/50 bg-secondary/50 px-2.5 py-1">
              <TokenImage alt={token} className="h-5 w-5 rounded-full" />
              <span className="font-medium text-foreground text-xs">{token}</span>
            </span>
            {i < displayTokens.length - 1 ? (
              <span className="font-bold text-muted-foreground/50 text-xs">{"\u2192"}</span>
            ) : null}
          </span>
        ))}
        {routePools && routePools.length > 0 ? (
          <span className="ml-1 text-[10px] text-muted-foreground/50">
            ({routePools.length} pool{routePools.length > 1 ? "s" : ""})
          </span>
        ) : null}
      </div>
    </div>
  );
}

function XdrToggle({
  showXdr,
  onToggle,
  xdr,
}: {
  showXdr: boolean;
  onToggle: () => void;
  xdr: string;
}) {
  return (
    <div className="px-5 pb-2">
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-1 text-muted-foreground/60 text-xs transition-colors hover:text-muted-foreground"
      >
        <span className="font-mono tracking-tight">
          {showXdr ? "\u25BC Hide XDR" : "\u25B6 Show XDR"}
        </span>
      </button>
      {showXdr && (
        <pre className="mt-2 max-h-[120px] overflow-auto break-all rounded-xl border border-border/20 bg-secondary/50 p-3 font-mono text-[11px] text-muted-foreground leading-relaxed">
          {xdr}
        </pre>
      )}
    </div>
  );
}

function ActionBar({
  txResult,
  txError,
  cancelled,
  signing,
  hasXdr,
  cfg,
  onSign,
  onCancel,
}: {
  txResult: { success: boolean; hash?: string; message?: string } | null;
  txError: string | null;
  cancelled: boolean;
  signing: boolean;
  hasXdr: boolean;
  cfg: OpConfig;
  onSign: () => void;
  onCancel: () => void;
}) {
  if (txResult?.success) {
    return (
      <a
        href={getExplorerUrl("tx", txResult.hash ?? "")}
        target="_blank"
        rel="noopener noreferrer"
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 py-2.5 text-center font-semibold text-emerald-400 text-sm transition-colors hover:bg-emerald-500/15"
      >
        <span className="h-2 w-2 rounded-full bg-emerald-400" />
        Confirmed {"\u00B7"} {trunc(txResult.hash ?? "")}
      </a>
    );
  }

  if (txError) {
    return (
      <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-2.5 text-center text-destructive text-sm">
        Failed {"\u00B7"} {txError.length > 80 ? `${txError.slice(0, 80)}\u2026` : txError}
      </div>
    );
  }

  if (cancelled) {
    return (
      <div className="rounded-xl border border-border bg-muted px-4 py-2.5 text-center text-muted-foreground text-sm">
        Transaction cancelled
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        className="flex-1 rounded-xl border border-border py-2.5 font-semibold text-muted-foreground text-sm transition-all hover:bg-secondary hover:text-foreground active:scale-[0.98]"
        disabled={signing}
        onClick={onCancel}
      >
        Cancel
      </button>
      <button
        type="button"
        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#B5EAFF] to-[#00BFFF] py-2.5 font-semibold text-black text-sm shadow-sm transition-all hover:from-[#C5F0FF] hover:to-[#1CCFFF] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
        onClick={onSign}
        disabled={signing || !hasXdr}
      >
        {signing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Signing...
          </>
        ) : (
          cfg.action
        )}
      </button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────

export function SwapExecuteCard({
  tx,
  mode = "chat",
  stream,
  toolCallId,
  respond,
}: SwapExecuteCardComponentProps) {
  const cfg = OP_CONFIG[tx.operation] ?? DEFAULT_OP;
  const isBridge = tx.operation === "bridge";

  // Protocol display
  const protoKey = tx.protocol?.toLowerCase() ?? "";
  const protocolIconColor = PROTOCOL_COLOR[protoKey] ?? cfg.iconColor;
  const protocolIconBg = PROTOCOL_BG[protoKey] ?? cfg.iconBg;

  // Amount calculations
  const amountIn = Number(tx.amountIn);
  const isStroops = amountIn > 1_000_000;
  const humanAmount = isStroops ? amountIn / 1e7 : amountIn;
  const estOutput = tx.amountOut ? Number(tx.amountOut) : null;
  const humanOutput =
    estOutput != null ? (isStroops && estOutput > 1_000_000 ? estOutput / 1e7 : estOutput) : null;
  const exchangeRate = tx.expectedRate
    ? Number(tx.expectedRate)
    : humanAmount > 0 && humanOutput != null
      ? humanOutput / humanAmount
      : null;

  // Token symbols
  const firstToken = resolveTokenSymbol(tx.tokenIn);
  const lastToken = resolveTokenSymbol(tx.tokenOut);
  const routeTokens = tx.routeTokens ?? [firstToken, lastToken];
  const displayTokens = routeTokens.length >= 2 ? routeTokens : [firstToken, lastToken];

  // Chain direction check
  const showChainDirection = isBridge && !!(tx.fromChain || tx.toChain);

  // Signing
  const { sign, cancel, signing, txResult, txError } = useTxSigning({
    mode,
    stream,
    toolCallId,
    operation: tx.operation,
    respond,
    volumeContext: {
      protocol: tx.protocol ?? tx.operation,
      operation: tx.operation,
      asset: firstToken,
      amount: tx.amountIn,
    },
  });

  const [showXdr, setShowXdr] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  // Derive cancelled from persisted txResult so it survives page reloads
  const cancelled =
    txResult !== null && !txResult.success && txResult.message === "Transaction cancelled";

  // EVM wallet connection state (bridge mode only)
  const [evmAddress, setEvmAddress] = useState<string | null>(null);
  const [connectingEVM, setConnectingEVM] = useState(false);
  const [evmError, setEvmError] = useState<string | null>(null);

  // Source-chain balance (Stellar: use wallet tokens; EVM: not yet supported)
  const walletStore = useWalletStore();
  const isSourceStellar = tx.fromChain?.toLowerCase() === "stellar";
  const { data: walletData } = useWalletTokens(isSourceStellar ? walletStore.account : null);
  const walletTokens = walletData?.tokens ?? [];
  const sourceBalance: number | null = isSourceStellar
    ? (walletTokens.find((t) => t.assetCode.toUpperCase() === firstToken.toUpperCase())?.balance ??
      null)
    : null;

  const handleConnectEVM = async () => {
    setConnectingEVM(true);
    setEvmError(null);
    try {
      const addr = await connectEvmWallet();
      if (addr) {
        setEvmAddress(addr);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to connect EVM wallet";
      setEvmError(msg);
    } finally {
      setConnectingEVM(false);
    }
  };

  const handleSign = () => sign(tx.xdr);
  const handleCancel = () => {
    cancel();
  };

  return (
    <div
      data-testid="card-swap-execute"
      className="relative rounded-xl border border-border bg-card"
    >
      {/* Blur overlay when address picker is open */}
      {pickerOpen && (
        <div className="absolute inset-0 z-40 rounded-xl bg-card/60 backdrop-blur-sm" />
      )}

      <SwapBridgeHeader
        cfg={cfg}
        isBridge={isBridge}
        protoKey={protoKey}
        protocolIconColor={protocolIconColor}
        protocolIconBg={protocolIconBg}
      />

      {showChainDirection ? (
        <BridgeDirectionCard
          sourceChain={tx.fromChain ?? ""}
          destChain={tx.toChain ?? ""}
          sourceAddress={tx.fromAddress}
          destAddress={tx.toAddress}
          firstToken={firstToken}
          lastToken={lastToken}
          humanAmount={humanAmount}
          humanOutput={humanOutput}
          evmAddress={evmAddress}
          connectingEVM={connectingEVM}
          evmError={evmError}
          onConnectEVM={handleConnectEVM}
          onPickerOpenChange={setPickerOpen}
          sourceBalance={sourceBalance}
        />
      ) : (
        <TokenDirectionDisplay firstToken={firstToken} lastToken={lastToken} />
      )}

      <SwapDetailRows
        tx={tx}
        isBridge={isBridge}
        firstToken={firstToken}
        lastToken={lastToken}
        humanAmount={humanAmount}
        humanOutput={humanOutput}
        exchangeRate={exchangeRate}
      />

      {!isBridge && displayTokens.length > 1 ? (
        <RouteVisualization displayTokens={displayTokens} routePools={tx.routePools} />
      ) : null}

      <XdrToggle showXdr={showXdr} onToggle={() => setShowXdr(!showXdr)} xdr={tx.xdr} />

      <div className="h-px bg-border" />

      <div className="px-4 py-3">
        <ActionBar
          txResult={txResult}
          txError={txError}
          cancelled={cancelled}
          signing={signing}
          hasXdr={!!tx.xdr}
          cfg={cfg}
          onSign={handleSign}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
