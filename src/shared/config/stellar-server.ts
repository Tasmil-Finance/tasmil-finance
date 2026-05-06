// Server-side Stellar network — set NEXT_PUBLIC_STELLAR_NETWORK=testnet|mainnet in .env
export const STELLAR_NETWORK: "mainnet" | "testnet" =
  process.env.NEXT_PUBLIC_STELLAR_NETWORK === "mainnet" ? "mainnet" : "testnet";
