/**
 * Stellar-specific formatting utilities for Generative UI components.
 */

/** Format raw token amount (BigInt string) to human-readable with decimals. */
export function formatTokenAmount(
  amount: string | number | undefined | null,
  decimals: number,
  maxFraction = 4
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

/** Format XLM amount (7 decimals on Stellar). */
export function formatXLM(amount: string | number | undefined | null): string {
  return formatTokenAmount(amount, 7);
}

/** Format USDC amount (7 decimals on Stellar Soroban). */
export function formatUSDC(amount: string | number | undefined | null): string {
  return formatTokenAmount(amount, 7);
}

/** Format large numbers with K/M/B/T abbreviations. */
export function formatNumber(num: number | string | undefined | null): string {
  if (num === undefined || num === null) return "N/A";
  const n = typeof num === "string" ? Number.parseFloat(num) : num;
  if (Number.isNaN(n)) return "N/A";
  if (n >= 1e12) return `${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(2)}K`;
  return n.toFixed(2);
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
  if (value === undefined || value === null) return "N/A";
  const n = typeof value === "string" ? Number.parseFloat(value) : value;
  if (Number.isNaN(n)) return "N/A";
  return `${n.toFixed(decimals)}%`;
}

/** Format estimated time from seconds string. */
export function formatEstimatedTime(time: string | number | undefined | null): string {
  if (!time) return "N/A";
  const seconds = typeof time === "string" ? Number.parseInt(time, 10) : time;
  if (Number.isNaN(seconds)) return String(time);
  if (seconds < 60) return `~${seconds}s`;
  if (seconds < 3600) return `~${Math.round(seconds / 60)}m`;
  return `~${(seconds / 3600).toFixed(1)}h`;
}
