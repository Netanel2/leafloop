// ===== LeafLoop – לוגיקת האפליקציה =====
import {
  initializeApp, getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult,
  onAuthStateChanged, signOut, deleteUser, reauthenticateWithPopup,
  getFirestore, doc, getDoc, setDoc, updateDoc, deleteDoc, addDoc, collection, query, where,
  getDocs, onSnapshot, orderBy, limit, increment, arrayUnion, arrayRemove, writeBatch, getCountFromServer, loadMessaging
} from './fb.js';
import * as CFG from './firebase-config.js';
const FIREBASE_CONFIG = CFG.FIREBASE_CONFIG;

const APP_NAME = 'LeafLoop';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const errLog = e => console.error('[LeafLoop]', e);
// ---------- בדיקת נתונים שמגיעים ממסד הנתונים (הגנה מהזרקת קוד) ----------
const okId = id => typeof id === 'string' && /^[A-Za-z0-9_-]{1,700}$/.test(id);
const safeImg = src => (typeof src === 'string' && /^data:image\/(jpeg|jpg|png|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(src) ? src : null);
const safeAudio = src => (typeof src === 'string' && /^data:audio\/[a-z0-9.+-]+(;codecs=[a-z0-9.,-]+)?;base64,[A-Za-z0-9+/=]+$/i.test(src) ? src : null);
const safeColor = c => (typeof c === 'string' && /^#[0-9a-fA-F]{6}$/.test(c) ? c : '#19A55B');
const safeUrl = u => (typeof u === 'string' && /^https:\/\/[^\s"'<>]+$/.test(u) ? u : null);

// ---------- אייקונים ----------
const ICONS = {
  heart: 'M19.5 12.57 12 20l-7.5-7.43A5 5 0 1 1 12 6.01a5 5 0 1 1 7.5 6.56',
  x: 'M18 6 6 18M6 6l12 12',
  star: 'm12 17.75-6.17 3.24 1.18-6.87-5-4.86 6.9-1 3.08-6.25 3.08 6.25 6.9 1-5 4.86 1.18 6.87z',
  bookmark: 'M18 7v14l-6-4-6 4V7a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4',
  map: 'm3 7 6-3 6 3 6-3v13l-6 3-6-3-6 3zM9 4v13M15 7v13',
  plus: 'M12 5v14M5 12h14',
  cards: 'M4 8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zM8 6V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-2',
  chat: 'M3 20l1.3-3.9A9 8 0 1 1 7.7 19L3 20',
  user: 'M8 7a4 4 0 1 0 8 0a4 4 0 0 0-8 0M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2',
  bell: 'M10 5a2 2 0 1 1 4 0a7 7 0 0 1 4 6v3a4 4 0 0 0 2 3H4a4 4 0 0 0 2-3v-3a7 7 0 0 1 4-6M9 17v1a3 3 0 0 0 6 0v-1',
  pin: 'M9 11a3 3 0 1 0 6 0a3 3 0 0 0-6 0M17.66 16.66 13.41 20.9a2 2 0 0 1-2.83 0l-4.24-4.24a8 8 0 1 1 11.32 0',
  filter: 'M4 6h16M7 12h10M10 18h4',
  camera: 'M5 7h1a2 2 0 0 0 2-2 1 1 0 0 1 1-1h6a1 1 0 0 1 1 1 2 2 0 0 0 2 2h1a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2M9 13a3 3 0 1 0 6 0a3 3 0 0 0-6 0',
  send: 'M10 14 21 3M21 3l-6.5 18a.55.55 0 0 1-1 0L10 14l-7-3.5a.55.55 0 0 1 0-1z',
  back: 'M9 6l6 6-6 6',
  check: 'M5 12l5 5L20 7',
  trash: 'M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3',
  image: 'M15 8h.01M3 6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3zM3 16l5-5c.93-.9 2.07-.9 3 0l5 5M14 14l1-1c.93-.9 2.07-.9 3 0l3 3',
  eye: 'M10 12a2 2 0 1 0 4 0a2 2 0 0 0-4 0M21 12c-2.4 4-5.4 6-9 6s-6.6-2-9-6c2.4-4 5.4-6 9-6s6.6 2 9 6',
  swap: 'M7 10h14l-4-4M17 14H3l4 4',
  calendar: 'M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zM16 3v4M8 3v4M4 11h16',
  shield: 'M12 3a12 12 0 0 0 8.5 3A12 12 0 0 1 12 21 12 12 0 0 1 3.5 6 12 12 0 0 0 12 3',
  refresh: 'M20 11A8.1 8.1 0 0 0 4.5 9M4 5v4h4M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4',
  undo: 'M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11',
  share: 'M6 12a3 3 0 1 0 0 .01M18 6a3 3 0 1 0 0 .01M18 18a3 3 0 1 0 0 .01M8.7 10.7l6.6-3.4M8.7 13.3l6.6 3.4',
  dots: 'M5 12h.01M12 12h.01M19 12h.01',
  logout: 'M14 8V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2v-2M9 12h12l-3-3M18 15l3-3',
  settings: 'M10.3 4.3c.4-1.8 3-1.8 3.4 0a1.7 1.7 0 0 0 2.6 1.1c1.5-.9 3.3.8 2.4 2.4a1.7 1.7 0 0 0 1 2.5c1.8.5 1.8 3 0 3.5a1.7 1.7 0 0 0-1 2.6c.9 1.5-.9 3.3-2.4 2.4a1.7 1.7 0 0 0-2.6 1c-.4 1.8-3 1.8-3.4 0a1.7 1.7 0 0 0-2.6-1c-1.5.9-3.3-.9-2.4-2.4a1.7 1.7 0 0 0-1-2.6c-1.8-.4-1.8-3 0-3.4a1.7 1.7 0 0 0 1-2.6c-.9-1.5.9-3.3 2.4-2.4a1.7 1.7 0 0 0 2.6-1.1M9 12a3 3 0 1 0 6 0a3 3 0 0 0-6 0',
  download: 'M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M7 11l5 5 5-5M12 4v12',
  phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2',
  phoneOff: 'M3 21 21 3M5.1 18.9A16 16 0 0 1 3 6a2 2 0 0 1 2-2h4l2 5-2.5 1.5c.4.8.9 1.5 1.5 2.2M14.3 14.3c.4.3.8.5 1.2.7L15 13l5 2v4a2 2 0 0 1-2 2c-3 0-5.9-1-8.2-2.6',
  mic: 'M9 5a3 3 0 0 1 6 0v5a3 3 0 0 1-6 0zM5 10a7 7 0 0 0 14 0M8 21h8M12 17v4',
  micOff: 'M3 3l18 18M9 5a3 3 0 0 1 6 0v5c0 .3 0 .6-.1.9M15 15a3 3 0 0 1-6-1.5V11M5 10a7 7 0 0 0 10.6 6M19 10a7 7 0 0 1-.7 3M8 21h8M12 17v4',
  play: 'M7 4v16l13-8z',
  search: 'M3 10a7 7 0 1 0 14 0a7 7 0 1 0-14 0M21 21l-6-6',
  lock: 'M5 13a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2zM8 11V7a4 4 0 1 1 8 0v4',
  pause: 'M6 5h4v14H6zM14 5h4v14h-4z'
};
const ic = (n, s = 22) => `<svg class="ic" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${ICONS[n]}"/></svg>`;
const icInline = (n, s = 16) => ic(n, s).replace('class="ic"', 'class="ic" style="display:inline;vertical-align:-3px"');
const GOOGLE_G = `<svg width="22" height="22" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>`;

// ---------- מילונים ----------
const OFFER = { full: 'צמח שלם', cutting: 'ייחור', seedling: 'שתיל', seeds: 'זרעים' };
const COND = { young: 'צעיר', mature: 'בוגר', large: 'גדול' };
const DELIV = { pickup: 'איסוף', shipping: 'משלוח', both: 'איסוף או משלוח' };
const CATS = { house: 'צמחי בית', outdoor: 'צמחי חוץ', succulent: 'סוקולנטים', cactus: 'קקטוסים', tree: 'עצים', herb: 'תבלינים' };
const STATUS = { discussing: 'מדברים', agreed: 'סגרנו', meeting: 'נקבע מפגש', swapped: 'הוחלף', cancelled: 'בוטל' };
const STATUS_HINT = { discussing: 'עדיין מדברים', agreed: 'סגרנו על החלפה', meeting: 'נקבע זמן ומקום', swapped: 'ההחלפה בוצעה', cancelled: 'ההחלפה בוטלה' };
const RADII = [2, 5, 10, 25, 50, 100, 500];
const AV_COLORS = ['#FF2E7E', '#FFB21C', '#0FB5B2', '#FF6A3D', '#B44CFF', '#19A55B'];
const QUICK = ['מתאים לך להחליף?', 'איפה נוח לך להיפגש?', 'אני יכול/ה היום', 'מתאים מחר?', 'אפשר תמונה נוספת של הצמח?'];
const REPORT_REASONS = ['הטרדה או התנהגות פוגענית', 'ספאם או הונאה', 'תוכן לא הולם', 'לא הגיע/ה למפגש', 'אחר'];
const MODE = { swap: { t: 'להחלפה', i: '🔄', c: 'm-swap' }, gift: { t: 'במתנה', i: '🎁', c: 'm-gift' }, both: { t: 'מתנה או החלפה', i: '💚', c: 'm-both' }, sale: { t: 'למכירה', i: '🏷️', c: 'm-sale' } };
const MODE_ACT = { swap: 'להחליף', gift: 'למסור במתנה', both: 'גם וגם', sale: 'למכור' };
const MODE_HINT = { swap: 'בתמורה לצמח אחר', gift: 'בלי תמורה, למי שירצה', both: 'מתנה או החלפה', sale: 'במחיר שתקבעו' };
const priceTxt = p => (p && p.price ? `₪${p.price}` : '');
const modeOf = p => (p && MODE[p.mode] ? p.mode : 'swap');
// מי רואה את פאנל הניהול של המשתלות (חייב להתאים לכתובת ב-firestore.rules)
const ADMIN_EMAILS = ['netanelkk9@gmail.com'];
const TYPE_LABEL = { perfect: 'התאמה מושלמת', wishlist: 'מהרשימה שלך', good: 'התאמה אפשרית', nearby: 'קרוב אליך' };

// ---------- מכשיר ----------
const UA = navigator.userAgent || '';
const isIOS = /iPad|iPhone|iPod/.test(UA) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isMobile = isIOS || /Android/i.test(UA);
const inAppBrowser = /FBAN|FBAV|FB_IAB|Instagram|Line\/|Snapchat|TikTok|musical_ly|; wv\)|GSA\//i.test(UA);
const isStandalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

// ---------- Firebase ----------
const cfgOk = !!(FIREBASE_CONFIG && FIREBASE_CONFIG.apiKey && !/PASTE/.test(FIREBASE_CONFIG.apiKey));
// ההתחברות עוברת דרך הכתובת של האתר עצמו (worker.js), כדי שתעבוד גם באייפון.
const sameDomainAuth = location.protocol === 'https:' && !/(firebaseapp\.com|web\.app)$/.test(location.hostname);
let auth = null, db = null, fbApp = null, fbCfg = null;
if (cfgOk) {
  fbCfg = sameDomainAuth ? { ...FIREBASE_CONFIG, authDomain: location.host } : FIREBASE_CONFIG;
  const app = initializeApp(fbCfg);
  fbApp = app;
  auth = getAuth(app);
  db = getFirestore(app);
}

// ---------- מצב ----------
const S = {
  me: null, profile: null, booted: false,
  priv: { swipes: {}, saved: [], blocked: [], alertsSeenAt: 0 },
  myPlants: [], pool: [], poolAt: 0, users: {}, photos: {},
  matches: [], incoming: [], outgoing: [], msgs: [], reviews: [],
  here: null, nurseries: [], promos: [], myNursery: null, rep: {}
};
let filters = (() => { const d = { cat: 'all', offer: 'all', delivery: 'all', mode: 'all' }; try { return { ...d, ...JSON.parse(localStorage.getItem('ll_filters') || '{}') }; } catch (e) { return d; } })();
const saveFilters = () => { try { localStorage.setItem('ll_filters', JSON.stringify(filters)); } catch (e) { } };
const uid = () => S.me && S.me.uid;
function pruneSwipes() {
  const now = Date.now(), e = Object.entries(S.priv.swipes || {});
  const t = v => +String(v).split(':')[1] || 0;
  let keep = e.filter(([, v]) => !(String(v).startsWith('pass') && t(v) && now - t(v) > 45 * 864e5));
  if (keep.length > 2500) keep = keep.sort((a, b) => t(b[1]) - t(a[1])).slice(0, 2500);
  if (keep.length !== e.length) { S.priv.swipes = Object.fromEntries(keep); savePriv(); }
  if ((S.priv.saved || []).length > 300) S.priv.saved = S.priv.saved.slice(-300);
}
let privT;
function savePriv() {
  clearTimeout(privT);
  privT = setTimeout(() => setDoc(doc(db, 'users', uid(), 'private', 'state'), S.priv).catch(errLog), 500);
}

// ---------- עזרים ----------
const cleanName = t => String(t || '').trim().replace(/\s+/g, ' ').slice(0, 40);
const catById = id => {
  if (typeof id === 'string' && id.startsWith('n:')) return { id, he: id.slice(2), sci: '', cat: 'house', art: 'leafy', custom: true };
  return CATALOG.find(c => c.id === id) || { id, he: id || 'צמח', sci: '', cat: 'house', art: 'leafy' };
};
const pName = p => (p ? catById(p.catId).he : '');
const catByName = n => { const q = cleanName(n).toLowerCase(); return CATALOG.find(c => c.he.toLowerCase() === q || c.sci.toLowerCase() === q); };
// שם חופשי: אם יש התאמה מדויקת לקטלוג משתמשים בה, אחרת שומרים את מה שנכתב
const toCat = n => { const c = catByName(n); if (c) return c; const t = cleanName(n); return t ? catById('n:' + t) : null; };
function km(a, b) {
  if (!a || !b || a.lat == null || b.lat == null) return 9999;
  const R = 6371, t = x => x * Math.PI / 180;
  const dLat = t(b.lat - a.lat), dLng = t(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(t(a.lat)) * Math.cos(t(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
const base = () => S.here || S.profile;
const dist = o => km(base(), o);
const isAdmin = () => !!(S.me && ADMIN_EMAILS.includes((S.me.email || '').toLowerCase()));
const fmtKm = d => (d >= 9999 ? '' : (d < 1 ? 'פחות מק״מ' : (d < 10 ? d.toFixed(1) : Math.round(d)) + ' ק״מ'));
const radiusLabel = r => (r >= 500 ? 'כל הארץ' : r + ' ק״מ');
const initials = n => (String(n || '?').trim()[0] || '?');
function ago(t) {
  const m = Math.round((Date.now() - (t || 0)) / 60000);
  if (m < 1) return 'עכשיו';
  if (m < 60) return `לפני ${m} דק׳`;
  const h = Math.round(m / 60);
  if (h < 24) return h === 1 ? 'לפני שעה' : `לפני ${h} שעות`;
  const d = Math.round(h / 24);
  return d === 1 ? 'אתמול' : `לפני ${d} ימים`;
}
function greeting() {
  const h = new Date().getHours();
  if (h < 5) return 'לילה טוב'; if (h < 12) return 'בוקר טוב'; if (h < 17) return 'צהריים טובים'; if (h < 21) return 'ערב טוב'; return 'לילה טוב';
}
const pubInfo = u => ({ name: u.name || 'משתמש/ת', color: u.color || '#19A55B', photo: u.photo || null, city: u.city || '' });
const owner = p => S.users[p.ownerId] || { id: p.ownerId, name: p.ownerName, color: p.ownerColor, photo: p.ownerPhoto, city: p.city, wishlist: [] };
const isBlocked = id => (S.priv.blocked || []).includes(id);
// הדירוג מחושב תמיד מתוך הדירוגים עצמם, ולא משדה שהמשתמש יכול לשנות
const repOf = u => (u && S.rep[u.id]) || { avg: 0, count: 0 };
const rating = u => { const r = repOf(u); return r.count ? `★${r.avg.toFixed(1)}` : 'חדש/ה'; };
const otherId = m => m.users.find(x => x !== uid());
const otherInfo = m => (m.info && m.info[otherId(m)]) || { name: 'משתמש/ת', color: '#19A55B' };

const askArt = `<div class="art gift-art ask-art" aria-label="שיחה">💬</div>`;
function visual(p, kind) {
  if (!p || (!p.catId && !p.thumb && !p.img)) return kind === 'ask' ? askArt : `<div class="art gift-art" aria-label="מתנה">🎁</div>`;
  const key = p.id || p.catId;
  const src = safeImg(S.photos[key]) || safeImg(p.thumb);
  if (src) return `<div class="photo"><img data-pid="${esc(key)}" src="${src}" alt="${esc(pName(p))}"></div>`;
  return `<div class="art" style="background:${colorFor(key)}">${plantArt(catById(p.catId).art, key)}</div>`;
}
function avatar(u, cls = 'av') {
  const ph = u && safeUrl(u.photo);
  if (ph) return `<div class="${esc(cls)} has-img" style="background:${safeColor(u.color)}"><img class="av-img" src="${esc(ph)}" alt="" referrerpolicy="no-referrer"></div>`;
  return `<div class="${esc(cls)}" style="background:${safeColor(u && u.color)}">${esc(initials(u && u.name))}</div>`;
}
async function hydrate(plants) {
  for (const p of plants) {
    if (!p || !p.hasPhoto || S.photos[p.id]) continue;
    try {
      const s = await getDoc(doc(db, 'photos', p.id));
      if (s.exists()) { S.photos[p.id] = s.data().img; $$(`img[data-pid="${p.id}"]`).forEach(i => { i.src = S.photos[p.id]; }); }
    } catch (e) { errLog(e); }
  }
}
async function getUser(id) {
  if (S.users[id]) return S.users[id];
  try {
    const s = await getDoc(doc(db, 'users', id));
    S.users[id] = s.exists() ? { id, ...s.data() } : { id, name: 'משתמש/ת', wishlist: [], color: '#19A55B' };
  } catch (e) { errLog(e); S.users[id] = { id, name: 'משתמש/ת', wishlist: [], color: '#19A55B' }; }
  return S.users[id];
}
function compress(file, max, q) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => {
      const img = new Image();
      img.onload = () => {
        const s = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        res(c.toDataURL('image/jpeg', q));
      };
      img.onerror = rej; img.src = r.result;
    };
    r.onerror = rej; r.readAsDataURL(file);
  });
}
function shrinkDataUrl(src, max, q) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => {
      const s = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      res(c.toDataURL('image/jpeg', q));
    };
    img.onerror = rej; img.src = src;
  });
}

// ---------- לוגיקת התאמה ----------
// צמח שאחרים יכולים לראות ולפנות עליו
const isDiscoverable = p => !!p && p.available !== false && !p.frozen && !p.dealIn && !isBlocked(p.ownerId) && !(S.users[p.ownerId] && S.users[p.ownerId].banned);
// צמחים שלי שאפשר להציע עכשיו
const myAvail = () => S.myPlants.filter(p => p.available && !p.frozen && !p.dealIn);
const theyWantMine = u => myAvail().filter(p => (u.wishlist || []).includes(p.catId));
const iWant = p => (S.profile.wishlist || []).includes(p.catId);
function matchType(p) {
  const mine = theyWantMine(owner(p)).length > 0;
  if (mine && iWant(p)) return 'perfect';
  if (iWant(p)) return 'wishlist';
  if (mine || p.open) return 'good';
  return 'nearby';
}
function score(p) {
  const u = owner(p);
  let s = { perfect: 100, wishlist: 60, good: 35, nearby: 0 }[matchType(p)];
  const r = repOf(u);
  s += (r.count ? (r.avg - 4) * 10 : 0) + Math.min(r.count, 30) / 3;
  s -= dist(p) * 1.2;
  s += Math.max(0, 10 - (Date.now() - (p.t || 0)) / 864e5); // צמחים חדשים קצת למעלה
  return s;
}
const inActiveMatch = pid => S.matches.some(m => m.status !== 'cancelled' && m.plants && m.plants[pid]);
function feed() {
  const f = filters;
  return S.pool.filter(p =>
    isDiscoverable(p) && !S.priv.swipes[p.id] && !inActiveMatch(p.id) &&
    dist(p) <= S.profile.radius &&
    (f.cat === 'all' || catById(p.catId).cat === f.cat) &&
    (f.offer === 'all' || p.offer === f.offer) &&
    (f.delivery === 'all' || p.delivery === f.delivery || p.delivery === 'both') &&
    modeMatch(p, f.mode)
  ).sort((a, b) => score(b) - score(a));
}

// ---------- הודעות קופצות ומסך תחתון ----------
let toastT;
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 3400);
}
function sheet(html) {
  $('#sheet').innerHTML = `<button class="sheet-x" data-a="closeSheet" aria-label="סגירה">${ic('x', 20)}</button>` + html;
  $('#sheet-wrap').classList.add('open');
  setTimeout(() => $('#sheet').focus({ preventScroll: true }), 250);
}
function closeSheet() { $('#sheet-wrap').classList.remove('open'); }
const sheetOpen = () => $('#sheet-wrap').classList.contains('open');
function busy(el, on, label) {
  if (!el) return;
  if (on) { el.dataset.label = el.innerHTML; el.disabled = true; el.innerHTML = `<span class="spin"></span> ${label || 'רגע…'}`; }
  else { el.disabled = false; if (el.dataset.label) el.innerHTML = el.dataset.label; }
}

// ---------- התראות (מחושבות מהנתונים) ----------
function notifList() {
  const out = [];
  S.incoming.forEach(r => {
    const first = Object.values(r.offerSnap || {})[0];
    out.push({ t: r.t, text: first ? `🌿 ${r.fromInfo.name} רוצה להציע לך ${catById(first.catId).he} בתמורה ל${catById(r.targetSnap.catId).he} שלך.` : r.kind === 'buy' ? `🏷️ ${r.fromInfo.name} רוצה לקנות את ה${catById(r.targetSnap.catId).he} שלך.` : r.kind === 'ask' ? `💚 ${r.fromInfo.name} מתעניין/ת ב${catById(r.targetSnap.catId).he} שלך.` : `🎁 ${r.fromInfo.name} ישמח/תשמח לקבל את ה${catById(r.targetSnap.catId).he} שלך.`, link: 'matches', unread: true });
  });
  activePromos().filter(pr => iWant(pr)).forEach(pr => {
    out.push({ t: pr.t, text: `🌿 ${pr.nurseryName} מציעה ${pr.title}, ${fmtKm(dist(pr))} ממך.`, link: 'nursery/' + pr.nurseryId, unread: (pr.t || 0) > (S.priv.alertsSeenAt || 0) });
  });
  S.matches.forEach(m => {
    const n = (m.unread || {})[uid()] || 0;
    if (n && !isBlocked(otherId(m))) out.push({ t: m.lastAt, text: `💬 ${n === 1 ? 'הודעה חדשה' : n + ' הודעות חדשות'} מ${otherInfo(m).name}`, link: 'chat/' + m.id, unread: true });
  });
  S.pool.filter(p => isDiscoverable(p) && iWant(p) && dist(p) <= S.profile.radius).forEach(p => {
    out.push({ t: p.t, text: `🌿 הצמח שלך כאן! ${p.ownerName} מציע/ה ${pName(p)}, ${fmtKm(dist(p))} ממך.`, link: 'plant/' + p.id, unread: (p.t || 0) > (S.priv.alertsSeenAt || 0) });
  });
  return out.sort((a, b) => (b.t || 0) - (a.t || 0)).slice(0, 40);
}
const unreadMsgs = () => S.matches.reduce((s, m) => s + (isBlocked(otherId(m)) ? 0 : ((m.unread || {})[uid()] || 0)), 0);

// ---------- מיקום חי ----------
const nearestCity = h => CITIES.slice().sort((a, b) => km(h, a) - km(h, b))[0];
const lsGet = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { } };
const liveOn = () => lsGet('ll_live') !== '0';
const locLabel = () => (S.here ? `${S.here.city} (כאן עכשיו)` : S.profile.city);
let locating = false, lastLoc = 0;
function locate(fromUser) {
  if (!navigator.geolocation || locating) return;
  if (!fromUser && (!liveOn() || Date.now() - lastLoc < 5 * 60e3)) return;
  locating = true;
  navigator.geolocation.getCurrentPosition(pos => {
    locating = false; lastLoc = Date.now();
    const h = { lat: +pos.coords.latitude.toFixed(3), lng: +pos.coords.longitude.toFixed(3) };
    const c = nearestCity(h), prev = S.here;
    S.here = { ...h, city: km(h, c) > 12 ? 'ליד ' + c.n : c.n };
    lsSet('ll_live', '1'); lsSet('ll_granted', '1');
    if (fromUser || !prev || km(prev, h) > 1) live(['discover', 'swipe', 'map', 'nursery']);
    if (S.profile && km(h, S.profile) > 15 && (!prev || km(prev, h) > 15)) toast(`📍 נראה שאתם ב${S.here.city}. מציגים צמחים לידכם.`);
  }, err => {
    locating = false;
    if (fromUser) toast(err.code === 1 ? 'אין הרשאה למיקום. אפשר לאשר בהגדרות הדפדפן.' : 'לא הצלחנו לאתר מיקום. נסו שוב.');
  }, { enableHighAccuracy: false, timeout: 12000, maximumAge: fromUser ? 0 : 300000 });
}
async function autoLocate() {
  if (!liveOn()) return;
  try {
    if (navigator.permissions && navigator.permissions.query) {
      const p = await navigator.permissions.query({ name: 'geolocation' });
      if (p.state === 'granted') return locate(false);
      if (p.state === 'denied') return;
    }
  } catch (e) { }
  if (lsGet('ll_granted') === '1') locate(false);
}
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && S.booted) autoLocate(); });

// ---------- משתלות ----------
const nurseryById = id => S.nurseries.find(n => n.id === id) || (S.myNursery && S.myNursery.id === id ? S.myNursery : null);
function activePromos() {
  const now = Date.now(), act = new Set(S.nurseries.filter(n => n.active).map(n => n.id));
  return S.promos.filter(p => p.active && act.has(p.nurseryId) && (!p.until || p.until >= now) && dist(p) <= (p.radius || 25));
}
const promoVisual = pr => safeImg(pr.img) ? `<div class="photo"><img src="${safeImg(pr.img)}" alt="${esc(pr.title)}"></div>` : visual({ id: pr.id, catId: pr.catId || 'monstera' });
const nurseryImg = (n, cls) => safeImg(n.img) ? `<div class="photo"><img src="${safeImg(n.img)}" alt=""></div>` : `<div class="art nursery-art ${cls || ''}">🌿</div>`;
const viewed = new Set();
// כל משתמש נספר פעם אחת בלבד לכל הצעה, כך שאי אפשר לנפח את המספרים
function countView(pr) { if (viewed.has(pr.id) || !uid()) return; viewed.add(pr.id); setDoc(doc(db, 'promos', pr.id, 'seen', uid()), { t: Date.now() }).catch(errLog); }
function countClick(pr) { if (!uid()) return; setDoc(doc(db, 'promos', pr.id, 'clicks', uid()), { t: Date.now() }).catch(errLog); }
async function promoStats(list) {
  await Promise.all(list.map(async pr => {
    const [v, c] = await Promise.all([cnt(collection(db, 'promos', pr.id, 'seen')), cnt(collection(db, 'promos', pr.id, 'clicks'))]);
    pr.views = v || 0; pr.clicks = c || 0;
  }));
}
const waNum = ph => { let d = String(ph || '').replace(/\D/g, ''); if (d.startsWith('0')) d = '972' + d.slice(1); return d; };
function contactBtns(n) {
  if (!n) return '';
  const b = [];
  if (n.phone) b.push(`<a class="btn primary sm" href="tel:${esc(n.phone)}">📞 התקשרו</a>`);
  if (n.whatsapp || n.phone) b.push(`<a class="btn sm wa" href="https://wa.me/${waNum(n.whatsapp || n.phone)}" target="_blank" rel="noopener">💬 וואטסאפ</a>`);
  if (n.lat) b.push(`<a class="btn sun sm" href="https://waze.com/ul?ll=${n.lat},${n.lng}&navigate=yes" target="_blank" rel="noopener">🚗 ניווט</a>`);
  return `<div class="contact">${b.join('')}</div>`;
}
function openPromo(pr) {
  countClick(pr);
  const n = nurseryById(pr.nurseryId) || { name: pr.nurseryName };
  sheet(`<div class="promo-sheet-v">${promoVisual(pr)}</div>
  <span class="badge b-nursery" style="position:static;display:inline-block;margin-bottom:8px">🌿 מהמשתלה השכונתית</span>
  <h3>${esc(pr.title)}</h3>${pr.deal ? `<div class="deal">${esc(pr.deal)}</div>` : ''}
  ${pr.text ? `<p>${esc(pr.text)}</p>` : ''}
  <p class="muted small">${esc(n.name)}${n.address ? ', ' + esc(n.address) : ''}, ${fmtKm(dist(pr))} ממך${pr.until ? `. בתוקף עד ${new Date(pr.until).toLocaleDateString('he-IL')}` : ''}</p>
  ${contactBtns(n)}
  <button class="btn ghost" data-a="open" data-to="nursery/${pr.nurseryId}">לעמוד המשתלה</button>`);
}
function nurseryCard(n) {
  const cnt = activePromos().filter(p => p.nurseryId === n.id).length;
  return `<button class="mini nursery-mini" data-a="open" data-to="nursery/${n.id}"><div class="mv">${nurseryImg(n)}</div><div class="mt">${esc(n.name)}<div class="ms">${fmtKm(dist(n))}${cnt ? `, ${cnt} הצעות` : ''}</div></div></button>`;
}

