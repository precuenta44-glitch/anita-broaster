/* Anita Broaster — Carta QR: service worker.
   La página (HTML) se pide SIEMPRE primero a la red (network-first):
   una carta republicada se ve en la primera apertura, sin esperar a
   una segunda visita ni a actualizar a mano; la copia guardada solo
   se usa cuando no hay conexión. Los archivos estáticos (fotos, iconos)
   se sirven desde la caché y se actualizan en segundo plano
   (stale-while-revalidate). Los datos del menú NUNCA se cachean aquí:
   precios, stock y abierto/cerrado vienen siempre en vivo de Supabase,
   y la página guarda en el teléfono la última copia que recibió. */
var CACHE = 'anita-carta-v3';
var PRECACHE = [
  'icon-192.png',
  'icon-512.png',
  'apple-touch-icon.png'
];
var PAGE_URL = new URL('../index.html', self.location.href).href;

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll(PRECACHE).catch(function () {}).then(function () {
        return cache.add(PAGE_URL).catch(function () {});
      });
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        return k === CACHE ? null : caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET') return;
  var url;
  try { url = new URL(req.url); } catch (e) { return; }
  if (url.origin !== self.location.origin) return; /* Supabase y otros orígenes: siempre red, sin caché */
  var isPage = req.mode === 'navigate' || url.pathname === new URL(PAGE_URL).pathname;
  if (isPage) {
    /* Network-first para la página: el código nuevo de la carta llega
       en la primera apertura tras republicar. Sin conexión, la copia
       guardada mantiene la carta usable. */
    event.respondWith(
      fetch(req, { cache: 'no-cache' }).then(function (res) {
        if (res && res.ok) {
          var copy = res.clone();
          caches.open(CACHE).then(function (cache) {
            cache.put(PAGE_URL, copy);
            if (req.url !== PAGE_URL) {
              try { cache.put(req, res.clone()); } catch (e) {}
            }
          });
        }
        return res;
      }).catch(function () {
        return caches.match(PAGE_URL).then(function (c) {
          if (c) return c;
          return caches.match(req, { ignoreSearch: true });
        });
      })
    );
    return;
  }
  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then(function (cached) {
      var network = fetch(req).then(function (res) {
        if (res && res.ok) {
          var copy = res.clone();
          caches.open(CACHE).then(function (cache) { cache.put(req, copy); });
        }
        return res;
      }).catch(function (err) {
        if (cached) return cached;
        if (req.mode === 'navigate') return caches.match(PAGE_URL);
        throw err;
      });
      return cached || network;
    })
  );
});
