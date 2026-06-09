/**
 * GamerTab: Black Vault — Service Worker
 * Strategy:
 *   /assets/* (Vite hashed bundles)  → cache-first  (immutable)
 *   Images / fonts / icons           → cache-first
 *   HTML navigation                  → network-first → app-shell fallback
 *   Supabase API                     → network-only  (let client handle errors)
 *   Everything else                  → network-first → cache fallback
 */

const CACHE_VERSION = 'bv-pokies-offline-v1';
const SHELL_CACHE   = `${CACHE_VERSION}-shell`;
const ASSET_CACHE   = `${CACHE_VERSION}-assets`;
const ALL_CACHES    = [SHELL_CACHE, ASSET_CACHE];

// Known app-shell URLs to pre-cache on install
const SHELL_URLS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-192.webp',
  '/icon-512.webp',
  '/game-logo.webp',
];

// ─── Install ──────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then((cache) => {
        // addAll fails the whole install if one URL fails — use individual adds
        return Promise.allSettled(
          SHELL_URLS.map((url) =>
            cache.add(url).catch((err) => {
              console.warn(`[SW] Failed to pre-cache ${url}:`, err.message);
            })
          )
        );
      })
      .then(() => {
        console.log('[SW] Installed v' + CACHE_VERSION);
        return self.skipWaiting();
      })
  );
});

// ─── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => !ALL_CACHES.includes(k))
            .map((k) => {
              console.log('[SW] Deleting old cache:', k);
              return caches.delete(k);
            })
        )
      )
      .then(() => {
        console.log('[SW] Activated — controlling all clients');
        return self.clients.claim();
      })
  );
});

// ─── Fetch ────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET
  if (request.method !== 'GET') return;

  // Skip chrome-extension, data URIs, etc.
  if (!url.protocol.startsWith('http')) return;

  // ── Supabase: let the client handle it; we do NOT intercept ──────────────
  // Supabase already caches auth sessions in localStorage.
  // DB failures are handled by existing try/catch in components.
  if (url.hostname.includes('supabase.co') || url.hostname.includes('supabase.in')) {
    return; // fall through to browser default
  }

  // ── Vite hashed bundles (/assets/…): immutable → cache-first ─────────────
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(cacheFirst(request, ASSET_CACHE));
    return;
  }

  // ── Static files: images, fonts, icons → cache-first ─────────────────────
  if (/\.(png|jpg|jpeg|webp|gif|svg|ico|woff2?|ttf|eot|otf)$/i.test(url.pathname)) {
    event.respondWith(cacheFirst(request, ASSET_CACHE));
    return;
  }

  // ── HTML navigation → network-first, fall back to cached shell ───────────
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNav(request));
    return;
  }

  // ── Same-origin misc (manifest, etc.) → stale-while-revalidate ───────────
  if (url.origin === self.location.origin) {
    event.respondWith(staleWhileRevalidate(request, SHELL_CACHE));
    return;
  }
});

// ─── Strategy helpers ─────────────────────────────────────────────────────────

/** Cache-first: serve from cache; fetch + cache on miss. */
async function cacheFirst(request, cacheName) {
  const cache  = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const fresh = await fetch(request);
    if (fresh.ok) {
      cache.put(request, fresh.clone()).catch(() => {});
    }
    return fresh;
  } catch (err) {
    console.warn('[SW] cacheFirst offline miss:', request.url);
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

/** Network-first for HTML nav; fall back to cached / or app shell. */
async function networkFirstNav(request) {
  try {
    const fresh = await fetch(request);
    if (fresh.ok) {
      const cache = await caches.open(SHELL_CACHE);
      cache.put(request, fresh.clone()).catch(() => {});
    }
    return fresh;
  } catch {
    // Try exact URL, then root shell
    const cache  = await caches.open(SHELL_CACHE);
    const cached = await cache.match(request) || await cache.match('/');
    if (cached) return cached;

    return new Response(
      `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>GamerTab Black Vault — Offline</title>
  <style>
    body{margin:0;background:#0a0a0f;color:#e0e0e0;font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center;padding:24px}
    h1{color:#e8b800;font-size:1.8rem;margin-bottom:12px}
    p{color:#888;max-width:340px;line-height:1.6}
    button{margin-top:24px;padding:12px 28px;background:rgba(232,184,0,.15);border:1px solid rgba(232,184,0,.4);color:#e8b800;border-radius:10px;font-size:1rem;cursor:pointer}
  </style>
</head>
<body>
  <div>
    <div style="font-size:3rem;margin-bottom:16px">🏛️</div>
    <h1>GamerTab: Black Vault</h1>
    <p>You're offline. Open the app when connected once to enable offline play, then local & AI games work anywhere.</p>
    <button onclick="location.reload()">Retry Connection</button>
  </div>
</body>
</html>`,
      { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }
}

/** Serve cache if available, update in background. */
async function staleWhileRevalidate(request, cacheName) {
  const cache  = await caches.open(cacheName);
  const cached = await cache.match(request);

  const networkFetch = fetch(request)
    .then((fresh) => {
      if (fresh.ok) cache.put(request, fresh.clone()).catch(() => {});
      return fresh;
    })
    .catch(() => null);

  return cached || await networkFetch || new Response('Offline', { status: 503 });
}

// ─── Message handler (e.g. force update from UI) ──────────────────────────────
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data?.type === 'CLEAR_CACHE') {
    caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))));
  }
});