// ---------- התראות פוש ----------
const pushConfigured = () => !!(CFG.VAPID_KEY && !/PASTE/.test(CFG.VAPID_KEY));
const pushCapable = () => pushConfigured() && location.protocol === 'https:' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
const pushOn = () => pushCapable() && Notification.permission === 'granted' && lsGet('ll_push') === '1';
const iosNeedsInstall = () => isIOS && !isStandalone;
async function pushNotify(type, id, preview) {
  try {
    if (!auth || !auth.currentUser) return;
    const tok = await auth.currentUser.getIdToken();
    fetch('/api/notify', { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tok }, body: JSON.stringify({ type, id, preview: String(preview || '').slice(0, 120) }) }).catch(() => { });
  } catch (e) { }
}
async function enablePush(silent) {
  if (!pushCapable()) {
    if (!silent) { if (iosNeedsInstall()) installSheet(true); else toast(pushConfigured() ? 'הדפדפן הזה לא תומך בהתראות. נסו בכרום.' : 'ההתראות עוד לא הוגדרו באפליקציה.'); }
    return false;
  }
  try {
    const perm = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
    if (perm !== 'granted') { if (!silent) toast('ההתראות לא אושרו. אפשר לאשר בהגדרות הדפדפן, תחת הרשאות האתר.'); lsSet('ll_push', '0'); return false; }
    const { M, app: pushApp } = await loadMessaging(fbCfg);
    if (M.isSupported && !(await M.isSupported())) { if (!silent) toast('הדפדפן הזה לא תומך בהתראות.'); return false; }
    if (!(await navigator.serviceWorker.getRegistration())) await navigator.serviceWorker.register('sw.js');
    const reg = await Promise.race([navigator.serviceWorker.ready, new Promise((_, rej) => setTimeout(() => rej(Object.assign(new Error('service worker not ready'), { code: 'sw-timeout' })), 12000))]);
    const token = await M.getToken(M.getMessaging(pushApp || fbApp), { vapidKey: CFG.VAPID_KEY, serviceWorkerRegistration: reg });
    if (!token) throw Object.assign(new Error('no token returned'), { code: 'no-token' });
    await setDoc(doc(db, 'users', uid(), 'private', 'push'), { tokens: arrayUnion(token), t: Date.now() }, { merge: true });
    lsSet('ll_push', '1'); lsSet('ll_push_off', '0'); lsSet('ll_push_token', token);
    if (!silent) {
      sheet(`<div class="ask-ic">✅</div><h3>ההתראות פעילות</h3><p class="muted">מעכשיו נודיע לך בטלפון כשמישהו עונה, פונה או מתקשר, גם כשהאפליקציה סגורה.</p><button class="btn hot" data-a="closeSheet">מעולה</button>`);
    }
    return true;
  } catch (e) {
    errLog(e);
    const code = String(e && (e.code || e.name) || 'error'), msg = String(e && e.message || '').slice(0, 300);
    try { window.__llReport && (window.__bootErrs || []).push('push: ' + code + ' ' + msg) && window.__llReport('push'); } catch (x) { }
    if (!silent) {
      const hint = /token-subscribe-failed|PERMISSION_DENIED|has not been used|disabled/i.test(code + msg) ? 'צריך להפעיל שירות ב-Google Cloud (ראו הודעה בצ׳אט עם Claude).'
        : /failed-service-worker|serviceWorker/i.test(code + msg) ? 'בעיה ברישום של האפליקציה בדפדפן. נסו לסגור ולפתוח מחדש.'
        : /unsupported|indexedDB/i.test(code + msg) ? 'הדפדפן לא תומך בהתראות (אולי מצב גלישה בסתר).' : '';
      sheet(`<div class="ask-ic">⚠️</div><h3>ההתראות לא הופעלו</h3><p class="muted">${esc(hint || 'משהו השתבש. צלמו את המסך הזה ושלחו לנו.')}</p>
      <pre class="err-code">${esc(code)}\n${esc(msg)}</pre><button class="btn ghost" data-a="closeSheet">סגירה</button>`);
    }
    return false;
  }
}
// אחרי שליחת פנייה או הודעה: הזמן הכי טוב לבקש התראות
// החלון היפה של "הפעלת התראות"
// כיבוי התראות במכשיר הזה
async function disablePush() {
  const tok = lsGet('ll_push_token');
  try { if (tok) await updateDoc(doc(db, 'users', uid(), 'private', 'push'), { tokens: arrayRemove(tok) }); } catch (e) { errLog(e); }
  try { const { M, app } = await loadMessaging(fbCfg); await M.deleteToken(M.getMessaging(app || fbApp)); } catch (e) { errLog(e); }
  try { const reg = await navigator.serviceWorker.getRegistration(); const sub = reg && await reg.pushManager.getSubscription(); if (sub) await sub.unsubscribe(); } catch (e) { errLog(e); }
  lsSet('ll_push', '0'); lsSet('ll_push_off', '1');
}
function pushPopup() {
  sheet(`<div class="pp-hero"><div class="pp-ring"></div><div class="pp-bell">🔔</div></div>
  <h3 class="pp-title">אל תפספסו אף צמח</h3>
  <p class="muted center" style="margin-top:0">נודיע לכם בטלפון, גם כשהאפליקציה סגורה:</p>
  <ul class="pp-list">
    <li><span>💬</span>כשמישהו עונה לכם</li>
    <li><span>🌿</span>כשמישהו רוצה את הצמח שלכם</li>
    <li><span>📞</span>כשמתקשרים אליכם</li>
    <li><span>🔥</span>כשצמח מרשימת המשאלות מופיע לידכם</li>
  </ul>
  <button class="btn hot pp-cta" data-a="pushOn">🔔 הפעלת התראות</button>
  <button class="link-btn" data-a="closeSheet">אולי אחר כך</button>
  <p class="small muted center" style="margin:6px 0 0">אפשר לכבות בכל רגע בהגדרות</p>`);
}
// אחרי שליחת פנייה או הודעה: הזמן הכי טוב לבקש התראות
function askPushSoon() {
  if (pushOn() || sheetOpen() || lsGet('ll_push_off') === '1') return;
  const last = +lsGet('ll_push_ask') || 0;
  if (Date.now() - last < 3 * 864e5) return;
  if (iosNeedsInstall()) { lsSet('ll_push_ask', String(Date.now())); setTimeout(() => installSheet(true), 1500); return; }
  if (!pushCapable() || Notification.permission === 'denied') return;
  lsSet('ll_push_ask', String(Date.now()));
  setTimeout(() => { if (!sheetOpen()) pushPopup(); }, 1500);
}
// חלון "התקינו את האפליקציה"
function installSheet(forPush) {
  if (isStandalone) return;
  if (iosNeedsInstall()) {
    sheet(`<div class="ask-ic">📲</div><h3>${forPush ? 'כדי לקבל התראות באייפון' : 'התקינו את LeafLoop'}</h3>
    <p class="muted">${forPush ? 'באייפון, התראות עובדות רק אחרי שמוסיפים את האפליקציה למסך הבית. זה לוקח 5 שניות:' : 'פתיחה מהירה מהמסך הראשי, כמו אפליקציה רגילה, וגם התראות:'}</p>
    <ol class="ios-steps"><li>לוחצים על כפתור השיתוף <span class="ios-share">⬆︎</span> בתחתית ספארי</li><li>גוללים ובוחרים <b>"הוספה למסך הבית"</b></li><li>פותחים את LeafLoop מהמסך הראשי ומאשרים התראות</li></ol>
    <button class="btn ghost" data-a="installLater">הבנתי</button>`);
    return;
  }
  if (deferredInstall) {
    sheet(`<div class="ask-ic">📲</div><h3>התקינו את LeafLoop</h3><p class="muted">אייקון במסך הבית, פתיחה מהירה, והתראות כשעונים לך.</p>
    <button class="btn hot" data-a="install">${ic('download')} התקנה</button><button class="btn ghost" data-a="installLater">לא עכשיו</button>`);
    return;
  }
  if (forPush) enablePush();
}
function maybeInstallPrompt() {
  if (isStandalone || inAppBrowser) return;
  const last = +lsGet('ll_inst_no') || 0;
  if (Date.now() - last < 7 * 864e5) return;
  if (!(deferredInstall || isIOS)) return;
  setTimeout(() => { if (!sheetOpen() && !$('#overlay.open') && !['chat', 'add'].includes(curRoute()[0])) { lsSet('ll_inst_no', String(Date.now())); installSheet(false); } }, 8000);
}
// מיד אחרי ההתחברות: חלון התראות (לכל היותר פעם ביום, ולא למי שכיבה בעצמו)
function entryPrompt() {
  if (lsGet('ll_push_off') === '1') { maybeInstallPrompt(); return; }
  const last = +lsGet('ll_push_ask') || 0;
  const recently = Date.now() - last < 864e5;
  if (iosNeedsInstall()) {
    if (recently || inAppBrowser) { maybeInstallPrompt(); return; }
    setTimeout(() => { if (!sheetOpen() && !$('#overlay.open')) { lsSet('ll_push_ask', String(Date.now())); installSheet(true); } }, 900);
    return;
  }
  const needPush = pushCapable() && Notification.permission === 'default';
  if (!needPush || recently) { maybeInstallPrompt(); return; }
  setTimeout(() => {
    if (sheetOpen() || $('#overlay.open') || Notification.permission !== 'default') return;
    lsSet('ll_push_ask', String(Date.now()));
    pushPopup();
  }, 900);
}
window.addEventListener('appinstalled', () => { toast('🌿 LeafLoop הותקנה!'); });

// =====================================================
// ניווט
// =====================================================
let chatUnsub = null, mapObj = null;
const curRoute = () => (location.hash.slice(1) || 'discover').split('/');
function go(h) { if (location.hash === '#' + h) route(); else location.hash = h; }
const VIEWS = {};
function route() {
  closeSheet();
  if (chatUnsub) { chatUnsub(); chatUnsub = null; }
  if (mapObj) { mapObj.remove(); mapObj = null; }
  if (REC) stopRec(true);
  if (player) { player.pause(); player = null; playingId = null; }
  let full = true;
  if (!cfgOk) renderSetup();
  else if (S.me === null && !S.authKnown) renderLoading(redirecting() ? 'מסיימים להתחבר…' : '');
  else if (!S.me) renderLanding();
  else if (!S.profile) renderOnboarding();
  else if (!S.booted) renderLoading();
  else {
    const [r, arg] = curRoute();
    (VIEWS[r] || VIEWS.discover)(arg);
    full = r === 'chat';
  }
  $('#app').classList.toggle('no-tabs', full);
  $('#tabbar').style.display = full ? 'none' : '';
  if (!full) renderTabs(curRoute()[0]);
  window.scrollTo(0, 0);
}
function live(routes) {
  if (!S.booted) return;
  const [r, arg] = curRoute();
  if (!routes.includes(r) || sheetOpen()) return;
  const a = document.activeElement;
  if (a && ['INPUT', 'TEXTAREA', 'SELECT'].includes(a.tagName)) return;
  const y = window.scrollY;
  VIEWS[r](arg);
  window.scrollTo(0, y);
}
function renderTabs(active) {
  const n = unreadMsgs() + S.incoming.length;
  const T = [['discover', 'search', 'חיפוש'], ['map', 'map', 'מפה'], ['add', 'plus', 'הוספה'], ['matches', 'heart', 'התאמות'], ['profile', 'user', 'פרופיל']];
  $('#tabbar').innerHTML = T.map(([k, i, l]) => k === 'add'
    ? `<a href="#add" aria-label="הוספת צמח" class="${active === k ? 'on' : ''}"><span class="add">${ic('plus', 28)}</span></a>`
    : `<a href="#${k}" class="${active === k || ((active === 'plant' || active === 'swipe') && k === 'discover') ? 'on' : ''}">${ic(i, 24)}${l}${k === 'matches' && n ? `<span class="dot">${n}</span>` : ''}</a>`).join('');
}
function refreshBadges() {
  if (!S.booted) return;
  const r = curRoute()[0];
  if (r !== 'chat') renderTabs(r);
  const b = $('#bell-dot'); const n = notifList().filter(x => x.unread).length;
  if (b) { b.textContent = n; b.style.display = n ? '' : 'none'; }
}

// =====================================================
// מסכי פתיחה
// =====================================================
const markBooted = () => { window.__llBooted = true; };
function renderSetup() {
  markBooted();
  $('#view').innerHTML = `<div class="ob"><div class="ob-hero"><div class="wordmark">Leaf<span>Loop</span></div><p>כמעט מוכן!</p></div>
  <h2>צריך לחבר את Firebase</h2>
  <p class="muted">האפליקציה עובדת, אבל עוד לא מחוברת למסד הנתונים. פתחו את הקובץ <b>firebase-config.js</b> והדביקו בו את הפרטים מ-Firebase. ההוראות המלאות נמצאות בקובץ README.</p></div>`;
}
function redirecting() { try { return sessionStorage.getItem('ll_redirect') === '1'; } catch (e) { return false; } }
function renderLoading(msg) {
  $('#view').innerHTML = `<div class="loading"><div class="wordmark">Leaf<span>Loop</span></div><span class="spin big"></span>${msg ? `<p class="muted">${msg}</p>` : ''}</div>`;
}
function renderLanding() {
  markBooted();
  $('#view').innerHTML = `<div class="landing">
    <div class="ob-hero land-hero"><div class="wordmark">Leaf<span>Loop</span></div><p>הצמחים שלך מחפשים אחד את השני.</p></div>
    <ol class="how">
      <li><b>מצלמים צמח</b> שאתם רוצים להחליף</li>
      <li><b>מחליקים</b> על צמחים של אנשים באזור</li>
      <li><b>כשיש התאמה</b> מדברים ומתאמים החלפה</li>
    </ol>
    <div class="ob-foot">
      <button class="btn google" data-a="signIn">${GOOGLE_G} התחברות עם Google</button>
      <p class="small muted center">בהתחברות אתם מסכימים ל<a href="privacy.html">מדיניות הפרטיות</a>. הכתובת שלכם לעולם לא מוצגת לאחרים.</p>
    </div></div>`;
}
let ob = null;
function renderOnboarding() {
  markBooted();
  if (!ob) ob = { step: 1, name: (S.me.displayName || '').split(' ')[0], color: AV_COLORS[0], city: '', lat: null, lng: null, radius: 10, wish: [] };
  const steps = `<div class="steps">${[1, 2, 3].map(i => `<i class="${i <= ob.step ? 'on' : ''}"></i>`).join('')}</div>`;
  let body = '';
  if (ob.step === 1) {
    body = `<div class="ob-hero"><div class="wordmark">Leaf<span>Loop</span></div><p>נעים להכיר!</p></div>${steps}
    <h2>איך לקרוא לך?</h2><p class="muted">השם יוצג לאנשים שתחליפו איתם.</p>
    <input class="field" id="ob-name" placeholder="שם או כינוי" value="${esc(ob.name)}" maxlength="24" autocomplete="given-name">
    <div class="err" id="ob-err"></div>
    ${S.me.photoURL ? '' : `<p class="label">צבע לפרופיל</p><div class="colors">${AV_COLORS.map(c => `<button data-a="obColor" data-c="${c}" class="${c === ob.color ? 'on' : ''}" style="background:${c}" aria-label="צבע"></button>`).join('')}</div>`}
    <div class="ob-foot"><button class="btn hot" data-a="obNext">המשך</button><button class="btn ghost" data-a="signOut">התנתקות</button></div>`;
  } else if (ob.step === 2) {
    body = `${steps}<h2>איפה הצמחים שלך?</h2><p class="muted">כדי להראות לך אנשים קרובים.</p>
    <button class="btn sun" data-a="obGeo">${ic('pin')} שימוש במיקום שלי</button>
    <p class="label">או בחירת עיר</p>
    <select class="field" id="ob-city"><option value="">בחרו עיר</option>${CITIES.map(c => `<option ${c.n === ob.city ? 'selected' : ''}>${c.n}</option>`).join('')}</select>
    <div class="err" id="ob-err"></div>
    <div class="note">${ic('shield', 20)}<span>לעולם לא נציג את הכתובת שלך. אחרים רואים רק עיר ומרחק משוער.</span></div>
    <div class="ob-foot"><button class="btn hot" data-a="obNext">המשך</button><button class="btn ghost" data-a="obBack">חזרה</button></div>`;
  } else {
    body = `${steps}<h2>מה אתם מחפשים?</h2><p class="muted">בחרו כמה צמחים, ונמצא לכם התאמות. אפשר לשנות בכל רגע.</p>
    <div class="chips" style="gap:8px">${POPULAR.map(id => `<button class="sel ${ob.wish.includes(id) ? 'on' : ''}" data-a="obWish" data-id="${id}">${esc(catById(id).he)}</button>`).join('')}</div>
    <p class="label">כמה רחוק לחפש?</p>
    <div class="chips" style="gap:8px">${RADII.map(r => `<button class="sel ${r === ob.radius ? 'on' : ''}" data-a="obRadius" data-r="${r}">${radiusLabel(r)}</button>`).join('')}</div>
    <div class="err" id="ob-err"></div>
    <div class="ob-foot"><button class="btn hot" data-a="obFinish">יאללה, מתחילים</button><button class="btn ghost" data-a="obBack">חזרה</button></div>`;
  }
  $('#view').innerHTML = `<div class="ob">${body}</div>`;
}
async function finishOnboarding(el) {
  busy(el, true, 'יוצרים פרופיל…');
  const data = {
    name: ob.name, color: ob.color, photo: S.me.photoURL || null, city: ob.city, lat: ob.lat, lng: ob.lng,
    radius: ob.radius, wishlist: ob.wish,
    createdAt: Date.now(), lastSeen: Date.now()
  };
  try {
    await setDoc(doc(db, 'users', uid()), data);
    S.profile = { id: uid(), ...data };
    ob = null;
    await startSession();
    go('add');
    setTimeout(() => toast(`ברוכים הבאים, ${data.name}! הוסיפו את הצמח הראשון שלכם.`), 300);
  } catch (e) {
    errLog(e); busy(el, false);
    $('#ob-err').textContent = 'לא הצלחנו לשמור. בדקו את החיבור לאינטרנט ונסו שוב.';
  }
}

// =====================================================
// התחברות וסשן
// =====================================================
async function signIn(el) {
  if (inAppBrowser) { openInBrowserSheet(); return; }
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  busy(el, true, 'מתחברים…');
  // בטלפון: מעבר באותו דף (בלי לשונית חדשה). במחשב: חלון קופץ.
  if (isMobile && sameDomainAuth) {
    try { sessionStorage.setItem('ll_redirect', '1'); } catch (e) { }
    try { await signInWithRedirect(auth, provider); } catch (e) { busy(el, false); errLog(e); toast('ההתחברות לא הצליחה. נסו שוב.'); }
    return;
  }
  try { await signInWithPopup(auth, provider); }
  catch (e) {
    busy(el, false);
    if (['auth/popup-blocked', 'auth/operation-not-supported-in-this-environment'].includes(e.code)) return signInWithRedirect(auth, provider);
    if (['auth/popup-closed-by-user', 'auth/cancelled-popup-request'].includes(e.code)) return;
    if (e.code === 'auth/unauthorized-domain') return toast('הכתובת של האתר עוד לא אושרה ב-Firebase (README, שלב 3).');
    errLog(e); toast('ההתחברות לא הצליחה. נסו שוב.');
  }
}
function openInBrowserSheet() {
  sheet(`<h3>פתחו בדפדפן</h3><p class="muted">Google לא מאפשר להתחבר מתוך הדפדפן של אפליקציות כמו אינסטגרם או פייסבוק.</p>
  <p>${isIOS ? 'לחצו על <b>⋯</b> או על סמל השיתוף, ובחרו <b>פתיחה בספארי</b>.' : 'לחצו על <b>⋮</b> ובחרו <b>פתיחה בדפדפן</b>.'}</p>
  <button class="btn hot" data-a="copyLink">העתקת הקישור</button><button class="btn ghost" data-a="closeSheet">סגירה</button>`);
}
let subs = [];
function unsubAll() { subs.forEach(f => { try { f(); } catch (e) { } }); subs = []; if (chatUnsub) { chatUnsub(); chatUnsub = null; } }
async function startSession() {
  try {
    const ps = await getDoc(doc(db, 'users', uid(), 'private', 'state'));
    if (ps.exists()) S.priv = { swipes: {}, saved: [], blocked: [], alertsSeenAt: 0, ...ps.data() };
    pruneSwipes();
  } catch (e) { errLog(e); }
  listen();
  autoLocate();
  await loadMyNursery();
  try { await loadPool(true); } catch (e) { errLog(e); toast('לא הצלחנו לטעון צמחים. בדקו את החיבור לאינטרנט.'); }
  await Promise.race([S.matchesReady, new Promise(r => setTimeout(r, 4000))]);
  S.booted = true; markBooted();
  if (pushOn()) enablePush(true); // רענון המכשיר הרשום
  entryPrompt();
  updateDoc(doc(db, 'users', uid()), { lastSeen: Date.now() }).catch(errLog);
}
async function loadPool(force) {
  if (!force && Date.now() - S.poolAt < 90000) return;
  const s = await getDocs(query(collection(db, 'plants'), where('available', '==', true), limit(400)));
  S.pool = s.docs.map(d => ({ id: d.id, ...d.data() })).filter(p => okId(p.id) && okId(p.ownerId) && p.ownerId !== uid());
  const ids = [...new Set(S.pool.map(p => p.ownerId))];
  ids.forEach(id => { delete S.users[id]; });
  await Promise.all(ids.map(getUser));
  S.pool = S.pool.filter(p => !(S.users[p.ownerId] && S.users[p.ownerId].banned));
  loadReps(ids).catch(errLog);
  try {
    const [ns, ps] = await Promise.all([
      getDocs(query(collection(db, 'nurseries'), where('active', '==', true), limit(100))),
      getDocs(query(collection(db, 'promos'), where('active', '==', true), limit(150)))
    ]);
    S.nurseries = ns.docs.map(d => ({ id: d.id, ...d.data() })).filter(n => okId(n.id));
    S.promos = ps.docs.map(d => ({ id: d.id, ...d.data() })).filter(pr => okId(pr.id) && okId(pr.nurseryId));
  } catch (e) { errLog(e); }
  S.poolAt = Date.now();
}
async function loadReps(ids) {
  const todo = ids.filter(id => !S.rep[id]);
  for (let i = 0; i < todo.length; i += 30) {
    const chunk = todo.slice(i, i + 30);
    const s2 = await getDocs(query(collection(db, 'reviews'), where('to', 'in', chunk)));
    const agg = {}; chunk.forEach(id => { agg[id] = { sum: 0, count: 0 }; });
    s2.docs.forEach(d => { const r = d.data(); if (agg[r.to] && r.all >= 1 && r.all <= 5) { agg[r.to].sum += r.all; agg[r.to].count++; } });
    chunk.forEach(id => { const a = agg[id]; S.rep[id] = { avg: a.count ? a.sum / a.count : 0, count: a.count }; });
  }
}
async function loadMyNursery() {
  if (!S.me || !S.me.email) return;
  try {
    const s = await getDocs(query(collection(db, 'nurseries'), where('ownerEmail', '==', S.me.email.toLowerCase())));
    S.myNursery = s.docs.length ? { id: s.docs[0].id, ...s.docs[0].data() } : null;
  } catch (e) { errLog(e); }
}
function listen() {
  const me = uid();
  subs.push(onSnapshot(query(collection(db, 'plants'), where('ownerId', '==', me)), s => {
    S.myPlants = s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (b.t || 0) - (a.t || 0));
    fixStuckPlants();
    live(['profile']);
  }, errLog));

  let first = true; const seen = {};
  let gotMatches; S.matchesReady = new Promise(r => { gotMatches = r; });
  subs.push(onSnapshot(query(collection(db, 'matches'), where('users', 'array-contains', me)), s => {
    gotMatches();
    const list = s.docs.map(d => ({ id: d.id, ...d.data() })).filter(m => okId(m.id) && Array.isArray(m.users) && m.users.every(okId) && m.give && m.info);
    list.forEach(m => {
      const prev = seen[m.id];
      const viewing = location.hash === '#chat/' + m.id;
      if (!first && !isBlocked(otherId(m))) {
        if (prev === undefined && m.createdBy !== me) toast(`🌱 התאמה חדשה עם ${otherInfo(m).name}!`);
        else if (prev !== undefined && (m.lastAt || 0) > prev && m.lastFrom && m.lastFrom !== me && !viewing) toast(`💬 ${otherInfo(m).name}: ${m.lastMsg || ''}`);
      }
      seen[m.id] = m.lastAt || 0;
      ((m.give || {})[me] || []).forEach(pid => {
        const x = S.myPlants.find(p => p.id === pid); if (!x) return;
        if (m.status === 'swapped' && x.available) updateDoc(doc(db, 'plants', pid), { available: false, swappedIn: m.id, dealIn: null }).catch(errLog);
        else if (['agreed', 'meeting'].includes(m.status) && !x.dealIn && x.available) updateDoc(doc(db, 'plants', pid), { dealIn: m.id }).catch(errLog);
        else if (['discussing', 'cancelled'].includes(m.status) && x.dealIn === m.id) updateDoc(doc(db, 'plants', pid), { dealIn: null }).catch(errLog);
        else if (m.status !== 'swapped' && !x.available && x.swappedIn === m.id) updateDoc(doc(db, 'plants', pid), { available: true, swappedIn: null }).then(() => toast(`ה${pName(x)} חזר/ה להיות זמין/ה לאחרים`)).catch(errLog);
      });
    });
    first = false;
    S.matches = list.sort((a, b) => (b.lastAt || 0) - (a.lastAt || 0));
    syncStats(); fixStuckPlants();
    live(['matches', 'profile']);
    if (curRoute()[0] === 'chat') updateChatMeta();
    refreshBadges();
  }, errLog));

  subs.push(onSnapshot(query(collection(db, 'calls'), where('to', '==', me), where('status', '==', 'ringing')), onIncomingCalls, errLog));
  let firstIn = true;
  subs.push(onSnapshot(query(collection(db, 'requests'), where('to', '==', me)), s => {
    const prevIds = S.incoming.map(r => r.id);
    S.incoming = s.docs.map(d => ({ id: d.id, ...d.data() })).filter(r => okId(r.id) && okId(r.from) && okId(r.target) && Array.isArray(r.offer) && r.offer.every(okId) && r.status === 'pending' && !isBlocked(r.from)).sort((a, b) => b.t - a.t);
    const fresh = S.incoming.find(r => !prevIds.includes(r.id));
    if (!firstIn && fresh) toast(`🌿 ${fresh.fromInfo.name} שלח/ה לך הצעת החלפה`);
    firstIn = false;
    live(['matches']); refreshBadges();
  }, errLog));

  subs.push(onSnapshot(query(collection(db, 'requests'), where('from', '==', me)), s => {
    S.outgoing = s.docs.map(d => ({ id: d.id, ...d.data() }));
    S.outgoing.filter(r => r.status !== 'pending' && !r.seen).forEach(r => {
      const n = (r.toInfo && r.toInfo.name) || '';
      toast(r.status === 'accepted' ? `🌱 ${n} אישר/ה את הצעת ההחלפה שלך!` : `${n} מעדיף/ה לוותר הפעם. אפשר להציע צמח אחר.`);
      updateDoc(doc(db, 'requests', r.id), { seen: true }).catch(errLog);
    });
  }, errLog));
}
// צמחים שהוסתרו בגלל החלפה שבוטלה אחר כך (גם מגרסאות קודמות)
let fixedStuck = false;
function fixStuckPlants() {
  if (fixedStuck || !S.matches.length || !S.myPlants.length) return;
  fixedStuck = true;
  const me = uid();
  S.myPlants.filter(p => !p.available && !p.swappedIn).forEach(p => {
    const ms = S.matches.filter(m => ((m.give || {})[me] || []).includes(p.id));
    if (ms.length && !ms.some(m => m.status === 'swapped') && ms.some(m => m.status === 'cancelled'))
      updateDoc(doc(db, 'plants', p.id), { available: true, swappedIn: null }).then(() => toast(`ה${pName(p)} חזר/ה להיות זמין/ה לאחרים`)).catch(errLog);
  });
}
function syncStats() {
  const me = uid();
  const done = S.matches.filter(m => m.status === 'swapped');
  const swaps = done.length;
  const rehomed = done.reduce((s, m) => s + (((m.give || {})[me] || []).length), 0);
  if (S.profile) { S.profile.swaps = swaps; S.profile.rehomed = rehomed; } // מחושב מקומית בלבד
}

// =====================================================
// גילוי (Swipe)
// =====================================================
let lastSwipe = null;
VIEWS.swipe = function () {
  const R = S.profile.radius;
  const nearWish = S.pool.filter(p => isDiscoverable(p) && iWant(p) && dist(p) <= R).sort((a, b) => dist(a) - dist(b));
  const people = [...new Set(S.pool.filter(p => isDiscoverable(p) && dist(p) <= R).map(p => p.ownerId))].map(id => S.users[id]).filter(Boolean).sort((a, b) => dist(a) - dist(b)).slice(0, 20);
  const nurs = S.nurseries.filter(n => n.active && dist(n) <= Math.max(R, 30)).sort((a, b) => dist(a) - dist(b)).slice(0, 12);
  const n = notifList().filter(x => x.unread).length;
  const canLive = !S.here && liveOn() && !!navigator.geolocation;
  $('#view').innerHTML = `
  <div class="disc">
    <header class="hero2">
      <div class="hrow"><button class="icon-btn" data-a="open" data-to="discover" aria-label="חזרה לחיפוש">${ic('back', 22)}</button><h1 style="flex:1">🔥 גלה עוד</h1>
        <button class="icon-btn" data-a="notifs" aria-label="התראות">${ic('bell', 22)}<span class="dot" id="bell-dot" style="${n ? '' : 'display:none'}">${n}</span></button></div>
      <div class="hrow2">
        <button class="loc" data-a="filters">${ic('pin', 16)} ${esc(locLabel())}, ${radiusLabel(R)}</button>
        ${canLive ? `<button class="live-pill" data-a="useLive">${ic('pin', 14)} איפה אני?</button>` : ''}
        <span class="sp"></span>
        <button class="hbtn" data-a="refresh" aria-label="רענון">${ic('refresh', 18)}</button>
        <button class="hbtn" data-a="filters">${ic('filter', 18)} סינון</button>
      </div>
    </header>
    <div class="deck-area"><span class="hcount" id="deck-count"></span><section class="deck" id="deck" aria-label="כרטיסי צמחים"></section></div>
    <div class="actions" id="deck-actions">
      <button class="act undo" data-a="undo" aria-label="ביטול ההחלקה האחרונה" ${lastSwipe ? '' : 'disabled'}>${ic('undo', 20)}</button>
      <button class="act pass" data-a="decide" data-d="pass" aria-label="לא בשבילי">${ic('x', 28)}</button>
      <button class="act like" data-a="decide" data-d="like" aria-label="מעוניין">${ic('heart', 32)}</button>
      <button class="act super" data-a="decide" data-d="super" aria-label="סופר מעוניין">${ic('star', 26)}</button>
      <button class="act save" data-a="decide" data-d="save" aria-label="שמירה לאחר כך">${ic('bookmark', 20)}</button>
    </div>
  </div>`;
  renderDeck();
};

