/* Uloží hru do iPadu, aby jako aplikace na ploše fungovala i bez internetu.
   VERZE doplní tools/build.mjs; po nahrání nové verze se hra při dalším spuštění sama aktualizuje. */
const VERZE = 'f7de78441e';
const CACHE = 'mestecko-' + VERZE;
const SOUBORY = ['./', 'index.html', 'manifest.webmanifest', 'ikona-180.png', 'ikona-192.png', 'ikona-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SOUBORY.map(u => new Request(u, { cache: 'reload' })))));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x.startsWith('mestecko-') && x !== CACHE).map(x => caches.delete(x)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  // stránka: nejdřív zkusit síť (nová verze), bez internetu uložená kopie
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request).then(r => { const k = r.clone(); caches.open(CACHE).then(c => c.put('index.html', k)); return r; })
      .catch(() => caches.match('index.html')));
    return;
  }
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(r => r || fetch(e.request)));
});
