/**
 * Phase 4 Task 4.8 — Referral JOIN flow e2e
 *
 * Three scenarios:
 *   S1 organic signup       — wallet has no referredById → /profile/referrals
 *                             shows referralCode, "Not yet" join badge,
 *                             empty events.
 *   S2 referred signup      — invitee.waitlistEntry.referredById = inviter
 *                             entry id. Logging the invitee in fires
 *                             AuthService.upsertAndIssueToken →
 *                             ReferralService.creditJoinIfEligible → +20
 *                             credits + 1 JOIN event + inviter
 *                             successfulReferralCount incremented.
 *   S3 replay safety        — second login of the same invitee does NOT
 *                             double-credit (unique(userId, kind, sourceId)
 *                             on referral_events). Snapshot still 20 credits,
 *                             1 JOIN event, inviter count still 1.
 *
 * Pre-conditions for the run:
 *   - dev backend at PLAYWRIGHT_BACKEND_URL (default http://localhost:6756)
 *     running with NODE_ENV != 'production' so /api/auth/wallet/test-login
 *     mints a JWT.
 *   - dev DB exposed via `docker exec backend-db-1 psql -U postgres -d
 *     tasmilfinance ...` — used to seed waitlist_entries directly because
 *     Phase 4 ships no test-only seed endpoint.
 *   - playwright.config.ts auto-starts the FE on http://localhost:3000.
 */

import { execSync } from "node:child_process";
import { expect, test, type Page } from "@playwright/test";
import { attachConsoleSpy } from "./_helpers/console-filter";

const BACKEND = process.env.PLAYWRIGHT_BACKEND_URL ?? "http://localhost:6756";
const DB_CONTAINER = process.env.PLAYWRIGHT_DB_CONTAINER ?? "backend-db-1";
const DB_NAME = process.env.PLAYWRIGHT_DB_NAME ?? "tasmilfinance";

// Use deterministic 56-char G-prefixed pseudo-Stellar pubkeys. They never need
// to validate against StrKey because /api/auth/wallet/test-login skips that
// check; it only requires `walletAddress.length >= 4`.
const ORGANIC_WALLET = "GREFERRALORGANIC1000000000000000000000000000000000000000";
const INVITER_WALLET = "GREFERRALINVITER1000000000000000000000000000000000000000";
const INVITEE_WALLET = "GREFERRALINVITEE1000000000000000000000000000000000000000";

const ORGANIC_REFCODE = "ORG1E2E";
const INVITER_REFCODE = "INV1E2E";
const INVITEE_REFCODE = "IVE1E2E";

interface Session {
  walletAddress: string;
  jwt: string;
  userId: string;
}

interface ReferralEventDto {
  kind: "JOIN" | "X_SHARE";
  creditsAwarded: number;
  occurredAt: string;
}

interface ReferralSnapshot {
  referralCode: string | null;
  totalEarnedCredits: number;
  joinClaimedAt: string | null;
  xLinked: boolean;
  recentEvents: ReferralEventDto[];
}

function execPsql(sql: string): string {
  return execSync(
    `docker exec ${DB_CONTAINER} psql -U postgres -d ${DB_NAME} -tA -c "${sql.replace(/"/g, '\\"').replace(/\n/g, " ")}"`,
    { stdio: ["ignore", "pipe", "pipe"] },
  )
    .toString()
    .trim();
}

function dbCleanWallet(walletAddress: string): void {
  // users.id is referenced by 8 child tables; only credit_accounts,
  // referral_events, and topups CASCADE. The rest (welcome_reward_states,
  // managed_accounts, reward_volume_events, user_chat_usage,
  // chat_usage_commits) RESTRICT — must be deleted explicitly first.
  // chat_usage_commits FKs through user_chat_usage so order matters.
  const userSelect = `(SELECT id FROM users WHERE stellar_pubkey = '${walletAddress}')`;
  execPsql(`DELETE FROM chat_usage_commits WHERE user_id IN ${userSelect}`);
  execPsql(`DELETE FROM user_chat_usage WHERE user_id IN ${userSelect}`);
  execPsql(`DELETE FROM welcome_reward_states WHERE user_id IN ${userSelect}`);
  execPsql(`DELETE FROM reward_volume_events WHERE user_id IN ${userSelect}`);
  execPsql(`DELETE FROM managed_accounts WHERE user_id IN ${userSelect}`);
  // users delete now cascades credit_accounts (→credit_ledger),
  // referral_events, and topups.
  execPsql(`DELETE FROM users WHERE stellar_pubkey = '${walletAddress}'`);
  execPsql(`DELETE FROM waitlist_entries WHERE wallet_address = '${walletAddress}'`);
}

function seedWaitlistEntry(opts: {
  walletAddress: string;
  referralCode: string;
  referredById?: string | null;
}): string {
  const id = `wl_e2e_${Math.random().toString(36).slice(2, 12)}`;
  const referredByLit = opts.referredById ? `'${opts.referredById}'` : "NULL";
  // WaitlistStatus enum is { PENDING, CONFIRMED, ACCESS_SENT, UNSUBSCRIBED,
  // BOUNCED } — CONFIRMED is the closest analogue to "approved/active".
  // updated_at has no default so we set it explicitly.
  execPsql(
    `INSERT INTO waitlist_entries
       (id, email, wallet_address, status, referral_code, referred_by_id, created_at, updated_at)
     VALUES ('${id}', '${id}@e2e.test', '${opts.walletAddress}', 'CONFIRMED',
             '${opts.referralCode}', ${referredByLit}, NOW(), NOW())`,
  );
  return id;
}

