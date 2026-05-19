import { expect, type Page } from "@playwright/test";

const BACKEND = process.env.PLAYWRIGHT_BACKEND_URL ?? "http://localhost:6756";

export interface AuthedSession {
  walletAddress: string;
  jwt: string;
  userId: string;
}

/**
 * Generate a unique Stellar-format public key (G...56 chars).
 * test-login only checks length >= 4, so any prefix-padded string works.
 */
export function freshWallet(): string {
  const stamp = `${Date.now()}${Math.floor(Math.random() * 1_000_000)}`;
  return `GE2ECREDITFLOW${stamp}`.padEnd(56, "0").slice(0, 56);
}

/**
 * Authenticate a wallet via the backend test-login endpoint and
 * inject auth + wallet state into localStorage so the frontend
 * believes the user is connected without a real Stellar wallet.
 *
 * Must be called BEFORE page.goto() because addInitScript runs
 * on the next navigation.
 */
export async function loginAsWallet(page: Page, walletAddress: string): Promise<AuthedSession> {
  const response = await page.request.post(`${BACKEND}/api/auth/wallet/test-login`, {
    data: { walletAddress },
  });
  if (!response.ok()) {
    throw new Error(`test-login failed ${response.status()}: ${await response.text()}`);
  }
  const body = await response.json();
  const jwt: string = body?.data?.accessToken ?? body?.accessToken;
  const userId: string = body?.data?.user?.id ?? body?.user?.id;
  expect(jwt).toBeTruthy();
  expect(userId).toBeTruthy();

  await page.addInitScript(
    ({ walletAddress, jwt }) => {
      // Zustand persist store for useAuthStore (key: "auth-storage")
      localStorage.setItem(
        "auth-storage",
        JSON.stringify({
          state: {
            isAuthenticated: true,
            accessToken: jwt,
            user: {
              id: walletAddress,
              walletAddress,
              type: "regular",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            isLoading: false,
            expiresAt: Date.now() + 60 * 60 * 1000,
          },
          version: 0,
        })
      );
      // Zustand persist store for useWalletStore (key: "wallet-storage").
      // Both `connected: true` AND `account` are required for WalletProvider's
      // auto-restore effect to populate React-state `address` (otherwise
      // wallet-aware UI like the onboarding modal never triggers).
      localStorage.setItem(
        "wallet-storage",
        JSON.stringify({
          state: { connected: true, account: walletAddress },
          version: 0,
        })
      );

      // Test-only flag honored by WalletProvider's auto-restore: trust the
      // persisted wallet-storage state without calling StellarWalletsKit.
      // Production code never sets this; safe to bake in for headless e2e.
      (window as unknown as { __TASMIL_E2E_BYPASS_KIT__?: boolean }).__TASMIL_E2E_BYPASS_KIT__ =
        true;

      // Pre-mark onboarding as completed so the welcome modal doesn't open
      // in front of every test. Tests that DO want to exercise the modal
      // must call `clearOnboardingState(page)` AFTER `loginAsWallet` to
      // reset this. Without this default, the modal races every navigation
      // and intermittently blocks downstream assertions.
      localStorage.setItem(
        "tasmil-onboarding",
        JSON.stringify({
          state: { hasCompletedWelcome: true },
          version: 0,
        })
      );
    },
    { walletAddress, jwt }
  );

  return { walletAddress, jwt, userId };
}

/**
 * Minimal sibling of `loginAsWallet` that exercises the cookie-only
 * rehydrate path. The backend still sets the `tasmil_auth` cookie via
 * `Set-Cookie`, but the persisted Zustand state is seeded WITHOUT
 * accessToken — mimicking what survives a real page reload.
 *
 * The `<AuthBootstrap />` effect must call `GET /api/auth/me` to
 * repopulate the in-memory token before any chat call goes out.
 */
export async function loginViaCookieOnly(
  page: Page,
  walletAddress: string
): Promise<AuthedSession> {
  const response = await page.request.post(`${BACKEND}/api/auth/wallet/test-login`, {
    data: { walletAddress },
  });
  if (!response.ok()) {
    throw new Error(`test-login failed ${response.status()}: ${await response.text()}`);
  }
  const body = await response.json();
  const jwt: string = body?.data?.accessToken ?? body?.accessToken;
  const userId: string = body?.data?.user?.id ?? body?.user?.id;
  expect(jwt).toBeTruthy();
  expect(userId).toBeTruthy();

  await page.addInitScript(
    ({ walletAddress }) => {
      // Persisted Zustand state AS IT EXISTS AFTER A REAL RELOAD:
      // - isAuthenticated: true
      // - user: present
      // - expiresAt: future
      // - accessToken: ABSENT (Zustand persist drops it via `partialize`)
      localStorage.setItem(
        "auth-storage",
        JSON.stringify({
          state: {
            isAuthenticated: true,
            user: {
              id: walletAddress,
              walletAddress,
              type: "regular",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            expiresAt: Date.now() + 60 * 60 * 1000,
          },
          version: 0,
        })
      );
      localStorage.setItem(
        "wallet-storage",
        JSON.stringify({
          state: { connected: true, account: walletAddress },
          version: 0,
        })
      );
      (window as unknown as { __TASMIL_E2E_BYPASS_KIT__?: boolean }).__TASMIL_E2E_BYPASS_KIT__ = true;
      localStorage.setItem(
        "tasmil-onboarding",
        JSON.stringify({ state: { hasCompletedWelcome: true }, version: 0 })
      );
    },
    { walletAddress }
  );

  return { walletAddress, jwt, userId };
}
