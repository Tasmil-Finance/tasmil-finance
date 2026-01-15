import { createPublicClient, formatUnits, http, type Address } from 'viem';
import { sepolia } from 'viem/chains';
import { POPULAR_ASSETS, ERC20_ABI, type Asset } from './assets-config';

export interface AssetBalance {
  symbol: string;
  name: string;
  balance: string; 
  balanceRaw: bigint; 
  decimals: number;
  priceUsd?: number;
  valueUsd?: number;
  change24h?: number;
  allocation?: number;
  icon?: string;
}

/**
 * Fetch token prices from CoinGecko
 */
async function fetchTokenPrices(coingeckoIds: string[]): Promise<Record<string, { usd: number; usd_24h_change: number }>> {
  try {
    const ids = coingeckoIds.join(',');
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`
    );
    
    if (!response.ok) {
      console.error('Failed to fetch prices from CoinGecko');
      return {};
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching token prices:', error);
    return {};
  }
}

/**
 * Check if contract exists at address
 */
async function isContract(address: Address, publicClient: ReturnType<typeof createPublicClient>): Promise<boolean> {
  try {
    const code = await publicClient.getBytecode({ address });
    return code !== undefined && code !== '0x';
  } catch {
    return false;
  }
}

/**
 * Get balance for a single asset
 */
async function getAssetBalance(
  asset: Asset,
  walletAddress: Address,
  publicClient: ReturnType<typeof createPublicClient>
): Promise<AssetBalance | null> {
  try {
    let balanceRaw: bigint;
    
    if (asset.contractAddress === 'NATIVE') {
      balanceRaw = await publicClient.getBalance({ address: walletAddress });
    } else {
      const contractExists = await isContract(asset.contractAddress, publicClient);
      if (!contractExists) {
        console.warn(`Contract not found at ${asset.contractAddress} for ${asset.symbol}`);
        return null;
      }
      
      const data = await publicClient.readContract({
        address: asset.contractAddress,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [walletAddress],
      });
      
      balanceRaw = data as bigint;
    }
    
    const balance = formatUnits(balanceRaw, asset.decimals);
    
    return {
      symbol: asset.symbol,
      name: asset.name,
      balance,
      balanceRaw,
      decimals: asset.decimals,
      icon: asset.icon,
    };
  } catch (error) {
    console.error(`Error fetching balance for ${asset.symbol}:`, error);
    return null;
  }
}

/**
 * Get all asset balances for a wallet address
 */
export async function getAssetBalances(walletAddress: Address): Promise<AssetBalance[]> {
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(),
  });
  
  const balancePromises = POPULAR_ASSETS.map((asset) =>
    getAssetBalance(asset, walletAddress, publicClient)
  );
  
  const balances = await Promise.all(balancePromises);
  
  const validBalances = balances.filter((b): b is AssetBalance => b !== null);
  
  const coingeckoIds = POPULAR_ASSETS.map((a) => a.coingeckoId);
  const prices = await fetchTokenPrices(coingeckoIds);
  
  const balancesWithPrices = validBalances.map((balance) => {
    const asset = POPULAR_ASSETS.find((a) => a.symbol === balance.symbol);
    if (!asset) return balance;
    
    const priceData = prices[asset.coingeckoId];
    if (!priceData) return balance;
    
    const balanceNum = parseFloat(balance.balance);
    const valueUsd = balanceNum * priceData.usd;
    
    return {
      ...balance,
      priceUsd: priceData.usd,
      valueUsd,
      change24h: priceData.usd_24h_change,
    };
  });
  
  const totalValue = balancesWithPrices.reduce((sum, b) => sum + (b.valueUsd || 0), 0);
  
  const balancesWithAllocation = balancesWithPrices.map((balance) => ({
    ...balance,
    allocation: totalValue > 0 ? ((balance.valueUsd || 0) / totalValue) * 100 : 0,
  }));
  
  // Filter out zero balances and sort by value
  return balancesWithAllocation
    .filter((b) => b.balanceRaw > 0n)
    .sort((a, b) => (b.valueUsd || 0) - (a.valueUsd || 0));
}
