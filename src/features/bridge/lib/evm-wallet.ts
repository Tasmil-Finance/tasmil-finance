/**
 * Minimal EVM wallet integration via window.ethereum (MetaMask).
 * No wagmi/viem dependency — uses raw provider requests.
 */

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<any>;
      on: (event: string, handler: (...args: any[]) => void) => void;
      removeListener: (event: string, handler: (...args: any[]) => void) => void;
      isMetaMask?: boolean;
    };
  }
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
};

// Testnet chain IDs
const EVM_TESTNET_CHAIN_IDS: Record<string, string> = {
  ethereum: "0xaa36a7", // Sepolia
  arbitrum: "0x66eee",  // Arbitrum Sepolia
  base: "0x14a34",      // Base Sepolia
  polygon: "0x13882",   // Polygon Amoy
  optimism: "0xaa37dc", // Optimism Sepolia
  bsc: "0x61",          // BSC Testnet
  avalanche: "0xa869",  // Avalanche Fuji
};

export function isEvmWalletAvailable(): boolean {
  return typeof window !== "undefined" && !!window.ethereum;
}

export async function connectEvmWallet(): Promise<string | null> {
  if (!window.ethereum) {
    throw new Error("No EVM wallet found. Please install MetaMask.");
  }

  console.log("[EVM] window.ethereum detected:", {
    isMetaMask: window.ethereum.isMetaMask,
    isBraveWallet: (window.ethereum as any).isBraveWallet,
    isPhantom: (window.ethereum as any).isPhantom,
    isRabby: (window.ethereum as any).isRabby,
  });

  const accounts: string[] = await window.ethereum.request({
    method: "eth_requestAccounts",
  });

  console.log("[EVM] Connected accounts:", accounts);
  return accounts[0] ?? null;
}

export async function getEvmChainId(): Promise<string> {
  if (!window.ethereum) throw new Error("No EVM wallet");
  return window.ethereum.request({ method: "eth_chainId" });
}

export async function switchEvmChain(chainId: string, isTestnet = false): Promise<void> {
  if (!window.ethereum) throw new Error("No EVM wallet");

  const chainMap = isTestnet ? EVM_TESTNET_CHAIN_IDS : EVM_CHAIN_IDS;
  const targetChainId = chainMap[chainId];
  if (!targetChainId) return;

  try {
    await window.ethereum.request({
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
  if (!window.ethereum) throw new Error("No EVM wallet");

  const txHash: string = await window.ethereum.request({
    method: "eth_sendTransaction",
    params: [rawTx],
  });

  return txHash;
}

export function onEvmAccountChanged(handler: (accounts: string[]) => void): () => void {
  if (!window.ethereum) return () => {};
  window.ethereum.on("accountsChanged", handler);
  return () => window.ethereum?.removeListener("accountsChanged", handler);
}

export function onEvmChainChanged(handler: (chainId: string) => void): () => void {
  if (!window.ethereum) return () => {};
  window.ethereum.on("chainChanged", handler);
  return () => window.ethereum?.removeListener("chainChanged", handler);
}
