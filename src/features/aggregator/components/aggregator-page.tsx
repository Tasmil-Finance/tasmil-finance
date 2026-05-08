"use client";

import { solana, solanaTestnet } from "@reown/appkit/networks";
import {
  useAppKit,
  useAppKitAccount,
  useAppKitNetwork,
  useAppKitProvider,
} from "@reown/appkit/react";
import { AnimatePresence, motion, useCycle } from "framer-motion";
import {
  ArrowLeftRight,
  ArrowUpDown,
  Clock,
  Info,
  Landmark,
  Unplug,
  Wallet,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAccount, useDisconnect, useSendTransaction } from "wagmi";
import { AddressPicker } from "@/features/aggregator/components/address-picker";
import {
  AggregatorRoutePanel,
  SlippageSettings,
} from "@/features/aggregator/components/aggregator-routes";
import { AggregatorTokenPicker } from "@/features/aggregator/components/chain-token-selector";
import { useAggregator } from "@/features/aggregator/hooks/use-aggregator";
import { useAllbridgeExecute } from "@/features/aggregator/hooks/use-allbridge-execute";
import { useEvmTokenBalance } from "@/features/aggregator/hooks/use-evm-balance";
import { useSolanaTokenBalance } from "@/features/aggregator/hooks/use-solana-balance";
import { useWalletTokens } from "@/features/profile/hooks/use-wallet-tokens";
import { TokenImage } from "@/shared/components/token-image";
import { useWallet } from "@/shared/context/wallet-context";
import { BackgroundRippleEffect } from "@/shared/ui/background-ripple-effect";
import BorderGlow from "@/shared/ui/border-glow";
import { Typography } from "@/shared/ui/typography";
import { useAddressStore } from "@/store/use-address";

const C = {
  widgetBg: "var(--card)",
  sectionBg: "var(--secondary)",
  hover: "var(--accent)",
  interactive: "var(--input)",
  mutedText: "var(--muted-foreground)",
  mainText: "var(--foreground)",
  dimText: "var(--ring)",
} as const;

const EVM_CHAINS = new Set([
  "ethereum",
  "arbitrum",
  "base",
  "polygon",
  "optimism",
  "bsc",
  "avalanche",
  "sonic",
  "celo",
  "linea",
  "unichain",
]);

function truncAddr(addr: string) {
  return addr.length <= 12 ? addr : `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function formatAmount(raw: string, decimals = 7): string {
  const num = Number(raw) / 10 ** decimals;
  if (num === 0) return "0";
  if (num < 0.0001) return "<0.0001";
  return num.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

function formatUsdCompact(value: number): string {
  if (value === 0) return "$0";
  if (value < 0.01) return "<$0.01";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatBalanceShort(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(2)}K`;
  if (value > 0) return value.toFixed(6);
  return "0";
}

const isTestnet = process.env["NEXT_PUBLIC_STELLAR_NETWORK"] !== "mainnet";

