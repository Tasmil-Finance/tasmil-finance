// Phase 5 image cache Service Worker.
//
// Three caches, distinct strategies:
//   tasmil-token-icons-v1     cache-first, 1yr, prewarmed at install from manifest
//   tasmil-protocol-assets-v1 stale-while-revalidate, 30d
//
// Bumping the version suffix forces a clean refetch on next deploy.
//
// The SW intercepts:
//   1. Direct CDN fetches: tasmil-assets.sgp1.cdn.digitaloceanspaces.com/static/...
//   2. Next.js image-optimizer wraps: /_next/image?url=<encoded-cdn-url>&w=..&q=..
//
// pickCache() inspects both shapes so cache-first works for both <img src=cdn>
// and <Image src={cdn}> consumers.

const TOKEN = "tasmil-token-icons-v1";
const PROTOCOL = "tasmil-protocol-assets-v1";
const ALL = [TOKEN, PROTOCOL];

const MANIFEST_URL = "/asset-manifest.json";

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const res = await fetch(MANIFEST_URL, { cache: "no-store" });
        if (!res.ok) {
          console.warn("[sw-images] manifest fetch failed; install skips prewarm");
          await self.skipWaiting();
          return;
        }
        const manifest = await res.json();
        const cache = await caches.open(TOKEN);
        const urls = Object.values(manifest.tokens || {});
        // Prewarm without addAll (which fails atomically); use individual put.
        await Promise.all(
          urls.map(async (u) => {
            try {
              const r = await fetch(u, { cache: "no-store" });
              if (r.ok) await cache.put(u, r);
            } catch {
              /* tolerate per-URL failures */
            }
          })
        );
      } catch (err) {
        console.warn("[sw-images] install prewarm error:", err);
      }
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => !ALL.includes(k)).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

function pickCache(url) {
  // 1. Direct CDN URL.
  if (url.hostname.endsWith(".cdn.digitaloceanspaces.com")) {
    if (url.pathname.startsWith("/static/tokens/")) return { name: TOKEN, strategy: "cache-first" };
    if (url.pathname.startsWith("/static/protocols/")) return { name: PROTOCOL, strategy: "swr" };
    return null;
  }
  // 2. Next image optimizer wraps remote URLs as /_next/image?url=...
  if (url.pathname.startsWith("/_next/image")) {
    const inner = url.searchParams.get("url");
    if (inner && inner.includes(".cdn.digitaloceanspaces.com/static/tokens/")) {
      return { name: TOKEN, strategy: "cache-first" };
    }
    if (inner && inner.includes(".cdn.digitaloceanspaces.com/static/protocols/")) {
      return { name: PROTOCOL, strategy: "swr" };
    }
  }
  return null;
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  let url;
  try {
    url = new URL(event.request.url);
  } catch {
    return;
  }
  const pick = pickCache(url);
  if (!pick) return;
  event.respondWith(
    (async () => {
      const cache = await caches.open(pick.name);
      const cached = await cache.match(event.request);
      if (pick.strategy === "cache-first" && cached) return cached;
      const fresh = fetch(event.request)
        .then((r) => {
          if (r.ok) cache.put(event.request, r.clone());
          return r;
        })
        .catch(() => cached);
      return cached || fresh;
    })()
  );
});
