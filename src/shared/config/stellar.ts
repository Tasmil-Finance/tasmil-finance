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

export const activeNetwork =
  process.env.NEXT_PUBLIC_STELLAR_NETWORK === "mainnet"
    ? STELLAR_NETWORKS.PUBLIC
    : STELLAR_NETWORKS.TESTNET;

export const isMainnet = process.env.NEXT_PUBLIC_STELLAR_NETWORK === "mainnet";

export const getExplorerUrl = (type: "tx" | "account" | "op" | "asset", id: string) => {
  const base = activeNetwork.explorerUrl;
  switch (type) {
    case "tx":
      return `${base}/tx/${id}`;
    case "account":
      return `${base}/account/${id}`;
    case "op":
      return `${base}/op/${id}`;
    case "asset":
      return `${base}/asset/${id}`;
  }
};

export const truncateAddress = (address: string) => {
  if (!address) return "";
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
};
