import type { VaultToken } from "./types";

export const VAULT_NAME = "Tasmil Vault";
export const VAULT_DESCRIPTION = "Earn yield on Stellar, automated";

export const SUPPORTED_TOKENS: { value: VaultToken; label: string; icon: string }[] = [
  { value: "USDC", label: "USDC", icon: "/icons/usdc.svg" },
  { value: "XLM", label: "XLM", icon: "/icons/xlm.svg" },
];

export const QUICK_AMOUNTS_USD = [100, 500, 1000] as const;

export const BACKEND_URL =
  process.env["NEXT_PUBLIC_BACKEND_URL"] ?? "http://localhost:6756";
export const API_BASE = `${BACKEND_URL}/api/vault`;

export const POSITION_REFETCH_MS = 30_000;
export const STATS_REFETCH_MS = 60_000;
export const ACTIVITY_REFETCH_MS = 60_000;
