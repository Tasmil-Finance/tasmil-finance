import type { Address } from 'viem';

export interface Asset {
  symbol: string;
  name: string;
  decimals: number;
  contractAddress: Address | 'NATIVE';
  coingeckoId: string;
  icon?: string;
}

/**
 * Popular assets configuration on Sepolia Testnet
 */
export const POPULAR_ASSETS: Asset[] = [
  {
    symbol: 'ETH',
    name: 'Sepolia Ether',
    decimals: 18,
    contractAddress: 'NATIVE',
    coingeckoId: 'ethereum',
  },
  {
    symbol: 'USDC',
    name: 'USD Coin (Testnet)',
    decimals: 6,
    contractAddress: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238' as Address, // Sepolia USDC
    coingeckoId: 'usd-coin',
  },
  {
    symbol: 'DAI',
    name: 'Dai Stablecoin (Testnet)',
    decimals: 18,
    contractAddress: '0x68194a729C2450ad26072b3D33ADaCbcef39D574' as Address, // Sepolia DAI
    coingeckoId: 'dai',
  },
  {
    symbol: 'LINK',
    name: 'Chainlink (Testnet)',
    decimals: 18,
    contractAddress: '0x779877A7B0D9E8603169DdbD7836e478b4624789' as Address, // Sepolia LINK
    coingeckoId: 'chainlink',
  },
];

/**
 * ERC20 Token ABI - Only the functions we need
 */
export const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'name',
    outputs: [{ name: '', type: 'string' }],
    type: 'function',
  },
] as const;
