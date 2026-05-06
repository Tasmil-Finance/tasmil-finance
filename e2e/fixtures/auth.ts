import type { Page } from "@playwright/test";
import type { WalletConfig } from "./test-wallet";
import { deriveSecretKey, resolvePublicKey } from "./test-wallet";

const NETWORK_PASSPHRASE = "Public Global Stellar Network ; September 2015";

/**
 * JWT cache — authenticate once per wallet, reuse across tests.
 */
// Global JWT cache — shared via globalThis so the fixture can re-inject after tunnel redirects
const jwtCache = new Map<string, { accessToken: string; user: any }>();
(globalThis as any).__tasmilJwtCache = jwtCache;

/**
 * Programmatic wallet authentication — no Freighter extension needed.
 * Caches JWT per public key so only the first test pays the auth cost.
 */
export async function authenticateWallet(page: Page, wallet: WalletConfig): Promise<void> {
  const publicKey = await resolvePublicKey(wallet);

  // Check cache first
  const cached = jwtCache.get(publicKey);
  if (cached) {
    // Navigate first so we have an origin for localStorage
    await page.goto("/chat/new", { waitUntil: "domcontentloaded" });
    try {
      const btn = page.locator(
        'button:has-text("Continue"), button:has-text("Visit Site"), a:has-text("Visit Site")'
      );
      await btn.first().click({ timeout: 5_000 });
      await page.waitForLoadState("networkidle");
    } catch {
      /* no warning */
    }
    await page.waitForLoadState("load");
    await page.waitForTimeout(1_000);
    await injectAuthState(page, publicKey, cached.accessToken, cached.user);
    return;
  }

  const secretKey = await deriveSecretKey(wallet);
  if (!secretKey) {
    throw new Error(`[Auth] No secret key for ${publicKey.slice(0, 8)}...`);
  }

  // Navigate to get tunnel cookies active
  await page.goto("/chat/new", { waitUntil: "domcontentloaded", timeout: 30_000 });

  // Dismiss tunnel/ngrok interstitial if present
  try {
    const continueBtn = page.locator(
      'button:has-text("Continue"), button:has-text("Visit Site"), a:has-text("Visit Site")'
    );
    await continueBtn.first().click({ timeout: 5_000 });
    await page.waitForLoadState("domcontentloaded", { timeout: 15_000 });
  } catch {
    /* no warning */
  }

  // Wait for SPA to be ready (don't use "load" — tunnels are slow)
  await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => {});

  // Step 1: Get challenge (retry up to 3 times for transient 502/503 from proxy)
  const challenge = await page.evaluate(async (pubKey: string) => {
    for (let attempt = 0; attempt < 3; attempt++) {
      const res = await fetch(`${window.location.origin}/api/auth/challenge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicKey: pubKey }),
      });
      if (res.ok) {
        const json = await res.json();
        return json.data.challenge as string;
      }
      if (res.status >= 500 && attempt < 2) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }
      throw new Error(`Challenge failed: ${res.status}`);
    }
    throw new Error("Challenge failed after retries");
  }, publicKey);

  // Step 2: Sign (Node.js side)
  const { Keypair, TransactionBuilder, Operation, Account } = await import("@stellar/stellar-sdk");
  const keypair = Keypair.fromSecret(secretKey);
  const account = new Account(publicKey, "0");
  const tx = new TransactionBuilder(account, {
    fee: "100",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(Operation.manageData({ name: "tasmil auth", value: challenge }))
    .setTimeout(300)
    .build();
  tx.sign(keypair);
  const signedXdr = tx.toXDR();

  // Step 3: Verify → JWT
  const authResult = await page.evaluate(
    async (params: { publicKey: string; signedXdr: string }) => {
      const res = await fetch(`${window.location.origin}/api/auth/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      if (!res.ok) throw new Error(`Verify failed: ${res.status}`);
      const json = await res.json();
      return json.data as { accessToken: string; user: any };
    },
    { publicKey, signedXdr }
  );

  console.log(`[Auth] JWT obtained for ${publicKey.slice(0, 8)}... ✅`);

  // Cache it
  jwtCache.set(publicKey, authResult);

  // Step 4: Inject into localStorage
  await injectAuthState(page, publicKey, authResult.accessToken, authResult.user);
}

async function injectAuthState(page: Page, publicKey: string, accessToken: string, user: any) {
  await page.evaluate(
    (params: { publicKey: string; accessToken: string; user: any }) => {
      localStorage.setItem(
        "wallet-storage",
        JSON.stringify({
          state: { connected: true, account: params.publicKey, signing: false },
          version: 0,
        })
      );
      localStorage.setItem(
        "auth-storage",
        JSON.stringify({
          state: {
            isAuthenticated: true,
            accessToken: params.accessToken,
            user: {
              id: params.user?.id || `user_${params.publicKey.slice(0, 8)}`,
              walletAddress: params.publicKey,
              type: params.user?.type || "regular",
              createdAt: params.user?.createdAt || new Date().toISOString(),
              updatedAt: params.user?.updatedAt || new Date().toISOString(),
            },
            isLoading: false,
            expiresAt: Date.now() + 23 * 60 * 60 * 1000,
          },
          version: 0,
        })
      );
    },
    { publicKey, accessToken, user }
  );
}
