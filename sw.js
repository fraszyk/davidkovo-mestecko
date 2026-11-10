/* Davídkovy hry – šablona service workeru (společná). Hra při sestavení nahradí __VERZE__, __PREFIX__, __KANAL__, __SOUBORY__.
   Uloží hru do iPadu, aby jako aplikace na ploše fungovala i bez internetu.
   Stahuje soubor po souboru a hlásí průběh stránce (BroadcastChannel 'hratky-sw'); nová verze se použije,
   až když je stažená celá. Po nahrání nové verze se hra při dalším spuštění s internetem sama aktualizuje. */
const VERZE = '65899410bf';
const PREFIX = 'mestecko-';            // např. 'hratky-'
const CACHE = PREFIX + VERZE;
const SOUBORY = ["./","index.html","manifest.webmanifest","ikona-180.png","ikona-192.png","ikona-512.png","audio/index.json","audio/audio-0.bin","audio/audio-1.bin","audio/audio-2.bin","audio/audio-3.bin","audio/audio-4.bin","audio/audio-5.bin","audio/audio-6.bin","audio/audio-7.bin","audio/audio-8.bin","audio/audio-9.bin","audio/audio-10.bin","audio/audio-11.bin","audio/audio-12.bin"];          // seznam souborů k uložení
let bc = null; try { bc = new BroadcastChannel('mestecko-sw'); } catch (e) {}
const hlas = d => { try { bc && bc.postMessage(d); } catch (e) {} };
self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    let hotovo = 0;
    for (const u of SOUBORY) {
      if (!(await c.match(u))) {
        const r = await fetch(new Request(u, { cache: 'reload' }));
        if (!r.ok) { hlas({ typ: 'chyba' }); throw new Error(u + ' ' + r.status); }
        await c.put(u, r);
      }
      hotovo++; hlas({ typ: 'prubeh', hotovo, celkem: SOUBORY.length });
    }
  })().catch(err => { hlas({ typ: 'chyba' }); throw err; }));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x.startsWith(PREFIX) && x !== CACHE).map(x => caches.delete(x))))
    .then(() => self.clients.claim()).then(() => hlas({ typ: 'hotovo' })));
});
if (bc) bc.onmessage = async e => {
  if ((e.data || {}).typ !== 'dotaz') return;
  const c = await caches.open(CACHE); let n = 0;
  for (const u of SOUBORY) if (await c.match(u)) n++;
  hlas({ typ: 'stav', hotovo: n, celkem: SOUBORY.length });
};
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request).then(r => { const k = r.clone(); caches.open(CACHE).then(c => c.put('index.html', k)); return r; })
      .catch(() => caches.match('index.html')));
    return;
  }
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(r => r || fetch(e.request)));
});
