// Minimal runtime cache for Unity Web builds
const CACHE = 'unity-webgame-v1';

self.addEventListener('install', (event) => {
  // You can pre-cache files here if you want; keeping it empty keeps updates simple.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  // Only cache GET requests
  if (req.method !== 'GET') return;

  // Network-first for build files; cache-first for everything else
  const isBuild = req.url.includes('/Build/');
  if (isBuild) {
    event.respondWith(
      fetch(req).then(resp => {
        const copy = resp.clone();
        caches.open(CACHE).then(cache => cache.put(req, copy));
        return resp;
      }).catch(() => caches.match(req))
    );
  } else {
    event.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(resp => {
        const copy = resp.clone();
        caches.open(CACHE).then(cache => cache.put(req, copy));
        return resp;
      }))
    );
  }
});