// =====================================================
// חיפוש (המסך הראשי)
// =====================================================
const SQ = { q: '', mode: 'all', far: false };
const plantMatchesQ = (p, q) => { const c = catById(p.catId); return c.he.toLowerCase().includes(q) || (c.sci || '').toLowerCase().includes(q) || (CATS[c.cat] || '').includes(q); };
function searchList(radius) {
  const q = cleanName(SQ.q).toLowerCase();
  let list = S.pool.filter(p => isDiscoverable(p) && dist(p) <= radius && modeMatch(p, SQ.mode));
  if (q) list = list.filter(p => plantMatchesQ(p, q));
  return list.sort((a, b) => {
    if (q) { const sa = pName(a).toLowerCase().startsWith(q) ? 0 : 1, sb = pName(b).toLowerCase().startsWith(q) ? 0 : 1; if (sa !== sb) return sa - sb; }
    return (dist(a) - dist(b)) || ((b.t || 0) - (a.t || 0));
  });
}
// מתי הצמח הועלה: מוצג רק למנהל
const adminAge = p => (isAdmin() && p && p.t ? `🕒 ${ago(p.t)}` : '');
function resultCard(p) {
  const u = owner(p);
  return `<button class="rcard" data-a="open" data-to="plant/${p.id}"><div class="mv">${visual(p)}${modeTag(p)}</div>
    <div class="mt">${esc(pName(p))}<div class="ms">${esc(u.name || p.ownerName || '')}, ${fmtKm(dist(p))}</div>${adminAge(p) ? `<div class="ms admin-age">${adminAge(p)}</div>` : ''}</div></button>`;
}
function promoResult(pr) {
  return `<button class="rcard promo-r" data-a="promo" data-id="${pr.id}"><div class="mv">${promoVisual(pr)}<span class="mode m-nursery">🌿 משתלה</span></div>
    <div class="mt">${esc(pr.title)}<div class="ms">${pr.deal ? esc(pr.deal) + ', ' : ''}${esc(pr.nurseryName)}</div></div></button>`;
}
function renderResults() {
  const box = $('#results'); if (!box) return;
  const R = S.profile.radius, q = cleanName(SQ.q).toLowerCase();
  const list = searchList(SQ.far ? 9999 : R);
  const promos = activePromos().filter(pr => !q || pr.title.toLowerCase().includes(q) || (pr.catId && catById(pr.catId).he.toLowerCase().includes(q))).slice(0, 3);
  const items = list.map(resultCard);
  promos.forEach((pr, i) => items.splice(Math.min(items.length, 2 + i * 6), 0, promoResult(pr)));
  const farChip = SQ.far ? `<div class="pad" style="padding-bottom:0"><button class="sel on" data-a="nearOnly">🌍 בכל הארץ ✕</button></div>` : '';
  const title = q ? (list.length ? `${list.length === 1 ? 'נמצא צמח אחד' : `נמצאו ${list.length} צמחים`}` : '') : 'צמחים לידך';
  if (items.length) { box.innerHTML = `${farChip}<h2 class="section-t" style="margin-top:14px">${title}</h2><div class="rgrid">${items.join('')}</div>`; return; }
  const far = searchList(9999).length;
  box.innerHTML = `<div class="empty"><h3>${q ? `לא מצאנו "${esc(SQ.q.trim())}" לידך` : 'עוד אין כאן צמחים'}</h3>
    ${far ? `<p>יש ${far === 1 ? 'אחד' : far} כאלה רחוק יותר.</p><button class="btn sun sm" data-a="searchFar" style="margin:0 auto 10px">חיפוש בכל הארץ</button>` : ''}
    ${q ? `<p>נוסיף לרשימת המשאלות שלך ונודיע כשמישהו יעלה כזה?</p><button class="btn hot sm" data-a="wishFromSearch" style="margin:auto">${ic('bell', 16)} תודיעו לי</button>`
      : `<p>הזמינו חברים שאוהבים צמחים, וככל שיהיו יותר אנשים יהיו יותר צמחים.</p><button class="btn hot sm" data-a="invite" style="margin:auto">${ic('share', 16)} הזמנת חברים</button>`}</div>`;
}
VIEWS.discover = function () {
  if (Date.now() - S.poolAt > 45000) loadPool(true).then(() => { if (curRoute()[0] === 'discover') renderResults(); }).catch(errLog);
  const R = S.profile.radius;
  const n = notifList().filter(x => x.unread).length;
  const canLive = !S.here && liveOn() && !!navigator.geolocation;
  const nearWish = S.pool.filter(p => isDiscoverable(p) && iWant(p) && dist(p) <= R).sort((a, b) => dist(a) - dist(b));
  const nurs = S.nurseries.filter(x => x.active && dist(x) <= Math.max(R, 30)).sort((a, b) => dist(a) - dist(b)).slice(0, 12);
  const swipeN = feed().length;
  $('#view').innerHTML = `
  <header class="hero2 search-hero">
    <div class="hrow"><h1>${greeting()}, ${esc(S.profile.name)}</h1>
      <button class="icon-btn" data-a="notifs" aria-label="התראות">${ic('bell', 22)}<span class="dot" id="bell-dot" style="${n ? '' : 'display:none'}">${n}</span></button></div>
    <div class="sbox">${ic('search', 20)}<input id="sq" type="search" placeholder="מה מחפשים? מונסטרה, פוטוס, קקטוס…" value="${esc(SQ.q)}" autocomplete="off" enterkeyhint="search">${SQ.q ? `<button data-a="clearSearch" aria-label="ניקוי">${ic('x', 18)}</button>` : ''}</div>
    <div class="hrow2">
      <button class="loc" data-a="filters">${ic('pin', 16)} ${esc(locLabel())}, ${radiusLabel(R)}</button>
      ${canLive ? `<button class="live-pill" data-a="useLive">${ic('pin', 14)} איפה אני?</button>` : ''}
      <span class="sp"></span><button class="hbtn" data-a="refresh" aria-label="רענון">${ic('refresh', 18)}</button>
    </div>
  </header>
  <div class="mchips">${[['all', 'הכול'], ['swap', '🔄 להחלפה'], ['gift', '🎁 במתנה'], ['sale', '🏷️ למכירה']].map(([k, l]) => `<button class="sel ${SQ.mode === k ? 'on' : ''}" data-a="searchMode" data-k="${k}">${l}</button>`).join('')}</div>
  <button class="swipe-cta" data-a="open" data-to="swipe"><span class="sc-ic">🔥</span><span><b>גלה עוד</b><span>החליקו על צמחים לידכם ומצאו התאמות${swipeN ? ` (${swipeN})` : ''}</span></span>${ic('back', 20).replace('class="ic"', 'class="ic flip"')}</button>
  ${!SQ.q && nearWish.length ? `<h2 class="section-t">מרשימת המשאלות שלך</h2><div class="strip">${nearWish.map(miniCard).join('')}</div>` : ''}
  <div id="results"></div>
  ${!SQ.q && nurs.length ? `<h2 class="section-t">משתלות לידך</h2><div class="strip">${nurs.map(nurseryCard).join('')}</div>` : ''}
  <div style="height:24px"></div>`;
  renderResults();
};
const modeTag = p => {
  if (p && p.frozen) return `<span class="mode m-frozen">🔒 מוקפא</span>`;
  if (p && p.dealIn) return `<span class="mode m-frozen">🤝 בתהליך החלפה</span>`;
  const k = modeOf(p), m = MODE[k];
  return `<span class="mode ${m.c}">${m.i} ${k === 'sale' && p.price ? priceTxt(p) : m.t}</span>`;
};
const modeMatch = (p, want) => want === 'all' || modeOf(p) === want || (modeOf(p) === 'both' && (want === 'swap' || want === 'gift'));
function miniCard(p) {
  return `<button class="mini" data-a="open" data-to="plant/${p.id}"><div class="mv">${visual(p)}${modeTag(p)}</div><div class="mt">${esc(pName(p))}<div class="ms">${esc(p.ownerName)}, ${fmtKm(dist(p))}</div>${adminAge(p) ? `<div class="ms admin-age">${adminAge(p)}</div>` : ''}</div></button>`;
}
function wantsChips(u, open) {
  const mineCats = myAvail().map(p => p.catId);
  const w = u.wishlist || [];
  return w.map(c => `<span class="chip ${mineCats.includes(c) ? 'have' : 'want'}">${mineCats.includes(c) ? ic('check', 14) : ''}${esc(catById(c).he)}</span>`).join('') +
    (open ? '<span class="chip open">פתוח/ה להצעות</span>' : '') + (!w.length && !open ? '<span class="chip">אפשר להציע</span>' : '');
}
function cardHTML(it, i) {
  if (it.k === 'promo') return promoCardHTML(it.p, i);
  const p = it.p, t = matchType(p), u = owner(p), gift = modeOf(p) === 'gift';
  return `<article class="card" data-id="${p.id}" style="z-index:${10 - i};--i:${i}">
    <div class="card-visual">${visual(p)}<span class="badge b-${t}">${TYPE_LABEL[t]}</span>${modeTag(p)}
      <span class="stamp s-like">${gift ? 'אשמח!' : 'מעוניין'}</span><span class="stamp s-pass">לא בשבילי</span><span class="stamp s-super">סופר!</span></div>
    <div class="card-info">
      <div class="row sb"><h2>${esc(pName(p))}</h2><button class="icon-btn" data-a="open" data-to="plant/${p.id}" aria-label="פרטים נוספים">${ic('eye')}</button></div>
      ${catById(p.catId).sci ? `<p class="sci">${esc(catById(p.catId).sci)}</p>` : ''}
      <div class="chips"><span class="chip">${OFFER[p.offer]}${p.qty > 1 ? ' ×' + p.qty : ''}</span><span class="chip">${ic('pin', 14)}${fmtKm(dist(p))}</span><span class="chip">${esc(u.name)} ${rating(u)}</span>${adminAge(p) ? `<span class="chip admin-age">${adminAge(p)}</span>` : ''}</div>
      ${gift ? `<p class="wants-l">${esc(u.name)} מוסר/ת את זה בלי תמורה 💛</p><div class="chips"><span class="chip open">רק לבקש</span></div>`
        : `<p class="wants-l">${modeOf(p) === 'both' ? 'אפשר במתנה, או בתמורה ל:' : 'רוצה בתמורה'}</p><div class="chips">${wantsChips(u, p.open)}</div>`}
    </div></article>`;
}
function promoCardHTML(pr, i) {
  const n = nurseryById(pr.nurseryId) || { name: pr.nurseryName };
  return `<article class="card promo-card" data-id="pr_${pr.id}" data-kind="promo" style="z-index:${10 - i};--i:${i}">
    <div class="card-visual">${promoVisual(pr)}<span class="badge b-nursery">🌿 מהמשתלה השכונתית</span>${iWant(pr) ? '<span class="mode m-gift">מהרשימה שלך</span>' : ''}
      <span class="stamp s-like">מעניין!</span><span class="stamp s-pass">לא עכשיו</span><span class="stamp s-super">סופר!</span></div>
    <div class="card-info">
      <div class="row sb"><h2>${esc(pr.title)}</h2><button class="icon-btn" data-a="open" data-to="nursery/${pr.nurseryId}" aria-label="לעמוד המשתלה">${ic('eye')}</button></div>
      ${pr.deal ? `<div class="deal">${esc(pr.deal)}</div>` : ''}
      <div class="chips"><span class="chip">${ic('pin', 14)}${esc(n.name)}, ${fmtKm(dist(pr))}</span></div>
      ${pr.text ? `<p class="promo-text">${esc(pr.text)}</p>` : ''}
    </div></article>`;
}
function deckItems() {
  const plants = feed().map(p => ({ k: 'plant', p }));
  const seen = S.priv.promoSeen || {}, now = Date.now();
  const promos = activePromos().filter(pr => !seen[pr.id] || now - seen[pr.id] > 3 * 864e5)
    .sort((a, b) => ((iWant(b) ? 1 : 0) - (iWant(a) ? 1 : 0)) || dist(a) - dist(b)).map(p => ({ k: 'promo', p }));
  if (!promos.length) return plants;
  const out = []; let j = 0;
  plants.forEach((it, i) => { out.push(it); if ((i + 1) % 4 === 0 && j < promos.length) out.push(promos[j++]); });
  if (plants.length < 4 && j < promos.length) out.splice(Math.min(1, out.length), 0, promos[j++]);
  return out;
}
function renderDeck() {
  const deck = $('#deck'); if (!deck) return;
  const list = deckItems();
  const plantsN = list.filter(x => x.k === 'plant').length;
  $('#deck-count').textContent = plantsN ? (plantsN === 1 ? 'צמח אחד באזור' : `${plantsN} צמחים באזור`) : '';
  $('#deck-actions').classList.toggle('hidden', !list.length);
  const undo = $('[data-a=undo]'); if (undo) undo.disabled = !lastSwipe;
  if (!list.length) {
    const anyAtAll = S.pool.length > 0;
    deck.innerHTML = `<div class="card empty-card" style="--i:0"><div class="empty">
      ${anyAtAll ? `<h3>עברתם על כל הצמחים באזור</h3><p>הגדילו את הרדיוס או חזרו לצמחים שדילגתם עליהם.</p>
        <button class="btn sun" data-a="filters">הגדלת הרדיוס</button><button class="btn ghost" data-a="resetPasses">הצגה מחדש של מה שדילגתי</button>`
      : `<h3>עוד אין כאן צמחים</h3><p>אתם מהראשונים באזור! הזמינו חברים שאוהבים צמחים, וככל שיהיו יותר אנשים, יהיו יותר התאמות.</p>
        <button class="btn hot" data-a="invite">${ic('share')} הזמנת חברים</button><button class="btn ghost" data-a="open" data-to="add">הוספת צמח משלי</button>`}
      ${lastSwipe ? `<button class="btn ghost" data-a="undo">${ic('undo')} ביטול ההחלקה האחרונה</button>` : ''}</div></div>`;
    return;
  }
  const top = list.slice(0, 3);
  deck.innerHTML = top.map(cardHTML).reverse().join('');
  bindDrag();
  hydrate(top.filter(x => x.k === 'plant').map(x => x.p));
  if (top[0].k === 'promo') countView(top[0].p);
}
function bindDrag() {
  const card = $$('#deck .card[data-id]').pop(); if (!card) return;
  let sx = 0, sy = 0, dx = 0, dy = 0, drag = false;
  card.addEventListener('pointerdown', e => {
    if (e.target.closest('button')) return;
    drag = true; sx = e.clientX; sy = e.clientY; dx = dy = 0;
    card.setPointerCapture(e.pointerId); card.style.transition = 'none';
  });
  card.addEventListener('pointermove', e => {
    if (!drag) return;
    dx = e.clientX - sx; dy = e.clientY - sy;
    card.style.transform = `translate(${dx}px,${dy}px) rotate(${dx / 16}deg)`;
    const c = v => Math.max(0, Math.min(1, v));
    card.style.setProperty('--like', c(dx / 100));
    card.style.setProperty('--pass', c(-dx / 100));
    card.style.setProperty('--super', Math.abs(dx) < 60 ? c(-dy / 110) : 0);
  });
  const end = () => {
    if (!drag) return; drag = false; card.style.transition = '';
    if (dx > 100) decide('like');
    else if (dx < -100) decide('pass');
    else if (dy < -120 && Math.abs(dx) < 70) decide('super');
    else { card.style.transform = ''; ['--like', '--pass', '--super'].forEach(v => card.style.setProperty(v, 0)); }
  };
  card.addEventListener('pointerup', end);
  card.addEventListener('pointercancel', end);
}
function decide(a) {
  const card = $$('#deck .card[data-id]').pop(); if (!card) return;
  const out = { like: 'translate(130%,-4%) rotate(22deg)', pass: 'translate(-130%,-4%) rotate(-22deg)', super: 'translate(0,-130%)', save: 'translate(0,40%) scale(.6)' }[a];
  if (card.dataset.kind === 'promo') {
    const pr = S.promos.find(x => 'pr_' + x.id === card.dataset.id); if (!pr) return;
    card.classList.add('leaving'); card.style.transform = out;
    S.priv.promoSeen = { ...(S.priv.promoSeen || {}), [pr.id]: Date.now() };
    if (a === 'save') { S.priv.savedPromos = [...new Set([...(S.priv.savedPromos || []), pr.id])]; toast('נשמר. תמצאו את זה בפרופיל, תחת "שמורים".'); }
    lastSwipe = (a === 'pass' || a === 'save') ? { promo: pr.id, a } : null;
    savePriv();
    setTimeout(() => { renderDeck(); if (a === 'like' || a === 'super') openPromo(pr); }, 260);
    return;
  }
  const p = S.pool.find(x => x.id === card.dataset.id); if (!p) return;
  card.classList.add('leaving'); card.style.transform = out;
  if (navigator.vibrate) navigator.vibrate(12);
  S.priv.swipes[p.id] = a + ':' + Date.now();
  if (a === 'save' && !S.priv.saved.includes(p.id)) { S.priv.saved.push(p.id); toast('נשמר. תמצאו אותו בפרופיל, תחת "שמורים".'); }
  lastSwipe = { id: p.id, a };
  savePriv();
  setTimeout(() => { renderDeck(); if (a === 'like' || a === 'super') afterLike(p, a === 'super'); }, 260);
}
async function afterLike(p, sup) {
  const me = uid();
  const u = await getUser(p.ownerId);
  try { await setDoc(doc(db, 'likes', me + '_' + p.id), { from: me, to: p.ownerId, plantId: p.id, super: !!sup, t: Date.now() }); } catch (e) { errLog(e); }
  if (modeOf(p) === 'gift' || modeOf(p) === 'sale') return openRequestSheet(p, u, sup);
  let mine = theyWantMine(u).map(x => x.id);
  let mutual = false;
  try {
    const q = await getDocs(query(collection(db, 'likes'), where('from', '==', p.ownerId), where('to', '==', me)));
    const liked = q.docs.map(d => d.data().plantId).filter(id => myAvail().some(x => x.id === id));
    if (liked.length) { mutual = true; mine = [liked[0]]; }
  } catch (e) { errLog(e); }
  if ((mine.length && iWant(p)) || mutual) {
    try {
      const m = await createMatch({ other: u, mineIds: [mine[0]], theirIds: [p.id], theirPlants: [p], type: 'perfect', basis: 'like' });
      showMatch(m);
    } catch (e) { errLog(e); toast('לא הצלחנו ליצור את ההתאמה. נסו שוב.'); }
  } else openRequestSheet(p, u, sup);
}

// ---------- הצעת החלפה ----------
function openRequestSheet(p, u, sup) {
  if (S.outgoing.some(r => r.target === p.id && r.status === 'pending')) { toast(`כבר שלחתם בקשה על הצמח הזה. מחכים לתשובה מ${u.name}.`); return; }
  const mode = modeOf(p);
  const msgBox = `<p class="label">כמה מילים ל${esc(u.name)} (לא חובה)</p><textarea class="field" id="req-msg" rows="2" maxlength="300" placeholder="היי! אשמח מאוד, יש לי מקום מושלם בשבילו 🌿"></textarea>`;
  if (mode === 'sale') {
    sheet(`<h3>🏷️ רוצים לקנות?</h3>
    <div class="deal">${esc(priceTxt(p) || 'מחיר לפי הסכמה')}</div>
    <p class="muted">שלחו הודעה ל${esc(u.name)}. אם ${esc(u.name)} יאשר/תאשר, תדברו בצ'אט ותסגרו איסוף ותשלום ביניכם (מזומן, ביט וכו').</p>
    <p class="label">הודעה ל${esc(u.name)}</p><textarea class="field" id="req-msg" rows="2" maxlength="300" placeholder="היי! הצמח עדיין זמין? מתי אפשר לאסוף?"></textarea>
    <div class="err" id="req-err"></div>
    <button class="btn hot" data-a="sendRequest" data-id="${p.id}">🏷️ שליחה ל${esc(u.name)}</button>
    <button class="btn ghost" data-a="closeSheet">לא עכשיו</button>`);
    return;
  }
  if (mode === 'gift') {
    sheet(`<h3>🎁 רוצים לקבל במתנה?</h3>
    <p class="muted">${esc(u.name)} מוסר/ת את ה${esc(pName(p))} בלי תמורה. שלחו בקשה, ואם ${esc(u.name)} יאשר/תאשר, תתאמו איסוף בצ'אט.</p>
    ${msgBox}<div class="err" id="req-err"></div>
    <button class="btn hot" data-a="sendRequest" data-id="${p.id}">🎁 שליחת בקשה לקבל</button>
    <button class="btn ghost" data-a="closeSheet">לא עכשיו</button>`);
    return;
  }
  if (mode === 'swap' && !myAvail().length) {
    sheet(`<h3>💚 רוצים את ה${esc(pName(p))}?</h3>
    <p class="muted">${esc(u.name)} מחפש/ת החלפה, אבל אפשר לשלוח התעניינות גם בלי צמח. ${esc(u.name)} יחליט/תחליט אם מתאים, ואז תדברו בצ'אט.</p>
    <p class="label">כמה מילים ל${esc(u.name)}</p><textarea class="field" id="req-msg" rows="3" maxlength="300" placeholder="היי! אני מאוד אוהבת את הצמח. עוד אין לי צמח להחלפה, אבל אשמח לדבר 🌿"></textarea>
    <div class="err" id="req-err"></div>
    <button class="btn hot" data-a="sendRequest" data-id="${p.id}">💚 שליחת התעניינות</button>
    <button class="btn ghost" data-a="open" data-to="add">${ic('plus')} הוספת צמח שלי להצעה</button>`);
    return;
  }
  const wanted = theyWantMine(u).map(x => x.id);
  const wl = (u.wishlist || []).map(w => esc(catById(w).he)).join(', ');
  sheet(`<h3>${sup ? 'סופר מעוניין! ⭐' : 'שמרנו שאתם מעוניינים'}</h3>
  <p class="muted">${mode === 'both' ? `${esc(u.name)} מוכן/ה למסור במתנה או להחליף. אפשר לבקש בלי לתת כלום, או להציע משהו בתמורה.` : `אין כאן התאמה אוטומטית, אבל אפשר לשלוח ל${esc(u.name)} הצעת החלפה.`}${wl ? ` ברשימת המשאלות: ${wl}.` : ''}${p.open ? ' פתוח/ה גם להצעות אחרות.' : ''}</p>
  ${myAvail().length ? `<p class="label">${mode === 'both' ? 'רוצים להציע משהו בתמורה? (לא חובה)' : `מה להציע בתמורה ל${esc(pName(p))}? (אפשר גם בלי)`}</p>
  <div class="pick">${myAvail().map(x => `<label class="pick-item"><input type="checkbox" name="offer" value="${x.id}" ${wanted.includes(x.id) ? 'checked' : ''}><span class="thumb">${visual(x)}</span><span>${esc(pName(x))} <span class="small muted">(${OFFER[x.offer]}${x.qty > 1 ? ' ×' + x.qty : ''})</span>${wanted.includes(x.id) ? `<em>${esc(u.name)} מחפש/ת את זה</em>` : ''}</span></label>`).join('')}</div>` : ''}
  ${msgBox}<div class="err" id="req-err"></div>
  <button class="btn hot" data-a="sendRequest" data-id="${p.id}">${ic('swap')} ${mode === 'both' ? 'שליחת בקשה' : 'שליחת הצעת החלפה'}</button>
  <button class="btn ghost" data-a="closeSheet">לא עכשיו</button>`);
}
async function sendRequest(el) {
  const p = S.pool.find(x => x.id === el.dataset.id); if (!p) return;
  const u = await getUser(p.ownerId);
  const ids = $$('#sheet input[name=offer]:checked').map(i => i.value);
  const kind = modeOf(p) === 'sale' ? 'buy' : ids.length ? 'swap' : (modeOf(p) === 'swap' ? 'ask' : 'gift');
  const snap = {};
  ids.forEach(id => { const x = S.myPlants.find(y => y.id === id); if (x) snap[id] = { catId: x.catId, thumb: x.thumb || null, offer: x.offer, qty: x.qty || 1 }; });
  const mEl = $('#req-msg'); const msg = mEl ? mEl.value.trim() : '';
  busy(el, true, 'שולחים…');
  try {
    const rref = await addDoc(collection(db, 'requests'), {
      from: uid(), to: p.ownerId, fromInfo: pubInfo(S.profile), toInfo: pubInfo(u),
      target: p.id, targetSnap: { catId: p.catId, thumb: p.thumb || null, offer: p.offer, qty: p.qty || 1, price: p.price || null },
      offer: ids, offerSnap: snap, kind, msg, status: 'pending', seen: false, t: Date.now()
    });
    pushNotify('request', rref.id); askPushSoon();
    closeSheet(); toast(kind === 'buy' ? `ההודעה נשלחה ל${u.name} 🏷️ נעדכן אתכם כשתגיע תשובה.` : kind === 'swap' ? `ההצעה נשלחה ל${u.name}. נעדכן אתכם כשתגיע תשובה.` : kind === 'ask' ? `ההתעניינות נשלחה ל${u.name} 💚 נעדכן אתכם כשתגיע תשובה.` : `הבקשה נשלחה ל${u.name} 🎁 נעדכן אתכם כשתגיע תשובה.`);
  } catch (e) { errLog(e); busy(el, false); $('#req-err').textContent = 'השליחה לא הצליחה. נסו שוב.'; }
}
async function acceptReq(rid, toChat, el) {
  const r = S.incoming.find(x => x.id === rid); if (!r) return;
  const target = S.myPlants.find(p => p.id === r.target);
  if (!target || !target.available || target.frozen) {
    toast('הצמח הזה כבר לא זמין אצלך, אז ההצעה נדחתה.');
    return updateDoc(doc(db, 'requests', rid), { status: 'declined' }).catch(errLog);
  }
  busy(el, true);
  try {
    const u = await getUser(r.from);
    // קודם מאשרים את הפנייה, ורק אז נוצרת ההתאמה (כללי האבטחה בודקים את הסדר הזה)
    await updateDoc(doc(db, 'requests', rid), { status: 'accepted' });
    const theirPlants = r.offer.map(id => ({ id, ...(r.offerSnap[id] || {}) }));
    const m = await createMatch({ other: u, mineIds: [r.target], theirIds: r.offer, theirPlants, type: 'request', reqId: rid, kind: r.kind || (r.offer.length ? 'swap' : 'gift'), status: 'discussing' });
    updateDoc(doc(db, 'requests', rid), { matchId: m.id }).catch(errLog);
    pushNotify('accepted', rid);
    if (r.msg) addDoc(collection(db, 'matches', m.id, 'messages'), { from: uid(), sys: true, text: `💬 ${r.fromInfo.name} כתב/ה: ${String(r.msg).slice(0, 300)}`, t: Date.now() + 1 }).catch(errLog);
    if (toChat) go('chat/' + m.id); else showMatch(m);
  } catch (e) { errLog(e); busy(el, false); toast('לא הצלחנו לאשר. נסו שוב.'); }
}

// ---------- יצירת התאמה ----------
async function createMatch(o) {
  const me = uid(), u = o.other;
  let id = [me, u.id].sort().join('_') + '_' + [...o.mineIds, ...o.theirIds].sort().join('_');
  let ref = doc(db, 'matches', id);
  const ex = await getDoc(ref);
  if (ex.exists() && ex.data().status !== 'cancelled') return { id, ...ex.data() };
  if (ex.exists()) { id = id + '_' + Date.now().toString(36); ref = doc(db, 'matches', id); } // התאמה ישנה שבוטלה: מתחילים חדשה
  const snap = {};
  o.mineIds.forEach(pid => { const x = S.myPlants.find(p => p.id === pid); if (x) snap[pid] = { catId: x.catId, thumb: x.thumb || null, offer: x.offer, qty: x.qty || 1, price: x.price || null, owner: me }; });
  o.theirIds.forEach(pid => { const x = o.theirPlants.find(p => p.id === pid); if (x) snap[pid] = { catId: x.catId, thumb: x.thumb || null, offer: x.offer || 'full', qty: x.qty || 1, owner: u.id }; });
  const now = Date.now();
  const data = {
    users: [me, u.id], info: { [me]: pubInfo(S.profile), [u.id]: pubInfo(u) },
    give: { [me]: o.mineIds, [u.id]: o.theirIds }, plants: snap, type: o.type, kind: o.kind || 'swap', status: o.status || 'discussing',
    createdBy: me, createdAt: now, lastAt: now, lastMsg: 'התאמה חדשה!', lastFrom: me,
    unread: { [me]: 0, [u.id]: 1 }, meeting: null, rated: [], reqId: o.reqId || null
  };
  await setDoc(ref, data);
  await addDoc(collection(db, 'matches', id, 'messages'), { from: me, sys: true, text: '🌿 יש התאמה! מומלץ לתאם מפגש במקום ציבורי.', t: now });
  pushNotify('match', id);
  return { id, ...data };
}
const snapOf = (m, pid) => ({ id: pid, ...((m.plants || {})[pid] || {}) });
function showMatch(m) {
  const me = uid(), o = otherId(m), name = otherInfo(m).name;
  const mineIds = m.give[me] || [], theirIds = m.give[o] || [];
  const mp = mineIds.length ? snapOf(m, mineIds[0]) : null, tp = theirIds.length ? snapOf(m, theirIds[0]) : null;
  const ask = m.kind === 'ask', buy = m.kind === 'buy';
  if (buy) {
    const pl = mp || tp;
    const t2 = mp ? 'יש קונה!' : 'אפשר לסגור!';
    const l2 = mp ? `${esc(name)} רוצה לקנות את ה${esc(pName(mp))} שלך 🏷️` : `ה${esc(pName(tp))} של ${esc(name)}${tp.price ? `, ₪${tp.price}` : ''} 🏷️`;
    $('#overlay').innerHTML = `<div class="match" role="dialog" aria-label="${t2}"><div class="burst">${burstLeaves(18)}</div>
      <div class="pair"><div class="bubble from-r">${visual(pl)}</div></div><h1>${t2}</h1><p>תאמו בצ'אט איסוף ותשלום.</p><div class="swapline">${l2}</div>
      <div class="btns"><button class="btn sun" data-a="matchChat" data-id="${m.id}">${ic('chat')} לצ'אט</button><button class="btn light" data-a="closeOverlay">אחר כך</button></div></div>`;
    $('#overlay').classList.add('open'); return;
  }
  const title = ask ? 'אפשר לדבר!' : !mp ? 'מתנה בדרך אליך!' : !tp ? 'מצאת למי למסור!' : 'יש התאמה!';
  const sub = ask ? 'עכשיו אפשר לדבר בצ׳אט ולמצוא מה מתאים לשניכם.' : mp && tp ? 'הצמחים שלכם מצאו אחד את השני.' : 'עוד צמח מצא בית חדש.';
  const line = ask ? (!mp ? `${esc(name)} פתוח/ה לדבר על ה${esc(pName(tp))} 💚` : `${esc(name)} מתעניין/ת ב${esc(pName(mp))} שלך 💚`)
    : !mp ? `ה${esc(pName(tp))} של ${esc(name)} מגיע/ה אליך במתנה 🎁` : !tp ? `ה${esc(pName(mp))} שלך עובר/ת ל${esc(name)} במתנה 🎁` : `ה${esc(pName(mp))} שלך ⇄ ה${esc(pName(tp))} של ${esc(name)}`;
  $('#overlay').innerHTML = `<div class="match" role="dialog" aria-label="${title}">
    <div class="burst">${burstLeaves(18)}</div>
    <div class="pair"><div class="bubble from-r">${visual(mp, m.kind)}</div><div class="heart">${ic('heart', 28)}</div><div class="bubble from-l">${visual(tp, m.kind)}</div></div>
    <h1>${title}</h1>
    <p>${sub}</p>
    <div class="swapline">${line}</div>
    <div class="btns"><button class="btn sun" data-a="matchChat" data-id="${m.id}">${ic('chat')} בואו נתאם</button><button class="btn light" data-a="closeOverlay">אחר כך</button></div>
  </div>`;
  $('#overlay').classList.add('open');
  if (navigator.vibrate) navigator.vibrate([30, 40, 30]);
}

