export interface TokenInfo {
  symbol: string;
  name: string;
  image?: string;
  contractAddress?: string;
  decimals: number;
}

export const TOKENS: Record<string, TokenInfo> = {
  U2U: {
    name: "U2U Network",
    symbol: "U2U",
    image: "https://assets.coingecko.com/coins/images/32646/small/IMG_7062.jpeg?1699015088",
    decimals: 18,
  },
  ETH: {
    name: "Ethereum",
    symbol: "ETH",
    image: "https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png",
    decimals: 18,
  },
  USDT: {
    name: "Tether USD",
    symbol: "USDT",
    contractAddress: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    image: "https://s2.coinmarketcap.com/static/img/coins/64x64/825.png",
    decimals: 6,
  },
  USDC: {
    name: "USD Coin",
    symbol: "USDC",
    contractAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    image: "https://s2.coinmarketcap.com/static/img/coins/64x64/3408.png",
    decimals: 6,
  },
  BNB: {
    name: "BNB",
    symbol: "BNB",
    image: "https://s2.coinmarketcap.com/static/img/coins/64x64/1839.png",
    decimals: 18,
  },
  DAI: {
    name: "Dai Stablecoin",
    symbol: "DAI",
    contractAddress: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    image: "https://s2.coinmarketcap.com/static/img/coins/64x64/4943.png",
    decimals: 18,
  },
  WETH: {
    name: "Wrapped Ether",
    symbol: "WETH",
    contractAddress: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    image: "https://s2.coinmarketcap.com/static/img/coins/64x64/2396.png",
    decimals: 18,
  },
};
