// ===== שרת קטן ב-Cloudflare =====
// 1. מעביר את דפי ההתחברות של Google/Firebase דרך הכתובת של האתר (בשביל אייפון).
// 2. נותן לאפליקציה פרטי "ממסר" (TURN) לשיחות קוליות, כדי שיתחברו גם בסלולר.
const FIREBASE_HOST = 'leafloop-f882c.firebaseapp.com';
const PROJECT_ID = 'leafloop-f882c';

// בדיקה שהבקשה מגיעה ממשתמש מחובר של LeafLoop (אימות ה-ID Token של Firebase)
let JWKS = null, JWKS_AT = 0;
function b64u(s) { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; const bin = atob(s); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u; }
async function verifyIdToken(token) {
  try {
    const [h, p, sig] = token.split('.');
    if (!h || !p || !sig) return null;
    const dec = x => JSON.parse(new TextDecoder().decode(b64u(x)));
    const header = dec(h), payload = dec(p), now = Math.floor(Date.now() / 1000);
    if (header.alg !== 'RS256' || payload.aud !== PROJECT_ID || payload.iss !== `https://securetoken.google.com/${PROJECT_ID}`) return null;
    if (!payload.sub || payload.exp < now || payload.iat > now + 300) return null;
    if (!JWKS || Date.now() - JWKS_AT > 3600e3) {
      const r = await fetch('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com');
      JWKS = (await r.json()).keys || []; JWKS_AT = Date.now();
    }
    const jwk = JWKS.find(k => k.kid === header.kid); if (!jwk) return null;
    const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
    const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, b64u(sig), new TextEncoder().encode(h + '.' + p));
    return ok ? payload.sub : null;
  } catch (e) { return null; }
}

