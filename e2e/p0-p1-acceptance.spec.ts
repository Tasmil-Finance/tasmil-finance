/**
 * P0/P1 Acceptance Suite
 *
 * One-stop ship-readiness gate covering the six tasks in the May 2026
 * P0/P1 list. Each describe block maps to one task; each test names
 * the acceptance criterion verbatim.
 *
 * Discipline:
 * - Every test calls loginAsWallet(page, freshWallet()) BEFORE goto.
 * - No silent skips — strict expect().toBeVisible({ timeout }).
 * - localStorage cleared via addInitScript when test depends on
 *   per-device state.
 * - Run: pnpm test:e2e -- p0-p1-acceptance.spec.ts
 *
 * Spec: docs/superpowers/specs/2026-05-04-p0-p1-acceptance-design.md
 */
import { expect, test } from "@playwright/test";
import { freshWallet, loginAsWallet } from "./helpers/auth";
import { applyCreditDelta } from "./helpers/backend";
import { clearOnboardingState, clearWatchlistState } from "./helpers/state";

test.describe("T1 — Onboarding guide (P0)", () => {
  // tests added in Task 6
});

test.describe("T2 — Farming UI (P0)", () => {
  // tests added in Task 7
});

test.describe("T3 — Credit mechanic (P1)", () => {
  // tests added in Task 8
});

test.describe("T4 — Protocol/Reward split (P1)", () => {
  // tests added in Task 9
});

test.describe("T5 — History display Freighter-style (P1)", () => {
  // tests added in Task 10
});

test.describe("T6 — Asset selector (P1)", () => {
  // tests added in Task 11
});
