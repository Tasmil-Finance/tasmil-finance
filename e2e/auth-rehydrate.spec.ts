import { expect, test } from "@playwright/test";
import { freshWallet, loginViaCookieOnly } from "./helpers/auth";

test.describe("Auth rehydrate (/api/auth/me)", () => {
  test.skip(process.env.NODE_ENV === "production", "test-login is disabled on production");

  test("calls /api/auth/me on mount when accessToken missing", async ({ page }) => {
    const wallet = freshWallet();
    await loginViaCookieOnly(page, wallet);

    const meRequestPromise = page.waitForRequest(
      (req) => req.url().endsWith("/api/auth/me") && req.method() === "GET",
      { timeout: 15_000 }
    );

    await page.goto("/dashboard");
    const meRequest = await meRequestPromise;
    const meResponse = await meRequest.response();
    expect(meResponse?.status()).toBe(200);
  });

  test("chat call after rehydrate sends Authorization header and is not 403/500", async ({ page }) => {
    const wallet = freshWallet();
    await loginViaCookieOnly(page, wallet);

    // Capture the agui request (POST to /agui/* SSE endpoint).
    const aguiRequestPromise = page.waitForRequest(
      (req) => /\/agui\//.test(req.url()) && req.method() === "POST",
      { timeout: 20_000 }
    );

    await page.goto("/chat/new");

    // Wait for chat input then send a message.
    const input = page.locator("textarea, input[type=text]").first();
    await input.waitFor({ timeout: 10_000 });
    await input.fill("Hello");
    await input.press("Enter");

    const aguiRequest = await aguiRequestPromise;
    const authHeader = aguiRequest.headers()["authorization"];
    expect(authHeader).toMatch(/^Bearer\s+\S+/);

    // Response must NOT be 403 (auth missed) or 500 (ImportError regression).
    const aguiResponse = await aguiRequest.response();
    const status = aguiResponse?.status() ?? 0;
    expect(status).not.toBe(403);
    expect(status).not.toBe(500);

    // No "missing wallet identity" toast.
    await expect(page.getByText(/missing a usable wallet identity/i)).toHaveCount(0);
  });
});
