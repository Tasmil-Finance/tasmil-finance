import { resolve } from "node:path";
import { defineConfig, devices } from "@playwright/test";
import { config } from "dotenv";

/**
 * Load E2E environment variables from .env.test
 * Contains: PLAYWRIGHT_BASE_URL, E2E_WALLET_PUBLIC_KEY, E2E_MAINNET_SECRET_KEY,
 * LANGSMITH_API_KEY, LANGSMITH_PROJECT
 */
config({ path: resolve(__dirname, ".env.test") });

const isDevTunnel = !!process.env.PLAYWRIGHT_BASE_URL;
const runTimestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: "./e2e",

  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: 2,

  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : 2,

  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ["html"],
    ["json", { outputFile: "playwright-report/results.json" }],
    ["junit", { outputFile: "playwright-report/results.xml" }],
  ],

  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000",

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",

    /* Take full-page screenshot on failure */
    screenshot: { mode: "only-on-failure", fullPage: true },

    /* Record video on failure */
    video: "retain-on-failure",

    /* Global timeout for each action */
    actionTimeout: 10000,

    /* Global timeout for navigation */
    navigationTimeout: 30000,

    /* Accept self-signed certs for dev tunnels */
    ignoreHTTPSErrors: isDevTunnel,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },

    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },

    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },

    /* Test against mobile viewports. */
    {
      name: "Mobile Chrome",
      use: { ...devices["Pixel 5"] },
    },
    {
      name: "Mobile Safari",
      use: { ...devices["iPhone 12"] },
    },

    /* Test against branded browsers. */
    {
      name: "Microsoft Edge",
      use: { ...devices["Desktop Edge"], channel: "msedge" },
    },
    {
      name: "Google Chrome",
      use: { ...devices["Desktop Chrome"], channel: "chrome" },
    },

    /* AI Chat E2E — relaxed timeouts for LLM response latency */
    {
      name: "e2e-chat",
      testDir: "./e2e",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
        actionTimeout: 180_000,
        navigationTimeout: 60_000,
        ignoreHTTPSErrors: true,
        storageState: "./e2e/auth.json",
        video: "on",
        screenshot: { mode: "on", fullPage: true },
      },
      timeout: 240_000,
    },
  ],

  /* Run local dev server only when not using an external URL (dev tunnel) */
  ...(isDevTunnel
    ? {}
    : {
        webServer: {
          command: "pnpm dev",
          url: "http://localhost:3000",
          reuseExistingServer: !process.env.CI,
          timeout: 120000,
        },
      }),

  /* Global setup/teardown — creates artifact dirs + summary report */
  globalSetup: "./e2e/global-setup.ts",
  globalTeardown: "./e2e/global-teardown.ts",

  /* Test timeout */
  timeout: 30000,

  /* Expect timeout */
  expect: {
    timeout: 5000,
  },

  /* Output directory — timestamped so each run is preserved */
  outputDir: `e2e/test-results/${runTimestamp}/`,
});
