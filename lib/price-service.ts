/**
 * Price Service - Fetch real-time cryptocurrency prices
 * Uses CoinGecko API (free tier)
 */

interface CoinGeckoPriceResponse {
  [key: string]: {
    usd: number;
    usd_24h_change: number;
  };
}

// CoinGecko API coin IDs mapping
const COINGECKO_IDS: Record<string, string> = {
  U2U: "u2u-network",
  ETH: "ethereum",
  USDT: "tether",
  USDC: "usd-coin",
  BNB: "binancecoin",
  DAI: "dai",
  WETH: "weth",
};

/**
 * Fetch prices for multiple tokens from CoinGecko
 * @param symbols - Array of token symbols (e.g., ['U2U', 'ETH', 'USDT'])
 * @returns Object with prices and 24h changes
 */
export async function fetchTokenPrices(
  symbols: string[]
): Promise<Record<string, { price: number; change24h: number }>> {
  try {
    // Convert symbols to CoinGecko IDs
    const coinIds = symbols
      .map((symbol) => COINGECKO_IDS[symbol])
      .filter(Boolean)
      .join(",");

    if (!coinIds) {
      console.warn("No valid coin IDs found for symbols:", symbols);
      return getFallbackPrices(symbols);
    }

    // Fetch from CoinGecko API (free tier, no API key required)
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinIds}&vs_currencies=usd&include_24hr_change=true`,
      {
        next: { revalidate: 60 }, // Cache for 60 seconds
      }
    );

    if (!response.ok) {
      console.error("CoinGecko API error:", response.statusText);
      return getFallbackPrices(symbols);
    }

    const data: CoinGeckoPriceResponse = await response.json();

    // Map response back to symbols
    const prices: Record<string, { price: number; change24h: number }> = {};
    symbols.forEach((symbol) => {
      const coinId = COINGECKO_IDS[symbol];
      if (coinId && data[coinId]) {
        prices[symbol] = {
          price: data[coinId].usd,
          change24h: data[coinId].usd_24h_change || 0,
        };
      } else {
        // Fallback for missing data
        prices[symbol] = getFallbackPriceForSymbol(symbol);
      }
    });

    return prices;
  } catch (error) {
    console.error("Error fetching token prices:", error);
    return getFallbackPrices(symbols);
  }
}

/**
 * Fetch price for a single token
 * @param symbol - Token symbol (e.g., 'U2U')
 * @returns Price and 24h change
 */
export async function fetchTokenPrice(
  symbol: string
): Promise<{ price: number; change24h: number }> {
  const prices = await fetchTokenPrices([symbol]);
  return prices[symbol] || { price: 0, change24h: 0 };
}

/**
 * Get fallback prices when API fails
 * Uses approximate/cached values
 */
function getFallbackPrices(
  symbols: string[]
): Record<string, { price: number; change24h: number }> {
  const fallback: Record<string, { price: number; change24h: number }> = {};
  symbols.forEach((symbol) => {
    fallback[symbol] = getFallbackPriceForSymbol(symbol);
  });
  return fallback;
}

/**
 * Get fallback price for a single symbol
 * Note: These are emergency fallback only, always fetches real price first
 * Updated: Oct 2025
 */
function getFallbackPriceForSymbol(symbol: string): {
  price: number;
  change24h: number;
} {
  // Approximate fallback prices (used only when CoinGecko API fails)
  // These should be updated periodically but are rarely used
  const fallbackPrices: Record<string, { price: number; change24h: number }> = {
    U2U: { price: 0.0075, change24h: 0 }, // ~$0.0075 as of Oct 2025
    ETH: { price: 2500, change24h: 0 },
    USDT: { price: 1.0, change24h: 0 },
    USDC: { price: 1.0, change24h: 0 },
    BNB: { price: 300, change24h: 0 },
    DAI: { price: 1.0, change24h: 0 },
    WETH: { price: 2500, change24h: 0 },
  };

  return fallbackPrices[symbol] || { price: 0, change24h: 0 };
}

/**
 * Check if CoinGecko API is available
 */
export async function checkPriceServiceHealth(): Promise<boolean> {
  try {
    const response = await fetch("https://api.coingecko.com/api/v3/ping", {
      next: { revalidate: 300 }, // Cache for 5 minutes
    });
    return response.ok;
  } catch {
    return false;
  }
}
