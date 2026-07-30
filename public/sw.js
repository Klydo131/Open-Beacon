const CACHE_PREFIX = 'open-beacon-';
const CACHE_NAME = `${CACHE_PREFIX}v2`;
const SHELL = ['/', '/dashboard/', '/manifest.webmanifest', '/icon.svg'];
const PUBLIC_ASSET_TYPES = new Set(['font', 'image', 'script', 'style']);

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter(
            (key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME,
          )
          .map((key) => caches.delete(key)),
      ),
    ),
  );
  self.clients.claim();
});

async function fetchAndCachePublicAsset(request) {
  try {
    const response = await fetch(request);
    if (response.ok && response.type === 'basic') {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    return (await caches.match(request)) || Response.error();
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(
        async () =>
          (await caches.match(request)) ||
          (await caches.match('/')) ||
          Response.error(),
      ),
    );
    return;
  }

  if (url.search === '' && PUBLIC_ASSET_TYPES.has(request.destination)) {
    event.respondWith(fetchAndCachePublicAsset(request));
  }
});
