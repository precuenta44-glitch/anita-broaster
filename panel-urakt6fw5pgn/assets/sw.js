// Service worker del Panel del Dueño — Anita Broaster.
// Estrategia stale-while-revalidate: la página y los archivos estáticos se
// sirven AL INSTANTE desde la caché del teléfono y se actualizan en segundo
// plano con la red. Los datos (Supabase) NUNCA pasan por esta caché: van
// siempre en vivo por la red y el panel los guarda aparte en localStorage.
var CACHE = "anita-panel-v2";
var CORE = [
  "../index.html",
  "./",
  "manifest.webmanifest",
  "logo.png",
  "banner.jpg",
  "icon-panel-192.png",
  "icon-panel-512.png",
  "icon-panel-maskable-512.png",
  "apple-touch-icon.png",
  "alita.jpg",
  "entrepierna.jpg",
  "pierna.jpg",
  "pecho.jpg",
  "hamburguesa.jpg",
  "salchipapa.jpg",
  "gaseosa.jpg",
  "refresco.jpg"
];

self.addEventListener("install", function (e) {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(function (cache) {
      // Uno por uno con catch: si un archivo falla, los demás igual se guardan.
      return Promise.all(CORE.map(function (url) {
        return cache.add(url).catch(function () {});
      }));
    })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k !== CACHE) return caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url;
  try { url = new URL(req.url); } catch (err) { return; }
  // Datos en vivo: Supabase va siempre directo a la red, sin caché.
  if (url.hostname.indexOf("supabase.co") >= 0) return;
  if (url.protocol !== "http:" && url.protocol !== "https:") return;

  e.respondWith(
    caches.open(CACHE).then(function (cache) {
      return cache.match(req, { ignoreSearch: true }).then(function (cached) {
        var network = fetch(req).then(function (res) {
          if (res && (res.status === 200 || res.type === "opaque")) {
            cache.put(req, res.clone()).catch(function () {});
          }
          return res;
        }).catch(function (err) {
          if (cached) return cached;
          throw err;
        });
        // Si hay copia en caché se muestra al instante y la red actualiza
        // en segundo plano; si no hay copia, se espera a la red.
        return cached || network;
      });
    })
  );
});
