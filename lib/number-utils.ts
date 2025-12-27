/**
 * Number utilities for accurate calculations
 * Handles floating point precision issues and consistent formatting
 */

/**
 * Multiply two numbers with precision handling
 * Prevents floating point precision errors
 */
export function preciseMultiply(a: number, b: number, decimals = 8): number {
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 0;

  // Use string manipulation to avoid floating point errors
  const aStr = a.toString();
  const bStr = b.toString();

  const aDecimals = (aStr.split(".")[1] || "").length;
  const bDecimals = (bStr.split(".")[1] || "").length;
  const totalDecimals = aDecimals + bDecimals;

  // Convert to integers for multiplication
  const aInt = Math.round(a * 10 ** aDecimals);
  const bInt = Math.round(b * 10 ** bDecimals);

  // Multiply and convert back
  const result = (aInt * bInt) / 10 ** totalDecimals;

  // Round to specified decimals
  return Math.round(result * 10 ** decimals) / 10 ** decimals;
}

/**
 * Safe division with precision handling
 */
export function preciseDivide(a: number, b: number, decimals = 8): number {
  if (!Number.isFinite(a) || !Number.isFinite(b) || b === 0) return 0;

  const result = a / b;
  return Math.round(result * 10 ** decimals) / 10 ** decimals;
}

/**
 * Format currency consistently
 */
export function formatCurrency(value: number, forceDecimals = false): string {
  if (!Number.isFinite(value)) return "$0.00";
  if (value === 0) return "$0.00";

  const absValue = Math.abs(value);
  const sign = value < 0 ? "-" : "";

  if (absValue < 0.000_001) return `${sign}$${absValue.toFixed(8)}`;
  if (absValue < 0.01) return `${sign}$${absValue.toFixed(6)}`;
  if (absValue < 1) return `${sign}$${absValue.toFixed(4)}`;

  return `${sign}$${absValue.toLocaleString("en-US", {
    minimumFractionDigits: forceDecimals ? 2 : 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Format token amount consistently
 */
export function formatAmount(amount: number): string {
  if (!Number.isFinite(amount)) return "0";
  if (amount === 0) return "0";

  const absAmount = Math.abs(amount);

  if (absAmount < 0.000_001) return absAmount.toFixed(8);
  if (absAmount < 0.01) return absAmount.toFixed(8);
  if (absAmount < 1) return absAmount.toFixed(6);
  if (absAmount < 1000) return absAmount.toFixed(4);

  return absAmount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  });
}

/**
 * Format percentage consistently
 */
export function formatPercentage(value: number): string {
  if (!Number.isFinite(value)) return "0.00%";
  if (value === 0) return "0.00%";

  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

/**
 * Format price consistently
 */
export function formatPrice(price: number): string {
  if (!Number.isFinite(price)) return "N/A";
  if (price === 0) return "N/A";

  if (price < 0.000_001) return `$${price.toFixed(8)}`;
  if (price < 0.01) return `$${price.toFixed(6)}`;
  if (price < 1) return `$${price.toFixed(4)}`;

  return `$${price.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Validate and sanitize number input
 */
export function sanitizeNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return 0;
}

/**
 * Calculate token value with precision
 */
export function calculateTokenValue(amount: number, price: number): number {
  const sanitizedAmount = sanitizeNumber(amount);
  const sanitizedPrice = sanitizeNumber(price);

  return preciseMultiply(sanitizedAmount, sanitizedPrice);
}

/**
 * Calculate percentage with precision
 */
export function calculatePercentage(part: number, total: number): number {
  if (!Number.isFinite(part) || !Number.isFinite(total) || total === 0) {
    return 0;
  }

  return preciseDivide(part * 100, total, 2);
}

