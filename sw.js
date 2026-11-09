// Offline support for the ledger. The app shell is cached on the first load. Every later load tries
// the network first, so an update reaches the phone as soon as it is online.
const CACHE = 'daftar-al-mal-v1';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  // Only cache this site's own files; cloud and CDN traffic goes straight to the network.
  if (new URL(request.url).origin !== self.location.origin) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const response = await fetch(request);
      if (response.ok || response.type === 'opaque') cache.put(request, response.clone());
      return response;
    } catch (err) {
      const cached = await cache.match(request) || (request.mode === 'navigate' ? await cache.match('./index.html') : undefined);
      if (cached) return cached;
      throw err;
    }
  })());
});
