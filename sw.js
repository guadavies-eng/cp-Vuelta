const CACHE = 'cpv-v1';
const PRECACHE = [
  './',
  'manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        // Cachear CDN scripts dinámicamente
        if (res.ok && (
          e.request.url.includes('cdnjs.cloudflare.com') ||
          e.request.url.includes('fonts.googleapis.com') ||
          e.request.url.includes('fonts.gstatic.com')
        )) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => {
        // Sin red y sin caché: para HTML devolver página offline básica
        if (e.request.destination === 'document') {
          return caches.match('./');
        }
      });
    })
  );
});
