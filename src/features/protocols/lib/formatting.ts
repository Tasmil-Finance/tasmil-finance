/**
 * Unified formatting utilities for protocol cards.
 * Merges playground formatters (blend-cards.tsx, blend-tx-card.tsx)
 * with chat formatters (chat/actions/lib/formatting.ts).
 */

// ─── Known token symbols ────────────────────────────────────────

export const KNOWN_SYMBOLS: Record<string, string> = {
  // ── Mainnet ──────────────────────────────────────────────────
  CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA: "XLM",
  CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC: "XLM",
  CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75: "USDC",
  CCPRPXYHNKFMZFVNM5F3GYPAR6TFJWCGV6D72BM3MVCIRU7GOOS3FI52: "USDT",
  CD25MNVTZDL4Y3XBCPCJXGXATV5WUHHOWMYFF4YBEGU5FCPGMYTVG5JY: "BLND",
  CAUIKL3IYGMERDRUN6YSCLWVAKIFG5Q4YJHUKM4S4NJZQIA3BAS6OJPK: "AQUA",
  CDTKPWPLOURQA2SGTKTUQOWRCBZEORB4BWBOMJ3D3ZTQQSGE5F6JBQLV: "EURC",
  CAL6ER2TI6CTRAY6BFXWNWA7WTYXUXTQCHUBCIBU5O6KM3HJFG6Z6VXV: "CETES",
  CBLV4ATSIWU67CFSQU2NVRKINQIKUZ2ODSZBUJTJ43VJVRSBTZYOPNUR: "USTRY",
  CD6M4R2322BYCY2LNWM74PEBQAQ63SA3DUJLI3L4225U4ZVCLMSCBCIS: "TESOURO",
  CDIKURWHYS4FFTR5KOQK6MBFZA2K3E26WGBQI6PXBYWZ4XIOPJHDFJKP: "USDx",
  CBN3NCJSMOQTC6SPEYK3A44NU4VS3IPKTARJLI3Y77OH27EWBY36TP7U:  "EURx",
  CBCO65UOWXY2GR66GOCMCN6IU3Y45TXCPBY3FLUNL4AOUMOCKVIVV6JC: "GBPx",
  CBZPEXQLJCGUYTAQRQ4FGCXUV5O4TZER5WSOMCGNDNIIO4EJ4FU5GQNZ: "oUSD",
  CB226ZOEYXTBPD3QEGABTJYSKZVBP2PASEISLG3SBMTN5CE4QZUVZ3CE: "USDGLO",
  CCCRWH6Q3FNP3I2I57BDLM5AFAT7O6OF6GKQOC6SSJNDAVRZ57SPHGU2: "PYUSD",
  CBZ7M5B3Y4WWBZ5XK5UZCAFOEZ23KSSZXYECYX3IXM6E2JOLQC52DK32: "PHO",
  CAS3FL6TLZKDGGSISDBWGGPXT3NRR4DYTZD7YOD3HMYO6LTJUVGRVEAM: "BLNDUSDCLP",
  // ── Testnet ──────────────────────────────────────────────────
  CAQCFVLOBK5GIULPNZRGATJJMIZL5BSP7X5YJVMGCPTUEPFM4AVSRCJU: "USDC",
  CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA: "USDC",
  CAZRY5GSFBFXD7H6GAFBA5YGYQTDXU4QKWKMYFWBAZFUCURN3WKX6LF5: "USDC",
  CBL6KD2LFMLAUKFFWNNXWOXFN73GAXLEA4WMJRLQ5L76DMYTM3KWQVJN: "USDT",
  CB22KRA3YZVCNCQI64JQ5WE7UY2VAV7WFLK6A2JN3HEX56T2EDAFO7QF: "BLND",
  CAZAQB3D7KSLSNOSQKYD2V4JP5V2Y3B4RDJZRLBFCCIXDCTE3WHSY3UE: "WETH",
  CAP5AMC2OHNVREO66DFIN6DHJMPOBAJ2KCDDIMFBR7WWJH5RZBFM3UEI: "WBTC",
  CC72F57YTPX76HAA64JQOEGHQAPSADQWSY5DWVBR66JINPFDLNCQYHIC: "CETES",
  CDNVQW44C3HALYNVQ4SOBXY5EWYTGVYXX6JPESOLQDABJI5FC5LTRRUE: "AQUA",
  CA5UTUUPHYL5K22UBRUVC37EARZUGYOSGK3IKIXG2JLCC5ZZLI4BDWDM: "BLNDUSDCLP",
};