function getInviterSuccessfulCount(walletAddress: string): number {
  const out = execPsql(
    `SELECT successful_referral_count FROM waitlist_entries WHERE wallet_address = '${walletAddress}'`,
  );
  if (out === "") throw new Error(`No waitlist_entry for ${walletAddress}`);
  return Number.parseInt(out, 10);
}

async function loginAsWallet(page: Page, walletAddress: string): Promise<Session> {
  const response = await page.request.post(`${BACKEND}/api/auth/wallet/test-login`, {
    data: { walletAddress },
  });
  expect(
    response.ok(),
    `test-login HTTP ${response.status()}: ${await response.text()}`,
  ).toBeTruthy();
  const body = await response.json();
  const jwt: string = body?.data?.accessToken ?? body?.accessToken;
  expect(jwt).toBeTruthy();

  const meRes = await fetch(`${BACKEND}/api/user/me`, {
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

  return { walletAddress, jwt, userId };
}

async function fetchReferralSnapshot(jwt: string): Promise<ReferralSnapshot> {
  const res = await fetch(`${BACKEND}/api/referral/me`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  if (!res.ok) throw new Error(`/api/referral/me ${res.status}: ${await res.text()}`);
  const body = (await res.json()) as { data?: ReferralSnapshot } | ReferralSnapshot;
  return ("data" in body && body.data ? body.data : body) as ReferralSnapshot;
}

test.describe("Phase 4 — Referral JOIN flow", () => {
  // The three scenarios share the inviter+invitee state across S2 → S3 so we
  // serialize them. S1 is independent.
  test.describe.configure({ mode: "serial" });

  test.beforeAll(() => {
    // Pre-clean any stale rows from previous runs.
    dbCleanWallet(ORGANIC_WALLET);
    dbCleanWallet(INVITER_WALLET);
    dbCleanWallet(INVITEE_WALLET);
  });

  test("Scenario 1: organic signup → referralCode visible, no claim, no events", async ({
    page,
  }) => {
    seedWaitlistEntry({
      walletAddress: ORGANIC_WALLET,
      referralCode: ORGANIC_REFCODE,
      referredById: null,
    });

    const session = await loginAsWallet(page, ORGANIC_WALLET);
    const { errors } = attachConsoleSpy(page);

    await page.goto("/profile/referrals");
    await expect(page.getByTestId("referrals-root")).toBeVisible();
    await expect(page.getByTestId("referrals-code")).toContainText(ORGANIC_REFCODE);
    await expect(page.getByTestId("referrals-join-badge")).toContainText(/not yet/i);
    await expect(page.getByTestId("referrals-events-empty")).toBeVisible();

    // Defensive backend assertion — totalEarnedCredits must be 0.
    const snap = await fetchReferralSnapshot(session.jwt);
    expect(snap.totalEarnedCredits).toBe(0);
    expect(snap.joinClaimedAt).toBeNull();
    expect(snap.recentEvents).toHaveLength(0);

    expect(errors).toEqual([]);
  });

  test("Scenario 2: referred signup → +20 credits, JOIN event, inviter count++", async ({
    page,
  }) => {
    const inviterEntryId = seedWaitlistEntry({
      walletAddress: INVITER_WALLET,
      referralCode: INVITER_REFCODE,
      referredById: null,
    });
    seedWaitlistEntry({
      walletAddress: INVITEE_WALLET,
      referralCode: INVITEE_REFCODE,
      referredById: inviterEntryId,
    });

    const session = await loginAsWallet(page, INVITEE_WALLET);
    const { errors } = attachConsoleSpy(page);

    await page.goto("/profile/referrals");
    await expect(page.getByTestId("referrals-root")).toBeVisible();
    await expect(page.getByTestId("referrals-code")).toContainText(INVITEE_REFCODE);
    await expect(page.getByTestId("referrals-join-badge")).toContainText(/claimed/i);
    await expect(page.getByTestId("referrals-total-credits")).toContainText("20");
    await expect(page.getByTestId("referrals-events-row-JOIN")).toBeVisible();

    // Backend snapshot — defensive parity check.
    const snap = await fetchReferralSnapshot(session.jwt);
    expect(snap.totalEarnedCredits).toBe(20);
    expect(snap.joinClaimedAt).not.toBeNull();
    const joinEvents = snap.recentEvents.filter((e) => e.kind === "JOIN");
    expect(joinEvents).toHaveLength(1);
    expect(joinEvents[0].creditsAwarded).toBe(20);

    // Inviter's successfulReferralCount incremented.
    const inviterCount = getInviterSuccessfulCount(INVITER_WALLET);
    expect(inviterCount).toBe(1);

    expect(errors).toEqual([]);
  });

  test("Scenario 3: replay safety — second login does not double-credit", async ({ page }) => {
    // Same invitee wallet — call test-login again. Per AuthService:
    //   await this.referralService.creditJoinIfEligible(user.id);
    // creditJoinIfEligible relies on referral_events.@@unique(userId, kind,
    // sourceId) → P2002 on retry → no second credit_ledger row, no second
    // counter increment.
    const session = await loginAsWallet(page, INVITEE_WALLET);

    const snap = await fetchReferralSnapshot(session.jwt);
    expect(snap.totalEarnedCredits).toBe(20);
    const joinEvents = snap.recentEvents.filter((e) => e.kind === "JOIN");
    expect(joinEvents).toHaveLength(1);

    // Inviter counter must still be 1, not 2.
    const inviterCount = getInviterSuccessfulCount(INVITER_WALLET);
    expect(inviterCount).toBe(1);
  });
});
