"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { TOKEN_ICONS, PROTOCOL_ICONS } from "@/shared/constants/asset-manifest";

// CDN host that powers the optimized pipeline (must match next.config.ts).
const CDN_HOST = "tasmil-assets.sgp1.cdn.digitaloceanspaces.com";

// Local chain logos in /public/chains/ — kept here because chain artwork is
// not part of the token manifest yet.
const CHAIN_IMAGES: Record<string, string> = {
  STELLAR: "/chains/stellar.png",
  ETHEREUM: "/chains/ethereum.png",
  ETH: "/chains/ethereum.png",
  ARBITRUM: "/chains/arbitrum.png",
  ARB: "/chains/arbitrum.png",
  BASE: "/chains/base.png",
  POLYGON: "/chains/polygon.png",
  SOLANA: "/chains/solana.png",
  SOL: "/chains/solana.png",
  BSC: "/chains/bsc.png",
  "BNB CHAIN": "/chains/bsc.png",
  AVALANCHE: "/chains/avalanche.png",
  AVAX: "/chains/avalanche.png",
  OPTIMISM: "/chains/optimism.png",
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

/** Resolve the manifest CDN URL or local fallback for the given alt label. */
function localImageFor(alt: string): string | null {
  const upperKey = alt?.toUpperCase() ?? "";
  const lowerKey = alt?.toLowerCase() ?? "";
  return TOKEN_ICONS[upperKey] ?? CHAIN_IMAGES[upperKey] ?? PROTOCOL_ICONS[lowerKey] ?? null;
}

/** Whether the given URL points at an absolute remote host (vs. a /public path). */
function isAbsoluteUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

/** Whether the given URL is whitelisted in next.config.ts images.remotePatterns. */
function isWhitelistedHost(value: string): boolean {
  if (!isAbsoluteUrl(value)) return true; // /public paths always allowed
  try {
    const url = new URL(value);
    return url.hostname === CDN_HOST;
  } catch {
    return false;
  }
}

interface TokenImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
}

/**
 * Drop-in replacement for <img> that shows a first-letter avatar when the
 * image is missing or fails to load.
 *
 * Resolution order:
 *   1. Explicit `src` prop (external URL or path)
 *   2. Manifest CDN URL or local /public image matched by `alt`
 *   3. First-letter avatar with deterministic color
 *
 * If the external `src` fails to load, falls back to the local image (if any)
 * before showing the letter avatar — so bridge tokens always look correct
 * even when stellar.expert or other CDNs are unreachable.
 *
 * Wraps the Next.js `<Image>` component so the optimizer pipeline
 * (`/_next/image`) fires for whitelisted hosts; the Service Worker layer can
 * intercept those optimizer requests for cache-first delivery. Non-whitelisted
 * external hosts are passed through with `unoptimized` to avoid runtime errors.
 */
export function TokenImage({ src, alt, className, width = 40, height = 40 }: TokenImageProps) {
  const [primaryFailed, setPrimaryFailed] = useState(false);

  const local = localImageFor(alt);

  // Primary: explicit src (unless it already failed)
  // Fallback: manifest/local file matched by alt label
  const activeSrc = !primaryFailed && src ? src : local;

  if (activeSrc) {
    const unoptimized = isAbsoluteUrl(activeSrc) && !isWhitelistedHost(activeSrc);
    return (
      <Image
        src={activeSrc}
        alt={alt}
        width={width}
        height={height}
        className={className}
        unoptimized={unoptimized}
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
      role="img"
      aria-label={alt}
      className={cn(
        "inline-flex select-none items-center justify-center rounded-full font-bold leading-none",
        !hasTextClass && "text-xs",
        color,
        className
      )}
    >
      {letter}
    </span>
  );
}
