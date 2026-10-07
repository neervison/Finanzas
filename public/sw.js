// ============================================================
// MIS PAGOS — Service Worker (permite instalar la app)
//
// Estrategia:
// - La API (/api/) NUNCA se cachea: los datos siempre son frescos.
// - La página: RED PRIMERO. Así, cuando Render termina de publicar
//   una versión nueva, se ve al abrir la app (sin esperar a la
//   segunda apertura). Sin internet, se muestra la última copia.
// - Íconos y manifest: caché primero (casi nunca cambian).
// - Sube el número de CACHE en cada versión para limpiar copias.
// ============================================================
const CACHE = 'mispagos-v10';
const BASE = ['./', 'index.html', 'manifest.json', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(BASE)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((claves) => Promise.all(claves.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.pathname.startsWith('/api/')) return; // la API siempre va a la red

  // La página: red primero (actualizaciones al instante), copia si no hay red
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then((r) => {
          const copia = r.clone();
          caches.open(CACHE).then((c) => c.put('index.html', copia));
          return r;
        })
        .catch(() => caches.match('index.html'))
    );
    return;
  }

  // Lo demás (íconos, manifest): caché primero y se refresca por detrás
  e.respondWith(
    caches.match(e.request).then((enCache) => {
      const red = fetch(e.request)
        .then((r) => {
          const copia = r.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copia));
          return r;
        })
        .catch(() => enCache);
      return enCache || red;
    })
  );
});
