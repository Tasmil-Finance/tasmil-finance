"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

// Local token images in /public/token/
const TOKEN_IMAGES: Record<string, string> = {
  XLM:        "/token/xlm.png",
  USDC:       "/token/usdc.png",
  USDT:       "/token/usdt.png",
  BLND:       "/token/blnd.png",
  ETH:        "/token/eth.png",
  BTC:        "/token/btc.png",
  XRP:        "/token/xrp.png",
  AQUA:       "/token/aqua.png",
  EURC:       "/token/eurc.png",
  EURX:       "/token/eurx.png",
  GBPX:       "/token/gbpx.png",
  PYUSD:      "/token/pyusd.png",
  USDY:       "/token/usdy.png",
  USDGLO:     "/token/usdglo.png",
  USDX:       "/token/usdx.png",
  SCOP:       "/token/scop.png",
  CETES:      "/token/cetes.png",
  USTRY:      "/token/ustry.png",
  TESOURO:    "/token/tesouro.png",
  OUSD:       "/token/ousd.png",
  YXLM:       "/token/yxlm.png",
  YUSDC:      "/token/yusdc.png",
  YETH:       "/token/yeth.png",
  YBTC:       "/token/ybtc.png",
  XAU:        "/token/xau.png",
  XPD:        "/token/xpd.png",
  SOL:        "/token/solana.png",
  BNB:        "/token/bsc.png",
  AVAX:       "/token/avalanche.png",
  MATIC:      "/token/polygon.png",
  POL:        "/token/polygon.png",
  OP:         "/token/optimism.png",
  ARB:        "/token/arb.png",
  DAI:        "/token/dai.png",
  ICE:        "/token/ice.svg",
  WETH:       "/token/eth.png",
  WBTC:       "/token/btc.png",
  PHO:        "/token/plasma.svg",
  BLNDUSDCLP: "/token/blndusdclp.svg",
  // Aquarius pooled tokens
  ADA:         "/token/ada.jpg",
  NEWGOLDQFS:  "/token/newgoldqfs.png",
  PSY:         "/token/psy.jpg",
  SHARKY:      "/token/sharky.jpg",
  SILICA:      "/token/silica.png",
  QFSXRP:      "/token/qfsxrp.png",
  FADA:        "/token/fada.png",
  SECUREX:     "/token/securex.png",
  XCRYPTO:     "/token/xcrypto.jpg",
  FBIXRP:      "/token/fbixrp.png",
  XPEV:        "/token/xpev.png",
  KRWC:        "/token/krwc.png",
  RLUSD:       "/token/rlusd.png",
  YVELO:       "/token/yvelo.png",
  DOGE8:       "/token/doge8.png",
  TASE:        "/token/tase.png",
  CODY:        "/token/cody.png",
  ASXBONUS:    "/token/asxbonus.png",
  LSE:         "/token/lse.png",
  FREEDOMCARD: "/token/freedomcard.png",
  FEDAX:       "/token/fedax.png",
  PHOB:        "/token/phob.png",
  PALL:        "/token/pall.png",
  NAFU:        "/token/nafu.png",
  ZOMB:        "/token/zomb.png",
  ACT:         "/token/act.png",
  XSOLVBTC:    "/token/xsolvbtc.png",
  GIFT:        "/token/gift.jpg",
  VANGUARD:    "/token/vanguard.png",
  FBIREV:      "/token/fbirev.png",
  SUI:         "/token/sui.png",
  SOC:         "/token/soc.png",
  BEURC:       "/token/beurc.png",
  THEWHITEHATS: "/token/thewhitehats.jpg",
  KALE:        "/token/kale.png",
  SAVE:        "/token/save.png",
  FEDID:       "/token/fedid.png",
  RBB:         "/token/rbb.png",
  ZYIELD:      "/token/zyield.png",
  APUSDC:      "/token/apusdc.png",
  EZPZ:        "/token/ezpz.jpg",
  POM:         "/token/pom.png",
  FEDNET:      "/token/fednet.png",
  RGN:         "/token/rgn.png",
  SSLX:        "/token/sslx.png",
  SWANKYC:     "/token/swankyc.jpg",
  SOLVBTC:     "/token/solvbtc.png",
  RIPPLEW:     "/token/ripplew.png",
  RUXLM:       "/token/ruxlm.png",
  BWFF:        "/token/bwff.png",
  CENTRALBANK: "/token/centralbank.png",
  XRF:         "/token/xrf.svg",
  BLUB:        "/token/blub.png",
  ABUSDC:      "/token/abusdc.png",
  SLVR:        "/token/slvr.png",
  XRPNATIVE:   "/token/xrpnative.png",
  TSLA:        "/token/tsla.png",
  HG:          "/token/hg.jpg",
  HITZ:        "/token/hitz.png",
  TCOM:        "/token/tcom.png",
  GOVLINK:     "/token/govlink.png",
  AUD:         "/token/aud.png",
  XAG:         "/token/xag.jpg",
  DATAVAULT:   "/token/datavault.png",
  BUSDC:       "/token/busdc.png",
  LSP:         "/token/lsp.png",
  LMNR:        "/token/lmnr.jpg",
  QFSBANK:     "/token/qfsbank.png",
  NGNC:        "/token/ngnc.png",
  GOOGL:       "/token/googl.png",
  LIQUIDPOETRY: "/token/liquidpoetry.png",
  KOL:         "/token/kol.jpg",
  SWS:         "/token/sws.png",
  KPOP:        "/token/kpop.jpg",
  XPR:         "/token/xpr.svg",
  JOHN:        "/token/john.jpg",
  TRUMPSOL:    "/token/trumpsol.png",
  GEMINI:      "/token/gemini.png",
  GOLD:        "/token/gold.png",
  BVNG:        "/token/bvng.png",
  SHT:         "/token/sht.png",
  GBPC:        "/token/gbpc.png",
  AQUAM25:     "/token/aquam25.png",
  THEFED:      "/token/thefed.png",
  SHX:         "/token/shx.png",
  FIASX:       "/token/fiasx.png",
  WHIPGOLD:    "/token/whipgold.png",
  LUSI:        "/token/lusi.png",
  XLMFISH:     "/token/xlmfish.png",
  COPR:        "/token/copr.png",
  XMONEY:      "/token/xmoney.png",
  ZCLOSE:      "/token/zclose.png",
  SBB:         "/token/sbb.jpg",
  TKG:         "/token/tkg.png",
  ANTIFRAUD:   "/token/antifraud.png",
  QFSXLM:      "/token/qfsxlm.jpg",
  JFKPROTOCOL: "/token/jfkprotocol.png",
  TON:         "/token/ton.jpg",
  ESP:         "/token/esp.jpg",
  AQUAMB:      "/token/aquamb.png",
  NJC:         "/token/njc.png",
  ZINC:        "/token/zinc.png",
  DAWG:        "/token/dawg.png",
  MEGASTOCK:   "/token/megastock.png",
  LMX:         "/token/lmx.png",
  ZUSD:        "/token/zusd.png",
  CASEHASH:    "/token/casehash.png",
  XTAR:        "/token/xtar.png",
  STROOPY:     "/token/stroopy.png",
  PIZZA:       "/token/pizza.png",
  XCR:         "/token/xcr.png",
  USDM:        "/token/usdm.png",
  TME:         "/token/tme.png",
  RAYO:        "/token/rayo.png",
  LUMOS:       "/token/lumos.png",
  GOOGLEBONUS: "/token/googlebonus.png",
  SEVERUS:     "/token/severus.jpg",
  DIGITALRUBLE: "/token/digitalruble.png",
  ZLM:         "/token/zlm.png",
  WHIPXRP:     "/token/whipxrp.png",
  EURMTL:      "/token/eurmtl.png",
  LBTC:        "/token/lbtc.png",
  USABANK:     "/token/usabank.png",
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