// =====================================================
// פרטי צמח
// =====================================================
VIEWS.plant = async function (id) {
  let p = S.pool.find(x => x.id === id);
  if (!p) {
    $('#view').innerHTML = `<div class="loading"><span class="spin big"></span></div>`;
    try { const s = await getDoc(doc(db, 'plants', id)); if (s.exists()) { p = { id, ...s.data() }; await getUser(p.ownerId); } } catch (e) { errLog(e); }
    if (curRoute()[1] !== id) return;
    if (!p) { $('#view').innerHTML = `<div class="empty"><h3>הצמח הזה כבר לא זמין</h3><button class="btn hot sm" data-a="open" data-to="discover" style="margin:12px auto 0">חזרה לגילוי</button></div>`; return; }
  }
  const u = owner(p), t = matchType(p), saved = S.priv.saved.includes(p.id);
  const m = S.matches.find(x => x.status !== 'cancelled' && x.plants && x.plants[p.id]);
  const mine = p.ownerId === uid();
  $('#view').innerHTML = `
  <div class="detail-v">${visual(p)}<button class="icon-btn back" data-a="back" aria-label="חזרה">${ic('back')}</button>${mine ? '' : `<span class="badge b-${t}" style="top:auto;bottom:18px">${TYPE_LABEL[t]}</span>`}</div>
  <div class="pad">
    <h1 style="font-size:32px;font-weight:900">${esc(pName(p))}</h1><p class="sci" style="font-size:15px">${esc(catById(p.catId).sci)}</p>
    ${isAdmin() && p.t ? `<p class="admin-age small">🕒 הועלה ${ago(p.t)}, ${new Date(p.t).toLocaleString('he-IL', { day: 'numeric', month: 'numeric', year: '2-digit', hour: '2-digit', minute: '2-digit' })} (רק את/ה רואה את זה)</p>` : ''}
    ${p.frozen ? `<div class="mode-big m-frozen">🔒 המודעה מוקפאת<span>${mine ? 'אחרים לא רואים אותה ולא יכולים לפנות עליה' : 'הצמח שמור כרגע למישהו'}</span></div>`
      : `<div class="mode-big ${MODE[modeOf(p)].c}">${MODE[modeOf(p)].i} ${modeOf(p) === 'sale' && p.price ? `למכירה, ${priceTxt(p)}` : MODE[modeOf(p)].t}<span>${MODE_HINT[modeOf(p)]}</span></div>`}
    <div class="facts"><div class="fact"><b>${OFFER[p.offer]}</b><span>מה מוצע</span></div><div class="fact"><b>${COND[p.condition] || ''}</b><span>מצב</span></div><div class="fact"><b>${p.qty || 1}</b><span>כמות</span></div></div>
    <div class="owner">${avatar(u)}<div style="flex:1"><b>${esc(u.name)}</b><div class="small muted">${esc(u.city || p.city || '')}${mine ? '' : ', ' + fmtKm(dist(p)) + ' ממך'}</div></div><div style="text-align:center"><b style="font-family:var(--font-d)">${rating(u)}</b><div class="small muted">${repOf(u).count ? `${repOf(u).count} דירוגים` : 'עוד אין דירוגים'}</div></div></div>
    ${mine || p.frozen || ['gift', 'sale'].includes(modeOf(p)) ? '' : `<p class="label">${modeOf(p) === 'both' ? 'אם תרצו להציע משהו בתמורה' : `${esc(u.name)} רוצה בתמורה`}</p><div class="chips">${wantsChips(u, p.open)}</div>`}
    <p class="label">מסירה</p><div class="chips"><span class="chip">${DELIV[p.delivery] || ''}</span><span class="chip">${ic('shield', 14)} מפגש במקום ציבורי</span></div>
    <div style="margin-top:22px">
    ${mine ? `<button class="btn hot" data-a="myPlantSheet" data-id="${p.id}">✏️ עריכת המודעה</button>`
      : m ? `<button class="btn primary" data-a="open" data-to="chat/${m.id}">${ic('chat')} מעבר לצ'אט</button>`
        : p.frozen ? `<button class="btn ghost" disabled>🔒 שמור כרגע למישהו</button>`
        : `<button class="btn hot" data-a="likeDetail" data-id="${p.id}">${modeOf(p) === 'gift' ? '🎁 אשמח לקבל' : modeOf(p) === 'sale' ? '🏷️ אני רוצה לקנות' : '💚 מעוניין/ת'}</button>
           <button class="btn ghost" data-a="toggleSave" data-id="${p.id}">${ic('bookmark')} ${saved ? 'הסרה מהשמורים' : 'שמירה לאחר כך'}</button>`}
    </div>
  </div>`;
  hydrate([p]);
};

// =====================================================
// מפה
// =====================================================
VIEWS.map = function () {
  const near = S.pool.filter(p => isDiscoverable(p) && dist(p) <= S.profile.radius).sort((a, b) => dist(a) - dist(b));
  $('#view').innerHTML = `<div class="ph"><h1>צמחים באזור</h1></div>
  <p class="muted small" style="margin:-4px 18px 12px">${icInline('shield', 14)} המיקומים משוערים בכוונה, כדי לשמור על הפרטיות של כולם.</p>
  <div id="map"></div>
  <h2 class="section-t">הקרובים ביותר</h2>
  <div class="list">${near.length ? near.slice(0, 60).map(p => `<button class="li" data-a="open" data-to="plant/${p.id}"><span class="thumb">${visual(p)}</span><div class="li-main"><div class="li-t">${esc(pName(p))}</div><div class="li-s">${esc(p.ownerName)}, ${OFFER[p.offer]}</div></div><b class="small">${fmtKm(dist(p))}</b></button>`).join('')
      : `<div class="empty">אין עדיין צמחים ברדיוס הזה. <button class="btn sun sm" data-a="filters" style="margin:10px auto 0">הגדלת הרדיוס</button></div>`}</div>
  <div style="height:20px"></div>`;
  initMap(near);
};
function jitter(id, v, k) { return v + (((hashStr(id + k) % 1000) / 1000) - .5) * 0.006; }
function initMap(near, tries = 0) {
  if (!window.L) {
    if (tries < 20) return setTimeout(() => initMap(near, tries + 1), 250);
    const el = $('#map'); if (el) el.innerHTML = '<div class="empty" style="color:#fff">המפה לא נטענה. בדקו את החיבור לאינטרנט.</div>';
    return;
  }
  if (!$('#map') || mapObj) return;
  const r = S.profile.radius;
  const zoom = r <= 5 ? 13 : r <= 10 ? 12 : r <= 25 ? 11 : r <= 50 ? 10 : 8;
  const B = base();
  mapObj = L.map('map').setView([B.lat, B.lng], zoom);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 17, attribution: '© OpenStreetMap' }).addTo(mapObj);
  L.circle([B.lat, B.lng], { radius: 350, color: '#FF2E7E', fillColor: '#FF2E7E', fillOpacity: .5, weight: 3 }).addTo(mapObj).bindPopup('<b>אתם כאן (בערך)</b>');
  if (r < 500) L.circle([B.lat, B.lng], { radius: r * 1000, color: '#073B2A', weight: 1, fill: false, dashArray: '6 6' }).addTo(mapObj);
  const by = {};
  near.forEach(p => { (by[p.ownerId] = by[p.ownerId] || []).push(p); });
  Object.values(by).forEach(ps => {
    const u = owner(ps[0]);
    L.circle([jitter(u.id, ps[0].lat, 'a'), jitter(u.id, ps[0].lng, 'b')], { radius: 450, color: safeColor(u.color), fillColor: safeColor(u.color), fillOpacity: .45, weight: 2 }).addTo(mapObj)
      .bindPopup(`<b>${esc(u.name)}</b>, ${fmtKm(dist(ps[0]))}<br>${ps.map(p => `<a href="#plant/${p.id}">${MODE[modeOf(p)].i} ${esc(pName(p))}</a>`).join('<br>')}`);
  });
  S.nurseries.filter(n => n.active && n.lat).forEach(n => {
    L.marker([n.lat, n.lng], { icon: L.divIcon({ className: 'nursery-pin', html: '🌿', iconSize: [34, 34] }) }).addTo(mapObj)
      .bindPopup(`<b>${esc(n.name)}</b><br>משתלה, ${fmtKm(dist(n))}<br><a href="#nursery/${n.id}">לעמוד המשתלה</a>`);
  });
}

// =====================================================
// הוספת צמח
// =====================================================
let draft = null;
const newDraft = () => ({ step: 'name', img: null, catId: null, guesses: [], mode: 'swap', price: '', offer: 'cutting', condition: 'young', qty: 1, delivery: 'pickup', open: true, wants: [] });
// הוספת צמח בשלבים: שם, תמונה, מה לעשות, פרטים, ומה רוצים בתמורה
const ADD_STEPS = d => ['name', 'photo', 'mode', 'details', ...(['swap', 'both'].includes(d.mode) ? ['wants'] : [])];
VIEWS.add = function () {
  if (!draft) draft = newDraft();
  const d = draft;
  const steps = ADD_STEPS(d);
  if (!steps.includes(d.step)) d.step = 'name';
  const i = steps.indexOf(d.step), last = i === steps.length - 1;
  const c = d.catId ? catById(d.catId) : null;
  const sel = (k, obj) => `<div class="chips" style="gap:8px">${Object.entries(obj).map(([kk, v]) => `<button class="sel ${d[k] === kk ? 'on' : ''}" data-a="draftSet" data-k="${k}" data-v="${kk}">${v}</button>`).join('')}</div>`;
  let body = '';
  if (d.step === 'name') {
    body = `<h2 class="wiz-q">איזה צמח זה?</h2><p class="muted">כתבו את השם. ההצעות שמופיעות הן רק לעזרה.</p>
    <input class="field wiz-big" id="plant-name" data-suggest="name" placeholder="למשל: מונסטרה" value="${esc(c ? c.he : '')}" data-change="plantName" autocomplete="off" enterkeyhint="next">
    <div class="sugg" id="plant-name-sugg"></div>
    ${c && c.sci ? `<p class="sci" style="margin-top:6px">${esc(c.sci)}</p>` : ''}<div class="err" id="add-err"></div>`;
  } else if (d.step === 'photo') {
    body = safeImg(d.img)
      ? `<h2 class="wiz-q">איזה יופי! 📸</h2><div class="scan" style="height:min(38dvh,300px)"><img src="${safeImg(d.img)}" alt="התמונה שלך"><label class="lbl" for="gal2" style="cursor:pointer">${icInline('image', 14)} החלפת תמונה</label></div><input type="file" id="gal2" accept="image/*" class="sr" data-change="photo">`
      : `<h2 class="wiz-q">תמונה של ה${esc(c ? c.he : 'צמח')}</h2><p class="muted">מודעות עם תמונה מקבלות הרבה יותר פניות 🌿</p>
    <label class="drop" for="cam" style="height:220px"><div class="big">${ic('camera', 44)}</div><h2>צילום עכשיו</h2></label><input type="file" id="cam" accept="image/*" capture="environment" class="sr" data-change="photo">
    <label class="btn ghost" for="gal" style="margin-top:12px">${ic('image')} בחירה מהגלריה</label><input type="file" id="gal" accept="image/*" class="sr" data-change="photo">
    <button class="link-btn" data-a="skipPhoto">אין לי תמונה כרגע, להמשיך בלי</button>`;
  } else if (d.step === 'mode') {
    body = `<h2 class="wiz-q">מה תרצו לעשות איתו?</h2>
    <div class="modes">${Object.entries(MODE).map(([k, m]) => `<button class="mode-opt ${m.c} ${d.mode === k ? 'on' : ''}" data-a="draftSet" data-k="mode" data-v="${k}"><i>${m.i}</i><b>${MODE_ACT[k]}</b><span>${MODE_HINT[k]}</span></button>`).join('')}</div>
    ${d.mode === 'sale' ? `<p class="label">מחיר</p><div class="price-in"><input class="field" id="price" type="number" inputmode="numeric" min="1" max="99999" placeholder="למשל 40" value="${esc(d.price)}"><span>₪</span></div>` : ''}
    <div class="err" id="add-err"></div>`;
  } else if (d.step === 'details') {
    body = `<h2 class="wiz-q">עוד כמה פרטים</h2>
    <p class="label">מה אתם מציעים?</p>${sel('offer', OFFER)}
    <p class="label">מצב הצמח</p>${sel('condition', COND)}
    <p class="label">כמות</p><div class="stepper"><button data-a="qty" data-v="1" aria-label="יותר">+</button><b id="qty">${d.qty}</b><button data-a="qty" data-v="-1" aria-label="פחות">−</button></div>
    <p class="label">מסירה</p>${sel('delivery', DELIV)}`;
  } else {
    body = `<h2 class="wiz-q">מה הייתם רוצים בתמורה?</h2><p class="muted">לא חובה. זה עוזר למצוא התאמות.</p>
    <div class="row"><input class="field" id="want-in" data-suggest="want" placeholder="למשל: פילודנדרון" autocomplete="off" enterkeyhint="done"><button class="btn sun sm" data-a="addWant">הוספה</button></div>
    <div class="sugg" id="want-in-sugg"></div><div class="err" id="want-err"></div>
    <div class="chips" style="margin-top:8px">${d.wants.map(w => `<span class="chip want">${esc(catById(w).he)} <button data-a="rmWant" data-id="${esc(w)}" aria-label="הסרה">×</button></span>`).join('')}</div>
    <label class="toggle"><span><b>💚 פתוח/ה להצעות</b><br><span class="small muted">אפשר לקבל הצעות גם על צמחים אחרים.</span></span><input type="checkbox" id="open" ${d.open ? 'checked' : ''} data-change="open"></label>`;
  }
  const showNext = d.step !== 'photo' || safeImg(d.img);
  $('#view').innerHTML = `<div class="ph wiz-h">${i > 0 ? `<button class="icon-btn" data-a="addBack" aria-label="חזרה">${ic('back')}</button>` : ''}<h1>הוספת צמח</h1><span class="wiz-n">${i + 1}/${steps.length}</span></div>
  <div class="wiz-bar" role="progressbar" aria-valuenow="${i + 1}" aria-valuemax="${steps.length}"><i style="width:${Math.round((i + 1) / steps.length * 100)}%"></i></div>
  ${c && d.step !== 'name' ? `<div class="wiz-sum"><span class="thumb">${safeImg(d.img) ? `<div class="photo"><img src="${safeImg(d.img)}" alt=""></div>` : visual({ id: 'draft', catId: d.catId })}</span><b>${esc(c.he)}</b>${['details', 'wants'].includes(d.step) ? `<span class="chip">${MODE[d.mode].i} ${d.mode === 'sale' && d.price ? '₪' + esc(d.price) : MODE[d.mode].t}</span>` : ''}</div>` : ''}
  <div class="pad wiz-body">${body}</div>
  <div class="wiz-foot">${showNext ? `<button class="btn hot" data-a="${last ? 'savePlant' : 'addNext'}">${last ? ic('check') + ' פרסום הצמח' : 'המשך'}</button>` : ''}<button class="btn ghost" data-a="cancelAdd">ביטול</button></div>`;
  if (d.step === 'name') setTimeout(() => { const n = $('#plant-name'); if (n && !n.value) n.focus(); }, 50);
};
function addGo(dir) {
  keepName();
  const steps = ADD_STEPS(draft), i = steps.indexOf(draft.step);
  if (dir > 0) {
    if (draft.step === 'name' && !draft.catId) { $('#add-err').textContent = 'כתבו את שם הצמח.'; $('#plant-name').focus(); return; }
    if (draft.step === 'mode' && draft.mode === 'sale' && !(Math.round(+draft.price || 0) > 0)) { $('#add-err').textContent = 'כתבו מחיר למכירה.'; const pe = $('#price'); if (pe) pe.focus(); return; }
  }
  const ns = ADD_STEPS(draft);
  draft.step = ns[Math.max(0, Math.min(ns.length - 1, ns.indexOf(draft.step) + dir))] || steps[i];
  VIEWS.add(); window.scrollTo(0, 0);
}
function keepName() {
  if (!draft) return;
  const inp = $('#plant-name'); if (inp) { const c = toCat(inp.value); draft.catId = c ? c.id : null; }
  const o = $('#open'); if (o) draft.open = o.checked;
  const pr = $('#price'); if (pr) draft.price = pr.value;
}
async function savePlant(el) {
  keepName();
  if (!draft.catId) { draft.step = 'name'; VIEWS.add(); $('#add-err').textContent = 'כתבו את שם הצמח.'; return; }
  const price = Math.round(+draft.price || 0);
  if (draft.mode === 'sale' && price < 1) { draft.step = 'mode'; VIEWS.add(); $('#add-err').textContent = 'כתבו מחיר למכירה.'; return; }
  busy(el, true, 'מפרסמים…');
  try {
    const ref = doc(collection(db, 'plants'));
    const thumb = draft.img ? await shrinkDataUrl(draft.img, 260, .62) : null;
    const pr = S.profile;
    const data = {
      ownerId: uid(), ownerName: pr.name, ownerColor: pr.color || '#19A55B', ownerPhoto: pr.photo || null, city: pr.city, lat: pr.lat, lng: pr.lng,
      catId: draft.catId, mode: draft.mode, price: draft.mode === 'sale' ? price : null, frozen: false, offer: draft.offer, condition: draft.condition, qty: draft.qty, delivery: draft.delivery,
      open: ['gift', 'sale'].includes(draft.mode) ? true : !!draft.open, available: true, hasPhoto: !!draft.img, thumb, t: Date.now()
    };
    const b = writeBatch(db);
    b.set(ref, data);
    if (draft.img) b.set(doc(db, 'photos', ref.id), { ownerId: uid(), img: draft.img });
    const newWants = draft.wants.filter(w => !(pr.wishlist || []).includes(w));
    if (newWants.length) b.update(doc(db, 'users', uid()), { wishlist: arrayUnion(...newWants) });
    await b.commit();
    if (draft.img) S.photos[ref.id] = draft.img;
    if (newWants.length) pr.wishlist = [...(pr.wishlist || []), ...newWants];
    const seekers = Math.max(0, ((await cnt(query(collection(db, 'users'), where('wishlist', 'array-contains', data.catId)))) || 0));
    const name = pName(data);
    draft = null;
    go('discover');
    setTimeout(() => toast(seekers ? `פורסם! ${seekers === 1 ? 'משתמש אחד מחפש' : seekers + ' משתמשים מחפשים'} ${name} 🔥` : `פורסם! ה${name} שלך מחכה להתאמה.`), 300);
  } catch (e) { errLog(e); busy(el, false); toast('הפרסום לא הצליח. בדקו את החיבור ונסו שוב.'); }
}

// =====================================================
// התאמות
// =====================================================
let matchTab = 'active';
VIEWS.matches = function () {
  const vis = S.matches.filter(m => !isBlocked(otherId(m)));
  const lists = {
    active: vis.filter(m => !['swapped', 'cancelled'].includes(m.status)),
    completed: vis.filter(m => m.status === 'swapped'),
    archived: vis.filter(m => m.status === 'cancelled')
  };
  const L2 = lists[matchTab];
  const reqs = S.incoming.map(r => {
    const first = r.offer.map(id => ({ id, ...(r.offerSnap[id] || {}) }));
    const target = { id: r.target, ...r.targetSnap };
    return `<div class="req"><div class="row"><div class="duo"><span class="t">${visual(first[0], r.kind)}</span><span class="t">${visual(target)}</span></div>
      <div class="li-main">${first.length ? `<b>${esc(r.fromInfo.name)}</b> רוצה להציע לך <b>${first.map(x => esc(pName(x))).join(' + ')}</b> בתמורה ל<b>${esc(pName(target))}</b> שלך.` : (r.kind === 'buy' ? `🏷️ <b>${esc(r.fromInfo.name)}</b> רוצה לקנות את ה<b>${esc(pName(target))}</b> שלך${r.targetSnap.price ? ` (₪${r.targetSnap.price})` : ''}.` : r.kind === 'ask' ? `💚 <b>${esc(r.fromInfo.name)}</b> מתעניין/ת ב<b>${esc(pName(target))}</b> שלך. עוד אין לו/ה צמח להחלפה, אבל אפשר לדבר.` : `🎁 <b>${esc(r.fromInfo.name)}</b> ישמח/תשמח לקבל במתנה את ה<b>${esc(pName(target))}</b> שלך.`)}${r.msg ? `<div class="req-msg">"${esc(r.msg)}"</div>` : ''}<div class="small muted">${esc(r.fromInfo.city || '')}, ${ago(r.t)}</div></div></div>
      <div class="req-btns"><button class="btn primary sm" style="flex:1" data-a="reqAccept" data-id="${r.id}">אישור</button><button class="btn ghost sm" style="flex:1" data-a="reqChat" data-id="${r.id}">צ'אט</button><button class="btn ghost sm" style="flex:1" data-a="reqDecline" data-id="${r.id}">דחייה</button></div></div>`;
  }).join('');
  $('#view').innerHTML = `<div class="ph"><h1>התאמות</h1></div>
  ${reqs ? `<h2 class="section-t" style="margin-top:6px">הצעות שקיבלת</h2>${reqs}` : ''}
  <div class="tabs">${[['active', 'פעילות'], ['completed', 'הושלמו'], ['archived', 'בוטלו']].map(([k, l]) => `<button class="sel ${matchTab === k ? 'on' : ''}" data-a="matchTab" data-k="${k}">${l} (${lists[k].length})</button>`).join('')}</div>
  ${L2.length ? `<div class="list">${L2.map(matchRow).join('')}</div>` : `<div class="empty"><h3>${matchTab === 'active' ? 'עוד אין התאמות פעילות' : matchTab === 'completed' ? 'עוד לא השלמתם החלפה' : 'אין החלפות שבוטלו'}</h3><p>${matchTab === 'active' ? 'החליקו ימינה על צמחים שמעניינים אתכם. כשיש התאמה, היא תופיע כאן.' : 'כאן יופיעו החלפות לפי הסטטוס שלהן.'}</p>${matchTab === 'active' ? '<button class="btn hot sm" data-a="open" data-to="discover" style="margin:auto">לגילוי צמחים</button>' : ''}</div>`}
  <div style="height:20px"></div>`;
};
function matchRow(m) {
  const me = uid(), o = otherId(m), info = otherInfo(m);
  const mp = snapOf(m, (m.give[me] || [])[0]), tp = snapOf(m, (m.give[o] || [])[0]);
  const n = (m.unread || {})[me] || 0;
  return `<button class="li" data-a="open" data-to="chat/${m.id}"><div class="duo"><span class="t">${visual((m.give[me] || []).length ? mp : null, m.kind)}</span><span class="t">${visual((m.give[o] || []).length ? tp : null, m.kind)}</span></div>
  <div class="li-main"><div class="li-t">${m.kind === 'buy' ? `🏷️ ${esc(pName((m.give[me] || []).length ? mp : tp))}` : m.kind === 'ask' ? `💚 ${esc(pName((m.give[me] || []).length ? mp : tp))}` : !(m.give[me] || []).length ? `🎁 ${esc(pName(tp))} במתנה` : !(m.give[o] || []).length ? `🎁 ${esc(pName(mp))} במתנה ל${esc(info.name)}` : `${esc(pName(mp))} ⇄ ${esc(pName(tp))}`}</div><div class="li-s">${esc(info.name)}: ${esc(m.lastMsg || '')}</div></div>
  <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px"><span class="pill st-${m.status}">${STATUS[m.status]}</span>${n ? `<span class="unread">${n}</span>` : `<span class="small muted">${ago(m.lastAt)}</span>`}</div></button>`;
}

