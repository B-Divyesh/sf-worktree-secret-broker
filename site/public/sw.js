const CACHE = 'wsb-site-v4';
const SHELL = ['/', '/demo', '/privacy', '/terms', '/key-orchard.webp', '/fonts/atkinson-400.woff2', '/fonts/atkinson-700.woff2', '/fonts/fraunces-600-700.woff2', '__BUILD_ASSETS__'];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL))));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))));
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== location.origin) return;
  event.respondWith((async () => {
    const hit = await caches.match(event.request, { ignoreVary: true });
    if (hit) return hit;
    const response = await fetch(event.request);
    if (response.ok) {
      const cache = await caches.open(CACHE);
      await cache.put(event.request, response.clone());
    }
    return response;
  })());
});
