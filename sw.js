/* Anita Broaster — Carta QR: service worker mínimo (red primero, sin caché de datos).
   La carta siempre lee precios, stock y disponibilidad en vivo desde Supabase,
   por eso las respuestas HTML/JSON nunca se guardan en caché.
   Este archivo va en la raíz del sitio para que cubra toda la carta. */
var CACHE = 'anita-carta-v1';
var PRECACHE = [
  'assets/icon-192.png',
  'assets/icon-512.png',
  'assets/apple-touch-icon.png'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll(PRECACHE);
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
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request).catch(function () {
      return caches.match(event.request);
    })
  );
});