export function AggregatorPage() {
  const {
    connect: connectStellar,
    disconnect: disconnectStellar,
    address: stellarAddress,
  } = useWallet();
  const agg = useAggregator();
  const { execute: allbridgeExecute } = useAllbridgeExecute();
  const addrStore = useAddressStore();

  // EVM wallet via wagmi + Reown
  const { address: evmAddressRaw, isConnected: isEvmConnected } = useAccount();
  const { disconnectAsync } = useDisconnect();
  const { open: openReownModal } = useAppKit();
  const { switchNetwork } = useAppKitNetwork();
  const evmAddress = isEvmConnected && evmAddressRaw ? evmAddressRaw : null;

  // Solana wallet via Reown AppKit
  const { address: solanaAddressRaw, isConnected: isSolanaConnected } = useAppKitAccount({
    namespace: "solana",
  });
  const solanaAddress = isSolanaConnected && solanaAddressRaw ? solanaAddressRaw : null;
  const { walletProvider: solanaProvider } = useAppKitProvider<{
    signAndSendTransaction: (tx: unknown) => Promise<{ signature: string }>;
  }>("solana");

  // Sign and send a Solana transaction via Reown wallet (receives raw TX object from SDK)
  const signSolanaTransaction = useCallback(
    async (tx: unknown): Promise<string> => {
      if (!solanaProvider?.signAndSendTransaction) {
        throw new Error("Solana wallet not available");
      }
      const result = await solanaProvider.signAndSendTransaction(tx);
      return result.signature;
    },
    [solanaProvider]
  );

  // Sign and send an EVM transaction via wagmi
  const { sendTransactionAsync } = useSendTransaction();
  const signEvmTransaction = useCallback(
    async (tx: { to: string; data: string; value?: string }): Promise<string> => {
      const hash = await sendTransactionAsync({
        to: tx.to as `0x${string}`,
        data: tx.data as `0x${string}`,
        value: tx.value ? BigInt(tx.value) : undefined,
      });
      return hash;
    },
    [sendTransactionAsync]
  );

  const connectEvm = useCallback(async () => {
    openReownModal({ view: "Connect" });
  }, [openReownModal]);

  const connectSolana = useCallback(async () => {
    await switchNetwork(isTestnet ? solanaTestnet : solana);
    openReownModal({ view: "Connect" });
  }, [switchNetwork, openReownModal]);

  const disconnectEvm = useCallback(async () => {
    await disconnectAsync();
  }, [disconnectAsync]);
  const [swapAnim, cycleSwap] = useCycle({ rotateX: 0 }, { rotateX: 180 });
  const activeTab = "bridge" as const;
  const [selectedProtocol, setSelectedProtocol] = useState<string | null>(null);
  const hasUserInteracted = useRef(false);
  const swapPanelRef = useRef<HTMLDivElement>(null);
  const [swapPanelHeight, setSwapPanelHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    const el = swapPanelRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setSwapPanelHeight(el.offsetHeight);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Toast notifications for swap result
  const network = process.env["NEXT_PUBLIC_STELLAR_NETWORK"] === "mainnet" ? "public" : "testnet";
  const CHAIN_EXPLORERS: Record<string, string> = {
    stellar: `https://stellar.expert/explorer/${network}/tx`,
    ethereum: "https://etherscan.io/tx",
    arbitrum: "https://arbiscan.io/tx",
    base: "https://basescan.org/tx",
    polygon: "https://polygonscan.com/tx",
    bsc: "https://bscscan.com/tx",
    avalanche: "https://subnets.avax.network/c-chain/tx",
    optimism: "https://optimistic.etherscan.io/tx",
    solana: "https://solscan.io/tx",
    tron: "https://tronscan.org/#/transaction",
    sonic: "https://sonicscan.org/tx",
    celo: "https://celoscan.io/tx",
    linea: "https://lineascan.build/tx",
    unichain: "https://uniscan.xyz/tx",
  };
  const getExplorerUrl = useCallback(
    (hash: string) => {
      const base = CHAIN_EXPLORERS[agg.chainIn] ?? CHAIN_EXPLORERS.stellar;
      return `${base}/${hash}`;
    },
    [agg.chainIn, network]
  );
  useEffect(() => {
    if (agg.executeSuccess) {
      const isBridge = selectedProtocol === "allbridge";
      toast.success(isBridge ? "Bridge successful!" : "Swap successful!", {
        description: (
          <a
            href={getExplorerUrl(agg.executeSuccess)}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            View transaction ↗
          </a>
        ),
      });
    }
  }, [agg.executeSuccess]);

  useEffect(() => {
    if (agg.executeError) {
      toast.error("Swap failed", { description: agg.executeError });
    }
  }, [agg.executeError]);

  // Sync connected wallets into address store
  useEffect(() => {
    addrStore.syncConnectedWallet("stellar", stellarAddress, "Stellar Wallet");
    addrStore.syncConnectedWallet("evm", evmAddress, "EVM Wallet");
    addrStore.syncConnectedWallet("solana", solanaAddress, "Solana Wallet");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stellarAddress, evmAddress, solanaAddress]);

  const resolveChainType = (chain: string): "stellar" | "evm" | "solana" =>
    chain === "stellar" ? "stellar" : chain === "solana" ? "solana" : "evm";
  const isChainSupported = (chain: string) =>
    chain === "stellar" || chain === "solana" || EVM_CHAINS.has(chain);
  const chainTypeIn = resolveChainType(agg.chainIn);
  const chainTypeOut = resolveChainType(agg.chainOut);

  // Source address — from store selection or auto from connected wallet
  const isSourceStellar = agg.chainIn === "stellar";
  const isSourceEvm = EVM_CHAINS.has(agg.chainIn);
  const isSourceSolana = agg.chainIn === "solana";

  // Validate selectedSource matches the current chain type
  const selectedSourceValid = (() => {
    const sel = addrStore.selectedSource;
    if (!sel) return null;
    if (isSourceStellar && sel.startsWith("G") && sel.length === 56) return sel;
    if (isSourceEvm && sel.startsWith("0x") && sel.length === 42) return sel;
    if (isSourceSolana && !sel.startsWith("G") && !sel.startsWith("0x")) return sel;
    return null;
  })();

  const sourceAddress =
    selectedSourceValid ||
    (isSourceStellar
      ? stellarAddress
      : isSourceEvm
        ? evmAddress
        : isSourceSolana
          ? solanaAddress
          : null) ||
    "";

  const srcConnected = !!sourceAddress;
  const isUnsupportedChain = !isChainSupported(agg.chainIn) || !isChainSupported(agg.chainOut);
  const isCrossChain = agg.chainIn !== agg.chainOut;
  const destWalletAddress =
    chainTypeOut === "stellar"
      ? stellarAddress
      : chainTypeOut === "solana"
        ? solanaAddress
        : evmAddress;
  const destConnected = !!agg.destAddress || !!destWalletAddress;
  const needsSrcWallet = !srcConnected && (isSourceStellar || isSourceEvm || isSourceSolana);
  const needsDestWallet = isCrossChain && !destConnected && isChainSupported(agg.chainOut);
  const needsWallet = isUnsupportedChain || needsSrcWallet || needsDestWallet;
  const aggHasBothTokens = !!agg.tokenIn && !!agg.tokenOut;
  const aggHasAmount = !!agg.amount && Number.parseFloat(agg.amount) > 0;
  const showRoutePanel = aggHasBothTokens && aggHasAmount;

  // ─── Wallet balances & prices ───────────────────────────────────────────
  const { data: walletData } = useWalletTokens(stellarAddress);
  const walletTokens = walletData?.tokens ?? [];

  // Solana SPL token balance
  const solMintAddress = isSourceSolana ? agg.tokenIn?.addresses?.["solana"] : null;
  const { data: solanaTokenBal } = useSolanaTokenBalance(
    isSourceSolana ? solanaAddress : null,
    solMintAddress
  );

  // EVM ERC-20 token balance via RPC (works regardless of connected chain)
  const evmTokenAddress = isSourceEvm ? agg.tokenIn?.addresses?.[agg.chainIn] : null;
  const { data: evmTokenBal } = useEvmTokenBalance(
    isSourceEvm ? evmAddress : null,
    evmTokenAddress,
    isSourceEvm ? agg.chainIn : null,
    agg.tokenIn?.decimals ?? 18
  );

  // Build price map from wallet tokens
  const priceMap: Record<string, number> = {};
  for (const t of walletTokens) {
    if (t.price > 0) priceMap[t.assetCode.toUpperCase()] = t.price;
  }

  // Find balance for selected tokenIn (chain-aware)
  const tokenInBalance: { balance: number } | null = isSourceSolana
    ? solanaTokenBal != null
      ? { balance: solanaTokenBal }
      : null
    : isSourceEvm && evmTokenBal != null
      ? { balance: evmTokenBal }
      : isSourceStellar && agg.tokenIn
        ? (walletTokens.find(
            (t) => t.assetCode.toUpperCase() === agg.tokenIn!.symbol.toUpperCase()
          ) ?? null)
        : null;

  // Prices — use wallet price map (works even if user doesn't hold the token,
  // as long as another token with that symbol exists in the wallet)
  const tokenInPrice = agg.tokenIn ? (priceMap[agg.tokenIn.symbol.toUpperCase()] ?? 0) : 0;
  const tokenOutPrice = agg.tokenOut ? (priceMap[agg.tokenOut.symbol.toUpperCase()] ?? 0) : 0;

  // USD values (inputAmount computed here, outputAmount after selectedQuote)
  const inputAmount = Number.parseFloat(agg.amount || "0") || 0;
  const inputUsd = inputAmount * tokenInPrice;

  // Insufficient balance check
  const insufficientBalance =
    aggHasAmount && tokenInBalance != null && inputAmount > tokenInBalance.balance;

  // Reset selected protocol when tokens change
  useEffect(() => {
    setSelectedProtocol(null);
  }, [agg.tokenIn, agg.tokenOut]);

  // Clear selected source/dest when chain changes (prevents cross-chain address mismatch)
  useEffect(() => {
    addrStore.setSelectedSource(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agg.chainIn]);
  useEffect(() => {
    addrStore.setSelectedDest(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agg.chainOut]);

  // Selected route quote — either user-selected or best
  const selectedQuote =
    agg.quotes.find((q) => (q.protocol || q.provider) === selectedProtocol && q.status === "ok") ||
    agg.bestQuote;

  // Output USD value (must be after selectedQuote)
  const outputAmount =
    selectedQuote?.status === "ok"
      ? Number(selectedQuote.amountOut) / 10 ** (agg.tokenOut?.decimals ?? 7)
      : 0;
  const outputUsd = outputAmount * tokenOutPrice;

  // Auto-select best route when quotes change
  useEffect(() => {
    if (!agg.bestQuote) {
      setSelectedProtocol(null);
      return;
    }
    // Auto-select best if nothing selected, or if current selection is no longer available
    const currentStillAvailable = agg.quotes.some(
      (q) => (q.protocol || q.provider) === selectedProtocol && q.status === "ok"
    );
    if (!currentStillAvailable) {
      setSelectedProtocol(agg.bestQuote.protocol || agg.bestQuote.provider || null);
    }
  }, [agg.bestQuote, agg.quotes, selectedProtocol]);

  // URL prefill: ?tokenIn=XLM&tokenOut=USDC&chainIn=stellar&chainOut=stellar&amount=100
  useEffect(() => {
    if (agg.tokens.length === 0) return; // wait for registry
    const params = new URLSearchParams(window.location.search);
    const urlTokenIn = params.get("tokenIn");
    const urlTokenOut = params.get("tokenOut");
    const urlChainIn = params.get("chainIn") || params.get("from") || "stellar";
    const urlChainOut = params.get("chainOut") || params.get("to") || "stellar";
    const urlAmount = params.get("amount");

    if (urlTokenIn) {
      const t = agg.tokens.find((tk) => tk.symbol.toUpperCase() === urlTokenIn.toUpperCase());
      if (t) {
        agg.setTokenIn(t, urlChainIn);
        hasUserInteracted.current = true;
      }
    }
    if (urlTokenOut) {
      const t = agg.tokens.find((tk) => tk.symbol.toUpperCase() === urlTokenOut.toUpperCase());
      if (t) {
        agg.setTokenOut(t, urlChainOut);
        hasUserInteracted.current = true;
      }
    }
    if (urlAmount) {
      agg.setAmount(urlAmount);
      hasUserInteracted.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agg.tokens.length]);

  // Sync state → URL only after user has interacted (prevents default tokens polluting URL)
  useEffect(() => {
    if (!hasUserInteracted.current) return;
    if (!agg.tokenIn && !agg.tokenOut) return;
    const params = new URLSearchParams();
    if (agg.tokenIn) {
      params.set("tokenIn", agg.tokenIn.symbol);
      params.set("chainIn", agg.chainIn);
    }
    if (agg.tokenOut) {
      params.set("tokenOut", agg.tokenOut.symbol);
      params.set("chainOut", agg.chainOut);
    }
    if (agg.amount) params.set("amount", agg.amount);
    const url = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, "", url);
  }, [agg.tokenIn, agg.tokenOut, agg.chainIn, agg.chainOut, agg.amount]);

  // Tokens available for pickers — use filtered if available, else all
  const tokensForOut = agg.filteredTokensOut.length > 0 ? agg.filteredTokensOut : agg.tokens;
  const chainsForOut =
    agg.filteredChainsOut.length > 0 ? agg.filteredChainsOut : agg.chains.map((c) => c.id);
  const tokensForIn = agg.filteredTokensIn.length > 0 ? agg.filteredTokensIn : agg.tokens;
  const chainsForIn =
    agg.filteredChainsIn.length > 0 ? agg.filteredChainsIn : agg.chains.map((c) => c.id);

  return (
    <div className="relative flex flex-col items-center justify-center xl:justify-start min-h-full w-full overflow-y-auto px-4 pt-8 pb-8 xl:pt-20">
      <BackgroundRippleEffect rows={10} cols={22} cellSize={72} />

      {/* Hero — stacks above card normally. At ~1520px+ (enough room for
          card group + route panel), slides to absolute left rail to avoid overlap. */}
      <div className="pointer-events-none z-20 mb-4 min-[1520px]:absolute min-[1520px]:top-1/2 min-[1520px]:left-8 min-[1520px]:mb-0 max-w-md min-[1520px]:max-w-[280px] 2xl:max-w-[300px] 2xl:left-12 space-y-3 text-center min-[1520px]:text-left min-[1520px]:-translate-y-[105%]">
        <Typography
          as="h1"
          variant="h1"
          weight="bold"
          className="text-4xl leading-tight tracking-tight md:text-5xl"
        >
          DeFi Aggregator
        </Typography>
        <Typography variant="p" className="text-muted-foreground text-sm md:text-base">
          Compare rates across multiple DEXs and bridge assets to any supported chain — all in one
          place
        </Typography>
      </div>

      <div className="relative z-20 mx-auto flex w-fit items-start justify-center gap-3">
        <div ref={swapPanelRef} className="w-full sm:w-[480px] max-w-[480px]">
          <BorderGlow
            animated
            className="w-full"
            backgroundColor="var(--card)"
            borderRadius={24}
            glowColor="203 100 73"
            glowIntensity={0.4}
            glowRadius={35}
            colors={["hsl(203 100% 73%)", "hsl(195 90% 55%)", "hsl(210 80% 50%)"]}
            fillOpacity={0.2}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <div className="flex items-center gap-1.5">
                {agg.mode && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-secondary text-muted-foreground border border-border">
                    <ArrowLeftRight className="h-3 w-3" />
                    {agg.mode === "swap" ? "Swap" : "Bridge"}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <WalletHub
                  stellarAddress={stellarAddress}
                  evmAddress={evmAddress}
                  solanaAddress={solanaAddress}
                  onConnectStellar={() => connectStellar?.()}
                  onConnectEvm={connectEvm}
                  onConnectSolana={connectSolana}
                  onDisconnectStellar={disconnectStellar}
                  onDisconnectEvm={disconnectEvm}
                  onDisconnectSolana={disconnectEvm}
                />
                <SlippageSettings
                  slippageBps={agg.slippageBps}
                  setSlippageBps={agg.setSlippageBps}
                  enabledProtocols={agg.enabledProtocols}
                  toggleProtocol={agg.toggleProtocol}
                />
              </div>
            </div>

            {activeTab === "bridge" ? (
              <div className="flex flex-col px-4 pb-4">
                {/* Input/Output */}
                <div className="flex flex-col relative gap-2 leading-4">
                  {/* ── TOKEN IN ── */}
                  <div className="rounded-2xl p-4 pb-[15px]" style={{ background: C.sectionBg }}>
                    <div className="grid grid-cols-9 gap-2 items-center h-7">
                      <label
                        className="col-span-5 text-base font-normal leading-5"
                        style={{ color: C.mutedText }}
                      >
                        You pay
                      </label>
                      <div className="col-span-4 justify-self-end">
                        <AddressPicker
                          direction="source"
                          chainType={chainTypeIn}
                          selectedAddress={sourceAddress || null}
                          onSelect={(addr) => addrStore.setSelectedSource(addr)}
                          stellarAddress={stellarAddress}
                          evmAddress={evmAddress}
                          solanaAddress={solanaAddress}
                          onConnectWallet={
                            isSourceStellar
                              ? () => connectStellar?.()
                              : isSourceSolana
                                ? connectSolana
                                : connectEvm
                          }
                          onDisconnectStellar={disconnectStellar}
                          onDisconnectEvm={disconnectEvm}
                        />
                      </div>
                    </div>
                    <div className="mt-[10px] grid grid-cols-[1fr_auto] gap-1 w-full">
                      <div className="min-w-0 overflow-hidden">
                        <input
                          type="text"
                          inputMode="decimal"
                          autoComplete="off"
                          placeholder="0"
                          value={agg.amount}
                          onChange={(e) => {
                            if (/^[0-9]*[.,]?[0-9]*$/.test(e.target.value)) {
                              hasUserInteracted.current = true;
                              agg.setAmount(e.target.value);
                            }
                          }}
                          className="w-full bg-transparent text-[28px] leading-[34px] font-normal focus:outline-none truncate"
                          style={{ color: C.mainText }}
                        />
                        <div className="flex items-center mt-0.5 h-5 gap-1.5">
                          <span
                            className="text-sm font-medium leading-5"
                            style={{ color: C.mutedText }}
                          >
                            {inputAmount > 0 && tokenInPrice > 0
                              ? formatUsdCompact(inputUsd)
                              : "$0"}
                          </span>
                          {tokenInBalance != null && (
                            <>
                              <span className="text-sm leading-5" style={{ color: C.dimText }}>
                                |
                              </span>
                              <button
                                type="button"
                                onClick={() => agg.setAmount(String(tokenInBalance.balance))}
                                className="text-sm font-medium leading-5 underline decoration-dotted underline-offset-2 hover:opacity-80 transition-opacity cursor-pointer"
                                style={{ color: C.dimText }}
                                title="Use max balance"
                              >
                                Balance: {formatBalanceShort(tokenInBalance.balance)}{" "}
                                {agg.tokenIn?.symbol ?? ""}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="justify-self-end self-start">
                        <AggregatorTokenPicker
                          selectedToken={agg.tokenIn}
                          selectedChain={agg.chainIn}
                          tokens={tokensForIn}
                          chains={chainsForIn}
                          allChains={agg.chains}
                          onSelect={(token, chain) => {
                            hasUserInteracted.current = true;
                            agg.setTokenIn(token, chain);
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* ── SWAP ── */}
                  <div className="flex justify-center -my-2 relative z-10">
                    <button
                      type="button"
                      onClick={() => {
                        hasUserInteracted.current = true;
                        agg.swapDirection();
                        cycleSwap();
                      }}
                      className="rounded-lg h-9 w-9 flex items-center justify-center transition-colors hover:brightness-125"
                      style={{ background: C.interactive }}
                    >
                      <motion.div
                        animate={swapAnim}
                        transition={{ duration: 0.3 }}
                        className="flex items-center justify-center"
                      >
                        <ArrowUpDown className="h-5 w-5" style={{ color: C.mutedText }} />
                      </motion.div>
                    </button>
                  </div>

                  {/* ── TOKEN OUT ── */}
                  <div className="rounded-2xl p-4 pb-[15px]" style={{ background: C.sectionBg }}>
                    <div className="grid grid-cols-9 gap-2 items-center h-7">
                      <label
                        className="col-span-5 text-base font-normal leading-5"
                        style={{ color: C.mutedText }}
                      >
                        You receive
                      </label>
                      <div className="col-span-4 justify-self-end">
                        <AddressPicker
                          direction="dest"
                          chainType={chainTypeOut}
                          selectedAddress={
                            // Only show dest address if it matches the dest chain type
                            chainTypeOut === "stellar" && agg.destAddress?.startsWith("G")
                              ? agg.destAddress
                              : chainTypeOut === "evm" && agg.destAddress?.startsWith("0x")
                                ? agg.destAddress
                                : chainTypeOut === "solana" &&
                                    agg.destAddress &&
                                    !agg.destAddress.startsWith("G") &&
                                    !agg.destAddress.startsWith("0x")
                                  ? agg.destAddress
                                  : null
                          }
                          onSelect={(addr) => {
                            addrStore.setSelectedDest(addr);
                            agg.setDestAddress(addr);
                          }}
                          stellarAddress={stellarAddress}
                          evmAddress={evmAddress}
                          solanaAddress={solanaAddress}
                          onConnectWallet={
                            chainTypeOut === "stellar"
                              ? () => connectStellar?.()
                              : chainTypeOut === "solana"
                                ? connectSolana
                                : connectEvm
                          }
                          onDisconnectStellar={disconnectStellar}
                          onDisconnectEvm={disconnectEvm}
                        />
                      </div>
                    </div>
                    <div className="mt-[10px] grid grid-cols-[1fr_auto] gap-1 w-full">
                      <div className="min-w-0 overflow-hidden">
                        {agg.isLoadingQuotes ? (
                          <div className="space-y-2 pt-1">
                            <div
                              className="h-[34px] w-32 rounded-lg animate-pulse"
                              style={{ background: C.interactive, opacity: 0.4 }}
                            />
                            <div
                              className="h-5 w-16 rounded animate-pulse"
                              style={{ background: C.interactive, opacity: 0.4 }}
                            />
                          </div>
                        ) : (
                          <>
                            <p
                              className="text-[28px] leading-[34px] font-normal truncate"
                              style={{ color: C.mainText }}
                            >
                              {selectedQuote?.status === "ok"
                                ? formatAmount(selectedQuote.amountOut, agg.tokenOut?.decimals ?? 7)
                                : "0"}
                            </p>
                            <span
                              className="text-sm font-medium leading-5 mt-0.5 block h-5"
                              style={{ color: C.mutedText }}
                            >
                              {outputAmount > 0 && tokenOutPrice > 0
                                ? formatUsdCompact(outputUsd)
                                : "$0"}
                            </span>
                          </>
                        )}
                      </div>
                      <div className="justify-self-end self-start">
                        <AggregatorTokenPicker
                          selectedToken={agg.tokenOut}
                          selectedChain={agg.chainOut}
                          tokens={tokensForOut}
                          chains={chainsForOut}
                          allChains={agg.chains}
                          onSelect={(token, chain) => {
                            hasUserInteracted.current = true;
                            agg.setTokenOut(token, chain);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Best quote summary (above CTA, like reference image) ── */}
                {selectedQuote?.status === "ok" && !agg.isLoadingQuotes && (
                  <div
                    className="rounded-2xl px-3.5 py-3 text-sm mt-3"
                    style={{ background: C.sectionBg }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5" style={{ color: C.dimText }}>
                        <Info className="h-3.5 w-3.5" /> Fee
                      </span>
                      <span style={{ color: C.mutedText }}>
                        {formatAmount(selectedQuote.fee, agg.tokenIn?.decimals ?? 7)}{" "}
                        {agg.tokenIn?.symbol ?? ""} ({selectedQuote.feePercent})
                      </span>
                    </div>
                    {selectedQuote.gasFee && (
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="flex items-center gap-1.5" style={{ color: C.dimText }}>
                          <Info className="h-3.5 w-3.5" /> Gas fee
                        </span>
                        <span style={{ color: C.mutedText }}>
                          {selectedQuote.gasFee} {selectedQuote.gasFeeToken ?? ""}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="flex items-center gap-1.5" style={{ color: C.dimText }}>
                        <Clock className="h-3.5 w-3.5" /> Estimated time
                      </span>
                      <span style={{ color: C.mutedText }}>{selectedQuote.estimatedTime}</span>
                    </div>
                  </div>
                )}

                {/* ── Trustline Warning (shows all missing with individual buttons) ── */}
                {agg.needsTrustline && agg.missingTrustlines.length > 0 && (
                  <div
                    className="rounded-2xl p-4 mt-3 space-y-3"
                    style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}
                  >
                    <p
                      className="text-sm font-semibold flex items-center gap-1.5"
                      style={{ color: "var(--foreground)" }}
                    >
                      <Info className="h-4 w-4" style={{ color: "var(--primary)" }} />
                      Trustline{agg.missingTrustlines.length > 1 ? "s" : ""} missing
                    </p>
                    {agg.missingTrustlines.map((sym) => {
                      const isSigning = agg.signingTrustline === sym;
                      return (
                        <div
                          key={sym}
                          className="flex items-center gap-3 rounded-xl p-3"
                          style={{ background: "var(--input)" }}
                        >
                          <div className="flex flex-col flex-1 min-w-0">
                            <span
                              className="text-sm font-medium"
                              style={{ color: "var(--foreground)" }}
                            >
                              {sym}
                            </span>
                            <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                              {isSigning
                                ? "Waiting for wallet signature..."
                                : "Trustline required to receive"}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => agg.addTrustlineFor(sym)}
                            disabled={agg.isAddingTrustline}
                            className={`shrink-0 rounded-xl font-semibold px-4 py-2.5 text-xs transition-all active:scale-[0.98] relative overflow-hidden ${
                              isSigning
                                ? "bg-[var(--secondary)] text-[var(--muted-foreground)]"
                                : "bg-gradient-to-b from-[#B5EAFF] to-[#00BFFF] text-black"
                            }`}
                          >
                            {isSigning ? (
                              <span className="flex items-center gap-1.5">
                                <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
                                  <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    fill="none"
                                  />
                                  <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                  />
                                </svg>
                                Signing
                              </span>
                            ) : (
                              "Add +"
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* ── CTA ── */}
                <div className="flex flex-col gap-2 mt-3">
                  {needsWallet ? (
                    <button
                      type="button"
                      disabled={isUnsupportedChain}
                      onClick={
                        isUnsupportedChain
                          ? undefined
                          : needsSrcWallet
                            ? isSourceStellar
                              ? () => connectStellar?.()
                              : isSourceSolana
                                ? connectSolana
                                : connectEvm
                            : chainTypeOut === "stellar"
                              ? () => connectStellar?.()
                              : chainTypeOut === "solana"
                                ? connectSolana
                                : connectEvm
                      }
                      className={`w-full rounded-2xl font-bold py-4 text-base transition-all flex items-center justify-center gap-2 relative overflow-hidden ${
                        isUnsupportedChain
                          ? "cursor-not-allowed opacity-50"
                          : "active:scale-[0.98] hover:scale-[1.02] bg-gradient-to-b from-[#B5EAFF] to-[#00BFFF] text-black"
                      }`}
                      style={
                        isUnsupportedChain
                          ? { background: C.interactive, color: C.dimText }
                          : undefined
                      }
                    >
                      {!isUnsupportedChain && (
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-4 w-[50%] rounded-full bg-white/80 blur-xl" />
                      )}
                      <Wallet className="h-5 w-5" strokeWidth={2} />
                      <span>
                        {isUnsupportedChain
                          ? `${agg.chainIn === "tron" ? "Tron" : agg.chainIn} wallet not supported yet`
                          : needsSrcWallet
                            ? "Connect source wallet"
                            : "Connect destination wallet"}
                      </span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={
                        !aggHasAmount ||
                        !aggHasBothTokens ||
                        !selectedProtocol ||
                        agg.isExecuting ||
                        agg.needsTrustline ||
                        insufficientBalance
                      }
                      onClick={() =>
                        selectedProtocol &&
                        agg.executeSwap(selectedProtocol, {
                          sourceAddress: sourceAddress || undefined,
                          signSolana: isSourceSolana ? signSolanaTransaction : undefined,
                          signEvm: isSourceEvm ? signEvmTransaction : undefined,
                          allbridgeExecute:
                            selectedProtocol === "allbridge" ? allbridgeExecute : undefined,
                        })
                      }
                      className={`w-full rounded-2xl font-bold py-3.5 text-[15px] transition-all flex items-center justify-center gap-2 active:scale-[0.98] relative overflow-hidden ${
                        agg.isExecuting
                          ? "cursor-wait"
                          : aggHasAmount &&
                              selectedProtocol &&
                              !agg.needsTrustline &&
                              !insufficientBalance
                            ? "bg-gradient-to-b from-[#B5EAFF] to-[#00BFFF] text-black hover:scale-[1.02] hover:from-[#C5F0FF] hover:to-[#1CCFFF] cursor-pointer"
                            : "cursor-not-allowed opacity-50"
                      }`}
                      style={
                        agg.isExecuting
                          ? { background: C.sectionBg, color: "var(--muted-foreground)" }
                          : !(
                                aggHasAmount &&
                                selectedProtocol &&
                                !agg.needsTrustline &&
                                !insufficientBalance
                              )
                            ? { background: C.interactive, color: C.dimText }
                            : undefined
                      }
                    >
                      {aggHasAmount &&
                        selectedProtocol &&
                        !agg.isExecuting &&
                        !agg.needsTrustline &&
                        !insufficientBalance && (
                          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-4 w-[50%] rounded-full bg-white/80 blur-xl" />
                        )}
                      {agg.isExecuting
                        ? "Signing..."
                        : agg.needsTrustline
                          ? "Add trustline first"
                          : !aggHasAmount
                            ? "Enter amount"
                            : !aggHasBothTokens
                              ? "Select tokens"
                              : insufficientBalance
                                ? "Insufficient balance"
                                : !selectedProtocol
                                  ? "Select a route"
                                  : "Swap"}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* ── EXCHANGE TAB (Deposit from CEX) ── */
              <ExchangeTab stellarAddress={stellarAddress} />
            )}
          </BorderGlow>
        </div>

        {/* ══════════════════════════════════════════════════════════ */}
        {/* Right side: Route Panel (expands when both tokens + amount) */}
        {/* ══════════════════════════════════════════════════════════ */}
        <AnimatePresence>
          {activeTab === "bridge" && showRoutePanel && (
            <motion.div
              className="hidden sm:flex"
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 360 }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              style={{ overflow: "hidden", height: swapPanelHeight }}
            >
              <AggregatorRoutePanel
                quotes={agg.quotes}
                bestQuote={agg.bestQuote}
                isLoading={agg.isLoadingQuotes}
                tokenInSymbol={agg.tokenIn?.symbol ?? ""}
                tokenOutSymbol={agg.tokenOut?.symbol ?? ""}
                decimalsIn={agg.tokenIn?.decimals ?? 7}
                decimals={agg.tokenOut?.decimals ?? 7}
                chainIn={agg.chainIn}
                chainOut={agg.chainOut}
                selectedProtocol={selectedProtocol}
                onSelectProtocol={setSelectedProtocol}
                onRefresh={agg.refreshQuotes}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ── Wallet Hub: shows all connected wallets, connect new, disconnect ── */
function WalletHub({
  stellarAddress,
  evmAddress,
  solanaAddress,
  onConnectStellar,
  onConnectEvm,
  onConnectSolana,
  onDisconnectStellar,
  onDisconnectEvm,
  onDisconnectSolana,
}: {
  stellarAddress: string | null;
  evmAddress: string | null;
  solanaAddress: string | null;
  onConnectStellar: () => void;
  onConnectEvm: () => void;
  onConnectSolana: () => void;
  onDisconnectStellar: () => void;
  onDisconnectEvm: () => void;
  onDisconnectSolana: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const wallets = [
    stellarAddress
      ? {
          chain: "Stellar",
          addr: stellarAddress,
          logo: "/chains/stellar.png",
          onDisconnect: onDisconnectStellar,
        }
      : null,
    evmAddress
      ? {
          chain: "EVM",
          addr: evmAddress,
          logo: "/chains/ethereum.png",
          onDisconnect: onDisconnectEvm,
        }
      : null,
    solanaAddress
      ? {
          chain: "Solana",
          addr: solanaAddress,
          logo: "/chains/solana.png",
          onDisconnect: onDisconnectSolana,
        }
      : null,
  ].filter(Boolean) as { chain: string; addr: string; logo: string; onDisconnect: () => void }[];

  return (
    <div className="relative" ref={ref}>
      {/* Trigger: stack of connected wallet icons */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center -space-x-1.5 cursor-pointer"
      >
        {wallets.length > 0 ? (
          wallets.map((w) => (
            <TokenImage
              key={w.chain}
              src={w.logo}
              alt={w.chain}
              className="h-7 w-7 rounded-full object-contain ring-2 ring-[var(--card)]"
            />
          ))
        ) : (
          <span
            className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg"
            style={{ background: "var(--secondary)", color: "var(--muted-foreground)" }}
          >
            <Wallet className="h-3.5 w-3.5" /> Connect
          </span>
        )}
      </button>

      {/* Popover: all wallets */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-10 z-50 w-80 rounded-2xl p-4 shadow-xl"
            style={{ background: "var(--popover)", border: "1px solid var(--border)" }}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                Connected wallets
              </p>
              <button type="button" onClick={() => setOpen(false)}>
                <X className="h-4 w-4" style={{ color: "var(--muted-foreground)" }} />
              </button>
            </div>

            {/* Connect new wallet */}
            <div className="flex justify-center gap-3 mb-3">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setTimeout(onConnectStellar, 200);
                }}
                className="h-10 w-10 flex items-center justify-center rounded-xl transition-colors hover:brightness-125"
                style={{ background: "var(--secondary)" }}
                title="Stellar"
              >
                <TokenImage
                  src="/chains/stellar.png"
                  alt="Stellar"
                  className="h-6 w-6 rounded-full"
                />
              </button>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setTimeout(onConnectEvm, 200);
                }}
                className="h-10 w-10 flex items-center justify-center rounded-xl transition-colors hover:brightness-125"
                style={{ background: "var(--secondary)" }}
                title="EVM"
              >
                <TokenImage
                  src="/chains/ethereum.png"
                  alt="Ethereum"
                  className="h-6 w-6 rounded-full"
                />
              </button>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setTimeout(onConnectSolana, 200);
                }}
                className="h-10 w-10 flex items-center justify-center rounded-xl transition-colors hover:brightness-125"
                style={{ background: "var(--secondary)" }}
                title="Solana"
              >
                <TokenImage
                  src="/chains/solana.png"
                  alt="Solana"
                  className="h-6 w-6 rounded-full"
                />
              </button>
            </div>

            {/* Wallet list */}
            <div className="flex flex-col gap-1.5">
              {wallets.map((w) => (
                <div
                  key={w.chain}
                  className="flex items-center gap-3 rounded-xl p-3"
                  style={{ background: "var(--secondary)" }}
                >
                  <TokenImage
                    src={w.logo}
                    alt={w.chain}
                    className="h-9 w-9 rounded-full object-contain shrink-0"
                  />
                  <div className="flex flex-col min-w-0 flex-1">
                    <span
                      className="text-sm font-medium truncate"
                      style={{ color: "var(--foreground)" }}
                    >
                      {truncAddr(w.addr)}
                    </span>
                    <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                      {w.chain}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      w.onDisconnect();
                      setOpen(false);
                    }}
                    className="p-1.5 rounded-lg hover:bg-[var(--input)] transition-colors"
                    title="Disconnect"
                  >
                    <Unplug className="h-4 w-4" style={{ color: "var(--ring)" }} />
                  </button>
                </div>
              ))}

              {wallets.length === 0 && (
                <p className="text-sm text-center py-4" style={{ color: "var(--ring)" }}>
                  No wallets connected
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Exchange Tab: Deposit USDC/XLM from CEX ── */

const EXCHANGES = [
  {
    id: "binance",
    name: "Binance",
    logo: "https://cryptologos.cc/logos/binance-coin-bnb-logo.svg",
  },
  { id: "coinbase", name: "Coinbase", logo: "https://cryptologos.cc/logos/usd-coin-usdc-logo.svg" },
  { id: "kraken", name: "Kraken", logo: "https://cryptologos.cc/logos/stellar-xlm-logo.svg" },
  { id: "other", name: "Other Exchange", logo: "" },
];

function ExchangeTab({ stellarAddress }: { stellarAddress: string | null }) {
  const [selectedExchange, setSelectedExchange] = useState<string | null>(null);
  const [selectedToken, setSelectedToken] = useState<"USDC" | "XLM">("USDC");
  const [copied, setCopied] = useState(false);

  const depositAddress = stellarAddress || "";

  const copyAddress = () => {
    if (!depositAddress) return;
    navigator.clipboard.writeText(depositAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-3 px-4 pb-4">
      {/* Token selector */}
      <div className="space-y-2">
        <span className="text-sm font-medium" style={{ color: "var(--muted-foreground)" }}>
          Token to receive
        </span>
        <div className="flex gap-2">
          {(["USDC", "XLM"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setSelectedToken(t)}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all"
              style={{
                background: selectedToken === t ? "var(--primary)" : "var(--secondary)",
                color:
                  selectedToken === t ? "var(--primary-foreground)" : "var(--muted-foreground)",
              }}
            >
              <TokenImage
                src={
                  t === "USDC"
                    ? "https://stellar.expert/explorer/public/asset/USDC-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN/icon"
                    : "https://stellar.expert/explorer/public/asset/native/icon"
                }
                alt={t}
                className="h-5 w-5 rounded-full"
              />
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Exchange picker */}
      <div className="space-y-2">
        <span className="text-sm font-medium" style={{ color: "var(--muted-foreground)" }}>
          Send from
        </span>
        <div className="grid grid-cols-2 gap-2">
          {EXCHANGES.map((ex) => (
            <button
              key={ex.id}
              type="button"
              onClick={() => setSelectedExchange(ex.id)}
              className="flex items-center gap-2 rounded-xl p-3 text-sm transition-all"
              style={{
                background: selectedExchange === ex.id ? "var(--accent)" : "var(--secondary)",
                color: selectedExchange === ex.id ? "var(--foreground)" : "var(--muted-foreground)",
              }}
            >
              {ex.logo && (
                <TokenImage src={ex.logo} alt={ex.name} className="h-5 w-5 rounded-full" />
              )}
              <Landmark className={`h-4 w-4 ${ex.logo ? "hidden" : ""}`} />
              {ex.name}
            </button>
          ))}
        </div>
      </div>

      {/* Deposit address */}
      {selectedExchange && (
        <div className="rounded-2xl p-4 space-y-3" style={{ background: "var(--secondary)" }}>
          <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
            Send {selectedToken} to this Stellar address
          </p>

          {depositAddress ? (
            <>
              <div
                className="flex items-center gap-2 rounded-xl p-3 cursor-pointer transition-colors hover:brightness-110"
                style={{ background: "var(--input)" }}
                onClick={copyAddress}
              >
                <code
                  className="flex-1 text-xs break-all font-mono"
                  style={{ color: "var(--foreground)" }}
                >
                  {depositAddress}
                </code>
                <span className="text-xs shrink-0 font-medium" style={{ color: "var(--primary)" }}>
                  {copied ? "Copied!" : "Copy"}
                </span>
              </div>

              {selectedToken === "USDC" && (
                <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                  Make sure to select <strong>Stellar (XLM)</strong> network when withdrawing from
                  the exchange. USDC on Stellar uses the Circle issuer.
                </p>
              )}

              <div
                className="flex items-start gap-2 rounded-xl px-3 py-2.5 text-xs"
                style={{ background: "rgba(59,130,246,0.1)", color: "#60A5FA" }}
              >
                <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>
                  Only send <strong>{selectedToken}</strong> on <strong>Stellar network</strong> to
                  this address. Sending other tokens or using wrong network will result in loss of
                  funds.
                </span>
              </div>
            </>
          ) : (
            <p className="text-sm text-center py-4" style={{ color: "var(--ring)" }}>
              Connect your Stellar wallet to get deposit address
            </p>
          )}
        </div>
      )}

      {!selectedExchange && (
        <p className="text-sm text-center py-6" style={{ color: "var(--ring)" }}>
          Select an exchange to see deposit instructions
        </p>
      )}
    </div>
  );
}