async function turnServers(env) {
  if (!env.TURN_KEY_ID || !env.TURN_KEY_API_TOKEN) return [];
  const base = `https://rtc.live.cloudflare.com/v1/turn/keys/${env.TURN_KEY_ID}/credentials`;
  const init = { method: 'POST', headers: { Authorization: `Bearer ${env.TURN_KEY_API_TOKEN}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ ttl: 7200 }) };
  for (const path of ['/generate-ice-servers', '/generate']) {
    try {
      const r = await fetch(base + path, init);
      if (!r.ok) continue;
      const d = await r.json();
      const s = d.iceServers;
      if (s) return Array.isArray(s) ? s : [s];
    } catch (e) { }
  }
  return [];
}

// ===== הודעות פוש (Firebase Cloud Messaging) =====
// צריך Secret בשם FIREBASE_SA עם קובץ ה-Service Account של Firebase (הסבר ב-README)
let GTOK = null, GTOK_EXP = 0;
async function googleToken(env) {
  if (GTOK && Date.now() < GTOK_EXP - 60e3) return GTOK;
  const sa = JSON.parse(env.FIREBASE_SA);
  const now = Math.floor(Date.now() / 1000);
  const enc = o => btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(o)))).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
  const head = enc({ alg: 'RS256', typ: 'JWT' });
  const body = enc({ iss: sa.client_email, scope: 'https://www.googleapis.com/auth/firebase.messaging https://www.googleapis.com/auth/datastore', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 });
  const pem = sa.private_key.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
  const der = Uint8Array.from(atob(pem), c => c.charCodeAt(0));
  const key = await crypto.subtle.importKey('pkcs8', der, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const sig = new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(head + '.' + body)));
  let bin = ''; sig.forEach(b => { bin += String.fromCharCode(b); });
  const jwt = head + '.' + body + '.' + btoa(bin).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=' + jwt });
  const d = await r.json();
  if (!d.access_token) throw new Error('google token failed');
  GTOK = d.access_token; GTOK_EXP = Date.now() + (d.expires_in || 3600) * 1000;
  return GTOK;
}
function fv(v) {
  if (!v) return null;
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return +v.integerValue;
  if ('doubleValue' in v) return v.doubleValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('nullValue' in v) return null;
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(fv);
  if ('mapValue' in v) return fmap(v.mapValue.fields || {});
  return null;
}
function fmap(f) { const o = {}; for (const k in f) o[k] = fv(f[k]); return o; }
const FS = path => `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${path}`;
async function fsGet(env, path) {
  const r = await fetch(FS(path), { headers: { Authorization: 'Bearer ' + await googleToken(env) } });
  if (!r.ok) return null;
  const d = await r.json();
  return fmap(d.fields || {});
}
async function pushTo(env, to, msg) {
  const p = await fsGet(env, `users/${to}/private/push`);
  const tokens = (p && Array.isArray(p.tokens) ? p.tokens : []).slice(-5);
  if (!tokens.length) return 0;
  const gt = await googleToken(env), dead = [];
  let sent = 0;
  await Promise.all(tokens.map(async token => {
    const r = await fetch(`https://fcm.googleapis.com/v1/projects/${PROJECT_ID}/messages:send`, {
      method: 'POST', headers: { Authorization: 'Bearer ' + gt, 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: { token, data: msg, webpush: { headers: { Urgency: 'high', TTL: msg.type === 'call' ? '45' : '86400' } } } })
    });
    if (r.ok) sent++;
    else if (r.status === 404 || r.status === 400) dead.push(token);
  }));
  if (dead.length) {
    const keep = tokens.filter(t => !dead.includes(t));
    await fetch(FS(`users/${to}/private/push`) + '?updateMask.fieldPaths=tokens', {
      method: 'PATCH', headers: { Authorization: 'Bearer ' + gt, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: { tokens: { arrayValue: { values: keep.map(t => ({ stringValue: t })) } } } })
    }).catch(() => { });
  }
  return sent;
}
// מי שולח למי, ומה כתוב בהתראה. השרת בודק בעצמו שהשולח באמת חלק מהשיחה או מהפנייה.
async function buildNotify(env, me, type, id, preview) {
  const clip = (s, n) => String(s || '').slice(0, n);
  if (type === 'msg' || type === 'match') {
    const m = await fsGet(env, `matches/${id}`);
    if (!m || !Array.isArray(m.users) || !m.users.includes(me) || m.blockedBy) return null;
    const to = m.users.find(u => u !== me), name = clip(m.info && m.info[me] && m.info[me].name || 'מישהו', 30);
    return type === 'match'
      ? { to, msg: { type, title: '🌱 יש התאמה חדשה!', body: `את/ה ו${name} יכולים להתחיל לדבר`, url: `/#chat/${id}`, tag: 'chat-' + id } }
      : { to, msg: { type, title: `💬 ${name}`, body: clip(preview, 120) || 'הודעה חדשה', url: `/#chat/${id}`, tag: 'chat-' + id } };
  }
  if (type === 'request' || type === 'accepted') {
    const r = await fsGet(env, `requests/${id}`);
    if (!r) return null;
    if (type === 'request' && r.from === me) return { to: r.to, msg: { type, title: '🌿 פנייה חדשה', body: `${clip(r.fromInfo && r.fromInfo.name, 30)} מתעניין/ת בצמח שלך`, url: '/#matches', tag: 'req-' + id } };
    if (type === 'accepted' && r.to === me) return { to: r.from, msg: { type, title: '🌱 הפנייה שלך אושרה!', body: `${clip(r.toInfo && r.toInfo.name, 30)} אישר/ה. אפשר להתחיל לדבר`, url: '/#matches', tag: 'req-' + id } };
    return null;
  }
  if (type === 'call') {
    const c = await fsGet(env, `calls/${id}`);
    if (!c || c.from !== me || c.status !== 'ringing') return null;
    return { to: c.to, msg: { type, title: `📞 ${clip(c.fromInfo && c.fromInfo.name, 30)} מתקשר/ת…`, body: 'לחצו כדי לענות', url: `/#chat/${clip(c.matchId, 700)}`, tag: 'call-' + id } };
  }
  return null;
}

