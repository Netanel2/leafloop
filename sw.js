// Service worker: מאפשר התקנה כאפליקציה ופתיחה מהירה.
// בכל עדכון גדול אפשר להעלות את המספר כדי לרענן את הקבצים השמורים.
const V = 'leafloop-v24';
const SHELL = ['./', 'index.html', 'boot.js', 'style.css', 'app.js', 'art.js', 'data.js', 'fb.js', 'firebase-config.js', 'icon.svg', 'icon-192.png', 'manifest.webmanifest'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).catch(() => {})); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  // קודם רשת (כדי שעדכונים יופיעו מיד), ואם אין אינטרנט, מהזיכרון
  e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(V).then(x => x.put(e.request, c)); return r; }).catch(() => caches.match(e.request).then(r => r || caches.match('index.html'))));
});

// ===== התראות פוש =====
self.addEventListener('push', e => {
  let d = {};
  try { const j = e.data ? e.data.json() : {}; d = j.data || j.notification || j; } catch (x) { d = { body: e.data ? e.data.text() : '' }; }
  const call = d.type === 'call';
  e.waitUntil(self.registration.showNotification(d.title || 'LeafLoop', {
    body: d.body || '', icon: 'icon-192.png', badge: 'icon-192.png', dir: 'rtl', lang: 'he',
    tag: d.tag || undefined, renotify: !!d.tag, requireInteraction: call,
    vibrate: call ? [500, 250, 500, 250, 500] : [120, 60, 120],
    data: { url: d.url || './' }
  }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || './', self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => {
    for (const c of cs) { if (c.url.startsWith(self.registration.scope) && 'focus' in c) { return c.focus().then(w => (w && w.navigate ? w.navigate(url) : null)).catch(() => self.clients.openWindow(url)); } }
    return self.clients.openWindow(url);
  }));
});