// =====================================================
// צ'אט
// =====================================================
VIEWS.chat = function (id) {
  const m = S.matches.find(x => x.id === id);
  if (!m) { $('#view').innerHTML = `<div class="empty"><h3>השיחה לא נמצאה</h3><button class="btn hot sm" data-a="open" data-to="matches" style="margin:12px auto 0">להתאמות</button></div>`; return; }
  const info = otherInfo(m), done = ['swapped', 'cancelled'].includes(m.status) || !!m.blockedBy;
  $('#view').innerHTML = `<div class="chat">
    <header class="chat-h"><button class="icon-btn" data-a="open" data-to="matches" aria-label="חזרה">${ic('back')}</button>${avatar(info)}
      <div style="flex:1;min-width:0"><b>${esc(info.name)}</b><div class="small muted">${esc(info.city || '')}</div></div>
      <button class="pill st-${m.status}" id="chat-status" data-a="statusSheet" data-id="${m.id}">${STATUS[m.status]} ▾</button>
      ${m.status !== 'cancelled' && !m.blockedBy && !isBlocked(otherId(m)) ? `<button class="icon-btn call-btn" data-a="call" data-id="${m.id}" aria-label="שיחה קולית">${ic('phone', 20)}</button>` : ''}
      <button class="icon-btn" data-a="chatMenu" data-id="${m.id}" aria-label="עוד אפשרויות">${ic('dots')}</button></header>
    <div class="swapbar" id="swapbar"></div>
    <div class="msgs" id="msgs"><div class="loading" style="min-height:120px"><span class="spin"></span></div></div>
    ${done ? (m.status === 'swapped' && !(m.rated || []).includes(uid()) ? `<div class="quick"><button class="sel on" data-a="rate" data-id="${m.id}">⭐ דירוג ההחלפה</button></div>` : '') : `<div class="quick">${QUICK.map(q => `<button class="sel" data-a="quick" data-id="${m.id}" data-t="${esc(q)}">${esc(q)}</button>`).join('')}<button class="sel" data-a="meetSheet" data-id="${m.id}">${icInline('pin', 14)} קביעת מפגש</button></div>`}
    ${m.blockedBy ? `<div class="composer blocked-note">🚫 אי אפשר לשלוח הודעות בשיחה הזו.</div>` : `<div class="composer" id="composer">${composerHTML(m.id)}</div>`}
  </div>`;
  renderSwapbar(m);
  S.msgs = [];
  chatUnsub = onSnapshot(query(collection(db, 'matches', id, 'messages'), orderBy('t')), s => {
    S.msgs = s.docs.map(d => ({ id: d.id, ...d.data() })).filter(x => okId(x.id));
    renderMsgs(m);
    const cur = S.matches.find(x => x.id === id);
    if (cur && (cur.unread || {})[uid()]) updateDoc(doc(db, 'matches', id), { [`unread.${uid()}`]: 0 }).catch(errLog);
  }, e => { errLog(e); const b = $('#msgs'); if (b) b.innerHTML = '<div class="msg sys">לא הצלחנו לטעון את ההודעות.</div>'; });
};
function renderSwapbar(m) {
  const me = uid(), o = otherId(m);
  const mine = (m.give[me] || []).map(pid => snapOf(m, pid)), theirs = (m.give[o] || []).map(pid => snapOf(m, pid));
  const el = $('#swapbar'); if (!el) return;
  if (!mine.length) mine.push({}); if (!theirs.length) theirs.push({});
  const nm = arr => arr.map(x => x.catId ? esc(pName(x)) + (x.price ? ` ₪${x.price}` : '') : (m.kind === 'ask' ? 'נדבר' : m.kind === 'buy' ? 'תשלום' : 'מתנה')).join(' + ');
  el.innerHTML = `<div class="row sb"><div class="row">${mine.map(x => `<span class="thumb">${visual(x, m.kind)}</span>`).join('')}<b>${nm(mine)}</b></div><span aria-label="בתמורה ל">⇄</span><div class="row"><b>${nm(theirs)}</b>${theirs.map(x => `<span class="thumb">${visual(x, m.kind)}</span>`).join('')}</div></div>
  ${m.meeting ? `<div class="small" style="margin-top:8px">${icInline('calendar', 14)} ${esc(m.meeting.place)}, ${esc(fmtWhen(m.meeting.when))}</div>` : ''}`;
}
function updateChatMeta() {
  const id = curRoute()[1]; const m = S.matches.find(x => x.id === id); if (!m) return;
  const st = $('#chat-status');
  if (st && !st.classList.contains('st-' + m.status)) { VIEWS.chat(id); return; }
  renderSwapbar(m);
}
function composerHTML(mid) {
  return `<label class="icon-btn" for="chat-img" aria-label="שליחת תמונה">${ic('image')}</label><input type="file" id="chat-img" accept="image/*" class="sr" data-change="chatImg" data-id="${mid}">
      <input class="field" id="chat-in" placeholder="כתבו הודעה" autocomplete="off" maxlength="1000" data-enter="send" data-id="${mid}">
      <button class="icon-btn mic-btn" data-a="recStart" data-id="${mid}" aria-label="הקלטת הודעה קולית">${ic('mic', 22)}</button>
      <button class="send" data-a="send" data-id="${mid}" aria-label="שליחה">${ic('send')}</button>`;
}
const fmtDur = sec => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;
function msgBody(x) {
  if (x.audio) return `<div class="voice"><button class="vplay" data-a="vplay" data-id="${x.id}" aria-label="ניגון">${ic('play', 18)}</button><span class="vbar"><i id="vb-${x.id}"></i></span><span class="vdur">${fmtDur(x.dur || 0)}</span></div>`;
  if (safeImg(x.img)) return `<img src="${safeImg(x.img)}" alt="תמונה">`;
  if (x.img) return '<span class="muted">📷 תמונה</span>';
  return esc(x.text);
}
function renderMsgs(m) {
  const box = $('#msgs'); if (!box) return;
  const me = uid();
  const nearBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 80;
  box.innerHTML = S.msgs.map(x => x.sys ? `<div class="msg sys">${esc(x.text)}</div>` :
    `<div class="msg ${x.from === me ? 'me' : 'them'}${x.audio ? ' has-voice' : ''}">${msgBody(x)}<time>${new Date(x.t).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}</time></div>`).join('') || '<div class="msg sys">תגידו שלום 👋</div>';
  if (nearBottom || box.dataset.first !== '1') { box.scrollTop = box.scrollHeight; box.dataset.first = '1'; }
}
async function sendMsg(mid, text, img, sys) {
  const m = S.matches.find(x => x.id === mid); if (!m) return;
  if (!text && !img) return;
  const me = uid(), o = otherId(m), now = Date.now();
  try {
    await addDoc(collection(db, 'matches', mid, 'messages'), { from: me, text: text || '', img: img || null, sys: !!sys, t: now });
    await updateDoc(doc(db, 'matches', mid), { lastMsg: img ? '📷 תמונה' : text, lastAt: now, lastFrom: me, [`unread.${o}`]: increment(1) });
    pushNotify('msg', mid, img ? '📷 תמונה' : text);
    if (!sys) askPushSoon();
  } catch (e) { errLog(e); toast('ההודעה לא נשלחה. בדקו את החיבור.'); }
}
function fmtWhen(v) { try { return new Date(v).toLocaleString('he-IL', { weekday: 'long', day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch (e) { return v; } }
async function setStatus(mid, s) {
  const m = S.matches.find(x => x.id === mid); if (!m) return;
  if (m.status === s) return closeSheet();
  closeSheet();
  try {
    await updateDoc(doc(db, 'matches', mid), { status: s });
    await sendMsg(mid, `הסטטוס עודכן: ${STATUS[s]}`, null, true);
    if (s === 'swapped') {
      ((m.give || {})[uid()] || []).forEach(pid => updateDoc(doc(db, 'plants', pid), { available: false, swappedIn: mid }).catch(errLog));
      toast('ההחלפה סומנה כבוצעה. הצמח שלך הוסתר מהחיפוש.');
      setTimeout(() => rateSheet(mid), 500);
    }
  } catch (e) { errLog(e); toast('העדכון לא הצליח. נסו שוב.'); }
}
let rateVals = {};
function rateSheet(mid) {
  const m = S.matches.find(x => x.id === mid); if (!m) return;
  rateVals = {};
  const crit = [['comm', 'תקשורת'], ['cond', 'מצב הצמח'], ['rel', 'אמינות'], ['all', 'כללי']];
  sheet(`<h3>איך הייתה ההחלפה?</h3><p class="muted">הדירוג שלכם עוזר לבנות אמון בקהילה.</p>
  ${crit.map(([k, l]) => `<div class="rate-row"><b>${l}</b><div class="stars" data-k="${k}">${[1, 2, 3, 4, 5].map(i => `<button data-a="star" data-k="${k}" data-v="${i}" aria-label="${i} כוכבים">★</button>`).join('')}</div></div>`).join('')}
  <textarea class="field" id="rev-txt" rows="3" maxlength="400" placeholder="משהו שתרצו לספר על ההחלפה עם ${esc(otherInfo(m).name)}? (לא חובה)"></textarea>
  <div class="err" id="rate-err"></div>
  <button class="btn hot" data-a="submitRate" data-id="${mid}">שליחת דירוג</button><button class="btn ghost" data-a="closeSheet">אחר כך</button>`);
}

// =====================================================
// פרופיל
// =====================================================
let deferredInstall = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredInstall = e; });
VIEWS.profile = function () {
  const u = S.profile;
  const saved = S.priv.saved.map(id => S.pool.find(p => p.id === id)).filter(Boolean);
  const savedPr = (S.priv.savedPromos || []).map(id => S.promos.find(p => p.id === id)).filter(Boolean);
  const history = S.matches.filter(m => m.status === 'swapped');
  const badges = [['🌱', 'מאמץ מוקדם', true], ['🌿', 'החלפה ראשונה', (u.swaps || 0) >= 1], ['🏆', 'חובב צמחים מקומי', (u.swaps || 0) >= 5], ['🔥', '10 החלפות מוצלחות', (u.swaps || 0) >= 10]];
  $('#view').innerHTML = `
  <header class="prof"><button class="icon-btn" data-a="settings" aria-label="הגדרות">${ic('settings')}</button>
    ${avatar(u)}<h1>${esc(u.name)}</h1><div>${icInline('pin')} ${esc(u.city)}</div></header>
  <div class="stats"><div class="stat"><b>${u.swaps || 0}</b><span>החלפות</span></div><div class="stat"><b>${u.rehomed || 0}</b><span>צמחים שמצאו בית</span></div><div class="stat" id="my-rating"><b>${repOf(u).count ? repOf(u).avg.toFixed(1) : '–'}</b><span>${repOf(u).count ? `דירוג (${repOf(u).count})` : 'עוד אין דירוג'}</span></div></div>
  <h2 class="section-t">הצמחים שלי</h2>
  ${S.myPlants.length ? `<div class="grid">${S.myPlants.map(p => `<button class="mini ${p.available ? '' : 'off'}" data-a="myPlantSheet" data-id="${p.id}"><div class="mv">${visual(p)}${modeTag(p)}</div><div class="mt">${esc(pName(p))}<div class="ms">${p.available ? OFFER[p.offer] + (p.qty > 1 ? ' ×' + p.qty : '') : '👁️‍🗨️ מוסתר מהחיפוש'}</div></div></button>`).join('')}</div>
  ${S.myPlants.some(p => !p.available) ? `<p class="small muted" style="padding:8px 18px 0">צמח מוסתר לא מופיע לאחרים. לוחצים עליו ומדליקים "זמין" כדי להחזיר אותו.</p>` : ''}`
      : `<div class="empty"><p>עוד לא הוספתם צמחים.</p><button class="btn hot sm" data-a="open" data-to="add" style="margin:auto">הוספת צמח</button></div>`}
  <h2 class="section-t">רשימת המשאלות</h2>
  <div class="addwish"><input class="field" id="wish-in" data-suggest="wish" placeholder="איזה צמח אתם מחפשים?" autocomplete="off" enterkeyhint="done"><button class="btn sun sm" data-a="addWish">הוספה</button></div>
  <div class="sugg" id="wish-in-sugg" style="margin:0 18px"></div>
  <div class="err" id="wish-err" style="padding:0 18px"></div>
  <div class="wishchips chips">${(u.wishlist || []).map(w => `<span class="chip want">${esc(catById(w).he)} <button data-a="rmWish" data-id="${esc(w)}" aria-label="הסרה">×</button></span>`).join('') || '<span class="muted small">הוסיפו צמחים, ונתריע כשמישהו באזור מציע אותם.</span>'}</div>
  ${saved.length || savedPr.length ? `<h2 class="section-t">שמורים</h2><div class="strip">${saved.map(miniCard).join('')}${savedPr.map(pr => `<button class="mini" data-a="promo" data-id="${pr.id}"><div class="mv">${promoVisual(pr)}<span class="mode m-both">🌿 משתלה</span></div><div class="mt">${esc(pr.title)}<div class="ms">${esc(pr.nurseryName)}</div></div></button>`).join('')}</div>` : ''}
  <h2 class="section-t">היסטוריית החלפות</h2>
  ${history.length ? `<div class="list">${history.map(matchRow).join('')}</div>` : '<p class="muted small" style="padding:0 18px">החלפות שתשלימו יופיעו כאן.</p>'}
  <div id="reviews"></div>
  <h2 class="section-t">הישגים</h2>
  <div class="badges">${badges.map(([i, l, on]) => `<div class="bdg ${on ? '' : 'locked'}"><i>${i}</i>${l}</div>`).join('')}</div>
  <div class="pad"><button class="btn ghost" data-a="invite">${ic('share')} הזמנת חברים ל-${APP_NAME}</button>
  ${S.myNursery ? `<button class="btn sun" data-a="open" data-to="mynursery">🌿 המשתלה שלי: ${esc(S.myNursery.name)}</button>` : `<button class="btn ghost" data-a="nurseryApply">🌿 יש לכם משתלה? הצטרפו</button>`}
  ${isAdmin() ? `<button class="btn primary" data-a="open" data-to="admin">📊 לוח ניהול</button>` : ''}</div>
  <div style="height:16px"></div>`;
  loadReviews();
};
async function loadReviews() {
  try {
    const s = await getDocs(query(collection(db, 'reviews'), where('to', '==', uid())));
    const rs = s.docs.map(d => d.data()).sort((a, b) => b.t - a.t);
    const count = rs.length, avg = count ? rs.reduce((a, r) => a + (r.all || 0), 0) / count : 0;
    const was = S.rep[uid()]; S.rep[uid()] = { avg, count };
    if (!was || was.count !== count) { const st = $('#my-rating'); if (st) st.innerHTML = `<b>${count ? avg.toFixed(1) : '–'}</b><span>${count ? `דירוג (${count})` : 'עוד אין דירוג'}</span>`; }
    const box = $('#reviews'); if (!box) return;
    const withText = rs.filter(r => r.text);
    if (withText.length) box.innerHTML = `<h2 class="section-t">מה אומרים עליי</h2><div class="col" style="padding:0 14px">${withText.slice(0, 5).map(r => `<div class="review"><b>${'★'.repeat(r.all || 0)}</b><p>${esc(r.text)}</p><span class="small muted">${esc(r.fromName || '')}, ${ago(r.t)}</span></div>`).join('')}</div>`;
  } catch (e) { errLog(e); }
}
function settingsSheet() {
  const u = S.profile;
  sheet(`<h3>הגדרות</h3>
  <p class="label">שם</p><input class="field" id="set-name" value="${esc(u.name)}" maxlength="24">
  <p class="label">עיר</p><select class="field" id="set-city">${CITIES.map(c => `<option ${c.n === u.city ? 'selected' : ''}>${c.n}</option>`).join('')}</select>
  <p class="label">רדיוס חיפוש</p><div class="chips" style="gap:8px">${RADII.map(r => `<button class="sel ${r === u.radius ? 'on' : ''}" data-a="setRadius" data-r="${r}">${radiusLabel(r)}</button>`).join('')}</div>
  <div class="err" id="set-err"></div>
  <button class="btn primary" data-a="saveSettings" style="margin-top:14px">שמירה</button>
  <p class="label">התראות</p>
  ${pushCapable()
    ? `<label class="toggle"><span><b>${pushOn() ? '🔔' : '🔕'} התראות לטלפון</b><br><span class="small muted">${pushOn() ? 'פעילות במכשיר הזה' : Notification.permission === 'denied' ? 'חסומות בדפדפן. כדי לאפשר: נעילה ליד הכתובת ← הרשאות ← התראות ← אפשר' : 'כבויות'}</span></span><input type="checkbox" data-change="pushToggle" ${pushOn() ? 'checked' : ''} ${Notification.permission === 'denied' ? 'disabled' : ''}></label>`
    : iosNeedsInstall() ? `<button class="btn sun" data-a="pushOn">🔔 הפעלת התראות</button><p class="small muted">באייפון צריך קודם להוסיף את האפליקציה למסך הבית.</p>` : ''}
  ${deferredInstall ? `<button class="btn sun" data-a="install">${ic('download')} התקנת האפליקציה בטלפון</button>` : ''}
  ${isIOS && !isStandalone ? `<div class="note" style="margin-top:14px">${ic('download', 20)}<span><b>להתקנה באייפון:</b> בספארי לוחצים על סמל השיתוף ואז "הוספה למסך הבית".</span></div>` : ''}
  ${(S.priv.blocked || []).length ? `<p class="label">משתמשים חסומים</p>${S.priv.blocked.map(id => { const m = S.matches.find(x => x.users.includes(id)); const nm = (m && m.info && m.info[id] && m.info[id].name) || (S.users[id] && S.users[id].name) || 'משתמש/ת'; return `<div class="rate-row"><b>${esc(nm)}</b><button class="btn ghost sm" data-a="unblock" data-id="${esc(id)}">ביטול חסימה</button></div>`; }).join('')}` : ''}
  <button class="btn ghost" data-a="signOut">${ic('logout')} התנתקות</button>
  <p class="small center" style="margin-top:16px"><a href="privacy.html">מדיניות פרטיות</a></p>
  <button class="btn ghost danger" data-a="deleteAccount">${ic('trash')} מחיקת החשבון</button>`);
}
function myPlantSheet(id) {
  const p = S.myPlants.find(x => x.id === id); if (!p) return;
  const m = modeOf(p);
  const chips = (k, obj) => `<div class="chips" style="gap:8px">${Object.entries(obj).map(([kk, v]) => `<button class="sel ${p[k] === kk ? 'on' : ''}" data-a="editPlant" data-id="${p.id}" data-k="${k}" data-v="${kk}">${v}</button>`).join('')}</div>`;
  sheet(`<div class="row" style="margin-bottom:6px"><span class="thumb" style="width:60px;height:60px">${visual(p)}</span><div><h3 style="margin:0">${esc(pName(p))}</h3><div class="small muted">כל שינוי נשמר מיד</div></div></div>
  <p class="label">שם הצמח</p><input class="field" id="edit-name" data-suggest="editname" data-change="editName" data-id="${p.id}" value="${esc(pName(p))}" autocomplete="off" enterkeyhint="done"><div class="sugg" id="edit-name-sugg"></div>
  <label class="toggle freeze ${p.frozen ? 'on' : ''}"><span><b>🔒 הקפאת המודעה</b><br><span class="small muted">שמור למישהו? המודעה תיעלם מהחיפוש ולא יוכלו לפנות עליה, עד שתבטלו.</span></span><input type="checkbox" data-change="pfrozen" data-id="${p.id}" ${p.frozen ? 'checked' : ''}></label>
  <p class="label">מה תרצו לעשות איתו?</p>
  <div class="modes">${Object.entries(MODE).map(([k, mm]) => `<button class="mode-opt ${mm.c} ${m === k ? 'on' : ''}" data-a="editPlant" data-id="${p.id}" data-k="mode" data-v="${k}"><i>${mm.i}</i><b>${MODE_ACT[k]}</b><span>${MODE_HINT[k]}</span></button>`).join('')}</div>
  ${m === 'sale' || p._wantSale ? `<p class="label">מחיר${p._wantSale ? ' (חובה למכירה)' : ''}</p><div class="price-in"><input class="field" type="number" inputmode="numeric" min="1" max="99999" data-change="editPrice" data-id="${p.id}" value="${esc(p.price || '')}" placeholder="למשל 40"><span>₪</span></div>` : ''}
  <p class="label">מה אתם מציעים?</p>${chips('offer', OFFER)}
  <p class="label">מצב הצמח</p>${chips('condition', COND)}
  <p class="label">כמות</p><div class="stepper"><button data-a="editQty" data-id="${p.id}" data-v="1" aria-label="יותר">+</button><b id="edit-qty">${p.qty || 1}</b><button data-a="editQty" data-id="${p.id}" data-v="-1" aria-label="פחות">−</button></div>
  <p class="label">מסירה</p>${chips('delivery', DELIV)}
  <label class="toggle"><span><b>זמין</b><br><span class="small muted">כשזה כבוי, הצמח לא מופיע לאחרים.</span></span><input type="checkbox" data-change="avail" data-id="${p.id}" ${p.available ? 'checked' : ''}></label>
  <label class="toggle"><span><b>פתוח/ה להצעות</b><br><span class="small muted">גם על צמחים שלא ברשימת המשאלות שלכם.</span></span><input type="checkbox" data-change="popen" data-id="${p.id}" ${p.open ? 'checked' : ''}></label>
  <button class="btn ghost danger" data-a="delPlant" data-id="${p.id}" style="margin-top:14px">${ic('trash')} מחיקת הצמח</button>`);
}
function notifsSheet() {
  const list = notifList();
  sheet(`<h3>התראות</h3>${list.length ? list.map((n, i) => `<button class="notif ${n.unread ? 'unread' : ''}" data-a="notifGo" data-to="${n.link}"><div>${esc(n.text)}<time>${ago(n.t)}</time></div></button>`).join('') : '<p class="muted">אין התראות כרגע. כשמישהו יציע צמח מרשימת המשאלות שלכם, נודיע כאן.</p>'}`);
  S.priv.alertsSeenAt = Date.now(); savePriv();
  setTimeout(refreshBadges, 50);
}
let radiusDraft = null;
function filtersSheet(keepDraft) {
  const f = filters, u = S.profile;
  if (!keepDraft) radiusDraft = u.radius;
  const grp = (k, obj) => `<div class="chips" style="gap:8px"><button class="sel ${f[k] === 'all' ? 'on' : ''}" data-a="setFilter" data-k="${k}" data-v="all">הכול</button>${Object.entries(obj).map(([kk, v]) => `<button class="sel ${f[k] === kk ? 'on' : ''}" data-a="setFilter" data-k="${k}" data-v="${kk}">${v}</button>`).join('')}</div>`;
  sheet(`<h3>מה לחפש?</h3>
  <label class="toggle" style="margin-top:6px"><span><b>📍 לפי המקום שבו אני עכשיו</b><br><span class="small muted">${S.here ? `מזוהה: ${esc(S.here.city)}` : `כבוי: מחפשים לפי ${esc(u.city)}`}</span></span><input type="checkbox" data-change="liveLoc" ${S.here ? 'checked' : ''}></label>
  <p class="label">מרחק מ${esc(locLabel())}</p><div class="chips" style="gap:8px">${RADII.map(r => `<button class="sel ${r === radiusDraft ? 'on' : ''}" data-a="filterRadius" data-r="${r}">${radiusLabel(r)}</button>`).join('')}</div>
  <p class="label">מה מחפשים?</p>${grp('mode', { swap: '🔄 החלפה', gift: '🎁 מתנה', sale: '🏷️ למכירה' })}
  <p class="label">סוג צמח</p>${grp('cat', CATS)}
  <p class="label">סוג החלפה</p>${grp('offer', OFFER)}
  <p class="label">מסירה</p>${grp('delivery', { pickup: 'איסוף', shipping: 'משלוח' })}
  <button class="btn primary" data-a="applyFilters" style="margin-top:20px">הצגת תוצאות</button>`);
}
function meetSheet(mid) {
  const now = new Date(Date.now() + 864e5); now.setMinutes(0, 0, 0);
  const iso = new Date(now.getTime() - now.getTimezoneOffset() * 6e4).toISOString().slice(0, 16);
  sheet(`<h3>קביעת מפגש</h3><p class="muted">${icInline('shield')} מומלץ להיפגש במקום ציבורי ומואר.</p>
  <p class="label">איפה?</p><div class="pick">${SAFE_SPOTS.map((s, i) => `<label class="pick-item"><input type="radio" name="spot" value="${esc(s + ', ' + S.profile.city)}" ${i === 0 ? 'checked' : ''}><span>${esc(s)}, ${esc(S.profile.city)}</span></label>`).join('')}</div>
  <p class="label">מתי?</p><input type="datetime-local" class="field" id="meet-when" value="${iso}" min="${new Date(Date.now() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 16)}">
  <div class="err" id="meet-err"></div>
  <button class="btn hot" data-a="saveMeet" data-id="${mid}" style="margin-top:14px">${ic('calendar')} שליחת הצעת מפגש</button>`);
}
function chatMenu(mid) {
  const m = S.matches.find(x => x.id === mid); if (!m) return;
  const n = otherInfo(m).name;
  const mineHere = ((m.give || {})[uid()] || []).map(pid => S.myPlants.find(x => x.id === pid)).filter(Boolean);
  sheet(`<h3>${esc(n)}</h3>
  ${mineHere.map(pl => `<button class="btn ${pl.frozen ? 'ghost' : 'sun'}" data-a="freezeToggle" data-id="${pl.id}">${pl.frozen ? `🔓 ביטול ההקפאה של ה${esc(pName(pl))}` : `🔒 להקפיא את ה${esc(pName(pl))} (שמור ל${esc(n)})`}</button>`).join('')}
  <button class="btn ghost" data-a="reportSheet" data-id="${mid}">דיווח על ${esc(n)}</button>
  <button class="btn ghost danger" data-a="block" data-id="${mid}">חסימת ${esc(n)}</button>
  <button class="btn ghost" data-a="closeSheet">סגירה</button>`);
}
function reportSheet(mid) {
  sheet(`<h3>דיווח</h3><p class="muted">הדיווח נשלח לצוות ולא מוצג למשתמש/ת.</p>
  <div class="pick">${REPORT_REASONS.map((r, i) => `<label class="pick-item"><input type="radio" name="reason" value="${esc(r)}" ${i === 0 ? 'checked' : ''}><span>${esc(r)}</span></label>`).join('')}</div>
  <textarea class="field" id="rep-txt" rows="3" maxlength="500" placeholder="פרטים נוספים (לא חובה)"></textarea>
  <button class="btn hot" data-a="sendReport" data-id="${mid}" style="margin-top:12px">שליחת דיווח</button>`);
}

// =====================================================
// משתלות: עמוד משתלה, ניהול המשתלה שלי, פאנל ניהול
// =====================================================
VIEWS.nursery = async function (id) {
  let n = nurseryById(id);
  if (!n) {
    $('#view').innerHTML = `<div class="loading"><span class="spin big"></span></div>`;
    try { const s2 = await getDoc(doc(db, 'nurseries', id)); if (s2.exists()) n = { id, ...s2.data() }; } catch (e) { errLog(e); }
    if (curRoute()[1] !== id) return;
  }
  if (!n) { $('#view').innerHTML = `<div class="empty"><h3>המשתלה לא נמצאה</h3><button class="btn hot sm" data-a="open" data-to="discover" style="margin:12px auto 0">חזרה לגילוי</button></div>`; return; }
  const now = Date.now();
  const promos = S.promos.filter(p => p.nurseryId === id && p.active && (!p.until || p.until >= now));
  promos.forEach(countView);
  $('#view').innerHTML = `
  <div class="detail-v nursery-cover">${nurseryImg(n, 'big')}<button class="icon-btn back" data-a="back" aria-label="חזרה">${ic('back')}</button></div>
  <div class="pad">
    <span class="badge b-nursery" style="position:static;display:inline-block">🌿 משתלה</span>
    <h1 style="font-size:30px;font-weight:900;margin-top:8px">${esc(n.name)}</h1>
    <p class="muted">${esc(n.address || n.city || '')}${n.lat ? `, ${fmtKm(dist(n))} ממך` : ''}</p>
    ${n.hours ? `<p class="small">🕒 ${esc(n.hours)}</p>` : ''}
    ${n.about ? `<p>${esc(n.about)}</p>` : ''}
    ${contactBtns(n)}
    <h2 class="section-t" style="margin:24px 0 10px">הצעות עכשיו</h2>
    ${promos.length ? `<div class="col">${promos.map(pr => `<button class="promo-row" data-a="promo" data-id="${pr.id}"><span class="thumb">${promoVisual(pr)}</span><span class="li-main"><b>${esc(pr.title)}</b>${pr.deal ? `<span class="deal sm">${esc(pr.deal)}</span>` : ''}</span></button>`).join('')}</div>`
      : '<p class="muted small">אין כרגע הצעות פעילות. שווה לקפוץ לבקר!</p>'}
  </div>`;
};
let pd = null;
VIEWS.mynursery = async function () {
  $('#view').innerHTML = `<div class="loading"><span class="spin big"></span></div>`;
  await loadMyNursery();
  const n = S.myNursery;
  if (!n) { go('profile'); return; }
  let mine = [];
  try { const s2 = await getDocs(query(collection(db, 'promos'), where('nurseryId', '==', n.id))); mine = s2.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (b.t || 0) - (a.t || 0)); } catch (e) { errLog(e); }
  S.myPromos = mine;
  await promoStats(mine);
  const views = mine.reduce((a, p) => a + (p.views || 0), 0), clicks = mine.reduce((a, p) => a + (p.clicks || 0), 0);
  $('#view').innerHTML = `<div class="ph"><button class="icon-btn" data-a="open" data-to="profile" aria-label="חזרה">${ic('back')}</button><h1>${esc(n.name)}</h1></div>
  <div class="pad" style="padding-top:0">
    ${n.active ? '' : `<div class="note">${ic('shield', 20)}<span>המשתלה עוד לא פעילה. אפשר כבר להכין הצעות, והן יופיעו למשתמשים אחרי ההפעלה.</span></div>`}
    <div class="stats" style="margin:14px 0 0"><div class="stat"><b>${mine.filter(p => p.active).length}</b><span>הצעות פעילות</span></div><div class="stat"><b>${views}</b><span>אנשים שראו</span></div><div class="stat"><b>${clicks}</b><span>אנשים שלחצו</span></div></div>
    <button class="btn hot" data-a="newPromo" style="margin-top:18px">${ic('plus')} פרסום הצעה חדשה</button>
    <button class="btn ghost" data-a="editNursery">עריכת פרטי המשתלה</button>
    <h2 class="section-t" style="margin:24px 0 10px">ההצעות שלי</h2>
    ${mine.length ? `<div class="col">${mine.map(pr => `<div class="promo-row ${pr.active ? '' : 'off'}"><span class="thumb">${promoVisual(pr)}</span><span class="li-main"><b>${esc(pr.title)}</b><span class="small muted">👁 ${pr.views || 0} צפיות, 👆 ${pr.clicks || 0} לחיצות${pr.until ? `, עד ${new Date(pr.until).toLocaleDateString('he-IL')}` : ''}</span></span>
      <label class="mini-toggle" aria-label="פעילה"><input type="checkbox" data-change="promoActive" data-id="${pr.id}" ${pr.active ? 'checked' : ''}></label>
      <button class="icon-btn" data-a="delPromo" data-id="${pr.id}" aria-label="מחיקה">${ic('trash', 18)}</button></div>`).join('')}</div>`
      : '<p class="muted small">עוד אין הצעות. הצעה טובה: תמונה יפה, שם הצמח, ומבצע ברור כמו "2 ב-50 ₪".</p>'}
  </div><div style="height:20px"></div>`;
};
VIEWS.promonew = function () {
  if (!S.myNursery) { go('profile'); return; }
  if (!pd) pd = { img: null, title: '', catId: null, deal: '', text: '', until: '', radius: 25 };
  $('#view').innerHTML = `<div class="ph"><button class="icon-btn" data-a="open" data-to="mynursery" aria-label="חזרה">${ic('back')}</button><h1>הצעה חדשה</h1></div>
  <div class="pad" style="padding-top:4px">
    ${safeImg(pd.img) ? `<div class="scan" style="height:220px"><img src="${safeImg(pd.img)}" alt=""><label class="lbl" for="pr-img" style="cursor:pointer">${icInline('image', 14)} החלפת תמונה</label></div>` : `<label class="drop" for="pr-img" style="height:200px"><div class="big">${ic('camera', 40)}</div><h2>תמונה של ההצעה</h2></label>`}
    <input type="file" id="pr-img" accept="image/*" class="sr" data-change="promoPhoto">
    <p class="label">כותרת</p><input class="field" id="pr-title" maxlength="60" placeholder="למשל: מונסטרות ענקיות הגיעו!" value="${esc(pd.title)}">
    <p class="label">איזה צמח? (כדי שנתריע למי שמחפש אותו)</p>
    <input class="field" id="pr-cat" data-suggest="promo" placeholder="התחילו להקליד" autocomplete="off" value="${esc(pd.catId ? catById(pd.catId).he : '')}"><div class="sugg" id="pr-cat-sugg"></div>
    <p class="label">המבצע</p><input class="field" id="pr-deal" maxlength="40" placeholder="למשל: 2 ב-50 ₪, או 20% הנחה" value="${esc(pd.deal)}">
    <p class="label">כמה מילים (לא חובה)</p><textarea class="field" id="pr-text" rows="3" maxlength="300" placeholder="מה מיוחד בהצעה?">${esc(pd.text)}</textarea>
    <p class="label">בתוקף עד (לא חובה)</p><input type="date" class="field" id="pr-until" value="${esc(pd.until)}">
    <p class="label">למי להציג?</p><div class="chips" style="gap:8px">${[10, 25, 50].map(r => `<button class="sel ${pd.radius === r ? 'on' : ''}" data-a="promoRadius" data-r="${r}">עד ${r} ק״מ</button>`).join('')}</div>
    <div class="err" id="pr-err"></div>
    <div style="margin-top:20px"><button class="btn hot" data-a="savePromo">${ic('check')} פרסום ההצעה</button><button class="btn ghost" data-a="cancelPromo">ביטול</button></div>
  </div>`;
};
function keepPromo() {
  if (!pd) return;
  const g = id => ($('#' + id) || {}).value;
  pd.title = g('pr-title') ?? pd.title; pd.deal = g('pr-deal') ?? pd.deal; pd.text = g('pr-text') ?? pd.text; pd.until = g('pr-until') ?? pd.until;
  const c = toCat(g('pr-cat')); pd.catId = c ? c.id : null;
}
function nurseryEditSheet() {
  const n = S.myNursery;
  sheet(`<h3>פרטי המשתלה</h3>
  <p class="label">טלפון</p><input class="field" id="n-phone" type="tel" value="${esc(n.phone || '')}">
  <p class="label">וואטסאפ (אם שונה מהטלפון)</p><input class="field" id="n-wa" type="tel" value="${esc(n.whatsapp || '')}">
  <p class="label">כתובת</p><input class="field" id="n-addr" value="${esc(n.address || '')}" placeholder="רחוב ומספר, עיר">
  <p class="label">שעות פתיחה</p><input class="field" id="n-hours" value="${esc(n.hours || '')}" placeholder="א׳-ה׳ 8:00-19:00, ו׳ 8:00-14:00">
  <p class="label">על המשתלה</p><textarea class="field" id="n-about" rows="3" maxlength="400">${esc(n.about || '')}</textarea>
  <p class="label">תמונה ראשית</p><label class="btn ghost" for="n-img">${ic('image')} ${n.img ? 'החלפת תמונה' : 'הוספת תמונה'}</label><input type="file" id="n-img" accept="image/*" class="sr" data-change="nurseryImg">
  <button class="btn sun" data-a="nurseryHere">${ic('pin')} אני עכשיו במשתלה: שמירת המיקום</button>
  <p class="small muted">${n.lat ? 'יש מיקום שמור. ' : ''}המיקום עוזר להציג את ההצעות לאנשים קרובים ולנווט אליכם.</p>
  <div class="err" id="n-err"></div>
  <button class="btn primary" data-a="saveNursery" style="margin-top:10px">שמירה</button>`);
}
function nurseryApplySheet() {
  sheet(`<h3>🌿 הצטרפות משתלה</h3><p class="muted">הציגו את ההצעות שלכם לאנשים שאוהבים צמחים, ממש בשכונה. השאירו פרטים ונחזור אליכם.</p>
  <p class="label">שם המשתלה</p><input class="field" id="ap-name" maxlength="50">
  <p class="label">עיר</p><select class="field" id="ap-city">${CITIES.map(c => `<option ${c.n === S.profile.city ? 'selected' : ''}>${c.n}</option>`).join('')}</select>
  <p class="label">טלפון</p><input class="field" id="ap-phone" type="tel">
  <p class="label">שם איש/אשת קשר</p><input class="field" id="ap-contact" value="${esc(S.profile.name)}">
  <p class="label">משהו נוסף? (לא חובה)</p><textarea class="field" id="ap-notes" rows="2" maxlength="300"></textarea>
  <div class="err" id="ap-err"></div>
  <button class="btn hot" data-a="sendApply" style="margin-top:12px">שליחת בקשה</button>`);
}
async function adminNurseries(box) {
  let apps = [], ns = [], ps = [];
  try {
    const [a, b, c] = await Promise.all([
      getDocs(query(collection(db, 'nurseryApplications'), where('status', '==', 'pending'))),
      getDocs(collection(db, 'nurseries')), getDocs(collection(db, 'promos'))
    ]);
    apps = a.docs.map(d => ({ id: d.id, ...d.data() })); ns = b.docs.map(d => ({ id: d.id, ...d.data() })); ps = c.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) { errLog(e); box.innerHTML = adminNoAccess(); return; }
  S.adminApps = apps;
  await promoStats(ps);
  const st = id => { const x = ps.filter(p => p.nurseryId === id); return { n: x.filter(p => p.active).length, v: x.reduce((a, p) => a + (p.views || 0), 0), c: x.reduce((a, p) => a + (p.clicks || 0), 0) }; };
  box.innerHTML = `
  <h2 class="section-t" style="margin-top:4px">בקשות הצטרפות (${apps.length})</h2>
  ${apps.length ? apps.map(a => `<div class="req"><b>${esc(a.name)}</b>, ${esc(a.city)}<div class="small">${esc(a.contact || '')}, <a href="tel:${esc(a.phone)}">${esc(a.phone)}</a>, ${esc(a.email)}</div>${a.notes ? `<div class="req-msg">"${esc(a.notes)}"</div>` : ''}
    <div class="req-btns"><button class="btn primary sm" style="flex:1" data-a="adminApprove" data-id="${a.id}">אישור והפעלה</button><button class="btn ghost sm" style="flex:1" data-a="adminDecline" data-id="${a.id}">דחייה</button></div></div>`).join('') : '<p class="muted small" style="padding:0 18px">אין בקשות חדשות.</p>'}
  <h2 class="section-t">משתלות (${ns.length})</h2>
  <div class="list">${ns.map(n => { const x = st(n.id); return `<div class="li"><span class="thumb">${nurseryImg(n)}</span><div class="li-main"><div class="li-t">${esc(n.name)}</div><div class="li-s">${esc(n.ownerEmail || '')}</div><div class="small muted">${x.n} הצעות, 👁 ${x.v}, 👆 ${x.c}</div></div><label class="mini-toggle" aria-label="פעילה"><input type="checkbox" data-change="nurseryActive" data-id="${n.id}" ${n.active ? 'checked' : ''}></label></div>`; }).join('') || '<div class="empty">עוד אין משתלות.</div>'}</div>
  <div class="pad"><button class="btn ghost" data-a="adminAdd">${ic('plus')} הוספת משתלה ידנית</button></div>`;
};
// =====================================================
// לוח ניהול
// =====================================================
const adminNoAccess = () => `<div class="empty"><h3>אין גישה לנתונים</h3><p>צריך לפרסם ב-Firebase את כללי האבטחה העדכניים (firestore.rules), ואז לרענן.</p></div>`;
const DAY = 864e5;
const startOfDay = (t = Date.now()) => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
async function cnt(q) { try { const r = await getCountFromServer(q); return r.data().count; } catch (e) { errLog(e); return null; } }
const nfmt = n => (n == null ? '–' : Number(n).toLocaleString('he-IL'));
VIEWS.admin = async function (tab) {
  if (!isAdmin()) { go('profile'); return; }
  tab = tab || 'overview';
  const T = [['overview', '📊 סקירה'], ['push', '📣 התראות'], ['users', '👥 משתמשים'], ['reports', '🚩 דיווחים'], ['nurseries', '🌿 משתלות']];
  $('#view').innerHTML = `<div class="ph"><button class="icon-btn" data-a="open" data-to="profile" aria-label="חזרה">${ic('back')}</button><h1>לוח ניהול</h1>
    <span class="sp" style="flex:1"></span><button class="icon-btn" data-a="open" data-to="admin/${tab}" aria-label="רענון">${ic('refresh', 20)}</button></div>
  <div class="tabs">${T.map(([k, l]) => `<button class="sel ${tab === k ? 'on' : ''}" data-a="open" data-to="admin/${k}">${l}</button>`).join('')}</div>
  <div id="admin-box"><div class="loading" style="min-height:40vh"><span class="spin big"></span></div></div>`;
  const box = $('#admin-box');
  if (tab === 'nurseries') return adminNurseries(box);
  if (tab === 'users') return adminUsers(box);
  if (tab === 'reports') return adminReports(box);
  if (tab === 'push') return adminPush(box);
  return adminOverview(box);
};
async function adminOverview(box) {
  const now = Date.now(), today = startOfDay(), d7 = now - 7 * DAY, d30 = now - 30 * DAY;
  const U = collection(db, 'users'), P = collection(db, 'plants'), Mt = collection(db, 'matches');
  const [uAll, uToday, u7, u30, aToday, a7, pAll, pAvail, pNew7, mSwap, mGift, mBoth, mSale, frozen, mtAll, mtDone, mtCancel, rqPend, calls7, repOpen, revAll] = await Promise.all([
    cnt(U), cnt(query(U, where('createdAt', '>=', today))), cnt(query(U, where('createdAt', '>=', d7))), cnt(query(U, where('createdAt', '>=', d30))),
    cnt(query(U, where('lastSeen', '>=', today))), cnt(query(U, where('lastSeen', '>=', d7))),
    cnt(P), cnt(query(P, where('available', '==', true))), cnt(query(P, where('t', '>=', d7))),
    cnt(query(P, where('mode', '==', 'swap'))), cnt(query(P, where('mode', '==', 'gift'))), cnt(query(P, where('mode', '==', 'both'))), cnt(query(P, where('mode', '==', 'sale'))), cnt(query(P, where('frozen', '==', true))),
    cnt(Mt), cnt(query(Mt, where('status', '==', 'swapped'))), cnt(query(Mt, where('status', '==', 'cancelled'))),
    cnt(query(collection(db, 'requests'), where('status', '==', 'pending'))),
    cnt(query(collection(db, 'calls'), where('t', '>=', d7))),
    cnt(query(collection(db, 'reports'), where('handled', '==', false))),
    cnt(collection(db, 'reviews'))
  ]);
  if (uAll == null && pAll == null) { box.innerHTML = adminNoAccess(); return; }
  // הרשמות ב-14 הימים האחרונים + ערים
  let recent = [];
  try { const s2 = await getDocs(query(U, where('createdAt', '>=', startOfDay(now - 13 * DAY)))); recent = s2.docs.map(d => d.data()); } catch (e) { errLog(e); }
  const days = Array.from({ length: 14 }, (_, i) => { const st = startOfDay(now - (13 - i) * DAY); return { st, n: recent.filter(u => u.createdAt >= st && u.createdAt < st + DAY).length }; });
  const maxD = Math.max(1, ...days.map(d => d.n));
  let cities = {};
  try { const s3 = await getDocs(query(U, limit(2000))); s3.docs.forEach(d => { const c = d.data().city || 'לא ידוע'; cities[c] = (cities[c] || 0) + 1; }); } catch (e) { errLog(e); }
  const topC = Object.entries(cities).sort((a, b) => b[1] - a[1]).slice(0, 6), maxC = Math.max(1, ...topC.map(x => x[1]));
  const plantsByCat = {};
  S.pool.forEach(p => { const k = pName(p); plantsByCat[k] = (plantsByCat[k] || 0) + 1; });
  const topP = Object.entries(plantsByCat).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const activeMatches = mtAll == null ? null : mtAll - (mtDone || 0) - (mtCancel || 0);
  const stat = (n, l, hot) => `<div class="kpi ${hot ? 'hot' : ''}"><b>${nfmt(n)}</b><span>${l}</span></div>`;
  box.innerHTML = `
  <h2 class="section-t" style="margin-top:6px">משתמשים</h2>
  <div class="kpis">${stat(uAll, 'סה״כ משתמשים', true)}${stat(uToday, 'הצטרפו היום')}${stat(u7, 'חדשים השבוע')}${stat(u30, 'חדשים החודש')}${stat(aToday, 'פעילים היום')}${stat(a7, 'פעילים השבוע')}</div>
  <div class="panel"><div class="panel-t">הרשמות ב-14 הימים האחרונים</div>
    <div class="bars">${days.map(d => `<div class="bar" title="${new Date(d.st).toLocaleDateString('he-IL')}: ${d.n}"><i style="height:${Math.round(d.n / maxD * 100)}%"></i><span>${d.n || ''}</span><em>${new Date(d.st).getDate()}</em></div>`).join('')}</div></div>
  ${topC.length ? `<div class="panel"><div class="panel-t">ערים מובילות</div>${topC.map(([c, n]) => `<div class="hbar"><span>${esc(c)}</span><i style="width:${Math.round(n / maxC * 100)}%"></i><b>${n}</b></div>`).join('')}</div>` : ''}
  <h2 class="section-t">צמחים</h2>
  <div class="kpis">${stat(pAll, 'סה״כ מודעות', true)}${stat(pAvail, 'זמינות עכשיו')}${stat(pNew7, 'חדשות השבוע')}${stat(frozen, 'מוקפאות')}</div>
  <div class="chips" style="padding:10px 14px 0;gap:8px"><span class="mode-pill m-swap">🔄 להחלפה ${nfmt(mSwap)}</span><span class="mode-pill m-gift">🎁 במתנה ${nfmt(mGift)}</span><span class="mode-pill m-both">💚 גם וגם ${nfmt(mBoth)}</span><span class="mode-pill m-sale">🏷️ למכירה ${nfmt(mSale)}</span></div>
  ${topP.length ? `<div class="panel"><div class="panel-t">הצמחים הנפוצים ביותר</div>${topP.map(([c, n]) => `<div class="hbar"><span>${esc(c)}</span><i style="width:${Math.round(n / topP[0][1] * 100)}%"></i><b>${n}</b></div>`).join('')}</div>` : ''}
  <h2 class="section-t">פעילות</h2>
  <div class="kpis">${stat(mtAll, 'התאמות סה״כ', true)}${stat(activeMatches, 'התאמות פעילות')}${stat(mtDone, 'החלפות שבוצעו')}${stat(mtCancel, 'בוטלו')}${stat(rqPend, 'פניות שמחכות לתשובה')}${stat(calls7, 'שיחות קוליות השבוע')}${stat(revAll, 'דירוגים')}${stat(repOpen, 'דיווחים פתוחים', repOpen > 0)}</div>
  ${repOpen ? `<div class="pad"><button class="btn hot" data-a="open" data-to="admin/reports">🚩 ${repOpen === 1 ? 'יש דיווח פתוח' : `יש ${repOpen} דיווחים פתוחים`}</button></div>` : ''}
  <p class="small muted" style="padding:14px 18px 24px">"פעילים" הם מי שפתחו את האפליקציה בפרק הזמן הזה. הנתונים מתעדכנים בכל רענון.</p>`;
}
async function adminUsers(box) {
  let list = [];
  try { const s2 = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(200))); list = s2.docs.map(d => ({ id: d.id, ...d.data() })); }
  catch (e) { errLog(e); box.innerHTML = adminNoAccess(); return; }
  S.adminUsers = list;
  const row = u => `<div class="li"><span class="thumb">${avatar(u, 'av')}</span><div class="li-main"><div class="li-t">${esc(u.name || '')}${u.banned ? ' <span class="pill st-cancelled">מושעה</span>' : ''}</div>
    <div class="li-s">${esc(u.city || '')}, הצטרף/ה ${u.createdAt ? ago(u.createdAt) : '–'}</div><div class="small muted">נראה/תה ${u.lastSeen ? ago(u.lastSeen) : '–'}</div></div>
    <button class="btn ghost sm" data-a="adminBan" data-id="${esc(u.id)}" data-on="${u.banned ? '0' : '1'}">${u.banned ? 'ביטול השעיה' : 'השעיה'}</button></div>`;
  box.innerHTML = `<div class="sbox admin-search">${ic('search', 18)}<input id="au-q" type="search" placeholder="חיפוש לפי שם או עיר" autocomplete="off"></div>
  <p class="small muted" style="padding:6px 18px 0">${list.length} המשתמשים האחרונים שהצטרפו</p>
  <div class="list" id="au-list">${list.map(row).join('') || '<div class="empty">אין משתמשים.</div>'}</div><div style="height:20px"></div>`;
  $('#au-q').addEventListener('input', e => {
    const q = e.target.value.trim();
    $('#au-list').innerHTML = list.filter(u => !q || (u.name || '').includes(q) || (u.city || '').includes(q)).map(row).join('') || '<div class="empty">לא נמצא.</div>';
  });
}
async function adminReports(box) {
  let reps = [];
  try { const s2 = await getDocs(query(collection(db, 'reports'), orderBy('t', 'desc'), limit(100))); reps = s2.docs.map(d => ({ id: d.id, ...d.data() })); }
  catch (e) { errLog(e); box.innerHTML = adminNoAccess(); return; }
  const ids = [...new Set(reps.flatMap(r => [r.from, r.about]))];
  await Promise.all(ids.map(getUser));
  const nm = id => esc((S.users[id] && S.users[id].name) || 'משתמש/ת');
  const open = reps.filter(r => !r.handled), done = reps.filter(r => r.handled);
  const card = r => `<div class="req ${r.handled ? 'done' : ''}"><div><b>${nm(r.from)}</b> דיווח/ה על <b>${nm(r.about)}</b><span class="small muted">, ${ago(r.t)}</span></div>
    <div class="small" style="margin-top:4px">סיבה: ${esc(r.reason || '')}</div>${r.text ? `<div class="req-msg">"${esc(r.text)}"</div>` : ''}
    ${r.handled ? `<div class="small muted">✓ טופל</div>` : `<div class="req-btns"><button class="btn ghost sm" style="flex:1" data-a="adminHandled" data-id="${r.id}">✓ סימון כטופל</button><button class="btn hot sm" style="flex:1" data-a="adminBan" data-id="${esc(r.about)}" data-on="1" data-rep="${r.id}">השעיית ${nm(r.about)}</button></div>`}</div>`;
  box.innerHTML = `<h2 class="section-t" style="margin-top:6px">פתוחים (${open.length})</h2>${open.map(card).join('') || '<p class="muted small" style="padding:0 18px">אין דיווחים פתוחים 🎉</p>'}
  ${done.length ? `<h2 class="section-t">טופלו (${done.length})</h2>${done.map(card).join('')}` : ''}
  <p class="small muted" style="padding:14px 18px 24px">השעיה מסתירה את כל המודעות של המשתמש/ת וחוסמת את הכניסה שלו/ה לאפליקציה. אפשר לבטל בכל רגע מלשונית המשתמשים.</p>`;
}

