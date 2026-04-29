"use client";

import { useEffect } from "react";

/**
 * Conditionally registers public/sw-images.js. Activates iff:
 *   1. NEXT_PUBLIC_ENABLE_SW_CACHE === "true" at build time, OR
 *   2. window.__NEXT_PUBLIC_ENABLE_SW_CACHE_OVERRIDE__ === "true" at runtime
 *      (used by Playwright e2e via addInitScript so the SW can be exercised
 *      against the dev FE without a production build).
 *
 * Returns null (no rendered output).
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    const buildFlag = process.env.NEXT_PUBLIC_ENABLE_SW_CACHE === "true";
    const runtimeOverride =
      typeof window !== "undefined" &&
      (window as unknown as { __NEXT_PUBLIC_ENABLE_SW_CACHE_OVERRIDE__?: string })
        .__NEXT_PUBLIC_ENABLE_SW_CACHE_OVERRIDE__ === "true";
    if (!buildFlag && !runtimeOverride) return;

    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw-images.js", { scope: "/" }).catch((err) => {
      console.warn("[sw] register failed:", err);
    });
  }, []);

  return null;
}
