// ===== שרת קטן ב-Cloudflare =====
// מעביר את דפי ההתחברות של Google/Firebase דרך הכתובת של האתר עצמו.
// זה מה שגורם להתחברות לעבוד באייפון (ספארי חוסם התחברות בין שני אתרים שונים).
const FIREBASE_HOST = 'leafloop-f882c.firebaseapp.com';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
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
