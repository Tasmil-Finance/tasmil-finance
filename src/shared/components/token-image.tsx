"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

// Local token images in /public/token/
const TOKEN_IMAGES: Record<string, string> = {
  XLM:    "/token/xlm.png",
  USDC:   "/token/usdc.png",
  USDT:   "/token/usdt.png",
  BLND:   "/token/blnd.png",
  ETH:    "/token/eth.png",
  BTC:    "/token/btc.png",
  XRP:    "/token/xrp.png",
  AQUA:   "/token/aqua.png",
  EURC:   "/token/eurc.png",
  PYUSD:  "/token/pyusd.png",
  USDY:   "/token/usdy.png",
  SCOP:   "/token/scop.png",
  CETES:  "/token/cetes.png",
  YXLM:   "/token/yxlm.png",
  YUSDC:  "/token/yusdc.png",
  YETH:   "/token/yeth.png",
  YBTC:   "/token/ybtc.png",
  SOL:    "/token/solana.png",
  BNB:    "/token/bsc.png",
  AVAX:   "/token/avalanche.png",
  MATIC:  "/token/polygon.png",
  POL:    "/token/polygon.png",
  OP:     "/token/optimism.png",
  ARB:    "/token/arb.png",
  DAI:    "/token/dai.png",
  ICE:    "/token/ice.svg",
  WETH:   "/token/eth.png",
  WBTC:   "/token/btc.png",
  PHO:    "/token/plasma.svg",
  BLNDUSDCLP: "/token/blndusdclp.svg",
};

// Local chain logos in /public/chains/
const CHAIN_IMAGES: Record<string, string> = {
  STELLAR:   "/chains/stellar.png",
  ETHEREUM:  "/chains/ethereum.png",
  ETH:       "/chains/ethereum.png",
  ARBITRUM:  "/chains/arbitrum.png",
  ARB:       "/chains/arbitrum.png",
  BASE:      "/chains/base.png",
  POLYGON:   "/chains/polygon.png",
  SOLANA:    "/chains/solana.png",
  SOL:       "/chains/solana.png",
  BSC:       "/chains/bsc.png",
  "BNB CHAIN": "/chains/bsc.png",
  AVALANCHE: "/chains/avalanche.png",
  AVAX:      "/chains/avalanche.png",
  OPTIMISM:  "/chains/optimism.png",
};

// Deterministic color from string so the same token always gets the same color
const FALLBACK_COLORS = [
  "bg-blue-500/20 text-blue-400",
  "bg-emerald-500/20 text-emerald-400",
  "bg-violet-500/20 text-violet-400",
  "bg-amber-500/20 text-amber-400",
  "bg-rose-500/20 text-rose-400",
  "bg-cyan-500/20 text-cyan-400",
  "bg-pink-500/20 text-pink-400",
  "bg-indigo-500/20 text-indigo-400",
];

function colorFor(label: string): string {
  let hash = 0;
  for (let i = 0; i < label.length; i++) {
    hash = label.charCodeAt(i) + ((hash << 5) - hash);
  }
  return FALLBACK_COLORS[Math.abs(hash) % FALLBACK_COLORS.length] ?? "bg-blue-500/20 text-blue-400";
}

/** Resolve the local fallback image for a given alt label (token symbol or chain name). */
function localImageFor(alt: string): string | null {
  const key = alt?.toUpperCase() ?? "";
  return TOKEN_IMAGES[key] ?? CHAIN_IMAGES[key] ?? null;
}

interface TokenImageProps {
  src?: string | null;
  alt: string;
  className?: string;
}

/**
 * Drop-in replacement for <img> that shows a first-letter avatar when the
 * image is missing or fails to load.
 *
 * Resolution order:
 *   1. Explicit `src` prop (external URL or path)
 *   2. Local /public/token/ or /public/chains/ image matched by `alt`
 *   3. First-letter avatar with deterministic color
 *
 * If the external `src` fails to load, falls back to the local image (if any)
 * before showing the letter avatar — so bridge tokens always look correct
 * even when stellar.expert or other CDNs are unreachable.
 */
export function TokenImage({ src, alt, className }: TokenImageProps) {
  const [primaryFailed, setPrimaryFailed] = useState(false);

  const local = localImageFor(alt);

  // Primary: explicit src (unless it already failed)
  // Fallback: local file matched by alt label
  const activeSrc = (!primaryFailed && src) ? src : local;

  if (activeSrc) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={activeSrc}
        alt={alt}
        className={className}
        onError={() => {
          if (!primaryFailed && src) {
            // External src failed — switch to local fallback (re-render handled by state)
            setPrimaryFailed(true);
          }
          // If local fallback also fails (shouldn't happen for /public files), nothing to do
        }}
      />
    );
  }

  // No image available — show letter avatar
  const letter = (alt || "?").trim().charAt(0).toUpperCase();
  const color = colorFor(alt);
  const hasTextClass = !!className?.match(/\btext-/);

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full font-bold select-none leading-none",
        !hasTextClass && "text-xs",
        color,
        className
      )}
      aria-label={alt}
    >
      {letter}
    </span>
  );
}
