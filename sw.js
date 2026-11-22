const CACHE = 'dms-v1';
const SHELL = ['./', './index.html', './manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // never cache the live database — it must stay online
  if (url.hostname.includes('googleapis.com') || url.hostname.includes('firebaseio.com') ||
      url.hostname.includes('cloudfunctions.net') || url.hostname.includes('workers.dev')) return;

  if (url.origin === location.origin) {
    e.respondWith(
      fetch(req).then(r => { const c = r.clone(); caches.open(CACHE).then(k => k.put(req, c)); return r; })
                .catch(() => caches.match(req).then(m => m || caches.match('./index.html')))
    );
    return;
  }
  // Tailwind / lucide / fonts / images: cache-first
  e.respondWith(caches.match(req).then(m => m || fetch(req).then(r => {
    if (r.ok || r.type === 'opaque') { const c = r.clone(); caches.open(CACHE).then(k => k.put(req, c)); }
    return r;
  })));
});
