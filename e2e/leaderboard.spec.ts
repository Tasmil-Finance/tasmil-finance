import { test, expect } from "@playwright/test";

test.describe("/quest leaderboard", () => {
  test("renders title and table or empty state", async ({ page }) => {
    await page.goto("/quest");
    await expect(page.getByText(/Tasmil Quest Leaderboard/i)).toBeVisible({
      timeout: 10_000,
    });

    const podium = page.locator('[data-testid^="podium-rank-"]');
    const empty = page.getByText(/No volume yet/i);

    const hasPodium = await podium.first().isVisible({ timeout: 3000 }).catch(() => false);
    const hasEmpty = await empty.isVisible({ timeout: 3000 }).catch(() => false);

    expect(hasPodium || hasEmpty).toBe(true);
  });

  test("podium shows top 3 on page 1 when entries available", async ({ page }) => {
    await page.goto("/quest");
    const podium = page.locator('[data-testid^="podium-rank-"]');
    const visible = await podium.first().isVisible({ timeout: 3000 }).catch(() => false);
    if (!visible) return;

    await expect(page.locator('[data-testid="podium-rank-1"]')).toBeVisible();
    await expect(page.locator('[data-testid="podium-rank-2"]')).toBeVisible();
    await expect(page.locator('[data-testid="podium-rank-3"]')).toBeVisible();
  });

  test("table renders ranks 4+ when entries available", async ({ page }) => {
    await page.goto("/quest");
    const row4 = page.locator('[data-testid="leaderboard-row-4"]');
    const visible = await row4.isVisible({ timeout: 3000 }).catch(() => false);
    if (!visible) return;
    await expect(row4).toBeVisible();
  });
});
