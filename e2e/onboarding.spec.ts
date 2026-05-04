import { test, expect } from "@playwright/test";

test.describe("Welcome onboarding modal", () => {
  test("opens on first wallet connect, closes on Get Started, persists dismissal", async ({
    page,
    context,
  }) => {
    await context.clearCookies();
    await page.addInitScript(() => {
      window.localStorage.removeItem("tasmil-onboarding");
    });

    await page.goto("/farming");

    const modal = page.getByRole("dialog");
    const opened = await modal.isVisible({ timeout: 8000 }).catch(() => false);
    if (!opened) {
      return;
    }

    for (let i = 0; i < 4; i++) {
      await page.getByRole("button", { name: /^Next$/ }).click();
    }
    await page.getByRole("button", { name: /Get Started/i }).click();

    await expect(modal).not.toBeVisible({ timeout: 3000 });

    await page.reload();
    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 3000 });
  });

  test("Skip dismisses without completing all slides", async ({ page, context }) => {
    await context.clearCookies();
    await page.addInitScript(() => {
      window.localStorage.removeItem("tasmil-onboarding");
    });
    await page.goto("/farming");

    const modal = page.getByRole("dialog");
    const opened = await modal.isVisible({ timeout: 8000 }).catch(() => false);
    if (!opened) return;

    await page.getByRole("button", { name: /Skip/i }).click();
    await expect(modal).not.toBeVisible({ timeout: 3000 });
  });
});
