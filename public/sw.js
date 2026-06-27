// Service Worker for Leka Hotel PWA with Instant Update Activation
const CACHE_NAME = "leka-hotel-v2";
const PRECACHE_ASSETS = [
  "/",
  "/manifest.json",
  "/fav.png",
  "/logo.png"
];

// Install Event — caching core assets and skipping waiting to activate immediately
self.addEventListener("install", (event) => {
  self.skipWaiting(); // Force active service worker to stop waiting and take control
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
});

// Activate Event — claim clients immediately and clear old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(), // Claim all active tabs/windows immediately
      caches.keys().then((keys) => {
        return Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        );
      })
    ])
  );
});

// Fetch Event — Network-First Strategy (Falls back to Cache when offline)
// This guarantees that any new deployment is reflected immediately when online.
self.addEventListener("fetch", (event) => {
  // Only handle HTTP/HTTPS requests (avoid chrome-extension:// etc.)
  if (!event.request.url.startsWith("http")) return;

  // STRICT CACHE RULE: Do NOT attempt to cache non-GET requests (e.g. POST, PUT, DELETE)
  if (event.request.method !== "GET") {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // If request is successful, clone it and update cache
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Network failed (offline), check cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // If no cache, return fallback response or let it fail gracefully
          return new Response("Offline mode. Connection required for this resource.", {
            status: 503,
            statusText: "Service Unavailable",
            headers: new Headers({ "Content-Type": "text/plain" })
          });
        });
      })
  );
});
