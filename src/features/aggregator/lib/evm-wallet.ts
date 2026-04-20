/**
 * Minimal EVM wallet integration via window.ethereum (MetaMask).
 * No wagmi/viem dependency — uses raw provider requests.
 */

import type { EIP1193Provider } from "viem";

function getEthereum(): EIP1193Provider | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as Window & { ethereum?: EIP1193Provider }).ethereum;
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
  return !!getEthereum();
}

export async function connectEvmWallet(): Promise<string | null> {
  const ethereum = getEthereum();
  if (!ethereum) {
    throw new Error("No EVM wallet found. Please install MetaMask.");
  }

  const accounts = await ethereum.request({
    method: "eth_requestAccounts",
  });
  return (accounts as string[])[0] ?? null;
}

export async function getEvmChainId(): Promise<string> {
  const ethereum = getEthereum();
  if (!ethereum) throw new Error("No EVM wallet");
  return ethereum.request({ method: "eth_chainId" }) as Promise<string>;
}

export async function switchEvmChain(chainId: string, isTestnet = false): Promise<void> {
  const ethereum = getEthereum();
  if (!ethereum) throw new Error("No EVM wallet");

  const chainMap = isTestnet ? EVM_TESTNET_CHAIN_IDS : EVM_CHAIN_IDS;
  const targetChainId = chainMap[chainId];
  if (!targetChainId) return;

  try {
    await ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: targetChainId }],
    });
  } catch (error: any) {
    if (error.code === 4902) {
      console.warn("Chain not added to wallet:", chainId);
    }
    throw error;
  }
}

export async function sendEvmTransaction(rawTx: unknown): Promise<string> {
  const ethereum = getEthereum();
  if (!ethereum) throw new Error("No EVM wallet");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const txHash = (await ethereum.request({
    method: "eth_sendTransaction",
    params: [rawTx] as any,
  })) as string;

  return txHash;
}

export function onEvmAccountChanged(handler: (accounts: string[]) => void): () => void {
  const ethereum = getEthereum();
  if (!ethereum) return () => {};
  const handleAccountsChanged = (accounts: unknown[]) => handler(accounts as string[]);
  ethereum.on("accountsChanged", handleAccountsChanged);
  return () => ethereum.removeListener("accountsChanged", handleAccountsChanged);
}

export function onEvmChainChanged(handler: (chainId: string) => void): () => void {
  const ethereum = getEthereum();
  if (!ethereum) return () => {};
  const handleChainChanged = (chainId: unknown) => handler(chainId as string);
  ethereum.on("chainChanged", handleChainChanged);
  return () => ethereum.removeListener("chainChanged", handleChainChanged);
}
