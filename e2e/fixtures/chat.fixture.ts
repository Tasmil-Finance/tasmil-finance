import { test as base } from "@playwright/test";
import { ChatPage } from "../page-objects/chat.page";
import { authenticateWallet } from "./auth";
import { EMPTY_WALLET, FUNDED_WALLET, injectMockWallet } from "./test-wallet";

/**
 * Setup flow:
 * 1. addInitScript — mock Freighter API
 * 2. authenticateWallet — gets JWT, injects localStorage
 * 3. goto /chat/new — app loads, but shows "Connect Wallet"
 * 4. Click "Connect Wallet" button → triggers StellarWalletsKit modal
 * 5. The mock Freighter resolves the connection → wallet connected → textarea appears
 *
 * Alternative: if __TASMIL_E2E_WALLET__ fast-path is compiled, step 4 is skipped.
 */
async function setupWallet(page: import("@playwright/test").Page, wallet: typeof FUNDED_WALLET) {
  await injectMockWallet(page, wallet);
  await authenticateWallet(page, wallet);

  // Navigate fresh
  await page.goto(`/chat/new`, { waitUntil: "domcontentloaded", timeout: 30_000 });

  // Handle tunnel interstitial
  try {
    const btn = page.locator(
      'button:has-text("Continue"), button:has-text("Visit Site"), a:has-text("Visit Site")'
    );
    await btn.first().click({ timeout: 2_000 });
    await page.waitForLoadState("domcontentloaded", { timeout: 10_000 });
  } catch {
    /* no interstitial */
  }

  await page.waitForLoadState("networkidle", { timeout: 20_000 }).catch(() => {});

  // The E2E fast-path in wallet-context.tsx detects __TASMIL_E2E_WALLET__
  // and sets isConnected=true via useEffect. Wait for the textarea to appear
  // (the fast-path fires within the first render cycle).
  // Do NOT click "Connect Wallet" — that opens the real StellarWalletsKit modal
  // which hangs without a browser extension.
}

export const test = base.extend<{
  chatPage: ChatPage;
  chatPageEmpty: ChatPage;
}>({
  chatPage: async ({ page }, use) => {
    await setupWallet(page, FUNDED_WALLET);
    const chatPage = new ChatPage(page);
    await page.waitForSelector(
      'textarea, [contenteditable="true"], input[placeholder*="message" i], [role="textbox"]',
      { timeout: 30_000 }
    );
    await use(chatPage);
  },

  chatPageEmpty: async ({ page }, use) => {
    await setupWallet(page, EMPTY_WALLET);
    const chatPage = new ChatPage(page);
    await page.waitForSelector(
      'textarea, [contenteditable="true"], input[placeholder*="message" i], [role="textbox"]',
      { timeout: 30_000 }
    );
    await use(chatPage);
  },
});

export { expect } from "@playwright/test";
