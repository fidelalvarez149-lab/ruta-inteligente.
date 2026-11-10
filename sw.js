// Cambia este número cada vez que publiques una versión nueva
const VERSION = 'v2.11';
const CACHE = 'ruta-' + VERSION;
const BASE = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-180.png',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css', 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.allSettled(BASE.map(a => c.add(a)))));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('message', e => { if (e.data === 'ACTUALIZAR') self.skipWaiting(); });

self.addEventListener('fetch', e => {
  const req = e.request, u = new URL(req.url);
  if (req.method !== 'GET') return;
  // Servicios de búsqueda, rutas y mapas: siempre red
  if (/nominatim|photon\.komoot|routing\.openstreetmap|tile\.openstreetmap/.test(u.host)) return;
  const propio = u.origin === location.origin;
  const esPagina = req.mode === 'navigate' || /\.(html|webmanifest)$/.test(u.pathname) || u.pathname.endsWith('/');
  if (propio && esPagina) {
    // Primero la red (así siempre ves la última versión); sin internet, la copia guardada
    e.respondWith(fetch(req).then(r => {
      if (r.ok) { const c = r.clone(); caches.open(CACHE).then(ch => ch.put(req, c)); }
      return r;
    }).catch(() => caches.match(req).then(h => h || caches.match('./index.html'))));
    return;
  }
  // Resto (íconos, Leaflet): copia guardada primero
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
    if (r.ok) { const c = r.clone(); caches.open(CACHE).then(ch => ch.put(req, c)); }
    return r;
  })));
});
