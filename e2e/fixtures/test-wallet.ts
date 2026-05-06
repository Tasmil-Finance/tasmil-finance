import type { Page } from "@playwright/test";

// ─── Wallet Configuration ───────────────────────────────────────

interface WalletConfig {
  publicKey: string;
  recoveryPhrase?: string;
  secretKey?: string;
  hdIndex: number;
}

/** Funded wallet — has real balances for happy-path tests. */
export const FUNDED_WALLET: WalletConfig = {
  publicKey:
    process.env.E2E_WALLET_PUBLIC_KEY || "GDQI7LOGDRQRM5OXEIEY7TDHUYEHGQ7RX3KOJU3FNUP6HBDHUGWA3I6R",
  recoveryPhrase: process.env.E2E_WALLET_RECOVERY_PHRASE || undefined,
  secretKey: process.env.E2E_WALLET_SECRET_KEY || undefined,
  hdIndex: parseInt(process.env.E2E_WALLET_HD_INDEX || "0", 10),
};

/** Empty wallet — zero balance for edge-case tests. */
export const EMPTY_WALLET: WalletConfig = {
  publicKey:
    process.env.E2E_WALLET_EMPTY_PUBLIC_KEY ||
    "GC5D3EMZTDLRAOBMQN3ITUWLXMB7V2A6QKZ6GLJHWDDAE2BB6S6ICGLV",
  recoveryPhrase: process.env.E2E_WALLET_EMPTY_RECOVERY_PHRASE || undefined,
  secretKey: process.env.E2E_WALLET_EMPTY_SECRET_KEY || undefined,
  hdIndex: parseInt(process.env.E2E_WALLET_EMPTY_HD_INDEX || "0", 10),
};

// ─── Key Derivation ─────────────────────────────────────────────

/**
 * Derive the Stellar secret key from a wallet config.
 * Tries: secretKey > recoveryPhrase > null
 */
export async function deriveSecretKey(wallet: WalletConfig): Promise<string | null> {
  // Option 1: direct secret key
  if (wallet.secretKey && wallet.secretKey.startsWith("S")) {
    return wallet.secretKey;
  }

  // Option 2: derive from recovery phrase
  if (wallet.recoveryPhrase && wallet.recoveryPhrase.trim().split(/\s+/).length >= 12) {
    try {
      const StellarHDWallet = (await import("stellar-hd-wallet")).default;
      const hdWallet = StellarHDWallet.fromMnemonic(wallet.recoveryPhrase.trim());
      const keypair = hdWallet.getKeypair(wallet.hdIndex);
      return keypair.secret();
    } catch (error) {
      console.warn("[E2E Wallet] Failed to derive key from mnemonic:", error);
      return null;
    }
  }

  return null;
}

/**
 * Resolve public key — from config or derived from mnemonic.
 */
export async function resolvePublicKey(wallet: WalletConfig): Promise<string> {
  if (wallet.publicKey) return wallet.publicKey;

  // Derive from mnemonic as fallback
  if (wallet.recoveryPhrase && wallet.recoveryPhrase.trim().split(/\s+/).length >= 12) {
    try {
      const StellarHDWallet = (await import("stellar-hd-wallet")).default;
      const hdWallet = StellarHDWallet.fromMnemonic(wallet.recoveryPhrase.trim());
      return hdWallet.getPublicKey(wallet.hdIndex);
    } catch {
      // fallback to configured key
    }
  }

  return wallet.publicKey;
}

// ─── Page Injection ─────────────────────────────────────────────

/**
 * Injects a mock Stellar wallet into the page.
 * The mock intercepts Freighter/StellarWalletsKit calls and presents
 * the configured public key as the connected wallet.
 */
export async function injectMockWallet(page: Page, wallet: WalletConfig | string) {
  const config = typeof wallet === "string" ? { publicKey: wallet, hdIndex: 0 } : wallet;
  const pubKey = await resolvePublicKey(config);
  const secret = await deriveSecretKey(config);
  const canSign = !!secret;

  await page.addInitScript(
    (params: { pubKey: string; canSign: boolean }) => {
      (window as any).__TASMIL_E2E_WALLET__ = {
        publicKey: params.pubKey,
        connected: true,
        canSign: params.canSign,
      };

      // Mock Freighter API
      (window as any).freighter = {
        isConnected: () => Promise.resolve({ isConnected: true }),
        getPublicKey: () => Promise.resolve(params.pubKey),
        getAddress: () => Promise.resolve({ address: params.pubKey }),
        signTransaction: (xdr: string) => {
          console.log(
            `[E2E Wallet] signTransaction (canSign: ${params.canSign}, addr: ${params.pubKey.slice(0, 8)}...)`
          );
          return Promise.resolve({ signedTxXdr: xdr, signerAddress: params.pubKey });
        },
        signAuthEntry: (entry: string) => {
          return Promise.resolve({ signedAuthEntry: entry, signerAddress: params.pubKey });
        },
        isAllowed: () => Promise.resolve({ isAllowed: true }),
        setAllowed: () => Promise.resolve({ isAllowed: true }),
        getNetwork: () =>
          Promise.resolve({
            network: "PUBLIC",
            networkPassphrase: "Public Global Stellar Network ; September 2015",
          }),
        getNetworkDetails: () =>
          Promise.resolve({
            network: "PUBLIC",
            networkUrl: "https://horizon.stellar.org",
            sorobanUrl: "https://mainnet.sorobanrpc.com",
            networkPassphrase: "Public Global Stellar Network ; September 2015",
          }),
      };

      // Override StellarWalletsKit
      Object.defineProperty(window, "__stellarWalletsKit", {
        get() {
          return {
            getAddress: () => Promise.resolve({ address: params.pubKey }),
            signTransaction: (xdr: string) => Promise.resolve({ signedTxXdr: xdr }),
            signAuthEntry: (entry: string) => Promise.resolve({ signedAuthEntry: entry }),
          };
        },
        configurable: true,
      });
    },
    { pubKey, canSign }
  );
}

/**
 * Injects wallet state into localStorage so the app
 * recognizes the wallet as connected on page load.
 */
export async function setWalletState(page: Page, wallet: WalletConfig | string) {
  const config = typeof wallet === "string" ? { publicKey: wallet, hdIndex: 0 } : wallet;
  const pubKey = await resolvePublicKey(config);

  await page.addInitScript((key: string) => {
    localStorage.setItem(
      "wallet-store",
      JSON.stringify({
        state: { publicKey: key, isConnected: true, walletType: "FREIGHTER" },
        version: 0,
      })
    );
    localStorage.setItem(
      "auth-store",
      JSON.stringify({ state: { isAuthenticated: true, publicKey: key }, version: 0 })
    );
  }, pubKey);
}

/**
 * Sign a Stellar XDR using the wallet's secret key (Node.js context).
 * Call this in test code to produce a real signature for submission.
 */
export async function signXdr(wallet: WalletConfig, xdr: string): Promise<string | null> {
  const secret = await deriveSecretKey(wallet);
  if (!secret) {
    console.warn("[E2E Wallet] No secret key available for signing");
    return null;
  }

  try {
    const { Keypair, TransactionBuilder, Networks } = await import("@stellar/stellar-sdk");
    const keypair = Keypair.fromSecret(secret);
    const tx = TransactionBuilder.fromXDR(xdr, Networks.PUBLIC);
    tx.sign(keypair);
    return tx.toXDR();
  } catch (error) {
    console.warn("[E2E Wallet] Failed to sign XDR:", error);
    return null;
  }
}
