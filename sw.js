/* ═══════════════════════════════════════════════════════════════
   Service worker de la Consola de inversión

   SUBE ESTE NÚMERO CADA VEZ QUE ACTUALICES index.html.
   Es lo único que hay que tocar aquí: al cambiar, el móvil se entera
   de que hay versión nueva y te avisa para recargar.
   ═══════════════════════════════════════════════════════════════ */
const VERSION = 'v11';

const CACHE = 'consola-' + VERSION;
const ARCHIVOS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './config.js',
  './fusion.js',
  './nube.js',
  './agenda.js',
  './catalogo.js',
  './estudio.js',
  './papel.js',
  './icono-192.png',
  './icono-512.png',
  './icono-512-maskable.png',
  './icono-apple.png'
];

/* Al instalar: guardar todo para poder funcionar sin conexión */
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ARCHIVOS))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())   /* si falla un archivo, no bloquear */
  );
});

/* Al activar: borrar las versiones viejas y tomar el control ya */
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* Primero la red, la caché como red de seguridad.
   Al revés (caché primero) el móvil se quedaría pegado a la versión vieja
   y subirías cambios sin verlos nunca. */
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return;

  e.respondWith(
    fetch(req)
      .then(res => {
        if (res && res.ok) {
          const copia = res.clone();
          caches.open(CACHE).then(c => c.put(req, copia)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
  );
});

/* La página puede pedir que la versión nueva entre sin esperar */
self.addEventListener('message', e => {
  if (e.data === 'actualizar-ya') self.skipWaiting();
});
