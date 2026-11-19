// Service worker mínimo del Panel del Dueño — Anita Broaster.
// No guarda nada en caché: el panel siempre trabaja con los datos en vivo.
self.addEventListener('install', function (e) { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', function (e) { /* sin caché: todo pasa directo a la red */ });
