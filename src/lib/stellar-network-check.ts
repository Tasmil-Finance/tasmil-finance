/**
 * Utility to detect Stellar network mismatch between the app config and the
 * connected wallet (Freighter, Lobstr, etc.) before attempting to sign.
 *
 * Freighter throws an opaque error when networks don't match. This utility
 * proactively catches the mismatch and surfaces a clear, actionable message.
 */

import { Networks } from "@stellar/stellar-sdk";

const IS_MAINNET = process.env.NEXT_PUBLIC_STELLAR_NETWORK === "mainnet";
const APP_NETWORK_PASSPHRASE = IS_MAINNET ? Networks.PUBLIC : Networks.TESTNET;
const APP_NETWORK_NAME = IS_MAINNET ? "Mainnet" : "Testnet";

function stringifyError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;

  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

/**
 * Proactively checks if the wallet's current network matches the app config.
 * Currently supports Freighter via @stellar/freighter-api.
 * For other wallets it's a no-op (errors are caught after signing attempt).
 *
 * @throws Error with a human-readable message if there's a network mismatch.
 */
export async function checkWalletNetwork(): Promise<void> {
  try {
    // Only Freighter exposes getNetwork() — other wallets skip silently
    const freighterApi = await import("@stellar/freighter-api").catch(() => null);
    if (!freighterApi) return;

    const result = await freighterApi.getNetwork();
    if ("error" in result && result.error) return; // Freighter not installed / not connected

    const walletPassphrase = result.networkPassphrase;

    if (walletPassphrase && walletPassphrase !== APP_NETWORK_PASSPHRASE) {
      const walletNetworkName = walletPassphrase === Networks.PUBLIC ? "Mainnet" : walletPassphrase;
      throw new NetworkMismatchError(
        `Your Freighter wallet is set to **${walletNetworkName}**, but this app runs on **${APP_NETWORK_NAME}**.\n\nPlease open Freighter → click the network name at the top → switch to **${APP_NETWORK_NAME}**, then try again.`,
        walletNetworkName,
        APP_NETWORK_NAME
      );
    }
  } catch (err) {
    if (err instanceof NetworkMismatchError) throw err;
    // Any other error (import fail, API unavailable) → skip check silently
  }
}

export class NetworkMismatchError extends Error {
  constructor(
    message: string,
    public readonly walletNetwork: string,
    public readonly appNetwork: string
  ) {
    super(message);
    this.name = "NetworkMismatchError";
  }
}

/**
 * Parses the raw error thrown by wallet extensions during signing and returns
 * a clean, user-facing message. Falls back to the original message.
 */
export function parseSigningError(error: unknown): string {
  const msg = stringifyError(error);

  if (msg.includes("horizon-errors/not_found") || msg.includes("Resource Missing")) {
    return `Stellar account was not found on ${APP_NETWORK_NAME}. Fund or activate this address on ${APP_NETWORK_NAME}, then try again.`;
  }

  // Freighter network mismatch pattern
  if (msg.includes("is set to Main Net") || msg.includes("is set to Test")) {
    const walletNet = msg.includes("Main Net") ? "Mainnet" : "Testnet";
    const appNet = APP_NETWORK_NAME;
    return `Wallet is on ${walletNet} but app is on ${appNet}. Open Freighter → switch to ${appNet}, then retry.`;
  }

  if (
    msg.includes("User rejected") ||
    msg.includes("user rejected") ||
    msg.includes("User denied")
  ) {
    return "Transaction rejected by user.";
  }

  if (msg.includes("Failed to fetch") || msg.includes("NetworkError")) {
    return "Cannot reach the backend. Make sure the server is running.";
  }

  return msg;
}
