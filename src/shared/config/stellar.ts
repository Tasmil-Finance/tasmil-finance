"use client";

// Stellar Network Configuration
export const STELLAR_NETWORKS = {
  PUBLIC: {
    name: "Stellar Public",
    networkPassphrase: "Public Global Stellar Network ; September 2015",
    horizonUrl: "https://horizon.stellar.org",
    sorobanRpcUrl: "https://soroban-rpc.mainnet.stellar.gateway.fm",
    explorerUrl: "https://stellar.expert/explorer/public",
  },
  TESTNET: {
    name: "Stellar Testnet",
    networkPassphrase: "Test SDF Network ; September 2015",
    horizonUrl: "https://horizon-testnet.stellar.org",
    sorobanRpcUrl: "https://soroban-testnet.stellar.org",
    explorerUrl: "https://stellar.expert/explorer/testnet",
  },
} as const;

// Default to mainnet unless env says otherwise
const useTestnet = process.env["NEXT_PUBLIC_STELLAR_TESTNET"] === "true";

export const activeNetwork = useTestnet
  ? STELLAR_NETWORKS.TESTNET
  : STELLAR_NETWORKS.PUBLIC;

export const getExplorerUrl = (type: "tx" | "account" | "op", id: string) => {
  const base = activeNetwork.explorerUrl;
  switch (type) {
    case "tx":
      return `${base}/tx/${id}`;
    case "account":
      return `${base}/account/${id}`;
    case "op":
      return `${base}/op/${id}`;
  }
};

export const truncateAddress = (address: string) => {
  if (!address) return "";
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
};
