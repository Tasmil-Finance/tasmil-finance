"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  ArrowUpDown,
  ArrowLeftRight,
  Landmark,
  Wallet,
  Unplug,
  Clock,
  Info,
  X,
} from "lucide-react";
import { motion, useCycle, AnimatePresence } from "framer-motion";
import { useAccount, useDisconnect } from "wagmi";
import { useAppKit, useAppKitNetwork } from "@reown/appkit/react";
import { solana, solanaTestnet } from "@reown/appkit/networks";
import { useWallet } from "@/shared/context/wallet-context";
import { useAggregator } from "@/features/bridge/hooks/use-aggregator";
import { AggregatorTokenPicker } from "@/features/bridge/components/chain-token-selector";
import { AggregatorRoutePanel, SlippageSettings } from "@/features/bridge/components/aggregator-routes";
import { AddressPicker } from "@/features/bridge/components/address-picker";
import { useAddressStore } from "@/features/bridge/stores/use-address-store";
import { BackgroundRippleEffect } from "@/shared/ui/background-ripple-effect";
import BorderGlow from "@/shared/ui/border-glow";

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
  "ethereum", "arbitrum", "base", "polygon", "optimism", "bsc", "avalanche",
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


const isTestnet = process.env.NEXT_PUBLIC_STELLAR_TESTNET === "true";