// ---------- 📣 התראות לכל המשתמשים ----------
const PUSH_TEMPLATES = [
  { t: '🌿 צמחים חדשים לידך', b: 'אנשים באזור העלו צמחים חדשים השבוע. בואו לראות מה מחכה לכם', u: '/#discover' },
  { t: '🔥 יש צמחים שעוד לא ראית', b: 'כמה החלקות, ואולי מחכה לך התאמה מושלמת', u: '/#swipe' },
  { t: '📸 יש לך ייחור מיותר?', b: 'תוך דקה הוא באפליקציה, ומישהו באזור כבר מחפש אותו', u: '/#add' },
  { t: '🎁 צמחים במתנה בשכונה', b: 'אנשים לידך מוסרים צמחים בחינם. מי שמגיע ראשון…', u: '/#discover' },
  { t: '💬 מישהו מחכה לך?', b: 'בדקו את ההתאמות והפניות שלכם. אולי מישהו כבר רוצה להחליף', u: '/#matches' },
  { t: '🌱 שבוע ירוק!', b: 'זה זמן מצוין לסדר את המרפסת. מה תחליפו השבוע?', u: '/#discover' },
  { t: '⭐ החלפתם לאחרונה?', b: 'דרגו את ההחלפה ועזרו לקהילה לבנות אמון', u: '/#matches' },
  { t: '🤝 תביאו חבר', b: 'כמה שיותר שכנים, יותר התאמות. שלחו את LeafLoop לחבר שאוהב צמחים', u: '/#profile' },
  { t: '☀️ עונת הייחורים', b: 'עכשיו זה הזמן הכי טוב לייחורים. העלו אחד ותראו מי מתעניין', u: '/#add' },
  { t: '🌿 התגעגענו!', b: 'מאז שהיית פה הצטרפו אנשים חדשים עם צמחים חדשים. בואו להציץ', u: '/#discover' }
];
const PUSH_LINKS = [['/#discover', '🔍 חיפוש'], ['/#swipe', '🔥 גלה עוד'], ['/#add', '➕ הוספת צמח'], ['/#matches', '💚 התאמות'], ['/#profile', '👤 פרופיל']];
const BC = { seg: 'all', city: '', title: PUSH_TEMPLATES[0].t, body: PUSH_TEMPLATES[0].b, url: PUSH_TEMPLATES[0].u };
function bcTargets() {
  const now = Date.now(), all = (S.adminAll || []).filter(u => !u.banned && okId(u.id));
  const f = {
    all: () => all,
    new7: () => all.filter(u => (u.createdAt || 0) >= now - 7 * DAY),
    idle7: () => all.filter(u => (u.lastSeen || 0) < now - 7 * DAY),
    idle30: () => all.filter(u => (u.lastSeen || 0) < now - 30 * DAY),
    noplant: () => all.filter(u => !(S.adminOwners || new Set()).has(u.id)),
    city: () => all.filter(u => u.city === BC.city)
  };
  return (f[BC.seg] || f.all)();
}
function bcPreview() {
  const el = $('#bc-preview'); if (el) el.innerHTML = `<div class="np-ic">🌿</div><div><b>${esc(BC.title || 'כותרת')}</b><span>${esc(BC.body || '')}</span></div><em>עכשיו</em>`;
  const btn = $('#bc-send'); if (btn) btn.innerHTML = `📣 שליחה ל-${bcTargets().length} משתמשים`;
}
async function adminPush(box) {
  let users = [], owners = new Set(), hist = [];
  try {
    const [us, ps, hs] = await Promise.all([
      getDocs(query(collection(db, 'users'), limit(5000))),
      getDocs(query(collection(db, 'plants'), limit(5000))),
      getDocs(query(collection(db, 'broadcasts'), orderBy('t', 'desc'), limit(15))).catch(() => ({ docs: [] }))
    ]);
    users = us.docs.map(d => ({ id: d.id, ...d.data() }));
    ps.docs.forEach(d => owners.add(d.data().ownerId));
    hist = hs.docs.map(d => d.data());
  } catch (e) { errLog(e); box.innerHTML = adminNoAccess(); return; }
  S.adminAll = users; S.adminOwners = owners; S.adminHist = hist;
  const cities = [...new Set(users.map(u => u.city).filter(Boolean))].sort();
  if (!BC.city) BC.city = cities[0] || '';
  const segs = [['all', 'כולם'], ['new7', 'חדשים השבוע'], ['idle7', 'לא נכנסו 7+ ימים'], ['idle30', 'לא נכנסו 30+ ימים'], ['noplant', 'עוד לא העלו צמח'], ['city', 'לפי עיר']];
  const segCount = k => { const keep = BC.seg; BC.seg = k; const n = bcTargets().length; BC.seg = keep; return n; };
  const last = hist[0];
  box.innerHTML = `
  <h2 class="section-t" style="margin-top:6px">1. למי לשלוח?</h2>
  <div class="chips" style="padding:0 14px;gap:8px">${segs.map(([k, l]) => `<button class="sel ${BC.seg === k ? 'on' : ''}" data-a="bcSeg" data-k="${k}">${l} (${segCount(k)})</button>`).join('')}</div>
  ${BC.seg === 'city' ? `<div class="pad" style="padding-bottom:0"><select class="field" id="bc-city" data-change="bcCity">${cities.map(c => `<option ${c === BC.city ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select></div>` : ''}
  <h2 class="section-t">2. מה לכתוב?</h2>
  <p class="small muted" style="padding:0 18px;margin-top:-4px">בוחרים הודעה מוכנה, ואפשר לערוך אותה.</p>
  <div class="tpls">${PUSH_TEMPLATES.map((t, i) => `<button class="tpl ${BC.title === t.t ? 'on' : ''}" data-a="bcTpl" data-i="${i}"><b>${esc(t.t)}</b><span>${esc(t.b)}</span></button>`).join('')}</div>
  <div class="pad">
    <p class="label">כותרת</p><input class="field" id="bc-title" maxlength="60" value="${esc(BC.title)}">
    <p class="label">טקסט</p><textarea class="field" id="bc-body" rows="3" maxlength="180">${esc(BC.body)}</textarea>
    <p class="label">לחיצה על ההתראה פותחת</p>
    <div class="chips" style="gap:8px">${PUSH_LINKS.map(([u, l]) => `<button class="sel ${BC.url === u ? 'on' : ''}" data-a="bcLink" data-u="${u}">${l}</button>`).join('')}</div>
    <p class="label">ככה זה ייראה בטלפון</p>
    <div class="notif-prev" id="bc-preview"></div>
    <div class="note" style="margin-top:14px">${ic('bell', 20)}<span>רק מי שאישר התראות יקבל אותן. באייפון, רק מי שהוסיף את האפליקציה למסך הבית. כדאי לא לשלוח יותר מפעם-פעמיים בשבוע.</span></div>
    <div class="err" id="bc-err"></div>
    <button class="btn ghost" data-a="bcTest" style="margin-top:14px">🧪 שליחת בדיקה אליי</button>
    <button class="btn hot" id="bc-send" data-a="bcSend"></button>
    <div id="bc-progress" class="bc-progress" hidden><i></i><span></span></div>
  </div>
  <h2 class="section-t">היסטוריה</h2>
  ${hist.length ? `<div class="list">${hist.map(h => `<div class="li"><div class="li-main"><div class="li-t">${esc(h.title)}</div><div class="li-s">${esc(h.body || '')}</div><div class="small muted">${ago(h.t)}, ${esc(h.segLabel || '')}: ${h.targets} משתמשים, ${h.sent} מכשירים קיבלו</div></div></div>`).join('')}</div>` : '<p class="muted small" style="padding:0 18px">עוד לא נשלחו התראות.</p>'}
  ${last && Date.now() - last.t < DAY ? `<p class="small" style="padding:10px 18px;color:#B3122F">שימו לב: כבר נשלחה התראה ב-24 השעות האחרונות.</p>` : ''}
  <div style="height:24px"></div>`;
  bcPreview();
}
async function bcRun(uids, onProgress) {
  const tok = await auth.currentUser.getIdToken();
  let sent = 0, devices = 0, reason = '', err = '';
  for (let i = 0; i < uids.length; i += 20) {
    const r = await fetch('/api/broadcast', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tok }, body: JSON.stringify({ uids: uids.slice(i, i + 20), title: BC.title, body: BC.body, url: BC.url }) });
    if (r.status === 403) throw new Error('forbidden');
    const d = await r.json().catch(() => ({}));
    sent += d.sent || 0; devices += d.devices || 0; reason = d.reason || reason; err = d.err || err;
    onProgress(Math.min(uids.length, i + 20), uids.length, sent);
  }
  return { sent, devices, reason, err };
}
function bcValid() {
  BC.title = ($('#bc-title') || {}).value?.trim() ?? BC.title; BC.body = ($('#bc-body') || {}).value?.trim() ?? BC.body;
  if (!BC.title) { $('#bc-err').textContent = 'כתבו כותרת להתראה.'; return false; }
  return true;
}

async function createNursery(d) {
  const c = CITIES.find(x => x.n === d.city) || CITIES[0];
  const ref = doc(collection(db, 'nurseries'));
  await setDoc(ref, { name: d.name, city: c.n, lat: c.lat, lng: c.lng, phone: d.phone || '', whatsapp: d.phone || '', address: '', hours: '', about: '', img: null, ownerEmail: (d.email || '').toLowerCase().trim(), ownerUid: d.uid || null, active: true, createdAt: Date.now() });
  return ref.id;
}

// =====================================================
// שיחות קוליות בתוך האפליקציה (WebRTC) והודעות קוליות
// =====================================================
const STUN = [{ urls: ['stun:stun.cloudflare.com:3478', 'stun:stun.l.google.com:19302'] }];
let iceCache = null;
async function getIce() {
  if (iceCache && Date.now() - iceCache.t < 3000e3) return iceCache.servers;
  let extra = [];
  try {
    const ctl = new AbortController(); const tm = setTimeout(() => ctl.abort(), 3500);
    const tok = auth && auth.currentUser && auth.currentUser.getIdToken ? await auth.currentUser.getIdToken() : '';
    const r = await fetch('/api/turn', { signal: ctl.signal, cache: 'no-store', headers: tok ? { Authorization: 'Bearer ' + tok } : {} }); clearTimeout(tm);
    if (r.ok) { const d = await r.json(); const x = d.iceServers; extra = Array.isArray(x) ? x : (x ? [x] : []); }
  } catch (e) { }
  iceCache = { t: Date.now(), servers: [...STUN, ...extra] };
  return iceCache.servers;
}
// צלילים (נוצרים בדפדפן, בלי קבצים)
let actx = null;
document.addEventListener('pointerdown', () => {
  try { if (!actx) { const AC = window.AudioContext || window.webkitAudioContext; if (AC) actx = new AC(); } if (actx && actx.state === 'suspended') actx.resume(); } catch (e) { }
}, { passive: true });
function tone(pattern, every) {
  if (!actx) return () => { };
  let stopped = false;
  const beep = () => {
    if (stopped) return;
    pattern.forEach(([f, st, du]) => {
      try {
        const o = actx.createOscillator(), g = actx.createGain(); o.frequency.value = f; o.connect(g); g.connect(actx.destination);
        const t = actx.currentTime + st; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.14, t + .02); g.gain.setValueAtTime(.14, t + du - .03); g.gain.linearRampToValueAtTime(0, t + du);
        o.start(t); o.stop(t + du + .05);
      } catch (e) { }
    });
  };
  beep(); const iv = setInterval(beep, every);
  return () => { stopped = true; clearInterval(iv); };
}
const RING = [[880, 0, .3], [660, .38, .3], [880, .9, .3], [660, 1.28, .3]], RINGBACK = [[425, 0, 1.1]];
const CALL = { id: null, pc: null, stream: null, role: null, unsubs: [], other: null, matchId: null, started: 0, muted: false, incoming: null, pending: [], remoteQ: [], ready: false, ringStop: null, vib: null, ringT: null, tickT: null, audio: null };
function stopRing() { if (CALL.ringStop) { CALL.ringStop(); CALL.ringStop = null; } if (CALL.vib) { clearInterval(CALL.vib); CALL.vib = null; } try { navigator.vibrate && navigator.vibrate(0); } catch (e) { } }
function callUI(state, sub) {
  let el = $('#callscreen');
  if (!el) { el = document.createElement('div'); el.id = 'callscreen'; document.body.appendChild(el); }
  const o = CALL.other || {};
  el.className = 'callscreen ' + state;
  el.innerHTML = `<div class="call-top"><div class="call-ring">${avatar(o, 'av call-av')}</div><h2>${esc(o.name || '')}</h2><p id="call-status">${esc(sub || '')}</p><p class="small call-note">${ic('shield', 14)} שיחה דרך LeafLoop, בלי מספרי טלפון</p></div>
  <div class="call-btns">${state === 'incoming'
    ? `<button class="cbtn decline" data-a="callDecline" aria-label="דחייה">${ic('phoneOff', 30)}</button><button class="cbtn accept" data-a="callAccept" aria-label="מענה">${ic('phone', 30)}</button>`
    : `<button class="cbtn mute ${CALL.muted ? 'on' : ''}" data-a="callMute" aria-label="${CALL.muted ? 'ביטול השתקה' : 'השתקה'}">${ic(CALL.muted ? 'micOff' : 'mic', 26)}</button><button class="cbtn decline" data-a="callHang" aria-label="ניתוק">${ic('phoneOff', 30)}</button>`}</div>`;
}
const setCallStatus = t => { const e = $('#call-status'); if (e) e.textContent = t; };
const hideCallUI = () => { const e = $('#callscreen'); if (e) e.remove(); };
async function makePC() {
  const pc = new RTCPeerConnection({ iceServers: await getIce() });
  CALL.pc = pc;
  CALL.stream.getTracks().forEach(t => pc.addTrack(t, CALL.stream));
  pc.onicecandidate = e => {
    if (!e.candidate) return;
    const j = e.candidate.toJSON();
    const c = { candidate: j.candidate || '', sdpMid: j.sdpMid ?? null, sdpMLineIndex: j.sdpMLineIndex ?? null, side: CALL.role === 'caller' ? 'from' : 'to', t: Date.now() };
    if (CALL.ready) addDoc(collection(db, 'calls', CALL.id, 'cands'), c).catch(errLog); else CALL.pending.push(c);
  };
  pc.ontrack = e => {
    if (!CALL.audio) { const a = document.createElement('audio'); a.autoplay = true; a.setAttribute('playsinline', ''); document.body.appendChild(a); CALL.audio = a; }
    CALL.audio.srcObject = e.streams[0]; CALL.audio.play().catch(() => { });
  };
  pc.onconnectionstatechange = () => {
    const st = pc.connectionState;
    if (st === 'connected' && !CALL.started) {
      CALL.started = Date.now(); stopRing(); clearTimeout(CALL.ringT);
      CALL.tickT = setInterval(() => setCallStatus(fmtDur((Date.now() - CALL.started) / 1000)), 1000); setCallStatus('0:00');
    }
    if (st === 'failed') finishCall(true, 'השיחה לא התחברה. נסו שוב, או שלחו הודעה קולית.');
    if (st === 'disconnected' && CALL.started) setCallStatus('החיבור חלש…');
  };
  return pc;
}
function flushPending() { CALL.ready = true; CALL.pending.forEach(c => addDoc(collection(db, 'calls', CALL.id, 'cands'), c).catch(errLog)); CALL.pending = []; }
function flushRemote() { const q = CALL.remoteQ; CALL.remoteQ = []; q.forEach(c => CALL.pc.addIceCandidate(c).catch(errLog)); }
function listenCands(id, side) {
  const seen = new Set();
  CALL.unsubs.push(onSnapshot(query(collection(db, 'calls', id, 'cands'), where('side', '==', side)), sn => {
    sn.docs.forEach(d => {
      if (seen.has(d.id)) return; seen.add(d.id);
      const x = d.data(); const c = { candidate: x.candidate, sdpMid: x.sdpMid, sdpMLineIndex: x.sdpMLineIndex };
      if (CALL.pc && CALL.pc.remoteDescription) CALL.pc.addIceCandidate(c).catch(errLog); else CALL.remoteQ.push(c);
    });
  }, errLog));
}
async function getMic() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('nomic');
  return navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
}
async function startCall(mid) {
  if (CALL.id || CALL.incoming) return toast('כבר יש שיחה פעילה.');
  const m = S.matches.find(x => x.id === mid); if (!m) return;
  if (!window.RTCPeerConnection) return toast('הדפדפן הזה לא תומך בשיחות. נסו לעדכן אותו.');
  CALL.other = { ...otherInfo(m), id: otherId(m) }; CALL.matchId = mid; CALL.role = 'caller';
  callUI('outgoing', 'מתחברים…');
  try { CALL.stream = await getMic(); } catch (e) { resetCall(); hideCallUI(); return toast('צריך לאשר גישה למיקרופון כדי להתקשר.'); }
  try {
    const ref = doc(collection(db, 'calls')); CALL.id = ref.id;
    const pc = await makePC();
    const offer = await pc.createOffer(); await pc.setLocalDescription(offer);
    await setDoc(ref, { matchId: mid, from: uid(), to: CALL.other.id, fromInfo: pubInfo(S.profile), status: 'ringing', offer: { type: offer.type, sdp: offer.sdp }, answer: null, t: Date.now() });
    flushPending();
    pushNotify('call', ref.id);
    setCallStatus('מצלצל…'); CALL.ringStop = tone(RINGBACK, 3500);
    CALL.unsubs.push(onSnapshot(ref, sn => {
      const d = sn.data(); if (!d || !CALL.pc) return;
      if (d.answer && !CALL.pc.remoteDescription) { CALL.pc.setRemoteDescription(d.answer).then(flushRemote).catch(errLog); stopRing(); setCallStatus('מתחברים…'); }
      if (['ended', 'declined', 'busy'].includes(d.status)) finishCall(false, d.status === 'declined' ? 'השיחה נדחתה' : d.status === 'busy' ? 'הצד השני בשיחה אחרת' : 'השיחה הסתיימה');
    }, errLog));
    listenCands(ref.id, 'to');
    CALL.ringT = setTimeout(() => {
      if (CALL.id === ref.id && !CALL.started && !(CALL.pc && CALL.pc.remoteDescription)) { updateDoc(ref, { status: 'missed' }).catch(errLog); logCall(mid, 0); finishCall(false, 'אין מענה'); }
    }, 45000);
  } catch (e) { errLog(e); finishCall(true, 'לא הצלחנו להתקשר. נסו שוב.'); }
}
async function acceptCall() {
  const c = CALL.incoming; if (!c) return;
  stopRing();
  CALL.id = c.id; CALL.role = 'callee'; CALL.matchId = c.matchId; CALL.incoming = null;
  callUI('active', 'מתחברים…');
  try { CALL.stream = await getMic(); } catch (e) { updateDoc(doc(db, 'calls', c.id), { status: 'declined' }).catch(errLog); finishCall(false, 'צריך לאשר גישה למיקרופון כדי לענות.'); return; }
  try {
    const pc = await makePC(); CALL.ready = true;
    await pc.setRemoteDescription(c.offer); flushRemote();
    const ans = await pc.createAnswer(); await pc.setLocalDescription(ans);
    await updateDoc(doc(db, 'calls', c.id), { answer: { type: ans.type, sdp: ans.sdp }, status: 'accepted', acceptedAt: Date.now() });
    listenCands(c.id, 'from');
    CALL.unsubs.push(onSnapshot(doc(db, 'calls', c.id), sn => { const d = sn.data(); if (d && ['ended', 'missed'].includes(d.status)) finishCall(false, 'השיחה הסתיימה'); }, errLog));
  } catch (e) { errLog(e); finishCall(true, 'השיחה לא התחברה.'); }
}
function declineCall() {
  const c = CALL.incoming; if (!c) return;
  stopRing(); CALL.incoming = null; CALL.other = null; hideCallUI();
  updateDoc(doc(db, 'calls', c.id), { status: 'declined' }).catch(errLog);
}
function logCall(mid, dur) { sendMsg(mid, dur ? `📞 שיחה קולית, ${fmtDur(dur)}` : '📞 שיחה שלא נענתה', null, true); }
function resetCall() {
  CALL.unsubs.forEach(f => { try { f(); } catch (e) { } });
  Object.assign(CALL, { id: null, pc: null, stream: null, role: null, unsubs: [], other: null, matchId: null, started: 0, muted: false, incoming: null, pending: [], remoteQ: [], ready: false });
}
function finishCall(notify, msg) {
  const id = CALL.id, mid = CALL.matchId, caller = CALL.role === 'caller';
  const dur = CALL.started ? Math.round((Date.now() - CALL.started) / 1000) : 0;
  if (!id && !CALL.stream) { hideCallUI(); return; }
  stopRing(); clearTimeout(CALL.ringT); clearInterval(CALL.tickT);
  if (notify && id) updateDoc(doc(db, 'calls', id), { status: 'ended', endedAt: Date.now(), dur }).catch(errLog);
  if (caller && dur > 0) logCall(mid, dur);
  try { CALL.pc && CALL.pc.close(); } catch (e) { }
  try { CALL.stream && CALL.stream.getTracks().forEach(t => t.stop()); } catch (e) { }
  if (CALL.audio) { CALL.audio.srcObject = null; CALL.audio.remove(); CALL.audio = null; }
  resetCall();
  if (msg && $('#callscreen')) { setCallStatus(msg); const b = $('#callscreen .call-btns'); if (b) b.innerHTML = ''; setTimeout(hideCallUI, 1600); } else hideCallUI();
}
function onIncomingCalls(sn) {
  const now = Date.now();
  const ringing = sn.docs.map(d => ({ id: d.id, ...d.data() })).filter(c => okId(c.id) && okId(c.from) && now - (c.t || 0) < 45000 && !isBlocked(c.from));
  if (CALL.incoming && !ringing.some(c => c.id === CALL.incoming.id)) { stopRing(); CALL.incoming = null; CALL.other = null; hideCallUI(); toast('📞 שיחה שלא נענתה'); }
  const c = ringing[0];
  if (!c) return;
  if (CALL.id && c.id !== CALL.id) { updateDoc(doc(db, 'calls', c.id), { status: 'busy' }).catch(errLog); return; }
  if (!CALL.incoming && !CALL.id) {
    CALL.incoming = c; CALL.other = { ...(c.fromInfo || {}), id: c.from };
    callUI('incoming', 'שיחה קולית נכנסת…');
    CALL.ringStop = tone(RING, 2600);
    if (navigator.vibrate) { navigator.vibrate([500, 300, 500]); CALL.vib = setInterval(() => navigator.vibrate([500, 300, 500]), 2600); }
  }
}
window.addEventListener('pagehide', () => { if (CALL.id) updateDoc(doc(db, 'calls', CALL.id), { status: 'ended', endedAt: Date.now() }).catch(() => { }); });

// ---------- הקפאת מודעה ----------
function setFrozen(pid, on) {
  const pl = S.myPlants.find(x => x.id === pid); if (!pl) return;
  pl.frozen = on;
  const t = $('#sheet .toggle.freeze'); if (t) t.classList.toggle('on', on);
  updateDoc(doc(db, 'plants', pid), { frozen: on })
    .then(() => toast(on ? '🔒 המודעה הוקפאה. אף אחד חדש לא יפנה עליה.' : '🔓 המודעה פעילה שוב'))
    .catch(e => { errLog(e); pl.frozen = !on; toast('השמירה לא הצליחה.'); });
}

// ---------- הודעות קוליות ----------
let REC = null;
const blobToDataURL = b => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(b); });
async function startRec(mid) {
  if (REC) return;
  if (!window.MediaRecorder) return toast('הדפדפן הזה לא תומך בהקלטה.');
  let stream;
  try { stream = await getMic(); } catch (e) { return toast('צריך לאשר גישה למיקרופון כדי להקליט.'); }
  const types = ['audio/mp4;codecs=mp4a.40.2', 'audio/mp4', 'audio/aac', 'audio/webm;codecs=opus', 'audio/webm'];
  const mime = types.find(t => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) || '';
  let rec;
  try { rec = new MediaRecorder(stream, mime ? { mimeType: mime, audioBitsPerSecond: 32000 } : { audioBitsPerSecond: 32000 }); }
  catch (e) { stream.getTracks().forEach(t => t.stop()); return toast('ההקלטה לא נתמכת במכשיר הזה.'); }
  REC = { rec, stream, chunks: [], mid, start: Date.now(), cancel: false, mime: rec.mimeType || mime || 'audio/mp4' };
  rec.ondataavailable = e => { if (e.data && e.data.size && REC) REC.chunks.push(e.data); };
  rec.onstop = async () => {
    const r = REC; REC = null; clearInterval(r.iv);
    r.stream.getTracks().forEach(t => t.stop());
    const box = $('#composer'); if (box) box.innerHTML = composerHTML(r.mid);
    if (r.cancel) return;
    const dur = Math.round((Date.now() - r.start) / 1000);
    if (dur < 1) return toast('ההקלטה קצרה מדי. לוחצים, מדברים, ואז שולחים.');
    const blob = new Blob(r.chunks, { type: r.mime });
    if (blob.size > 700000) return toast('ההקלטה ארוכה מדי.');
    try { await sendVoice(r.mid, await blobToDataURL(blob), dur); } catch (e) { errLog(e); toast('ההודעה הקולית לא נשלחה.'); }
  };
  rec.start(250);
  const box = $('#composer');
  if (box) box.innerHTML = `<button class="icon-btn" data-a="recCancel" aria-label="ביטול ההקלטה">${ic('trash', 20)}</button><div class="rec-live"><span class="rec-dot"></span><span id="rec-time">0:00</span><span class="small muted">מקליטים… (עד דקה)</span></div><button class="send" data-a="recSend" aria-label="שליחת ההקלטה">${ic('send')}</button>`;
  REC.iv = setInterval(() => { if (!REC) return; const sec = (Date.now() - REC.start) / 1000; const e = $('#rec-time'); if (e) e.textContent = fmtDur(sec); if (sec >= 60) stopRec(false); }, 250);
}
function stopRec(cancel) { if (!REC) return; REC.cancel = cancel; try { REC.rec.stop(); } catch (e) { } }
async function sendVoice(mid, url, dur) {
  const m = S.matches.find(x => x.id === mid); if (!m) return;
  const me = uid(), o = otherId(m), now = Date.now();
  await addDoc(collection(db, 'matches', mid, 'messages'), { from: me, text: '', img: null, audio: url, dur, sys: false, t: now });
  await updateDoc(doc(db, 'matches', mid), { lastMsg: '🎙️ הודעה קולית', lastAt: now, lastFrom: me, [`unread.${o}`]: increment(1) });
  pushNotify('msg', mid, '🎙️ הודעה קולית');
}
let player = null, playingId = null;
function playVoice(id) {
  const x = S.msgs.find(y => y.id === id); if (!x || !safeAudio(x.audio)) { toast('לא הצלחנו לנגן את ההקלטה.'); return; }
  const btns = () => $$('[data-a=vplay]');
  if (playingId === id && player && !player.paused) { player.pause(); return; }
  if (player) { player.pause(); }
  player = new Audio(safeAudio(x.audio)); playingId = id; player.setAttribute('playsinline', '');
  const setIcon = (pid, on) => { const b = btns().find(e => e.dataset.id === pid); if (b) b.innerHTML = ic(on ? 'pause' : 'play', 18); };
  btns().forEach(b => { b.innerHTML = ic('play', 18); });
  player.ontimeupdate = () => { const bar = $('#vb-' + id); if (bar && player.duration) bar.style.width = Math.min(100, player.currentTime / player.duration * 100) + '%'; };
  player.onplay = () => setIcon(id, true);
  player.onpause = () => setIcon(id, false);
  player.onended = () => { setIcon(id, false); const bar = $('#vb-' + id); if (bar) bar.style.width = '0'; playingId = null; };
  player.play().catch(e => { errLog(e); toast('לא הצלחנו לנגן את ההקלטה במכשיר הזה.'); });
}

// =====================================================
// פעולות (לחיצות)
// =====================================================
const A = {
  // התחברות והרשמה
  signIn: el => signIn(el),
  signOut: async () => { closeSheet(); if (CALL.id) finishCall(true, ''); unsubAll(); await signOut(auth).catch(errLog); },
  obColor: el => { ob.color = el.dataset.c; ob.name = $('#ob-name').value; renderOnboarding(); },
  obBack: () => { ob.step--; renderOnboarding(); },
  obRadius: el => { ob.radius = +el.dataset.r; renderOnboarding(); },
  obWish: el => { const id = el.dataset.id; ob.wish = ob.wish.includes(id) ? ob.wish.filter(x => x !== id) : [...ob.wish, id]; el.classList.toggle('on'); },
  obGeo: el => {
    if (!navigator.geolocation) { $('#ob-err').textContent = 'הדפדפן לא תומך באיתור מיקום. בחרו עיר מהרשימה.'; return; }
    busy(el, true, 'מאתרים…');
    navigator.geolocation.getCurrentPosition(pos => {
      const here = { lat: +pos.coords.latitude.toFixed(2), lng: +pos.coords.longitude.toFixed(2) };
      const near = CITIES.slice().sort((a, b) => km(here, a) - km(here, b))[0];
      ob.lat = here.lat; ob.lng = here.lng; ob.city = near.n;
      renderOnboarding(); toast(`מצאנו: ${near.n}`);
    }, () => { busy(el, false); $('#ob-err').textContent = 'לא הצלחנו לאתר מיקום. בחרו עיר מהרשימה.'; }, { timeout: 10000 });
  },
  obNext: () => {
    if (ob.step === 1) {
      ob.name = $('#ob-name').value.trim();
      if (!ob.name) { $('#ob-err').textContent = 'כתבו שם או כינוי כדי להמשיך.'; return; }
    } else if (ob.step === 2) {
      const sel = $('#ob-city').value;
      if (sel && sel !== ob.city) { const c = CITIES.find(x => x.n === sel); ob.city = c.n; ob.lat = c.lat; ob.lng = c.lng; }
      if (!ob.city) { $('#ob-err').textContent = 'בחרו עיר או אשרו שימוש במיקום.'; return; }
    }
    ob.step++; renderOnboarding();
  },
  obFinish: el => finishOnboarding(el),

  // כללי
  open: el => { closeSheet(); $('#overlay').classList.remove('open'); go(el.dataset.to); },
  back: () => { if (history.length > 1) history.back(); else go('discover'); },
  closeSheet,
  reload: () => location.reload(),
  closeOverlay: () => $('#overlay').classList.remove('open'),
  invite: async () => {
    const data = { title: APP_NAME, text: 'בואו להחליף איתי צמחים ב-LeafLoop 🌿', url: location.origin + location.pathname };
    try { if (navigator.share) await navigator.share(data); else { await navigator.clipboard.writeText(data.url); toast('הקישור הועתק. שלחו אותו לחברים!'); } } catch (e) { }
  },

  // גילוי
  decide: el => decide(el.dataset.d),
  undo: () => {
    if (!lastSwipe) return;
    if (lastSwipe.promo) {
      const ps = { ...(S.priv.promoSeen || {}) }; delete ps[lastSwipe.promo]; S.priv.promoSeen = ps;
      if (lastSwipe.a === 'save') S.priv.savedPromos = (S.priv.savedPromos || []).filter(x => x !== lastSwipe.promo);
      lastSwipe = null; savePriv(); renderDeck(); return;
    }
    const ls = lastSwipe;
    if ((ls.a === 'like' || ls.a === 'super') && inActiveMatch(ls.id)) { toast('כבר נוצרה התאמה על הצמח הזה. אפשר לבטל אותה מהצ׳אט.'); lastSwipe = null; renderDeck(); return; }
    delete S.priv.swipes[ls.id];
    if (ls.a === 'save') S.priv.saved = S.priv.saved.filter(x => x !== ls.id);
    if (ls.a === 'like' || ls.a === 'super') {
      deleteDoc(doc(db, 'likes', uid() + '_' + ls.id)).catch(errLog);
      S.outgoing.filter(r => r.target === ls.id && r.status === 'pending').forEach(r => deleteDoc(doc(db, 'requests', r.id)).catch(errLog));
      closeSheet();
    }
    lastSwipe = null; savePriv(); renderDeck();
  },
  refresh: async el => { busy(el, true, ''); try { await loadPool(true); } catch (e) { errLog(e); toast('הרענון לא הצליח.'); } (VIEWS[curRoute()[0]] || VIEWS.discover)(); },
  searchMode: el => { SQ.mode = el.dataset.k; $$('.mchips .sel').forEach(b => b.classList.toggle('on', b === el)); renderResults(); },
  clearSearch: () => { SQ.q = ''; VIEWS.discover(); },
  searchFar: () => { SQ.far = true; renderResults(); },
  nearOnly: () => { SQ.far = false; renderResults(); },
  wishFromSearch: async el => {
    const c = toCat(SQ.q); if (!c) return;
    busy(el, true);
    try { await updateDoc(doc(db, 'users', uid()), { wishlist: arrayUnion(c.id) }); S.profile.wishlist = [...new Set([...(S.profile.wishlist || []), c.id])]; toast(`🔔 נודיע לך כשמישהו יעלה ${c.he}`); el.outerHTML = '<p class="small">✓ נוסף לרשימת המשאלות</p>'; }
    catch (e) { errLog(e); busy(el, false); toast('לא הצליח. נסו שוב.'); }
  },
  resetPasses: () => { Object.keys(S.priv.swipes).forEach(k => { if (String(S.priv.swipes[k]).startsWith('pass')) delete S.priv.swipes[k]; }); savePriv(); renderDeck(); },
  filters: filtersSheet,
  setFilter: el => { filters[el.dataset.k] = el.dataset.v; saveFilters(); filtersSheet(true); },
  filterRadius: el => { radiusDraft = +el.dataset.r; $$('#sheet [data-a=filterRadius]').forEach(b => b.classList.toggle('on', b === el)); },
  applyFilters: () => {
    closeSheet();
    if (radiusDraft && radiusDraft !== S.profile.radius) { S.profile.radius = radiusDraft; updateDoc(doc(db, 'users', uid()), { radius: radiusDraft }).catch(errLog); }
    route();
  },
  notifs: notifsSheet,
  notifGo: el => { closeSheet(); if (el.dataset.to) go(el.dataset.to); },
  likeDetail: async el => { const p = S.pool.find(x => x.id === el.dataset.id); if (!p) return; S.priv.swipes[p.id] = 'like'; savePriv(); busy(el, true); await afterLike(p, false); busy(el, false); },
  toggleSave: el => { const id = el.dataset.id; S.priv.saved = S.priv.saved.includes(id) ? S.priv.saved.filter(x => x !== id) : [...S.priv.saved, id]; savePriv(); VIEWS.plant(id); toast(S.priv.saved.includes(id) ? 'נשמר לאחר כך' : 'הוסר מהשמורים'); },
  sendRequest: el => sendRequest(el),
  matchChat: el => { $('#overlay').classList.remove('open'); go('chat/' + el.dataset.id); },

  // הוספה
  skipPhoto: () => { draft.step = 'mode'; VIEWS.add(); window.scrollTo(0, 0); },
  addNext: () => addGo(1),
  addBack: () => addGo(-1),
  draftSet: el => { keepName(); draft[el.dataset.k] = el.dataset.v; VIEWS.add(); },
  qty: el => { draft.qty = Math.max(1, Math.min(99, draft.qty + +el.dataset.v)); $('#qty').textContent = draft.qty; },
  addWant: () => {
    const c = toCat($('#want-in').value);
    if (!c) { $('#want-err').textContent = 'כתבו שם של צמח.'; return; }
    keepName();
    if (!draft.wants.includes(c.id)) draft.wants.push(c.id);
    VIEWS.add();
  },
  rmWant: el => { keepName(); draft.wants = draft.wants.filter(w => w !== el.dataset.id); VIEWS.add(); },
  cancelAdd: () => { draft = null; go('discover'); },
  savePlant: el => savePlant(el),

  // התאמות
  matchTab: el => { matchTab = el.dataset.k; VIEWS.matches(); },
  reqAccept: el => acceptReq(el.dataset.id, false, el),
  reqChat: el => acceptReq(el.dataset.id, true, el),
  reqDecline: el => { updateDoc(doc(db, 'requests', el.dataset.id), { status: 'declined' }).then(() => toast('ההצעה נדחתה')).catch(e => { errLog(e); toast('לא הצלחנו לדחות. נסו שוב.'); }); },

  // צ'אט
  send: el => { const inp = $('#chat-in'); const t = inp.value.trim(); if (!t) return; inp.value = ''; sendMsg(el.dataset.id, t); inp.focus(); },
  quick: el => sendMsg(el.dataset.id, el.dataset.t),
  statusSheet: el => {
    const m = S.matches.find(x => x.id === el.dataset.id);
    sheet(`<h3>איפה ההחלפה עומדת?</h3><div class="pick">${Object.entries(STATUS).map(([k, v]) => `<button class="pick-item" data-a="setStatus" data-id="${m.id}" data-s="${k}" style="${m.status === k ? 'border-color:var(--leaf)' : ''}"><span class="pill st-${k}">${v}</span><span class="small muted">${STATUS_HINT[k]}</span></button>`).join('')}</div>`);
  },
  setStatus: el => setStatus(el.dataset.id, el.dataset.s),
  meetSheet: el => meetSheet(el.dataset.id),
  saveMeet: async el => {
    const place = ($('#sheet input[name=spot]:checked') || {}).value, when = $('#meet-when').value;
    if (!when) { $('#meet-err').textContent = 'בחרו תאריך ושעה.'; return; }
    if (new Date(when).getTime() < Date.now() - 5 * 60e3) { $('#meet-err').textContent = 'אי אפשר לקבוע מפגש בעבר. בחרו תאריך ושעה עתידיים.'; return; }
    const m = S.matches.find(x => x.id === el.dataset.id);
    busy(el, true);
    try {
      const patch = { meeting: { place, when, by: uid() } };
      if (['discussing', 'agreed'].includes(m.status)) patch.status = 'meeting';
      await updateDoc(doc(db, 'matches', m.id), patch);
      await sendMsg(m.id, `📍 הצעת מפגש: ${place}, ${fmtWhen(when)}`, null, true);
      closeSheet();
    } catch (e) { errLog(e); busy(el, false); $('#meet-err').textContent = 'השמירה לא הצליחה. נסו שוב.'; }
  },
  rate: el => rateSheet(el.dataset.id),
  star: el => {
    rateVals[el.dataset.k] = +el.dataset.v;
    $$(`#sheet .stars[data-k="${el.dataset.k}"] button`).forEach(b => b.classList.toggle('on', +b.dataset.v <= +el.dataset.v));
  },
  submitRate: async el => {
    const keys = ['comm', 'cond', 'rel', 'all'];
    if (keys.some(k => !rateVals[k])) { $('#rate-err').textContent = 'דרגו את כל ארבע הקטגוריות.'; return; }
    const m = S.matches.find(x => x.id === el.dataset.id);
    busy(el, true, 'שולחים…');
    try {
      await setDoc(doc(db, 'reviews', m.id + '_' + uid()), { matchId: m.id, from: uid(), fromName: S.profile.name, to: otherId(m), ...rateVals, text: $('#rev-txt').value.trim().slice(0, 400), t: Date.now() });
      await updateDoc(doc(db, 'matches', m.id), { rated: arrayUnion(uid()) });
      closeSheet(); toast('תודה! הדירוג נשמר.');
    } catch (e) { errLog(e); busy(el, false); $('#rate-err').textContent = 'השליחה לא הצליחה. נסו שוב.'; }
  },
  chatMenu: el => chatMenu(el.dataset.id),
  unblock: el => {
    const id = el.dataset.id;
    S.priv.blocked = (S.priv.blocked || []).filter(x => x !== id); savePriv();
    deleteDoc(doc(db, 'blocks', uid() + '_' + id)).catch(errLog);
    S.matches.filter(x => x.users.includes(id) && x.blockedBy === uid()).forEach(x => updateDoc(doc(db, 'matches', x.id), { blockedBy: null }).catch(errLog));
    toast('החסימה בוטלה'); settingsSheet();
  },
  freezeToggle: el => { const pl = S.myPlants.find(x => x.id === el.dataset.id); if (!pl) return; setFrozen(pl.id, !pl.frozen); closeSheet(); },
  reportSheet: el => reportSheet(el.dataset.id),
  sendReport: async el => {
    const m = S.matches.find(x => x.id === el.dataset.id);
    busy(el, true, 'שולחים…');
    try {
      await addDoc(collection(db, 'reports'), { from: uid(), handled: false, about: otherId(m), matchId: m.id, reason: ($('#sheet input[name=reason]:checked') || {}).value || '', text: $('#rep-txt').value.trim(), t: Date.now() });
      closeSheet(); toast('תודה. הדיווח התקבל ונבדוק אותו.');
    } catch (e) { errLog(e); busy(el, false); toast('השליחה לא הצליחה. נסו שוב.'); }
  },
  block: async el => {
    const m = S.matches.find(x => x.id === el.dataset.id); const n = otherInfo(m).name;
    if (!confirm(`לחסום את ${n}? לא תראו יותר את הצמחים וההודעות שלו/ה, וההחלפה ביניכם תבוטל.`)) return;
    const o = otherId(m);
    S.priv.blocked = [...new Set([...(S.priv.blocked || []), o])]; savePriv();
    setDoc(doc(db, 'blocks', uid() + '_' + o), { by: uid(), user: o, t: Date.now() }).catch(errLog);
    S.matches.filter(x => x.users.includes(o) && !x.blockedBy).forEach(x => updateDoc(doc(db, 'matches', x.id), { status: x.status === 'swapped' ? 'swapped' : 'cancelled', blockedBy: uid() }).catch(errLog));
    closeSheet(); toast(`${n} נחסם/ה`); go('matches');
  },

  copyLink: async () => { try { await navigator.clipboard.writeText(location.href); toast('הקישור הועתק. הדביקו אותו בספארי או בכרום.'); } catch (e) { toast(location.href); } },
  pickSugg: el => {
    const inp = $('#' + el.dataset.for); if (!inp) return;
    inp.value = el.dataset.v;
    const box = $('#' + el.dataset.for + '-sugg'); if (box) box.innerHTML = '';
    const kind = inp.dataset.suggest;
    if (kind === 'name') { inp.dispatchEvent(new Event('change', { bubbles: true })); inp.blur(); VIEWS.add(); }
    else if (kind === 'want') A.addWant();
    else if (kind === 'wish') A.addWish();
    else if (kind === 'promo') { keepPromo(); }
    else if (kind === 'editname') { inp.dispatchEvent(new Event('change', { bubbles: true })); inp.blur(); }
  },

  // שיחות והודעות קוליות
  call: el => startCall(el.dataset.id),
  callAccept: () => acceptCall(),
  callDecline: () => declineCall(),
  callHang: () => finishCall(true, ''),
  callMute: () => {
    if (!CALL.stream) return;
    CALL.muted = !CALL.muted; CALL.stream.getAudioTracks().forEach(t => { t.enabled = !CALL.muted; });
    const b = $('#callscreen [data-a=callMute]'); if (b) { b.classList.toggle('on', CALL.muted); b.innerHTML = ic(CALL.muted ? 'micOff' : 'mic', 26); }
  },
  recStart: el => startRec(el.dataset.id),
  recCancel: () => stopRec(true),
  recSend: () => stopRec(false),
  vplay: el => playVoice(el.dataset.id),

  // התראות והתקנה
  pushOn: () => { closeSheet(); enablePush(false); },
  installLater: () => { lsSet('ll_inst_no', String(Date.now())); closeSheet(); },

  // מיקום
  useLive: el => { lsSet('ll_live', '1'); busy(el, true, ''); locate(true); setTimeout(() => busy(el, false), 4000); },
  noLive: () => { lsSet('ll_live_ask', '0'); const b = $('.live-ask'); if (b) b.remove(); },

  // משתלות
  promo: el => { const pr = S.promos.find(x => x.id === el.dataset.id) || (S.myPromos || []).find(x => x.id === el.dataset.id); if (pr) openPromo(pr); },
  nurseryApply: () => { if (lsGet('ll_applied') === '1') { toast('כבר קיבלנו את הבקשה שלכם. נחזור אליכם בקרוב 🌿'); return; } nurseryApplySheet(); },
  sendApply: async el => {
    const v = id => $('#' + id).value.trim();
    if (!v('ap-name') || !v('ap-phone')) { $('#ap-err').textContent = 'מלאו שם משתלה וטלפון.'; return; }
    busy(el, true, 'שולחים…');
    try {
      await addDoc(collection(db, 'nurseryApplications'), { uid: uid(), email: (S.me.email || '').toLowerCase(), name: v('ap-name'), city: v('ap-city'), phone: v('ap-phone'), contact: v('ap-contact'), notes: v('ap-notes'), status: 'pending', t: Date.now() });
      lsSet('ll_applied', '1'); closeSheet(); toast('קיבלנו! נחזור אליכם בקרוב 🌿');
    } catch (e) { errLog(e); busy(el, false); $('#ap-err').textContent = 'השליחה לא הצליחה. נסו שוב.'; }
  },
  newPromo: () => { pd = null; go('promonew'); },
  cancelPromo: () => { pd = null; go('mynursery'); },
  promoRadius: el => { keepPromo(); pd.radius = +el.dataset.r; VIEWS.promonew(); },
  savePromo: async el => {
    keepPromo();
    if (!pd.title.trim()) { $('#pr-err').textContent = 'כתבו כותרת להצעה.'; return; }
    const n = S.myNursery;
    busy(el, true, 'מפרסמים…');
    try {
      const thumb = pd.img ? await shrinkDataUrl(pd.img, 260, .62) : null;
      await addDoc(collection(db, 'promos'), {
        nurseryId: n.id, nurseryName: n.name, ownerEmail: (S.me.email || '').toLowerCase(), title: pd.title.trim(), catId: pd.catId || null,
        deal: pd.deal.trim(), text: pd.text.trim(), img: pd.img, thumb, lat: n.lat, lng: n.lng, city: n.city, radius: pd.radius,
        until: pd.until ? new Date(pd.until + 'T23:59:59').getTime() : null, active: true, views: 0, clicks: 0, t: Date.now()
      });
      pd = null; S.poolAt = 0; loadPool(true).catch(errLog);
      go('mynursery'); setTimeout(() => toast('ההצעה פורסמה 🌿'), 300);
    } catch (e) { errLog(e); busy(el, false); $('#pr-err').textContent = 'הפרסום לא הצליח. נסו שוב.'; }
  },
  delPromo: async el => {
    if (!confirm('למחוק את ההצעה?')) return;
    try { await deleteDoc(doc(db, 'promos', el.dataset.id)); VIEWS.mynursery(); toast('ההצעה נמחקה'); } catch (e) { errLog(e); toast('המחיקה לא הצליחה.'); }
  },
  editNursery: nurseryEditSheet,
  nurseryHere: el => {
    if (!navigator.geolocation) return;
    busy(el, true, 'מאתרים…');
    navigator.geolocation.getCurrentPosition(pos => {
      S.myNursery._lat = +pos.coords.latitude.toFixed(5); S.myNursery._lng = +pos.coords.longitude.toFixed(5);
      busy(el, false); el.innerHTML = `${ic('check')} המיקום נקלט. לחצו שמירה.`;
    }, () => { busy(el, false); toast('לא הצלחנו לאתר מיקום.'); }, { enableHighAccuracy: true, timeout: 15000 });
  },
  saveNursery: async el => {
    const n = S.myNursery, v = id => $('#' + id).value.trim();
    const patch = { phone: v('n-phone'), whatsapp: v('n-wa'), address: v('n-addr'), hours: v('n-hours'), about: v('n-about') };
    if (n._img) patch.img = n._img;
    if (n._lat) { patch.lat = n._lat; patch.lng = n._lng; }
    busy(el, true, 'שומרים…');
    try {
      await updateDoc(doc(db, 'nurseries', n.id), patch);
      if (patch.lat) { const b = writeBatch(db); (S.myPromos || []).forEach(pr => b.update(doc(db, 'promos', pr.id), { lat: patch.lat, lng: patch.lng })); await b.commit(); }
      delete n._img; delete n._lat; delete n._lng;
      closeSheet(); VIEWS.mynursery(); toast('הפרטים נשמרו');
    } catch (e) { errLog(e); busy(el, false); $('#n-err').textContent = 'השמירה לא הצליחה. נסו שוב.'; }
  },
  adminBan: async el => {
    const on = el.dataset.on === '1', id = el.dataset.id;
    const u = S.users[id] || (S.adminUsers || []).find(x => x.id === id) || {};
    if (on && !confirm(`להשעות את ${u.name || 'המשתמש/ת'}? כל המודעות שלו/ה יוסתרו והכניסה לאפליקציה תיחסם.`)) return;
    busy(el, true);
    try {
      await updateDoc(doc(db, 'users', id), { banned: on });
      if (el.dataset.rep) await updateDoc(doc(db, 'reports', el.dataset.rep), { handled: true });
      if (S.users[id]) S.users[id].banned = on;
      toast(on ? 'המשתמש/ת הושעה' : 'ההשעיה בוטלה'); VIEWS.admin(curRoute()[1]);
    } catch (e) { errLog(e); busy(el, false); toast('לא הצליח. בדקו שכללי האבטחה העדכניים פורסמו.'); }
  },
  bcSeg: el => { BC.seg = el.dataset.k; adminPush($('#admin-box')); },
  bcTpl: el => { const t = PUSH_TEMPLATES[+el.dataset.i]; Object.assign(BC, { title: t.t, body: t.b, url: t.u }); $('#bc-title').value = t.t; $('#bc-body').value = t.b; $$('.tpl').forEach(b => b.classList.toggle('on', b === el)); $$('[data-a=bcLink]').forEach(b => b.classList.toggle('on', b.dataset.u === t.u)); bcPreview(); },
  bcLink: el => { BC.url = el.dataset.u; $$('[data-a=bcLink]').forEach(b => b.classList.toggle('on', b === el)); },
  bcTest: async el => {
    if (!bcValid()) return;
    busy(el, true, 'שולחים…');
    try {
      const r = await bcRun([uid()], () => { });
      const msg = r.reason ? 'ההתראות עוד לא הוגדרו בשרת (FIREBASE_SA חסר ב-Runtime variables).'
        : r.sent ? `🧪 נשלחה התראת בדיקה ל-${r.sent} ${r.sent === 1 ? 'מכשיר' : 'מכשירים'}.`
        : r.devices ? 'נמצא מכשיר, אבל השליחה אליו נכשלה.'
        : r.err ? 'השרת לא הצליח לקרוא את רשימת המכשירים.'
        : 'לא נמצא מכשיר שלך שאישר התראות. בטלפון: הגדרות ← הפעלת התראות.';
      sheet(`<div class="ask-ic">${r.sent ? '✅' : '🔎'}</div><h3>תוצאת הבדיקה</h3><p class="muted">${esc(msg)}</p>${r.err ? `<pre class="err-code">${esc(r.err)}</pre>` : ''}<button class="btn ghost" data-a="closeSheet">סגירה</button>`);
    }
    catch (e) { errLog(e); toast('השליחה לא הצליחה.'); }
    busy(el, false);
  },
  bcSend: async el => {
    if (!bcValid()) return;
    const targets = bcTargets().map(u => u.id);
    if (!targets.length) { $('#bc-err').textContent = 'אין משתמשים בקהל הזה.'; return; }
    const recent = (S.adminHist || [])[0] && Date.now() - S.adminHist[0].t < DAY;
    if (!confirm(`לשלוח את ההתראה "${BC.title}" ל-${targets.length} משתמשים?${recent ? '\n\nשימו לב: כבר נשלחה התראה ב-24 השעות האחרונות.' : ''}`)) return;
    busy(el, true, 'שולחים…');
    const pr = $('#bc-progress'); pr.hidden = false;
    try {
      const r = await bcRun(targets, (done, total, sent) => { pr.querySelector('i').style.width = Math.round(done / total * 100) + '%'; pr.querySelector('span').textContent = `${done}/${total} משתמשים, ${sent} מכשירים קיבלו`; });
      if (r.reason) { toast('ההתראות עוד לא הוגדרו בשרת (FIREBASE_SA).'); busy(el, false); return; }
      const segLabel = { all: 'כולם', new7: 'חדשים השבוע', idle7: 'לא נכנסו 7+ ימים', idle30: 'לא נכנסו 30+ ימים', noplant: 'בלי צמחים', city: BC.city }[BC.seg];
      await addDoc(collection(db, 'broadcasts'), { title: BC.title, body: BC.body, url: BC.url, seg: BC.seg, segLabel, targets: targets.length, sent: r.sent, by: uid(), t: Date.now() }).catch(errLog);
      toast(`📣 נשלח! ${r.sent} מכשירים קיבלו את ההתראה.`);
      setTimeout(() => VIEWS.admin('push'), 1200);
    } catch (e) { errLog(e); busy(el, false); toast(String(e.message) === 'forbidden' ? 'אין הרשאה. רק מנהל יכול לשלוח.' : 'השליחה נעצרה באמצע. נסו שוב.'); }
  },
  adminHandled: async el => {
    try { await updateDoc(doc(db, 'reports', el.dataset.id), { handled: true }); VIEWS.admin('reports'); } catch (e) { errLog(e); toast('לא הצליח.'); }
  },
  adminApprove: async el => {
    const a = (S.adminApps || []).find(x => x.id === el.dataset.id); if (!a) return;
    busy(el, true);
    try {
      const nid = await createNursery(a);
      await updateDoc(doc(db, 'nurseryApplications', a.id), { status: 'approved', nurseryId: nid });
      toast(`${a.name} הופעלה 🌿`); VIEWS.admin('nurseries');
    } catch (e) { errLog(e); busy(el, false); toast('האישור לא הצליח.'); }
  },
  adminDecline: async el => {
    try { await updateDoc(doc(db, 'nurseryApplications', el.dataset.id), { status: 'declined' }); VIEWS.admin('nurseries'); } catch (e) { errLog(e); toast('לא הצליח.'); }
  },
  adminAdd: () => sheet(`<h3>הוספת משתלה</h3>
    <p class="label">שם המשתלה</p><input class="field" id="ad-name">
    <p class="label">עיר</p><select class="field" id="ad-city">${CITIES.map(c => `<option>${c.n}</option>`).join('')}</select>
    <p class="label">טלפון</p><input class="field" id="ad-phone" type="tel">
    <p class="label">האימייל של בעל/ת המשתלה (חשבון Google)</p><input class="field" id="ad-email" type="email" dir="ltr">
    <p class="small muted">מי שמתחבר/ת עם האימייל הזה יוכל/תוכל לנהל את המשתלה ולפרסם הצעות.</p>
    <div class="err" id="ad-err"></div>
    <button class="btn hot" data-a="adminSave" style="margin-top:12px">יצירה</button>`),
  adminSave: async el => {
    const v = id => $('#' + id).value.trim();
    if (!v('ad-name') || !v('ad-email').includes('@')) { $('#ad-err').textContent = 'מלאו שם ואימייל תקין.'; return; }
    busy(el, true);
    try { await createNursery({ name: v('ad-name'), city: v('ad-city'), phone: v('ad-phone'), email: v('ad-email') }); closeSheet(); toast('המשתלה נוספה'); VIEWS.admin('nurseries'); }
    catch (e) { errLog(e); busy(el, false); $('#ad-err').textContent = 'היצירה לא הצליחה.'; }
  },

  // פרופיל
  settings: settingsSheet,
  install: async () => {
    if (!deferredInstall) return;
    deferredInstall.prompt();
    const ch = await deferredInstall.userChoice.catch(() => ({}));
    deferredInstall = null; closeSheet();
    if (ch && ch.outcome === 'accepted' && pushCapable() && Notification.permission === 'default') setTimeout(() => enablePush(false), 1200);
  },
  setRadius: el => { $$('#sheet [data-a=setRadius]').forEach(b => b.classList.toggle('on', b === el)); },
  saveSettings: async el => {
    const name = $('#set-name').value.trim();
    if (!name) { $('#set-err').textContent = 'השם לא יכול להיות ריק.'; return; }
    const c = CITIES.find(x => x.n === $('#set-city').value);
    const r = $('#sheet [data-a=setRadius].on');
    const patch = { name };
    if (c && c.n !== S.profile.city) Object.assign(patch, { city: c.n, lat: c.lat, lng: c.lng });
    if (r) patch.radius = +r.dataset.r;
    busy(el, true, 'שומרים…');
    try {
      const b = writeBatch(db);
      b.update(doc(db, 'users', uid()), patch);
      const pp = { ownerName: name };
      if (patch.city) Object.assign(pp, { city: patch.city, lat: patch.lat, lng: patch.lng });
      S.myPlants.forEach(p => b.update(doc(db, 'plants', p.id), pp));
      const info = pubInfo({ ...S.profile, ...patch });
      S.matches.filter(m => !m.blockedBy && m.status !== 'cancelled').slice(0, 300).forEach(m => b.update(doc(db, 'matches', m.id), { [`info.${uid()}`]: info }));
      await b.commit();
      Object.assign(S.profile, patch);
      closeSheet(); VIEWS.profile(); toast('ההגדרות נשמרו');
    } catch (e) { errLog(e); busy(el, false); $('#set-err').textContent = 'השמירה לא הצליחה. נסו שוב.'; }
  },
  deleteAccount: async el => {
    if (!confirm('למחוק את החשבון לצמיתות? הצמחים, רשימת המשאלות וההצעות שלכם יימחקו. אי אפשר לבטל את זה.')) return;
    const lastIn = Date.parse((auth.currentUser.metadata || {}).lastSignInTime || 0) || 0;
    const fresh = Date.now() - lastIn < 4 * 60e3;
    if (!fresh && isMobile) {
      sheet(`<h3>צריך להתחבר מחדש</h3><p class="muted">מטעמי אבטחה, אפשר למחוק חשבון רק מיד אחרי התחברות. התנתקו, התחברו שוב, ואז חזרו לכאן ומחקו.</p><button class="btn hot" data-a="signOut">התנתקות</button><button class="btn ghost" data-a="closeSheet">ביטול</button>`);
      return;
    }
    busy(el, true, 'מוחקים…');
    const me = uid();
    try {
      if (!fresh) await reauthenticateWithPopup(auth.currentUser, new GoogleAuthProvider());
      const ops = [];
      const del = ref => ops.push(b => b.delete(ref));
      S.myPlants.forEach(p => { del(doc(db, 'plants', p.id)); if (p.hasPhoto) del(doc(db, 'photos', p.id)); });
      const q = async (c, f, v) => { try { return (await getDocs(query(collection(db, c), where(f, '==', v)))).docs; } catch (e) { errLog(e); return []; } };
      const [lkFrom, lkTo, rqFrom, rqTo, rvFrom, clFrom, clTo, blk] = await Promise.all([
        q('likes', 'from', me), q('likes', 'to', me), q('requests', 'from', me), q('requests', 'to', me),
        q('reviews', 'from', me), q('calls', 'from', me), q('calls', 'to', me), q('blocks', 'by', me)]);
      [...lkFrom, ...lkTo, ...rqFrom, ...rqTo, ...rvFrom, ...clFrom, ...clTo, ...blk].forEach(d => del(d.ref));
      S.matches.filter(m => !m.blockedBy || m.blockedBy === me).forEach(m => ops.push(b => b.update(doc(db, 'matches', m.id), { [`info.${me}`]: { name: 'משתמש/ת שמחק/ה חשבון', color: '#999999', photo: null, city: '' }, status: m.status === 'swapped' ? 'swapped' : 'cancelled' })));
      del(doc(db, 'users', me, 'private', 'state'));
      del(doc(db, 'users', me));
      unsubAll();
      for (let i = 0; i < ops.length; i += 400) { const b = writeBatch(db); ops.slice(i, i + 400).forEach(f => f(b)); await b.commit(); }
      await deleteUser(auth.currentUser);
      closeSheet(); toast('החשבון נמחק. תודה שהייתם איתנו 🌿');
    } catch (e) {
      errLog(e); busy(el, false);
      if (!['auth/popup-closed-by-user', 'auth/cancelled-popup-request'].includes(e.code)) toast('המחיקה לא הושלמה. נסו שוב.');
    }
  },
  addWish: async () => {
    const c = toCat($('#wish-in').value);
    if (!c) { $('#wish-err').textContent = 'כתבו שם של צמח.'; return; }
    if ((S.profile.wishlist || []).includes(c.id)) { $('#wish-in').value = ''; return; }
    try {
      await updateDoc(doc(db, 'users', uid()), { wishlist: arrayUnion(c.id) });
      S.profile.wishlist = [...(S.profile.wishlist || []), c.id];
      VIEWS.profile();
      const found = S.pool.filter(p => p.catId === c.id && dist(p) <= S.profile.radius).length;
      if (found) toast(`🌿 יש כבר ${found === 1 ? 'מישהו' : found + ' אנשים'} באזור שמציעים ${c.he}!`);
    } catch (e) { errLog(e); $('#wish-err').textContent = 'השמירה לא הצליחה. נסו שוב.'; }
  },
  rmWish: async el => {
    try {
      await updateDoc(doc(db, 'users', uid()), { wishlist: arrayRemove(el.dataset.id) });
      S.profile.wishlist = (S.profile.wishlist || []).filter(w => w !== el.dataset.id);
      VIEWS.profile();
    } catch (e) { errLog(e); toast('לא הצלחנו להסיר. נסו שוב.'); }
  },
  myPlantSheet: el => myPlantSheet(el.dataset.id),
  editPlant: el => {
    const p = S.myPlants.find(x => x.id === el.dataset.id); if (!p) return;
    const k = el.dataset.k, v = el.dataset.v;
    if (p[k] === v) return;
    if (k === 'mode' && v === 'sale' && !(p.price > 0)) { p._wantSale = true; myPlantSheet(p.id); toast('כתבו מחיר, והמודעה תעבור למכירה.'); setTimeout(() => { const i = $('#sheet [data-change=editPrice]'); if (i) i.focus(); }, 300); return; }
    p._wantSale = false;
    const prev = p[k]; p[k] = v;
    $$(`#sheet [data-a=editPlant][data-k=${k}]`).forEach(b => b.classList.toggle('on', b === el));
    if (k === 'mode' && (v === 'sale' || prev === 'sale')) setTimeout(() => myPlantSheet(p.id), 0);
    updateDoc(doc(db, 'plants', p.id), { [k]: v })
      .then(() => toast(k === 'mode' ? (v === 'sale' && !p.price ? 'עודכן ל🏷️ למכירה. כתבו מחיר.' : `עודכן: ${MODE[v].i} ${MODE[v].t}`) : 'עודכן ✓'))
      .catch(e => { errLog(e); p[k] = prev; toast('השמירה לא הצליחה. נסו שוב.'); myPlantSheet(p.id); });
  },
  editQty: el => {
    const p = S.myPlants.find(x => x.id === el.dataset.id); if (!p) return;
    const q = Math.max(1, Math.min(99, (p.qty || 1) + +el.dataset.v)); if (q === p.qty) return;
    p.qty = q; $('#edit-qty').textContent = q;
    clearTimeout(A._qT); A._qT = setTimeout(() => updateDoc(doc(db, 'plants', p.id), { qty: q }).then(() => toast('עודכן ✓')).catch(errLog), 600);
  },
  delPlant: async el => {
    const p = S.myPlants.find(x => x.id === el.dataset.id); if (!p) return;
    if (!confirm(`למחוק את ה${pName(p)}? אי אפשר לבטל את זה.`)) return;
    try {
      const b = writeBatch(db);
      b.delete(doc(db, 'plants', p.id));
      if (p.hasPhoto) b.delete(doc(db, 'photos', p.id));
      await b.commit();
      closeSheet(); toast('הצמח נמחק');
      if (curRoute()[0] === 'plant') go('profile');
    } catch (e) { errLog(e); toast('המחיקה לא הצליחה. נסו שוב.'); }
  }
};

