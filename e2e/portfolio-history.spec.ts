import { expect, test } from "@playwright/test";

const ADDR = "GA7XYZ7XYZ7XYZ7XYZ7XYZ7XYZ7XYZ7XYZ7XYZ7XYZ7XYZ7XYZ7";
const COUNTERPARTY = "GBOTHER1OTHER1OTHER1OTHER1OTHER1OTHER1OTHER1OTHER1";

const fixturePage = {
  _embedded: {
    records: [
      {
        id: "op_send",
        type: "payment",
        created_at: "2026-05-04T10:00:00Z",
        transaction_hash: "tx_send",
        paging_token: "1",
        transaction_successful: true,
        from: ADDR,
        to: COUNTERPARTY,
        amount: "10",
        asset_type: "native",
        transaction: {
          fee_charged: "100",
          memo_type: "none",
          ledger: 1,
          operation_count: 1,
          successful: true,
        },
      },
      {
        id: "op_swap",
        type: "path_payment_strict_send",
        created_at: "2026-05-04T09:55:00Z",
        transaction_hash: "tx_swap",
        paging_token: "2",
        transaction_successful: true,
        from: ADDR,
        to: ADDR,
        source_amount: "100",
        source_asset_type: "native",
        amount: "23.5",
        asset_code: "USDC",
        asset_issuer: "GA_ISSUER",
        asset_type: "credit_alphanum4",
        transaction: {
          fee_charged: "100",
          memo_type: "none",
          ledger: 2,
          operation_count: 1,
          successful: true,
        },
      },
      {
        id: "op_fail",
        type: "payment",
        created_at: "2026-05-04T09:50:00Z",
        transaction_hash: "tx_fail",
        paging_token: "3",
        transaction_successful: false,
        from: ADDR,
        to: COUNTERPARTY,
        amount: "1",
        asset_type: "native",
        transaction: {
          fee_charged: "100",
          memo_type: "none",
          ledger: 3,
          operation_count: 1,
          successful: false,
        },
      },
    ],
  },
};

test.describe("/portfolio?tab=history", () => {
  test.beforeEach(async ({ page }) => {
    // Mock Horizon operations endpoint with our fixture page (no nextCursor → infinite-query stops).
    await page.route(/horizon.*\/accounts\/.*\/operations.*/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(fixturePage),
      });
    });

    // Stub wallet connection without going through the real Stellar Wallets Kit.
    // Mirrors `e2e/helpers/auth.ts`: persist `wallet-storage` Zustand envelope,
    // bypass the kit re-handshake, and pre-mark the welcome modal complete so
    // it doesn't race in front of the history list.
    await page.addInitScript((addr) => {
      window.localStorage.setItem(
        "wallet-storage",
        JSON.stringify({
          state: { connected: true, account: addr },
          version: 0,
        })
      );
      window.localStorage.setItem(
        "tasmil-onboarding",
        JSON.stringify({
          state: { hasCompletedWelcome: true },
          version: 0,
        })
      );
      (window as unknown as { __TASMIL_E2E_BYPASS_KIT__?: boolean }).__TASMIL_E2E_BYPASS_KIT__ =
        true;
    }, ADDR);
  });

  test("renders one row per transaction", async ({ page }) => {
    await page.goto("/portfolio?tab=history");
    await expect(page.getByText("Sent").first()).toBeVisible();
    await expect(page.getByText("Swapped").first()).toBeVisible();
    await expect(page.getByText("Transaction Failed").first()).toBeVisible();
  });

  test("swap row shows SRC → DST", async ({ page }) => {
    await page.goto("/portfolio?tab=history");
    const swapRow = page.locator("button", { hasText: "Swapped" }).first();
    await expect(swapRow).toContainText("XLM");
    await expect(swapRow).toContainText("USDC");
    await expect(swapRow).toContainText("→");
  });

  test("filter chip narrows to swaps", async ({ page }) => {
    await page.goto("/portfolio?tab=history");
    await expect(page.getByText("Swapped").first()).toBeVisible();
    await page.getByRole("button", { name: "Swap", exact: true }).click();
    await expect(page).toHaveURL(/filter=swap/);
    await expect(page.getByText("Sent")).toHaveCount(0);
    await expect(page.getByText("Swapped").first()).toBeVisible();
  });

  test("expanding row reveals fee and tx hash", async ({ page }) => {
    await page.goto("/portfolio?tab=history");
    await page.getByRole("button", { name: /sent/i }).first().click();
    const panel = page.getByTestId("tx-detail-panel").first();
    await expect(panel).toBeVisible();
    await expect(panel).toContainText("tx_send");
    await expect(panel).toContainText("0.0000100 XLM");
  });
});
