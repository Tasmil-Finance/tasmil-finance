import type { Page } from "@playwright/test";

/**
 * Clear the persisted onboarding store so the welcome modal opens
 * on the next wallet connect. Must be called BEFORE page.goto().
 */
export async function clearOnboardingState(page: Page): Promise<void> {
  await page.addInitScript(() => {
    window.localStorage.removeItem("tasmil-onboarding");
  });
}

/**
 * Clear the persisted watchlist store so add/remove/persist tests
 * start from a clean slate. Must be called BEFORE page.goto().
 *
 * Uses a one-shot init script — runs once on first navigation, then
 * sets a session sentinel so subsequent reloads do NOT wipe state
 * the test has just added (otherwise reload-persistence assertions
 * become un-testable).
 */
export async function clearWatchlistState(page: Page): Promise<void> {
  await page.addInitScript(() => {
    if (!window.sessionStorage.getItem("__tasmil_watchlist_cleared__")) {
      window.localStorage.removeItem("tasmil.watchlist");
      window.sessionStorage.setItem("__tasmil_watchlist_cleared__", "1");
    }
  });
}