const FB_VER = '10.12.2';
// Firebase דרך הכתובת שלנו, כדי שחוסמים לא יחסמו את האפליקציה
async function firebaseFile(url, ctx) {
  const file = url.pathname.slice(4);
  if (!/^firebase-(app|auth|firestore)\.js$/.test(file)) return new Response('not found', { status: 404 });
  const cache = caches.default, key = new Request(url.origin + '/fb/' + FB_VER + '/' + file);
  let res = await cache.match(key);
  if (res) return res;
  const up = await fetch(`https://www.gstatic.com/firebasejs/${FB_VER}/${file}`);
  if (!up.ok) return new Response('upstream error', { status: 502 });
  const txt = (await up.text()).split(`https://www.gstatic.com/firebasejs/${FB_VER}/`).join('/fb/');
  res = new Response(txt, { headers: { 'Content-Type': 'application/javascript; charset=utf-8', 'Cache-Control': 'public, max-age=86400' } });
  ctx.waitUntil(cache.put(key, res.clone()));
  return res;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/fb/')) return firebaseFile(url, ctx);
    // דיווחי תקלות מהטלפונים של המשתמשים. מופיעים ב-Cloudflare > leafloop > Logs
    if (url.pathname === '/api/log' && request.method === 'POST') {
      const body = (await request.text()).slice(0, 5000);
      console.log('CLIENT_REPORT', body);
      return new Response(null, { status: 204 });
    }
    if (url.pathname === '/api/notify' && request.method === 'POST') {
      const auth = request.headers.get('Authorization') || '';
      const me = auth.startsWith('Bearer ') ? await verifyIdToken(auth.slice(7)) : null;
      if (!me) return new Response('unauthorized', { status: 401 });
      if (!env.FIREBASE_SA) return new Response(JSON.stringify({ sent: 0, reason: 'push not configured' }), { headers: { 'Content-Type': 'application/json' } });
      try {
        const b = await request.json();
        if (!/^(msg|match|request|accepted|call)$/.test(b.type) || !/^[A-Za-z0-9_-]{1,700}$/.test(b.id || '')) return new Response('bad request', { status: 400 });
        const n = await buildNotify(env, me, b.type, b.id, b.preview);
        if (!n || !n.to || n.to === me) return new Response(JSON.stringify({ sent: 0 }), { headers: { 'Content-Type': 'application/json' } });
        const sent = await pushTo(env, n.to, n.msg);
        return new Response(JSON.stringify({ sent }), { headers: { 'Content-Type': 'application/json' } });
      } catch (e) { console.log('NOTIFY_ERROR', String(e)); return new Response(JSON.stringify({ sent: 0 }), { status: 200, headers: { 'Content-Type': 'application/json' } }); }
    }
    if (url.pathname === '/api/turn') {
      const origin = request.headers.get('Origin');
      // מותר מהכתובת הזו, מאתר ה-Netlify של LeafLoop, או מדומיין שהוגדר ב-ALLOWED_HOSTS
      const okHost = h => h === url.host || /^leafloop[a-z0-9-]*\.(netlify|vercel)\.app$/.test(h) || String(env.ALLOWED_HOSTS || '').split(',').map(x => x.trim()).filter(Boolean).includes(h);
      if (origin && !okHost(new URL(origin).host)) return new Response('forbidden', { status: 403 });
      const auth = request.headers.get('Authorization') || '';
      const uid = auth.startsWith('Bearer ') ? await verifyIdToken(auth.slice(7)) : null;
      if (!uid) return new Response(JSON.stringify({ iceServers: [] }), { status: 401, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
      const iceServers = await turnServers(env);
      return new Response(JSON.stringify({ iceServers }), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
    }
    if (url.pathname.startsWith('/__/auth/') || url.pathname.startsWith('/__/firebase/')) {
      const target = new URL(url.pathname + url.search, 'https://' + FIREBASE_HOST);
      const headers = new Headers(request.headers);
      headers.delete('host');
      const init = { method: request.method, headers, redirect: 'manual' };
      if (!['GET', 'HEAD'].includes(request.method)) init.body = request.body;
      return fetch(target.toString(), init);
    }
    return env.ASSETS.fetch(request);
  }
};