// ---------- מאזיני אירועים ----------
document.addEventListener('click', e => {
  const el = e.target.closest('[data-a]'); if (!el || el.disabled) return;
  const fn = A[el.dataset.a]; if (!fn) return;
  e.preventDefault(); fn(el, e);
});
document.addEventListener('change', async e => {
  const el = e.target, k = el.dataset && el.dataset.change; if (!k) return;
  if (k === 'photo' && el.files[0]) {
    try {
      keepName();
      draft.img = await compress(el.files[0], 760, .72);
      draft.step = 'photo'; VIEWS.add();
    } catch (err) { toast('לא הצלחנו לקרוא את התמונה. נסו תמונה אחרת.'); }
  }
  if (k === 'plantName') { const c = toCat(el.value); draft.catId = c ? c.id : null; const e2 = $('#add-err'); if (e2) e2.textContent = ''; }
  if (k === 'editName') {
    const pl = S.myPlants.find(x => x.id === el.dataset.id); const c = toCat(el.value);
    if (!pl || !c || c.id === pl.catId) return;
    const prev = pl.catId; pl.catId = c.id;
    updateDoc(doc(db, 'plants', pl.id), { catId: c.id }).then(() => toast('השם עודכן ✓')).catch(e2 => { errLog(e2); pl.catId = prev; toast('השמירה לא הצליחה.'); });
  }
  if (k === 'open') draft.open = el.checked;
  if (k === 'chatImg' && el.files[0]) { try { sendMsg(el.dataset.id, '', await compress(el.files[0], 680, .7)); } catch (err) { toast('לא הצלחנו לשלוח את התמונה.'); } }
  if (k === 'avail') updateDoc(doc(db, 'plants', el.dataset.id), { available: el.checked }).catch(e2 => { errLog(e2); toast('העדכון לא הצליח.'); });
  if (k === 'popen') updateDoc(doc(db, 'plants', el.dataset.id), { open: el.checked }).catch(errLog);
  if (k === 'pfrozen') setFrozen(el.dataset.id, el.checked);
  if (k === 'pushToggle') {
    el.disabled = true;
    if (el.checked) { const ok = await enablePush(false); if (!ok) { el.checked = false; el.disabled = false; } }
    else { await disablePush(); toast('🔕 ההתראות כובו. אפשר להפעיל שוב בכל רגע.'); settingsSheet(); }
  }
  if (k === 'bcCity') { BC.city = el.value; bcPreview(); }
  if (k === 'editPrice') {
    const pl = S.myPlants.find(x => x.id === el.dataset.id); const v = Math.round(+el.value || 0);
    if (pl && v > 0 && (v !== pl.price || pl._wantSale)) {
      const patch = pl._wantSale ? { price: v, mode: 'sale' } : { price: v };
      Object.assign(pl, patch); pl._wantSale = false;
      updateDoc(doc(db, 'plants', pl.id), patch).then(() => { toast(patch.mode ? `עבר למכירה: ₪${v} 🏷️` : `המחיר עודכן: ₪${v}`); if (patch.mode) myPlantSheet(pl.id); }).catch(errLog);
    }
  }
  if (k === 'liveLoc') {
    if (el.checked) { lsSet('ll_live', '1'); locate(true); }
    else { lsSet('ll_live', '0'); S.here = null; }
    setTimeout(() => filtersSheet(true), el.checked ? 1500 : 0);
  }
  if (k === 'promoActive') updateDoc(doc(db, 'promos', el.dataset.id), { active: el.checked }).then(() => toast(el.checked ? 'ההצעה פעילה' : 'ההצעה הוסתרה')).catch(e2 => { errLog(e2); toast('העדכון לא הצליח.'); });
  if (k === 'nurseryActive') updateDoc(doc(db, 'nurseries', el.dataset.id), { active: el.checked }).then(() => toast(el.checked ? 'המשתלה הופעלה' : 'המשתלה הושהתה')).catch(e2 => { errLog(e2); toast('העדכון לא הצליח.'); });
  if (k === 'promoPhoto' && el.files[0]) { try { keepPromo(); pd.img = await compress(el.files[0], 760, .72); VIEWS.promonew(); } catch (err) { toast('לא הצלחנו לקרוא את התמונה.'); } }
  if (k === 'nurseryImg' && el.files[0]) { try { S.myNursery._img = await compress(el.files[0], 760, .72); toast('התמונה נקלטה. לחצו שמירה.'); } catch (err) { toast('לא הצלחנו לקרוא את התמונה.'); } }
});
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.target.dataset && e.target.dataset.enter === 'send') { e.preventDefault(); A.send(e.target); }
  if (e.key === 'Escape') { closeSheet(); $('#overlay').classList.remove('open'); }
  if (S.booted && curRoute()[0] === 'swipe') {
    if (document.activeElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;
    if (sheetOpen() || $('#overlay').classList.contains('open')) return;
    if (e.key === 'ArrowRight') decide('like');
    if (e.key === 'ArrowLeft') decide('pass');
    if (e.key === 'ArrowUp') decide('super');
  }
});
document.addEventListener('input', e => {
  if (e.target.id === 'sq') { SQ.q = e.target.value; clearTimeout(SQ.t); SQ.t = setTimeout(renderResults, 120); return; }
  if (e.target.id === 'bc-title' || e.target.id === 'bc-body') { BC[e.target.id === 'bc-title' ? 'title' : 'body'] = e.target.value; $$('.tpl').forEach(b => b.classList.remove('on')); bcPreview(); return; }
  const er = e.target.closest('.pad, .ob, #sheet, #view'); if (er) $$('.err', er).forEach(x => { x.textContent = ''; });
  const t = e.target;
  if (t.dataset && t.dataset.suggest) {
    const box = $('#' + t.id + '-sugg'); if (!box) return;
    const q = t.value.trim().toLowerCase();
    const res = q ? CATALOG.filter(c => c.he.toLowerCase().includes(q) || c.sci.toLowerCase().includes(q)).slice(0, 6) : [];
    const typed = cleanName(t.value), exact = catByName(typed);
    box.innerHTML = res.map(c => `<button type="button" data-a="pickSugg" data-for="${t.id}" data-v="${esc(c.he)}"><b>${esc(c.he)}</b><span>${esc(c.sci)}</span></button>`).join('')
      + (typed && !exact && (t.dataset.suggest !== 'name' || res.length) ? `<button type="button" class="typed" data-a="pickSugg" data-for="${t.id}" data-v="${esc(typed)}"><b>✓ להשתמש ב"${esc(typed)}"</b><span></span></button>` : '');
  }
});
document.addEventListener('keydown', e => {
  const t = e.target;
  if (e.key === 'Enter' && t.dataset && t.dataset.suggest) {
    e.preventDefault();
    const box = $('#' + t.id + '-sugg'); if (box) box.innerHTML = '';
    if (t.dataset.suggest === 'want') A.addWant();
    else if (t.dataset.suggest === 'wish') A.addWish();
    else { t.dispatchEvent(new Event('change', { bubbles: true })); t.blur(); if (t.id === 'plant-name') addGo(1); }
  }
});
window.addEventListener('hashchange', route);
document.addEventListener('error', e => { const t = e.target; if (t && t.classList && t.classList.contains('av-img')) t.remove(); }, true);
window.addEventListener('online', () => toast('חזרתם לאינטרנט 🌿'));
window.addEventListener('offline', () => toast('אין חיבור לאינטרנט. השינויים יישמרו כשתתחברו.'));

