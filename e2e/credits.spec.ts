import { expect, test, type Page } from "@playwright/test";

const FUNDED_WALLET = "GDQI7LOG3I6R000000000000000000000000000000000000000000";
const FRESH_WALLET = "GFRESHCREDIT000000000000000000000000000000000000000000";
const SERVICE_KEY = process.env.AI_INTERNAL_SHARED_TOKEN ?? "test-shared-token";
const BACKEND = process.env.PLAYWRIGHT_BACKEND_URL ?? "http://localhost:6756";

interface TokenizedWallet {
  walletAddress: string;
  jwt: string;
}

async function loginAsWallet(page: Page, walletAddress: string): Promise<TokenizedWallet> {
  const response = await page.request.post(`${BACKEND}/api/auth/wallet/test-login`, {
    data: { walletAddress },
  });
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  const jwt: string = body?.data?.accessToken ?? body?.accessToken;
  expect(jwt).toBeTruthy();

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

  return { walletAddress, jwt };
}

async function getInternalUserId(jwt: string): Promise<string> {
  const res = await fetch(`${BACKEND}/api/user/me`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  if (!res.ok) throw new Error(`/api/user/me ${res.status}`);
  const body = (await res.json()) as { data?: { id: string }; id?: string };
  return body.data?.id ?? body.id ?? "";
}

async function applyCreditDelta(args: {
  userId: string;
  reason: string;
  deltaCredits: number;
  idempotencyKey: string;
}) {
  const res = await fetch(`${BACKEND}/api/internal/credit/apply`, {
    method: "POST",
    headers: { "x-service-key": SERVICE_KEY, "content-type": "application/json" },
    body: JSON.stringify(args),
  });
  if (!res.ok) throw new Error(`apply failed ${res.status}: ${await res.text()}`);
  return res.json();
}

function attachConsoleAndNetworkAsserts(page: Page) {
  const errors: string[] = [];
  const badResponses: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("response", (resp) => {
    const url = resp.url();
    const status = resp.status();
    if (status >= 400 && status !== 401 && url.startsWith(BACKEND)) {
      badResponses.push(`${status} ${url}`);
    }
  });
  return { errors, badResponses };
}

test.describe("Phase 0 — Credit Ledger", () => {
  test.describe.configure({ mode: "serial" });

  test("Scenario 1: funded wallet sees balance=0 and empty ledger", async ({ page }) => {
    const { jwt } = await loginAsWallet(page, FUNDED_WALLET);
    const userId = await getInternalUserId(jwt);

    await fetch(`${BACKEND}/api/internal/credit/apply`, {
      method: "POST",
      headers: { "x-service-key": SERVICE_KEY, "content-type": "application/json" },
      body: JSON.stringify({
        userId,
        reason: "ADMIN_ADJUST",
        deltaCredits: 0,
        idempotencyKey: `e2e:scenario1:bootstrap:${userId}`,
      }),
    });

    const probes = attachConsoleAndNetworkAsserts(page);
    await page.goto("/profile/credits");

    await expect(page.getByTestId("credits-page")).toBeVisible();
    await expect(page.getByTestId("credits-balance")).toHaveText("0");
    await expect(page.getByTestId("ledger-empty")).toBeVisible();

    expect(probes.errors).toEqual([]);
    expect(probes.badResponses).toEqual([]);
  });

  test("Scenario 2: PROMO_GRANT +50 → balance=50, one ledger row", async ({ page }) => {
    const { jwt } = await loginAsWallet(page, FUNDED_WALLET);
    const userId = await getInternalUserId(jwt);

    await applyCreditDelta({
      userId,
      reason: "PROMO_GRANT",
      deltaCredits: 50,
      idempotencyKey: `e2e:scenario2:promo:${userId}`,
    });

    const probes = attachConsoleAndNetworkAsserts(page);
    await page.goto("/profile/credits");

    await expect(page.getByTestId("credits-balance")).toHaveText("50");
    const rows = page.getByTestId("ledger-table").locator("tbody tr");
    await expect(rows).toHaveCount(1);
    await expect(rows.first()).toContainText("PROMO GRANT");
    await expect(rows.first()).toContainText("+50");

    expect(probes.errors).toEqual([]);
    expect(probes.badResponses).toEqual([]);
  });

  test("Scenario 3: idempotency replay → balance still 50, one row total", async ({ page }) => {
    const { jwt } = await loginAsWallet(page, FUNDED_WALLET);
    const userId = await getInternalUserId(jwt);

    await applyCreditDelta({
      userId,
      reason: "PROMO_GRANT",
      deltaCredits: 50,
      idempotencyKey: `e2e:scenario2:promo:${userId}`,
    });

    const probes = attachConsoleAndNetworkAsserts(page);
    await page.goto("/profile/credits");

    await expect(page.getByTestId("credits-balance")).toHaveText("50");
    const rows = page.getByTestId("ledger-table").locator("tbody tr");
    await expect(rows).toHaveCount(1);

    expect(probes.errors).toEqual([]);
    expect(probes.badResponses).toEqual([]);
  });

  test("Scenario 4: brand-new wallet → CreditAccount exists, balance=0, ledger empty", async ({
    page,
  }) => {
    const { jwt } = await loginAsWallet(page, FRESH_WALLET);
    const userId = await getInternalUserId(jwt);

    const probes = attachConsoleAndNetworkAsserts(page);
    await page.goto("/profile/credits");

    await expect(page.getByTestId("credits-balance")).toHaveText("0");
    await expect(page.getByTestId("ledger-empty")).toBeVisible();

    const account = await fetch(`${BACKEND}/api/internal/credit/apply`, {
      method: "POST",
      headers: { "x-service-key": SERVICE_KEY, "content-type": "application/json" },
      body: JSON.stringify({
        userId,
        reason: "ADMIN_ADJUST",
        deltaCredits: 0,
        idempotencyKey: `e2e:scenario4:probe:${userId}`,
      }),
    });
    expect(account.ok).toBe(true);

    expect(probes.errors).toEqual([]);
    expect(probes.badResponses).toEqual([]);
  });
});
