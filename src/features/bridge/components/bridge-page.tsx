"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Badge } from "@/shared/ui/badge";
import { Skeleton } from "@/shared/ui/skeleton";
import {
  ArrowDownUp,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Wallet,
  Unplug,
} from "lucide-react";
import { useWallet } from "@/shared/context/wallet-context";
import { useBridge } from "@/features/bridge/hooks/use-bridge";
import { ChainTokenSelector } from "@/features/bridge/components/chain-token-selector";
import { SUPPORTED_CHAINS } from "@/features/bridge/lib/constants";

const EVM_CHAINS = new Set([
  "ethereum", "arbitrum", "base", "polygon", "optimism", "bsc", "avalanche",
]);

function truncateAddress(addr: string): string {
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function BridgePage() {
  const { connect: connectStellar } = useWallet();
  const bridge = useBridge();
  const {
    sourceChain, destChain, token, amount, destAddress, quote,
    isLoadingQuote, isBridging, bridgeError, bridgeSuccess,
    stellarAddress, evmAddress, isEvmAvailable,
    sourceAddress,
    setSourceChain, setDestChain, setToken, setAmount, setDestAddress,
    swapDirection, connectEvm, disconnectEvm, executeBridge, isValid,
  } = bridge;

  const chainIds = SUPPORTED_CHAINS.map((c) => c.id);
  const availableTokens = ["USDC", "USDT"];

  const isSourceStellar = sourceChain === "stellar";
  const isSourceEvm = EVM_CHAINS.has(sourceChain);
  const isDestStellar = destChain === "stellar";
  const isDestEvm = EVM_CHAINS.has(destChain);

  // Determine if source wallet is connected
  const sourceWalletConnected = isSourceStellar
    ? !!stellarAddress
    : isSourceEvm
      ? !!evmAddress
      : false;

  return (
    <div className="mx-auto max-w-lg py-10 px-4">
      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl font-semibold">Bridge Assets</CardTitle>
          <Badge variant="outline" className="text-xs text-yellow-400 border-yellow-400/40">
            Testnet
          </Badge>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* ── FROM Section ── */}
          <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
            <ChainTokenSelector
              label="From"
              selectedChain={sourceChain}
              selectedToken={token}
              chains={[...chainIds]}
              tokens={availableTokens}
              onChainChange={setSourceChain}
              onTokenChange={setToken}
            />

            {/* Source wallet connect / address */}
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Wallet
              </span>

              {isSourceStellar && !stellarAddress && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2 text-sm"
                  onClick={() => connectStellar?.()}
                >
                  <Wallet className="h-4 w-4" />
                  Connect Stellar Wallet
                </Button>
              )}

              {isSourceStellar && stellarAddress && (
                <div className="flex h-10 w-full items-center rounded-md border border-input bg-background/30 px-3 text-sm gap-2">
                  <span className="text-blue-400">🌟</span>
                  <span className="text-muted-foreground truncate">{truncateAddress(stellarAddress)}</span>
                  <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0">Stellar</Badge>
                </div>
              )}

              {isSourceEvm && !evmAddress && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2 text-sm"
                  onClick={connectEvm}
                >
                  <Wallet className="h-4 w-4" />
                  Connect Wallet
                </Button>
              )}

              {isSourceEvm && evmAddress && (
                <div className="flex h-10 w-full items-center rounded-md border border-input bg-background/30 px-3 text-sm gap-2">
                  <span className="text-purple-400">⟠</span>
                  <span className="text-muted-foreground truncate">{truncateAddress(evmAddress)}</span>
                  <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0">EVM</Badge>
                  <button
                    type="button"
                    onClick={() => disconnectEvm()}
                    className="text-muted-foreground hover:text-foreground"
                    title="Disconnect"
                  >
                    <Unplug className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {!isSourceStellar && !isSourceEvm && (
                <Input
                  placeholder="Enter source address"
                  value={sourceAddress}
                  disabled
                  className="bg-background/30"
                />
              )}
            </div>

            {/* Amount */}
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Amount
              </span>
              <div className="relative">
                <Input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="bg-background/30 pr-16"
                  min="0"
                  step="0.01"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 px-2 text-xs text-primary hover:text-primary/80"
                  onClick={() => setAmount("100")}
                >
                  Max
                </Button>
              </div>
            </div>
          </div>

          {/* ── Swap Direction ── */}
          <div className="flex justify-center -my-2">
            <Button
              variant="outline"
              size="icon"
              onClick={swapDirection}
              className="h-9 w-9 rounded-full border-border bg-card hover:bg-muted/50 z-10"
            >
              <ArrowDownUp className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>

          {/* ── TO Section ── */}
          <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
            <ChainTokenSelector
              label="To"
              selectedChain={destChain}
              selectedToken={token}
              chains={[...chainIds]}
              tokens={availableTokens}
              onChainChange={setDestChain}
              onTokenChange={setToken}
            />

            {/* Destination address */}
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Destination Address
              </span>

              {isDestStellar && stellarAddress ? (
                <div className="flex h-10 w-full items-center rounded-md border border-input bg-background/30 px-3 text-sm gap-2">
                  <span className="text-blue-400">🌟</span>
                  <span className="text-muted-foreground truncate">{truncateAddress(stellarAddress)}</span>
                  <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0">Auto</Badge>
                </div>
              ) : isDestEvm && evmAddress ? (
                <div className="space-y-2">
                  <div className="flex h-10 w-full items-center rounded-md border border-input bg-background/30 px-3 text-sm gap-2">
                    <span className="text-purple-400">⟠</span>
                    <span className="text-muted-foreground truncate">{truncateAddress(evmAddress)}</span>
                    <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0">Connected</Badge>
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    Or enter a different address:
                  </span>
                  <Input
                    placeholder="0x..."
                    value={destAddress}
                    onChange={(e) => setDestAddress(e.target.value)}
                    className="bg-background/30 text-sm"
                  />
                </div>
              ) : (
                <Input
                  placeholder={isDestEvm ? "0x..." : isDestStellar ? "G..." : "Enter destination address"}
                  value={destAddress}
                  onChange={(e) => setDestAddress(e.target.value)}
                  className="bg-background/30"
                />
              )}
            </div>
          </div>

          {/* ── Quote ── */}
          {(isLoadingQuote || quote) && (
            <Card className="border-border bg-muted/10">
              <CardContent className="p-4 space-y-2.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">You receive</span>
                  {isLoadingQuote ? (
                    <Skeleton className="h-4 w-24" />
                  ) : quote?.error ? (
                    <span className="text-destructive text-xs">{quote.error}</span>
                  ) : (
                    <span className="font-medium">{quote?.amountOut} {token}</span>
                  )}
                </div>
                {!quote?.error && (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Fee</span>
                      {isLoadingQuote ? (
                        <Skeleton className="h-4 w-20" />
                      ) : (
                        <span className="text-muted-foreground">{quote?.fee} ({quote?.feePercent})</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Estimated time</span>
                      {isLoadingQuote ? (
                        <Skeleton className="h-4 w-16" />
                      ) : (
                        <span className="text-muted-foreground">{quote?.estimatedTime}</span>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* ── Bridge Button ── */}
          {!sourceWalletConnected ? (
            <Button
              className="w-full"
              size="lg"
              onClick={isSourceStellar ? () => connectStellar?.() : connectEvm}
            >
              <Wallet className="mr-2 h-4 w-4" />
              {isSourceStellar ? "Connect Stellar Wallet" : "Connect Wallet"}
            </Button>
          ) : (
            <Button
              className="w-full"
              size="lg"
              disabled={!isValid || isBridging}
              onClick={executeBridge}
            >
              {isBridging ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Bridging...
                </>
              ) : (
                "Bridge"
              )}
            </Button>
          )}

          {/* ── Success ── */}
          {bridgeSuccess && (
            <div className="flex items-start gap-2 rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-400">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
              <span className="break-all">{bridgeSuccess}</span>
            </div>
          )}

          {/* ── Error ── */}
          {bridgeError && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{bridgeError}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
