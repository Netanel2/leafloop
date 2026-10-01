// Service worker: מאפשר התקנה כאפליקציה ופתיחה מהירה.
// בכל עדכון גדול אפשר להעלות את המספר כדי לרענן את הקבצים השמורים.
const V = 'leafloop-v11';
const SHELL = ['./', 'index.html', 'style.css', 'app.js', 'art.js', 'data.js', 'fb.js', 'firebase-config.js', 'icon.svg', 'icon-192.png', 'manifest.webmanifest'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).catch(() => {})); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  // קודם רשת (כדי שעדכונים יופיעו מיד), ואם אין אינטרנט, מהזיכרון
  e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(V).then(x => x.put(e.request, c)); return r; }).catch(() => caches.match(e.request).then(r => r || caches.match('index.html'))));
});
