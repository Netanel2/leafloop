// ===== שרת קטן ב-Cloudflare =====
// 1. מעביר את דפי ההתחברות של Google/Firebase דרך הכתובת של האתר (בשביל אייפון).
// 2. נותן לאפליקציה פרטי "ממסר" (TURN) לשיחות קוליות, כדי שיתחברו גם בסלולר.
const FIREBASE_HOST = 'leafloop-f882c.firebaseapp.com';

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

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/turn') {
      const origin = request.headers.get('Origin');
      if (origin && new URL(origin).host !== url.host) return new Response('forbidden', { status: 403 });
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
