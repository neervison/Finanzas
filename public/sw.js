// Mis Pagos — Service Worker (permite instalar la app y abrirla rápido)
// Regla de oro (la misma de PropinasApp): la API /api/ NUNCA se cachea,
// porque los datos viven en el servidor y deben llegar siempre frescos.
const CACHE = 'mispagos-v3';
const BASE = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(BASE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.pathname.includes('/api/')) return; // datos: siempre a la red
  e.respondWith(
    caches.match(e.request).then(cacheada => {
      const red = fetch(e.request).then(resp => {
        if (resp.ok) {
          const copia = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, copia));
        }
        return resp;
      }).catch(() => cacheada);
      return cacheada || red;
    })
  );
});