export function resolveSymbol(contract: string): string {
  return KNOWN_SYMBOLS[contract] ?? (contract.length > 10 ? `${contract.slice(0, 6)}...` : contract);
}

// ─── Number formatting ──────────────────────────────────────────

/** Format a number with K/M/B/T abbreviations. Handles null/NaN gracefully. */
export function fmt(v: unknown, d = 2): string {
  const n = Number(v);
  if (!Number.isFinite(n)) return "\u2014";
  if (Math.abs(n) >= 1e12) return `${(n / 1e12).toFixed(2)}T`;
  if (Math.abs(n) >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (Math.abs(n) >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (Math.abs(n) >= 1e3) return `${(n / 1e3).toFixed(2)}K`;
  return n.toFixed(d);
}


/** Truncate a long string (address) to first+last chars. */
export function trunc(s: string, head = 6, tail = 4): string {
  if (s.length <= head + tail + 1) return s;
  return `${s.slice(0, head)}\u2026${s.slice(-tail)}`;
}

/** Format stroops (raw integer) to human-readable token amount. */
export function fmtAmount(stroops: string | number, decimals = 7): string {
  const n = Number(stroops) / 10 ** decimals;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(2)}K`;
  return n.toFixed(decimals > 4 ? 4 : decimals);
}

/** Format gas/fee in XLM. */
export function fmtGas(stroops: string | number): string {
  return `${(Number(stroops) / 1e7).toFixed(7)} XLM`;
}

/** Format large numbers with K/M/B/T (same as fmt but accepts null/undefined/string). */
export function formatNumber(num: number | string | undefined | null): string {
  if (num === undefined || num === null) return "N/A";
  const n = typeof num === "string" ? Number.parseFloat(num) : num;
  if (Number.isNaN(n)) return "N/A";
  return fmt(n);
}

/** Format price with dynamic decimal precision. */
export function formatPrice(price: number | string | undefined | null): string {
  if (price === undefined || price === null) return "N/A";
  const n = typeof price === "string" ? Number.parseFloat(price) : price;
  if (Number.isNaN(n)) return "N/A";
  if (n < 0.01) return n.toFixed(6);
  if (n < 1) return n.toFixed(4);
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Format percentage value. */
export function formatPercent(value: number | string | undefined | null, decimals = 2): string {
  if (value === undefined || value === null) return "\u2014";
  const n = typeof value === "string" ? Number.parseFloat(value) : value;
  if (!Number.isFinite(n)) return "\u2014";
  return `${(n * 100).toFixed(decimals)}%`;
}

/** Format raw token amount (BigInt string) to human-readable. */
export function formatTokenAmount(
  amount: string | number | undefined | null,
  decimals: number,
  maxFraction = 4,
): string {
  if (amount === undefined || amount === null || amount === "") return "N/A";
  try {
    const raw = BigInt(String(amount));
    const divisor = BigInt(10 ** decimals);
    const whole = raw / divisor;
    const fraction = (raw < 0n ? -raw : raw) % divisor;
    const fractionStr = fraction.toString().padStart(decimals, "0").slice(0, maxFraction);
    const num = Number.parseFloat(`${whole}.${fractionStr}`);
    if (num === 0) return "0";
    if (Math.abs(num) < 0.0001) return num < 0 ? ">-0.0001" : "<0.0001";
    return num.toLocaleString(undefined, { maximumFractionDigits: maxFraction });
  } catch {
    return String(amount);
  }
}
