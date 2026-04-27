/**
 * Minimal EVM wallet integration via window.ethereum (MetaMask).
 * No wagmi/viem dependency — uses raw provider requests.
 */

type EvmRequestArgs = {
  method: string;
  params?: unknown[];
};

type EvmProvider = Record<string, unknown> & {
  request: (args: EvmRequestArgs) => Promise<unknown>;
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
  isMetaMask?: boolean;
};

function getEvmProvider(): EvmProvider | undefined {
  if (typeof window === "undefined") return undefined;
  return window.ethereum as EvmProvider | undefined;
}

// Chain IDs for supported EVM networks
const EVM_CHAIN_IDS: Record<string, string> = {
  ethereum: "0x1",
  arbitrum: "0xa4b1",
  base: "0x2105",
  polygon: "0x89",
  optimism: "0xa",
  bsc: "0x38",
  avalanche: "0xa86a",
  sonic: "0x92",
  celo: "0xa4ec",
  linea: "0xe708",
  unichain: "0x82",
};

// Testnet chain IDs
const EVM_TESTNET_CHAIN_IDS: Record<string, string> = {
  ethereum: "0xaa36a7", // Sepolia
  arbitrum: "0x66eee", // Arbitrum Sepolia
  base: "0x14a34", // Base Sepolia
  polygon: "0x13882", // Polygon Amoy
  optimism: "0xaa37dc", // Optimism Sepolia
  bsc: "0x61", // BSC Testnet
  avalanche: "0xa869", // Avalanche Fuji
};

export function isEvmWalletAvailable(): boolean {
  return !!getEvmProvider();
}

export async function connectEvmWallet(): Promise<string | null> {
  const provider = getEvmProvider();
  if (!provider) {
    throw new Error("No EVM wallet found. Please install MetaMask.");
  }

  const accounts = (await provider.request({
    method: "eth_requestAccounts",
  })) as string[];
  return accounts[0] ?? null;
}

export async function getEvmChainId(): Promise<string> {
  const provider = getEvmProvider();
  if (!provider) throw new Error("No EVM wallet");
  return (await provider.request({ method: "eth_chainId" })) as string;
}

export async function switchEvmChain(chainId: string, isTestnet = false): Promise<void> {
  const provider = getEvmProvider();
  if (!provider) throw new Error("No EVM wallet");

  const chainMap = isTestnet ? EVM_TESTNET_CHAIN_IDS : EVM_CHAIN_IDS;
  const targetChainId = chainMap[chainId];
  if (!targetChainId) return;

  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: targetChainId }],
    });
  } catch (error: any) {
    // Chain not added to wallet (error code 4902)
    if (error.code === 4902) {
      console.warn("Chain not added to wallet:", chainId);
    }
    throw error;
  }
}

export async function sendEvmTransaction(rawTx: any): Promise<string> {
  const provider = getEvmProvider();
  if (!provider) throw new Error("No EVM wallet");

  const txHash = (await provider.request({
    method: "eth_sendTransaction",
    params: [rawTx],
  })) as string;

  return txHash;
}

export function onEvmAccountChanged(handler: (accounts: string[]) => void): () => void {
  const provider = getEvmProvider();
  if (!provider) return () => {};
  provider.on("accountsChanged", handler as (...args: unknown[]) => void);
  return () => provider.removeListener("accountsChanged", handler as (...args: unknown[]) => void);
}

export function onEvmChainChanged(handler: (chainId: string) => void): () => void {
  const provider = getEvmProvider();
  if (!provider) return () => {};
  provider.on("chainChanged", handler as (...args: unknown[]) => void);
  return () => provider.removeListener("chainChanged", handler as (...args: unknown[]) => void);
}
