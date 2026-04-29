/**
 * Shared auth helpers for the e2e suite.
 *
 * Centralises the test-login + admin-provision + DB-cleanup patterns that
 * were copy-pasted across referral-join, referrals-page, topup-admin,
 * profile-credits, end-user-journey, etc. New specs should import from
 * here rather than inlining their own copy.
 */

import { execSync } from "node:child_process";
import { expect, type Page } from "@playwright/test";

export const BACKEND_URL =
  process.env.PLAYWRIGHT_BACKEND_URL ?? "http://localhost:6756";
export const DB_CONTAINER =
  process.env.PLAYWRIGHT_DB_CONTAINER ?? "backend-db-1";
export const DB_NAME = process.env.PLAYWRIGHT_DB_NAME ?? "tasmilfinance";

export interface WalletSession {
  jwt: string;
  walletAddress: string;
  userId: string;
}

export interface AdminSession {
  jwt: string;
  email: string;
}

/** Execute a single-line SQL via docker exec psql. Returns trimmed stdout. */
export function execPsql(sql: string): string {
  return execSync(
    `docker exec ${DB_CONTAINER} psql -U postgres -d ${DB_NAME} -tA -c "${sql
      .replace(/"/g, '\\"')
      .replace(/\n/g, " ")}"`,
    { stdio: ["ignore", "pipe", "pipe"] },
  )
    .toString()
    .trim();
}

/**
 * Cascade-aware delete of any row that references this wallet's user. Mirrors
 * the inline pattern in referral-join.spec.ts. Safe to call when the user
 * doesn't exist — the inner SELECT just returns 0 rows.
 */
export function dbCleanWallet(walletAddress: string): void {
  const userSelect = `(SELECT id FROM users WHERE stellar_pubkey = '${walletAddress}')`;
  // Order matters: chat_usage_commits FKs through user_chat_usage, both with
  // RESTRICT — so they must be cleared before users so the cascade can run.
  execPsql(`DELETE FROM chat_usage_commits WHERE user_id IN ${userSelect}`);
  execPsql(`DELETE FROM user_chat_usage WHERE user_id IN ${userSelect}`);
  execPsql(`DELETE FROM welcome_reward_states WHERE user_id IN ${userSelect}`);
  execPsql(`DELETE FROM reward_volume_events WHERE user_id IN ${userSelect}`);
  execPsql(`DELETE FROM managed_accounts WHERE user_id IN ${userSelect}`);
  execPsql(`DELETE FROM users WHERE stellar_pubkey = '${walletAddress}'`);
  execPsql(`DELETE FROM waitlist_entries WHERE wallet_address = '${walletAddress}'`);
}

/**
 * Seed a waitlist_entries row directly. Returns the new entry id.
 * `referredById` is the FK to another waitlist_entries row (NOT a user id).
 */
export function seedWaitlistEntry(opts: {
  walletAddress: string;
  referralCode: string;
  referredById?: string | null;
}): string {
  const id = `wl_e2e_${Math.random().toString(36).slice(2, 12)}`;
  const referredByLit = opts.referredById ? `'${opts.referredById}'` : "NULL";
  execPsql(
    `INSERT INTO waitlist_entries
       (id, email, wallet_address, status, referral_code, referred_by_id, created_at, updated_at)
     VALUES ('${id}', '${id}@e2e.test', '${opts.walletAddress}', 'CONFIRMED',
             '${opts.referralCode}', ${referredByLit}, NOW(), NOW())`,
  );
  return id;
}

/**
 * POST /api/auth/wallet/test-login + addInitScript that injects the JWT
 * into Zustand-persist localStorage on every navigation. Returns the
 * minted JWT, walletAddress and (looked up via /api/user/me) the user id.
 */
