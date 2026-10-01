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
