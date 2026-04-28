import { expect, test, type ConsoleMessage, type Page } from "@playwright/test";

interface PackageExpectation {
  id: string;
  usd: string;
  credits: string;
  points: string;
  bonusPercent: number;
}

const EXPECTED_PACKAGES: readonly PackageExpectation[] = [
  { id: "starter", usd: "$5",   credits: "100",   points: "1,000",  bonusPercent: 0 },
  { id: "plus",    usd: "$20",  credits: "440",   points: "4,000",  bonusPercent: 10 },
  { id: "pro",     usd: "$50",  credits: "1,200", points: "10,000", bonusPercent: 20 },
  { id: "whale",   usd: "$200", credits: "5,200", points: "40,000", bonusPercent: 30 },
] as const;

function attachConsoleSpy(page: Page): { errors: string[] } {
  const errors: string[] = [];
  page.on("console", (msg: ConsoleMessage) => {
    if (msg.type() === "error") {
      errors.push(msg.text());
    }
  });
  page.on("pageerror", (err) => {
    errors.push(`pageerror: ${err.message}`);
  });
  return { errors };
}

test.describe("/topup — Pricing catalog", () => {
  test("renders exactly 4 package cards with the correct values", async ({ page }) => {
    const { errors } = attachConsoleSpy(page);

    await page.goto("/topup");

    await expect(page.getByTestId("topup-page-title")).toBeVisible();

    const cards = page.locator(
      '[data-testid^="package-card-"]:not([data-testid*="-bonus"]):not([data-testid*="-usd"]):not([data-testid*="-credits"]):not([data-testid*="-points"]):not([data-testid*="-buy-"])',
    );
    await expect(cards).toHaveCount(4);

    for (const expected of EXPECTED_PACKAGES) {
      const card = page.getByTestId(`package-card-${expected.id}`);
      await expect(card).toBeVisible();
      await expect(page.getByTestId(`package-card-${expected.id}-usd`)).toHaveText(expected.usd);
      await expect(page.getByTestId(`package-card-${expected.id}-credits`)).toContainText(expected.credits);
      await expect(page.getByTestId(`package-card-${expected.id}-points`)).toContainText(expected.points);

      if (expected.bonusPercent > 0) {
        await expect(page.getByTestId(`package-card-${expected.id}-bonus`)).toContainText(
          `+${expected.bonusPercent}% bonus`,
        );
      } else {
        await expect(page.getByTestId(`package-card-${expected.id}-bonus`)).toHaveCount(0);
      }
    }

    expect(errors, `Console errors during /topup load: ${errors.join("\n")}`).toEqual([]);
  });

  test("each Buy-with-crypto button links to the package's crypto-quote placeholder", async ({ page }) => {
    const { errors } = attachConsoleSpy(page);
    await page.goto("/topup");

    for (const pkg of EXPECTED_PACKAGES) {
      const button = page.getByTestId(`package-card-${pkg.id}-buy-crypto`);
      const href = await button.getAttribute("href");
      expect(href).toBe(`/topup/${pkg.id}/quote/crypto`);
    }

    expect(errors).toEqual([]);
  });

  test("each Buy-with-bank-transfer button links to the package's fiat-quote placeholder", async ({ page }) => {
    const { errors } = attachConsoleSpy(page);
    await page.goto("/topup");

    for (const pkg of EXPECTED_PACKAGES) {
      const button = page.getByTestId(`package-card-${pkg.id}-buy-fiat`);
      const href = await button.getAttribute("href");
      expect(href).toBe(`/topup/${pkg.id}/quote/fiat`);
    }

    expect(errors).toEqual([]);
  });

  test("clicking a CTA navigates without throwing console errors (Phase 2 destination may 404)", async ({ page }) => {
    const { errors } = attachConsoleSpy(page);
    await page.goto("/topup");

    const button = page.getByTestId("package-card-starter-buy-crypto");
    await button.click();

    await page.waitForURL("**/topup/starter/quote/crypto");

    expect(
      errors,
      `Unexpected console errors after CTA navigation: ${errors.join("\n")}`,
    ).toEqual([]);
  });
});