export async function loginAsWallet(
  page: Page,
  walletAddress: string,
): Promise<WalletSession> {
  const response = await page.request.post(`${BACKEND_URL}/api/auth/wallet/test-login`, {
    data: { walletAddress },
  });
  expect(
    response.ok(),
    `wallet test-login HTTP ${response.status()}: ${await response.text()}`,
  ).toBeTruthy();
  const body = await response.json();
  const jwt: string = body?.data?.accessToken ?? body?.accessToken;
  expect(jwt).toBeTruthy();

  const meRes = await fetch(`${BACKEND_URL}/api/user/me`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  if (!meRes.ok) throw new Error(`/api/user/me ${meRes.status}`);
  const meBody = (await meRes.json()) as { data?: { id: string }; id?: string };
  const userId = meBody.data?.id ?? meBody.id ?? "";
  expect(userId).toBeTruthy();

  await page.addInitScript(
    ({ walletAddress, jwt }) => {
      (window as Window & { __WALLET_MOCK__?: unknown }).__WALLET_MOCK__ = {
        isConnected: true,
        address: walletAddress,
        displayAddress: `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`,
        isAuthenticating: false,
      };
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
        }),
      );
      localStorage.setItem(
        "wallet-storage",
        JSON.stringify({ state: { account: walletAddress }, version: 0 }),
      );
    },
    { walletAddress, jwt },
  );

  return { jwt, walletAddress, userId };
}

/**
 * Idempotently create + login an admin (POST /api/admin-auth/create then
 * /api/admin-auth/login). Returns a JWT usable on protected /api/admin/*
 * routes. Treats 400 as "already exists" so the helper is safe across runs.
 */
export async function provisionAdmin(opts: {
  email: string;
  password: string;
  role: "SUPER_ADMIN" | "CAMPAIGN_ADMIN";
}): Promise<AdminSession> {
  const createRes = await fetch(`${BACKEND_URL}/api/admin-auth/create`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(opts),
  });
  if (![200, 201, 400].includes(createRes.status)) {
    throw new Error(`admin create ${createRes.status}: ${await createRes.text()}`);
  }
  const loginRes = await fetch(`${BACKEND_URL}/api/admin-auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: opts.email, password: opts.password }),
  });
  if (!loginRes.ok) throw new Error(`admin login ${loginRes.status}`);
  const body = (await loginRes.json()) as { data?: { accessToken: string } };
  const token = body.data?.accessToken;
  if (!token) throw new Error("no admin jwt");
  return { jwt: token, email: opts.email };
}

/**
 * Workaround for the production Zustand-persist hydration race that ships
 * with /profile/referrals (commit 9a106063). The page redirects on first
 * render when `accessToken` is null, but Zustand's localStorage hydration
 * fires asynchronously AFTER that first render. So a single `page.goto`
 * to a protected route is racey.
 *
 * This helper navigates to a public route (/topup) first, waits for the
 * store to hydrate, and then triggers a Next.js client-side navigation by
 * clicking the sidebar Link — which preserves the same JS bundle and the
 * already-hydrated store, so the protected page sees the JWT on its first
 * render.
 */
export async function gotoAuthed(page: Page, path: string): Promise<void> {
  await page.goto("/topup");
  await page
    .waitForFunction(
      () => {
        const raw = window.localStorage.getItem("auth-storage");
        if (!raw) return false;
        try {
          const parsed = JSON.parse(raw);
          return Boolean(parsed?.state?.accessToken);
        } catch {
          return false;
        }
      },
      undefined,
      { timeout: 10_000 },
    )
    .catch(() => {});
  await page.waitForTimeout(400);
  if (path === "/profile/referrals") {
    const referralsLink = page
      .getByRole("link", { name: /^Referrals$/i })
      .first();
    if (await referralsLink.count()) {
      await referralsLink.click();
      await page
        .waitForURL((url) => url.pathname === path, { timeout: 10_000 })
        .catch(() => {});
    } else {
      await page.goto(path);
    }
  } else {
    await page.goto(path);
  }
  if (!page.url().endsWith(path) && !page.url().includes(`${path}?`)) {
    await page.goto(path);
  }
}