export function BridgePage() {
  const { connect: connectStellar, disconnect: disconnectStellar, address: stellarAddress } = useWallet();
  const agg = useAggregator();
  const addrStore = useAddressStore();

  // EVM wallet via wagmi + Reown
  const { address: evmAddressRaw, isConnected: isEvmConnected } = useAccount();
  const { disconnectAsync } = useDisconnect();
  const { open: openReownModal } = useAppKit();
  const { switchNetwork } = useAppKitNetwork();
  const evmAddress = isEvmConnected && evmAddressRaw ? evmAddressRaw : null;

  const connectEvm = useCallback(async () => {
    if (agg.chainIn === "solana") {
      await switchNetwork(isTestnet ? solanaTestnet : solana);
    }
    openReownModal({ view: "Connect" });
  }, [agg.chainIn, switchNetwork, openReownModal]);

  const disconnectEvm = useCallback(async () => {
    await disconnectAsync();
  }, [disconnectAsync]);
  const [swapAnim, cycleSwap] = useCycle({ rotateX: 0 }, { rotateX: 180 });
  const activeTab = "bridge" as const;
  const [selectedProtocol, setSelectedProtocol] = useState<string | null>(null);
  const hasUserInteracted = useRef(false);

  // Sync connected wallets into address store
  useEffect(() => {
    addrStore.syncConnectedWallet("stellar", stellarAddress, "Stellar Wallet");
    addrStore.syncConnectedWallet("evm", evmAddress, "EVM Wallet");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stellarAddress, evmAddress]);

  const chainTypeIn = agg.chainIn === "stellar" ? "stellar" as const : agg.chainIn === "solana" ? "solana" as const : "evm" as const;
  const chainTypeOut = agg.chainOut === "stellar" ? "stellar" as const : agg.chainOut === "solana" ? "solana" as const : "evm" as const;

  // Source address — from store selection or auto from connected wallet
  const sourceAddress = addrStore.selectedSource || (
    chainTypeIn === "stellar" ? stellarAddress :
    chainTypeIn === "evm" ? evmAddress : null
  ) || "";

  const isSourceStellar = agg.chainIn === "stellar";
  const isSourceEvm = EVM_CHAINS.has(agg.chainIn);
  const srcConnected = !!sourceAddress;

  const needsWallet = !srcConnected && (isSourceStellar || isSourceEvm);
  const aggHasBothTokens = !!agg.tokenIn && !!agg.tokenOut;
  const aggHasAmount = !!agg.amount && Number.parseFloat(agg.amount) > 0;
  const showRoutePanel = aggHasBothTokens && aggHasAmount;

  // Reset selected protocol when tokens change
  useEffect(() => {
    setSelectedProtocol(null);
  }, [agg.tokenIn, agg.tokenOut]);

  // Selected route quote — either user-selected or best
  const selectedQuote = agg.quotes.find(
    (q) => (q.protocol || q.provider) === selectedProtocol && q.status === "ok"
  ) || agg.bestQuote;

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
      if (t) { agg.setTokenIn(t, urlChainIn); hasUserInteracted.current = true; }
    }
    if (urlTokenOut) {
      const t = agg.tokens.find((tk) => tk.symbol.toUpperCase() === urlTokenOut.toUpperCase());
      if (t) { agg.setTokenOut(t, urlChainOut); hasUserInteracted.current = true; }
    }
    if (urlAmount) { agg.setAmount(urlAmount); hasUserInteracted.current = true; }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agg.tokens.length]);

  // Sync state → URL only after user has interacted (prevents default tokens polluting URL)
  useEffect(() => {
    if (!hasUserInteracted.current) return;
    if (!agg.tokenIn && !agg.tokenOut) return;
    const params = new URLSearchParams();
    if (agg.tokenIn) { params.set("tokenIn", agg.tokenIn.symbol); params.set("chainIn", agg.chainIn); }
    if (agg.tokenOut) { params.set("tokenOut", agg.tokenOut.symbol); params.set("chainOut", agg.chainOut); }
    if (agg.amount) params.set("amount", agg.amount);
    const url = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, "", url);
  }, [agg.tokenIn, agg.tokenOut, agg.chainIn, agg.chainOut, agg.amount]);

  // Tokens available for pickers — use filtered if available, else all
  const tokensForOut = agg.filteredTokensOut.length > 0 ? agg.filteredTokensOut : agg.tokens;
  const chainsForOut = agg.filteredChainsOut.length > 0 ? agg.filteredChainsOut : agg.chains.map((c) => c.id);
  const tokensForIn = agg.filteredTokensIn.length > 0 ? agg.filteredTokensIn : agg.tokens;
  const chainsForIn = agg.filteredChainsIn.length > 0 ? agg.filteredChainsIn : agg.chains.map((c) => c.id);

  return (
    <div className="relative flex items-center justify-center min-h-screen w-full overflow-hidden">
      <BackgroundRippleEffect rows={10} cols={22} cellSize={72} />

      <div className="relative z-20 flex items-stretch gap-3">
        {/* Left tabs — commented out, swap-only mode */}
        {/* <motion.div
          className="hidden sm:flex flex-col self-center mr-[-13px] z-10 overflow-hidden rounded-l-2xl"
          style={{ background: C.widgetBg, borderTop: `1px solid rgba(255,255,255,0.08)`, borderLeft: `1px solid rgba(255,255,255,0.08)`, borderBottom: `1px solid rgba(255,255,255,0.08)` }}
          initial={{ width: 52 }}
          animate={{ width: tabHovered ? 170 : 52 }}
          transition={{ duration: 0.5, type: "spring", bounce: 0.15 }}
          onMouseEnter={() => setTabHovered(true)}
          onMouseLeave={() => setTabHovered(false)}
        >
          <div className="flex flex-col gap-1 p-1.5">
            {[
              { id: "bridge" as const, icon: ArrowLeftRight, label: "Bridge" },
              { id: "exchange" as const, icon: Landmark, label: "Exchange" },
            ].map(({ id, icon: Icon, label }) => (
              <button
                key={id} type="button" onClick={() => setActiveTab(id)}
                className="flex items-center gap-2 rounded-xl p-2.5 transition-colors"
                style={{
                  background: activeTab === id ? C.sectionBg : "transparent",
                  color: activeTab === id ? C.mainText : C.mutedText,
                }}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="text-sm whitespace-nowrap overflow-hidden">{label}</span>
              </button>
            ))}
          </div>
        </motion.div> */}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* Main card */}
        {/* ══════════════════════════════════════════════════════════ */}
        <BorderGlow
          className="w-full sm:w-[480px] max-w-[480px]"
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
                <span
                  className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg"
                  style={{
                    background: agg.mode === "swap"
                      ? "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))"
                      : "linear-gradient(135deg, rgba(59,130,246,0.2), rgba(16,185,129,0.2))",
                    color: agg.mode === "swap" ? "#818CF8" : "#34D399",
                    border: `1px solid ${agg.mode === "swap" ? "rgba(99,102,241,0.3)" : "rgba(16,185,129,0.3)"}`,
                  }}
                >
                  <ArrowLeftRight className="h-3 w-3" />
                  {agg.mode === "swap" ? "Swap" : "Bridge"}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <WalletHub
                stellarAddress={stellarAddress}
                evmAddress={evmAddress}
                onConnectStellar={() => connectStellar?.()}
                onConnectEvm={connectEvm}
                onDisconnectStellar={disconnectStellar}
                onDisconnectEvm={disconnectEvm}
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
                    <label className="col-span-5 text-base font-normal leading-5" style={{ color: C.mutedText }}>
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
                        onConnectWallet={isSourceStellar ? () => connectStellar?.() : connectEvm}
                        onDisconnectStellar={disconnectStellar}
                        onDisconnectEvm={disconnectEvm}
                      />
                    </div>
                  </div>
                  <div className="mt-[10px] grid grid-cols-[1fr_auto] gap-1 w-full">
                    <div className="min-w-0 overflow-hidden">
                      <input
                        type="text" inputMode="decimal" autoComplete="off" placeholder="0"
                        value={agg.amount}
                        onChange={(e) => { if (/^[0-9]*[.,]?[0-9]*$/.test(e.target.value)) { hasUserInteracted.current = true; agg.setAmount(e.target.value); } }}
                        className="w-full bg-transparent text-[28px] leading-[34px] font-normal focus:outline-none truncate"
                        style={{ color: C.mainText }}
                      />
                      <div className="flex items-center gap-1 mt-0.5 h-5">
                        <span className="text-sm font-medium leading-5" style={{ color: C.mutedText }}>$0</span>
                      </div>
                    </div>
                    <div className="justify-self-end self-start">
                      <AggregatorTokenPicker
                        selectedToken={agg.tokenIn}
                        selectedChain={agg.chainIn}
                        tokens={tokensForIn}
                        chains={chainsForIn}
                        allChains={agg.chains}
                        onSelect={(token, chain) => { hasUserInteracted.current = true; agg.setTokenIn(token, chain); }}
                      />
                    </div>
                  </div>
                </div>

                {/* ── SWAP ── */}
                <div className="flex justify-center -my-2 relative z-10">
                  <button
                    type="button"
                    onClick={() => { hasUserInteracted.current = true; agg.swapDirection(); cycleSwap(); }}
                    className="rounded-lg h-9 w-9 flex items-center justify-center transition-colors hover:brightness-125"
                    style={{ background: C.interactive }}
                  >
                    <motion.div animate={swapAnim} transition={{ duration: 0.3 }} className="flex items-center justify-center">
                      <ArrowUpDown className="h-5 w-5" style={{ color: C.mutedText }} />
                    </motion.div>
                  </button>
                </div>

                {/* ── TOKEN OUT ── */}
                <div className="rounded-2xl p-4 pb-[15px]" style={{ background: C.sectionBg }}>
                  <div className="grid grid-cols-9 gap-2 items-center h-7">
                    <label className="col-span-5 text-base font-normal leading-5" style={{ color: C.mutedText }}>
                      You receive
                    </label>
                    <div className="col-span-4 justify-self-end">
                      <AddressPicker
                        direction="dest"
                        chainType={chainTypeOut}
                        selectedAddress={
                          // Only show dest address if it matches the dest chain type
                          chainTypeOut === "stellar" && agg.destAddress?.startsWith("G") ? agg.destAddress :
                          chainTypeOut === "evm" && agg.destAddress?.startsWith("0x") ? agg.destAddress :
                          chainTypeOut === "solana" && agg.destAddress && !agg.destAddress.startsWith("G") && !agg.destAddress.startsWith("0x") ? agg.destAddress :
                          null
                        }
                        onSelect={(addr) => { addrStore.setSelectedDest(addr); agg.setDestAddress(addr); }}
                        stellarAddress={stellarAddress}
                        evmAddress={evmAddress}
                        onConnectWallet={chainTypeOut === "stellar" ? () => connectStellar?.() : connectEvm}
                        onDisconnectStellar={disconnectStellar}
                        onDisconnectEvm={disconnectEvm}
                      />
                    </div>
                  </div>
                  <div className="mt-[27px] grid grid-cols-[1fr_auto] gap-1 w-full">
                    <div className="min-w-0 overflow-hidden">
                      {agg.isLoadingQuotes ? (
                        <div className="space-y-2 pt-1">
                          <div className="h-[34px] w-32 rounded-lg animate-pulse" style={{ background: C.interactive, opacity: 0.4 }} />
                          <div className="h-5 w-16 rounded animate-pulse" style={{ background: C.interactive, opacity: 0.4 }} />
                        </div>
                      ) : (
                        <>
                          <p className="text-[28px] leading-[34px] font-normal truncate" style={{ color: C.mainText }}>
                            {selectedQuote?.status === "ok"
                              ? formatAmount(selectedQuote.amountOut, agg.tokenOut?.decimals ?? 7)
                              : "0"}
                          </p>
                          <span className="text-sm font-medium leading-5 mt-0.5 block h-5" style={{ color: C.mutedText }}>$0</span>
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
                        onSelect={(token, chain) => { hasUserInteracted.current = true; agg.setTokenOut(token, chain); }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Best quote summary (above CTA, like reference image) ── */}
              {selectedQuote?.status === "ok" && !agg.isLoadingQuotes && (
                <div className="rounded-2xl px-3.5 py-3 text-sm mt-3" style={{ background: C.sectionBg }}>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5" style={{ color: C.dimText }}>
                      <Info className="h-3.5 w-3.5" /> Fee
                    </span>
                    <span style={{ color: C.mutedText }}>{selectedQuote.fee} ({selectedQuote.feePercent})</span>
                  </div>
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
                <div className="rounded-2xl p-4 mt-3 space-y-3" style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}>
                  <p className="text-sm font-semibold flex items-center gap-1.5" style={{ color: "var(--foreground)" }}>
                    <Info className="h-4 w-4" style={{ color: "var(--primary)" }} />
                    Trustline{agg.missingTrustlines.length > 1 ? "s" : ""} missing
                  </p>
                  {agg.missingTrustlines.map((sym) => {
                    const isSigning = agg.signingTrustline === sym;
                    return (
                      <div key={sym} className="flex items-center gap-3 rounded-xl p-3" style={{ background: "var(--input)" }}>
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{sym}</span>
                          <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                            {isSigning ? "Waiting for wallet signature..." : "Trustline required to receive"}
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
                              <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                              Signing
                            </span>
                          ) : "Add +"}
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
                    onClick={isSourceStellar ? () => connectStellar?.() : connectEvm}
                    className="w-full rounded-2xl font-bold py-4 text-base transition-all flex items-center justify-center gap-2 active:scale-[0.98] hover:scale-[1.02] relative overflow-hidden bg-gradient-to-b from-[#B5EAFF] to-[#00BFFF] text-black"
                  >
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 h-4 w-[50%] rounded-full bg-white/80 blur-xl" />
                    <Wallet className="h-5 w-5" strokeWidth={2} />
                    <span>Connect a wallet</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={!aggHasAmount || !aggHasBothTokens || !selectedProtocol || agg.isExecuting || agg.needsTrustline}
                    onClick={() => selectedProtocol && agg.executeSwap(selectedProtocol)}
                    className={`w-full rounded-2xl font-bold py-3.5 text-[15px] transition-all flex items-center justify-center gap-2 active:scale-[0.98] relative overflow-hidden ${
                      aggHasAmount && selectedProtocol && !agg.isExecuting && !agg.needsTrustline
                        ? "bg-gradient-to-b from-[#B5EAFF] to-[#00BFFF] text-black hover:scale-[1.02] hover:from-[#C5F0FF] hover:to-[#1CCFFF] cursor-pointer"
                        : "cursor-not-allowed opacity-50"
                    }`}
                    style={!(aggHasAmount && selectedProtocol && !agg.needsTrustline) ? { background: C.interactive, color: C.dimText } : undefined}
                  >
                    {(aggHasAmount && selectedProtocol && !agg.isExecuting && !agg.needsTrustline) && (
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 h-4 w-[50%] rounded-full bg-white/80 blur-xl" />
                    )}
                    {agg.isExecuting ? "Signing..." : agg.needsTrustline ? "Add trustline first" : !aggHasAmount ? "Enter amount" : !aggHasBothTokens ? "Select tokens" : !selectedProtocol ? "Select a route" : "Swap"}
                  </button>
                )}

                {/* Success: show tx link */}
                {agg.executeSuccess && (
                  <div className="flex items-center justify-between rounded-xl px-4 py-3 text-sm" style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)" }}>
                    <span style={{ color: "#34D399" }}>Swap successful!</span>
                    <a
                      href={`https://stellar.expert/explorer/${agg.chainIn === "stellar" ? (process.env["NEXT_PUBLIC_STELLAR_NETWORK"] === "PUBLIC" ? "public" : "testnet") : "public"}/tx/${agg.executeSuccess}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium underline"
                      style={{ color: "var(--primary)" }}
                    >
                      View transaction
                    </a>
                  </div>
                )}
                {/* Error */}
                {agg.executeError && (
                  <div className="flex items-start gap-2 rounded-xl px-4 py-3 text-sm" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#F87171" }}>
                    <span>{agg.executeError}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* ── EXCHANGE TAB (Deposit from CEX) ── */
            <ExchangeTab stellarAddress={stellarAddress} />
          )}
        </BorderGlow>

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
              style={{ overflow: "hidden" }}
            >
              <AggregatorRoutePanel
                quotes={agg.quotes}
                bestQuote={agg.bestQuote}
                isLoading={agg.isLoadingQuotes}
                tokenOutSymbol={agg.tokenOut?.symbol ?? ""}
                decimals={agg.tokenOut?.decimals ?? 7}
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
  stellarAddress, evmAddress,
  onConnectStellar, onConnectEvm,
  onDisconnectStellar, onDisconnectEvm,
}: {
  stellarAddress: string | null;
  evmAddress: string | null;
  onConnectStellar: () => void;
  onConnectEvm: () => void;
  onDisconnectStellar: () => void;
  onDisconnectEvm: () => void;
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
    stellarAddress ? { chain: "Stellar", addr: stellarAddress, logo: "/chains/stellar.png", onDisconnect: onDisconnectStellar } : null,
    evmAddress ? { chain: "EVM", addr: evmAddress, logo: "/chains/ethereum.png", onDisconnect: onDisconnectEvm } : null,
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
            <img key={w.chain} src={w.logo} alt={w.chain} className="h-7 w-7 rounded-full object-contain ring-2 ring-[var(--card)]" />
          ))
        ) : (
          <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg" style={{ background: "var(--secondary)", color: "var(--muted-foreground)" }}>
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
              <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Connected wallets</p>
              <button type="button" onClick={() => setOpen(false)}>
                <X className="h-4 w-4" style={{ color: "var(--muted-foreground)" }} />
              </button>
            </div>

            {/* Connect new wallet */}
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => { setOpen(false); setTimeout(onConnectStellar, 200); }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium rounded-xl transition-colors"
                style={{ background: "var(--secondary)", color: "var(--muted-foreground)" }}
              >
                <img src="/chains/stellar.png" alt="" className="h-4 w-4 rounded-full" />
                {stellarAddress ? "Switch Stellar" : "+ Stellar"}
              </button>
              <button
                type="button"
                onClick={() => { setOpen(false); setTimeout(onConnectEvm, 200); }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium rounded-xl transition-colors"
                style={{ background: "var(--secondary)", color: "var(--muted-foreground)" }}
              >
                <img src="/chains/ethereum.png" alt="" className="h-4 w-4 rounded-full" />
                {evmAddress ? "Switch EVM" : "+ EVM"}
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
                  <img src={w.logo} alt="" className="h-9 w-9 rounded-full object-contain shrink-0" />
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>
                      {truncAddr(w.addr)}
                    </span>
                    <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                      {w.chain}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => { w.onDisconnect(); setOpen(false); }}
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
  { id: "binance", name: "Binance", logo: "https://cryptologos.cc/logos/binance-coin-bnb-logo.svg" },
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
        <span className="text-sm font-medium" style={{ color: "var(--muted-foreground)" }}>Token to receive</span>
        <div className="flex gap-2">
          {(["USDC", "XLM"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setSelectedToken(t)}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all"
              style={{
                background: selectedToken === t ? "var(--primary)" : "var(--secondary)",
                color: selectedToken === t ? "var(--primary-foreground)" : "var(--muted-foreground)",
              }}
            >
              <img
                src={t === "USDC"
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
        <span className="text-sm font-medium" style={{ color: "var(--muted-foreground)" }}>Send from</span>
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
              {ex.logo && <img src={ex.logo} alt="" className="h-5 w-5 rounded-full" />}
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
                <code className="flex-1 text-xs break-all font-mono" style={{ color: "var(--foreground)" }}>
                  {depositAddress}
                </code>
                <span className="text-xs shrink-0 font-medium" style={{ color: "var(--primary)" }}>
                  {copied ? "Copied!" : "Copy"}
                </span>
              </div>

              {selectedToken === "USDC" && (
                <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                  Make sure to select <strong>Stellar (XLM)</strong> network when withdrawing from the exchange. USDC on Stellar uses the Circle issuer.
                </p>
              )}

              <div className="flex items-start gap-2 rounded-xl px-3 py-2.5 text-xs" style={{ background: "rgba(59,130,246,0.1)", color: "#60A5FA" }}>
                <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>
                  Only send <strong>{selectedToken}</strong> on <strong>Stellar network</strong> to this address. Sending other tokens or using wrong network will result in loss of funds.
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