// ---------- הפעלה ----------
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(errLog);
if (!cfgOk) route();
else {
  route();
  getRedirectResult(auth).catch(e => {
    errLog(e);
    if (e.code === 'auth/unauthorized-domain') toast('הכתובת של האתר עוד לא אושרה ב-Firebase (README, שלב 3).');
    else if (e.code !== 'auth/no-auth-event') toast('ההתחברות לא הושלמה. נסו שוב.');
  }).finally(() => { try { sessionStorage.removeItem('ll_redirect'); } catch (e) { } });
  onAuthStateChanged(auth, async user => {
    unsubAll();
    S.authKnown = true; S.me = user; S.booted = false; S.profile = null;
    if (!user) { S.matches = []; S.myPlants = []; S.pool = []; S.incoming = []; S.outgoing = []; route(); return; }
    renderLoading();
    try {
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (!snap.exists()) { ob = null; route(); return; }
      S.profile = { id: user.uid, ...snap.data() };
      if (S.profile.banned && !isAdmin()) {
        $('#tabbar').style.display = 'none';
        markBooted();
        $('#view').innerHTML = `<div class="empty" style="padding-top:25vh"><h3>החשבון הושעה</h3><p>החשבון הושעה בעקבות דיווח. אם נראה לכם שזו טעות, כתבו ל-<a href="mailto:${ADMIN_EMAILS[0]}">${ADMIN_EMAILS[0]}</a>.</p><button class="btn ghost sm" data-a="signOut" style="margin:12px auto 0">התנתקות</button></div>`;
        return;
      }
      await startSession();
      route();
    } catch (e) {
      errLog(e);
      markBooted(); window.__llReport && window.__llReport('server');
      $('#view').innerHTML = `<div class="empty" style="padding-top:30vh"><h3>לא הצלחנו להתחבר לשרת</h3><p>בדקו את החיבור לאינטרנט ונסו שוב.</p><button class="btn hot sm" data-a="reload" style="margin:auto">ניסיון חוזר</button></div>`;
    }
  });
}
