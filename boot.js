// ===== שומר טעינה =====
// אם האפליקציה לא נטענה תוך כמה שניות, מוצגת הודעה ברורה במקום מסך ריק,
// ונשלח דיווח ללוג של Cloudflare כדי שנדע מה קרה ובאיזה מכשיר.
(function () {
  var errs = [], start = Date.now(), sent = 0;
  function add(m) { try { errs.push(String(m).slice(0, 300)); if (errs.length > 10) errs.shift(); } catch (e) { } }
  window.addEventListener('error', function (e) {
    var t = e.target;
    if (t && t !== window && (t.src || t.href)) add('load-fail ' + (t.src || t.href));
    else add((e.message || 'error') + (e.filename ? ' @' + String(e.filename).split('/').pop() + ':' + e.lineno : ''));
    if (window.__llBooted) report('error');
  }, true);
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason; add('promise: ' + (r && (r.code || r.message) || r));
    if (window.__llBooted) report('error');
  });
  function report(kind) {
    if (sent >= 6) return; sent++;
    try {
      var body = JSON.stringify({ kind: kind, errs: errs, ua: navigator.userAgent, w: window.innerWidth, h: window.innerHeight, ms: Date.now() - start, path: location.pathname + location.hash.split('/')[0], online: navigator.onLine });
      if (navigator.sendBeacon) navigator.sendBeacon('/api/log', body);
      else fetch('/api/log', { method: 'POST', body: body, keepalive: true });
    } catch (e) { }
  }
  window.__llReport = report;
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function fail() {
    if (window.__llBooted) return;
    var v = document.getElementById('view'); if (!v) return;
    // רק אם המסך באמת ריק או עדיין במסך הטעינה הראשוני
    var bootScreen = !v.children.length || (v.children.length === 1 && v.firstElementChild.classList.contains('loading') && v.querySelector('.wordmark'));
    if (!bootScreen) return;
    report('stuck');
    var tb = document.getElementById('tabbar'); if (tb) tb.style.display = 'none';
    v.innerHTML = '<div class="boot-fail"><div class="bf-logo">Leaf<span>Loop</span></div><h2>האפליקציה לא נטענה</h2>' +
      '<p>' + (navigator.onLine ? 'ייתכן שחוסם פרסומות, מצב חיסכון בנתונים או סינון של חברת הסלולר חוסם חלק מהאתר. נסו ללחוץ "תיקון ורענון". אם זה חוזר, נסו דפדפן אחר (למשל כרום) או כבו את חוסם הפרסומות לאתר הזה.' : 'אין חיבור לאינטרנט. התחברו ונסו שוב.') + '</p>' +
      '<button class="btn hot" id="bf-fix">תיקון ורענון</button><button class="btn ghost" id="bf-reload">רענון</button>' +
      '<details><summary>פרטים טכניים (לשליחה לתמיכה)</summary><pre>' + esc((errs.join('\n') || 'אין שגיאה') + '\n\n' + navigator.userAgent) + '</pre></details></div>';
    document.getElementById('bf-reload').addEventListener('click', function () { location.reload(); });
    document.getElementById('bf-fix').addEventListener('click', function () {
      var done = function () { location.replace(location.pathname + '?r=' + Date.now()); };
      try {
        var jobs = [];
        if (navigator.serviceWorker && navigator.serviceWorker.getRegistrations) jobs.push(navigator.serviceWorker.getRegistrations().then(function (rs) { return Promise.all(rs.map(function (r) { return r.unregister(); })); }));
        if (window.caches && caches.keys) jobs.push(caches.keys().then(function (ks) { return Promise.all(ks.map(function (k) { return caches.delete(k); })); }));
        Promise.all(jobs).then(done, done);
      } catch (e) { done(); }
    });
  }
  setTimeout(fail, 12000);
})();
