import BigNumber from "bignumber.js";

const MINUS = "−";

export function scaleByDecimals(raw: string, decimals: number): string {
  const bn = new BigNumber(raw);
  if (bn.isNaN()) return raw;
  return bn.shiftedBy(-decimals).toFixed();
}

export function formatAmount(value: string): string {
  const bn = new BigNumber(value);
  if (bn.isNaN()) return value;

  const abs = bn.abs();
  const sign = bn.isNegative() ? MINUS : "";

  if (abs.gte(1_000_000)) {
    return `${sign}${abs.dividedBy(1_000_000).toFixed(2)}M`;
  }
  if (abs.gte(1_000)) {
    return `${sign}${abs.dividedBy(1_000).toFixed(2)}K`;
  }
  if (abs.gte(1)) {
    return `${sign}${abs.toFixed(4, BigNumber.ROUND_HALF_EVEN).replace(/\.?0+$/, "")}`;
  }
  if (abs.isZero()) return "0";
  return `${sign}${abs.toFixed(7).replace(/\.?0+$/, "")}`;
}

export function signedAmount(value: string, isCredit: boolean): string {
  return isCredit ? `+${value}` : `${MINUS}${value}`;
}
