// ===== LeafLoop – לוגיקת האפליקציה =====
import {
  initializeApp, getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult,
  onAuthStateChanged, signOut, deleteUser, reauthenticateWithPopup,
  getFirestore, doc, getDoc, setDoc, updateDoc, addDoc, collection, query, where,
  getDocs, onSnapshot, orderBy, limit, increment, arrayUnion, arrayRemove, writeBatch
} from './fb.js';
import { FIREBASE_CONFIG } from './firebase-config.js';

const APP_NAME = 'LeafLoop';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const errLog = e => console.error('[LeafLoop]', e);

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
  download: 'M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M7 11l5 5 5-5M12 4v12'
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
const TYPE_LABEL = { perfect: 'התאמה מושלמת', wishlist: 'מהרשימה שלך', good: 'התאמה אפשרית', nearby: 'קרוב אליך' };

// ---------- Firebase ----------
const cfgOk = !!(FIREBASE_CONFIG && FIREBASE_CONFIG.apiKey && !/PASTE/.test(FIREBASE_CONFIG.apiKey));
let auth = null, db = null;
if (cfgOk) {
  const app = initializeApp(FIREBASE_CONFIG);
  auth = getAuth(app);
  db = getFirestore(app);
}

// ---------- מצב ----------
const S = {
  me: null, profile: null, booted: false,
  priv: { swipes: {}, saved: [], blocked: [], alertsSeenAt: 0 },
  myPlants: [], pool: [], poolAt: 0, users: {}, photos: {},
  matches: [], incoming: [], outgoing: [], msgs: [], reviews: []
};
let filters = (() => { try { return { cat: 'all', offer: 'all', delivery: 'all', ...JSON.parse(localStorage.getItem('ll_filters') || '{}') }; } catch (e) { return { cat: 'all', offer: 'all', delivery: 'all' }; } })();
const saveFilters = () => { try { localStorage.setItem('ll_filters', JSON.stringify(filters)); } catch (e) { } };
const uid = () => S.me && S.me.uid;
let privT;
function savePriv() {
  clearTimeout(privT);
  privT = setTimeout(() => setDoc(doc(db, 'users', uid(), 'private', 'state'), S.priv).catch(errLog), 500);
}

// ---------- עזרים ----------
const catById = id => CATALOG.find(c => c.id === id) || { id, he: id || 'צמח', sci: '', cat: 'house', art: 'leafy' };
const pName = p => (p ? catById(p.catId).he : '');
const catByName = n => { const q = String(n || '').trim().toLowerCase(); return CATALOG.find(c => c.he.toLowerCase() === q || c.sci.toLowerCase() === q); };
function km(a, b) {
  if (!a || !b || a.lat == null || b.lat == null) return 9999;
  const R = 6371, t = x => x * Math.PI / 180;
  const dLat = t(b.lat - a.lat), dLng = t(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(t(a.lat)) * Math.cos(t(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
const dist = o => km(S.profile, o);
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
const rating = u => (u && u.ratingCount ? `★${Number(u.ratingAvg).toFixed(1)}` : 'חדש/ה');
const otherId = m => m.users.find(x => x !== uid());
const otherInfo = m => (m.info && m.info[otherId(m)]) || { name: 'משתמש/ת', color: '#19A55B' };

function visual(p) {
  if (!p) return '';
  const key = p.id || p.catId;
  const src = S.photos[key] || p.thumb;
  if (src) return `<div class="photo"><img data-pid="${esc(key)}" src="${src}" alt="${esc(pName(p))}"></div>`;
  return `<div class="art" style="background:${colorFor(key)}">${plantArt(catById(p.catId).art, key)}</div>`;
}
function avatar(u, cls = 'av') {
  if (u && u.photo) return `<div class="${cls} has-img" style="background:${u.color || '#19A55B'}"><img src="${esc(u.photo)}" alt="" referrerpolicy="no-referrer" onerror="this.remove()"></div>`;
  return `<div class="${cls}" style="background:${(u && u.color) || '#19A55B'}">${esc(initials(u && u.name))}</div>`;
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
const myAvail = () => S.myPlants.filter(p => p.available);
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
  s += (u.ratingCount ? (u.ratingAvg - 4) * 10 : 0) + Math.min(u.swaps || 0, 30) / 3;
  s -= dist(p) * 1.2;
  s += Math.max(0, 10 - (Date.now() - (p.t || 0)) / 864e5); // צמחים חדשים קצת למעלה
  return s;
}
const inActiveMatch = pid => S.matches.some(m => m.status !== 'cancelled' && m.plants && m.plants[pid]);
function feed() {
  const f = filters;
  return S.pool.filter(p =>
    !S.priv.swipes[p.id] && !inActiveMatch(p.id) && !isBlocked(p.ownerId) &&
    dist(p) <= S.profile.radius &&
    (f.cat === 'all' || catById(p.catId).cat === f.cat) &&
    (f.offer === 'all' || p.offer === f.offer) &&
    (f.delivery === 'all' || p.delivery === f.delivery || p.delivery === 'both')
  ).sort((a, b) => score(b) - score(a));
}

// ---------- הודעות קופצות ומסך תחתון ----------
let toastT;
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 3400);
}
function sheet(html) {
  $('#sheet').innerHTML = html;
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
    out.push({ t: r.t, text: `🌿 ${r.fromInfo.name} רוצה להציע לך ${catById(first && first.catId).he} בתמורה ל${catById(r.targetSnap.catId).he} שלך.`, link: 'matches', unread: true });
  });
  S.matches.forEach(m => {
    const n = (m.unread || {})[uid()] || 0;
    if (n && !isBlocked(otherId(m))) out.push({ t: m.lastAt, text: `💬 ${n === 1 ? 'הודעה חדשה' : n + ' הודעות חדשות'} מ${otherInfo(m).name}`, link: 'chat/' + m.id, unread: true });
  });
  S.pool.filter(p => iWant(p) && dist(p) <= S.profile.radius && !isBlocked(p.ownerId)).forEach(p => {
    out.push({ t: p.t, text: `🌿 הצמח שלך כאן! ${p.ownerName} מציע/ה ${pName(p)}, ${fmtKm(dist(p))} ממך.`, link: 'plant/' + p.id, unread: (p.t || 0) > (S.priv.alertsSeenAt || 0) });
  });
  return out.sort((a, b) => (b.t || 0) - (a.t || 0)).slice(0, 40);
}
const unreadMsgs = () => S.matches.reduce((s, m) => s + (isBlocked(otherId(m)) ? 0 : ((m.unread || {})[uid()] || 0)), 0);

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
  let full = true;
  if (!cfgOk) renderSetup();
  else if (S.me === null && !S.authKnown) renderLoading();
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
  const T = [['discover', 'cards', 'גילוי'], ['map', 'map', 'מפה'], ['add', 'plus', 'הוספה'], ['matches', 'heart', 'התאמות'], ['profile', 'user', 'פרופיל']];
  $('#tabbar').innerHTML = T.map(([k, i, l]) => k === 'add'
    ? `<a href="#add" aria-label="הוספת צמח" class="${active === k ? 'on' : ''}"><span class="add">${ic('plus', 28)}</span></a>`
    : `<a href="#${k}" class="${active === k || (active === 'plant' && k === 'discover') ? 'on' : ''}">${ic(i, 24)}${l}${k === 'matches' && n ? `<span class="dot">${n}</span>` : ''}</a>`).join('');
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
function renderSetup() {
  $('#view').innerHTML = `<div class="ob"><div class="ob-hero"><div class="wordmark">Leaf<span>Loop</span></div><p>כמעט מוכן!</p></div>
  <h2>צריך לחבר את Firebase</h2>
  <p class="muted">האפליקציה עובדת, אבל עוד לא מחוברת למסד הנתונים. פתחו את הקובץ <b>firebase-config.js</b> והדביקו בו את הפרטים מ-Firebase. ההוראות המלאות נמצאות בקובץ README.</p></div>`;
}
function renderLoading() {
  $('#view').innerHTML = `<div class="loading"><div class="wordmark">Leaf<span>Loop</span></div><span class="spin big"></span></div>`;
}
function renderLanding() {
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
    radius: ob.radius, wishlist: ob.wish, swaps: 0, rehomed: 0, ratingAvg: 0, ratingCount: 0,
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
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  busy(el, true, 'מתחברים…');
  try { await signInWithPopup(auth, provider); }
  catch (e) {
    busy(el, false);
    if (['auth/popup-blocked', 'auth/operation-not-supported-in-this-environment'].includes(e.code)) return signInWithRedirect(auth, provider);
    if (['auth/popup-closed-by-user', 'auth/cancelled-popup-request'].includes(e.code)) return;
    if (e.code === 'auth/unauthorized-domain') return toast('הכתובת של האתר עוד לא אושרה ב-Firebase (README, שלב 3).');
    errLog(e); toast('ההתחברות לא הצליחה. נסו שוב.');
  }
}
let subs = [];
function unsubAll() { subs.forEach(f => { try { f(); } catch (e) { } }); subs = []; if (chatUnsub) { chatUnsub(); chatUnsub = null; } }
async function startSession() {
  try {
    const ps = await getDoc(doc(db, 'users', uid(), 'private', 'state'));
    if (ps.exists()) S.priv = { swipes: {}, saved: [], blocked: [], alertsSeenAt: 0, ...ps.data() };
  } catch (e) { errLog(e); }
  listen();
  try { await loadPool(true); } catch (e) { errLog(e); toast('לא הצלחנו לטעון צמחים. בדקו את החיבור לאינטרנט.'); }
  S.booted = true;
  updateDoc(doc(db, 'users', uid()), { lastSeen: Date.now() }).catch(errLog);
}
async function loadPool(force) {
  if (!force && Date.now() - S.poolAt < 90000) return;
  const s = await getDocs(query(collection(db, 'plants'), where('available', '==', true), limit(400)));
  S.pool = s.docs.map(d => ({ id: d.id, ...d.data() })).filter(p => p.ownerId !== uid());
  const ids = [...new Set(S.pool.map(p => p.ownerId))];
  ids.forEach(id => { delete S.users[id]; });
  await Promise.all(ids.map(getUser));
  S.poolAt = Date.now();
}
function listen() {
  const me = uid();
  subs.push(onSnapshot(query(collection(db, 'plants'), where('ownerId', '==', me)), s => {
    S.myPlants = s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (b.t || 0) - (a.t || 0));
    live(['profile']);
  }, errLog));

  let first = true; const seen = {};
  subs.push(onSnapshot(query(collection(db, 'matches'), where('users', 'array-contains', me)), s => {
    const list = s.docs.map(d => ({ id: d.id, ...d.data() }));
    list.forEach(m => {
      const prev = seen[m.id];
      const viewing = location.hash === '#chat/' + m.id;
      if (!first && !isBlocked(otherId(m))) {
        if (prev === undefined && m.createdBy !== me) toast(`🌱 התאמה חדשה עם ${otherInfo(m).name}!`);
        else if (prev !== undefined && (m.lastAt || 0) > prev && m.lastFrom && m.lastFrom !== me && !viewing) toast(`💬 ${otherInfo(m).name}: ${m.lastMsg || ''}`);
      }
      seen[m.id] = m.lastAt || 0;
      if (m.status === 'swapped') ((m.give || {})[me] || []).forEach(pid => {
        const x = S.myPlants.find(p => p.id === pid);
        if (x && x.available) updateDoc(doc(db, 'plants', pid), { available: false }).catch(errLog);
      });
    });
    first = false;
    S.matches = list.sort((a, b) => (b.lastAt || 0) - (a.lastAt || 0));
    syncStats();
    live(['matches', 'profile']);
    if (curRoute()[0] === 'chat') updateChatMeta();
    refreshBadges();
  }, errLog));

  let firstIn = true;
  subs.push(onSnapshot(query(collection(db, 'requests'), where('to', '==', me)), s => {
    const prevIds = S.incoming.map(r => r.id);
    S.incoming = s.docs.map(d => ({ id: d.id, ...d.data() })).filter(r => r.status === 'pending' && !isBlocked(r.from)).sort((a, b) => b.t - a.t);
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
function syncStats() {
  const me = uid();
  const done = S.matches.filter(m => m.status === 'swapped');
  const swaps = done.length;
  const rehomed = done.reduce((s, m) => s + (((m.give || {})[me] || []).length), 0);
  if (S.profile && (S.profile.swaps !== swaps || S.profile.rehomed !== rehomed)) {
    S.profile.swaps = swaps; S.profile.rehomed = rehomed;
    updateDoc(doc(db, 'users', me), { swaps, rehomed }).catch(errLog);
  }
}

// =====================================================
// גילוי (Swipe)
// =====================================================
let lastSwipe = null;
VIEWS.discover = function () {
  const nearWish = S.pool.filter(p => iWant(p) && dist(p) <= S.profile.radius && !isBlocked(p.ownerId)).sort((a, b) => dist(a) - dist(b));
  const people = [...new Set(S.pool.filter(p => dist(p) <= S.profile.radius && !isBlocked(p.ownerId)).map(p => p.ownerId))].map(id => S.users[id]).filter(Boolean).sort((a, b) => dist(a) - dist(b)).slice(0, 20);
  const n = notifList().filter(x => x.unread).length;
  $('#view').innerHTML = `
  <header class="hero">
    <div class="row sb"><h1>${greeting()},<br>${esc(S.profile.name)}</h1>
    <button class="icon-btn" data-a="notifs" aria-label="התראות">${ic('bell', 24)}<span class="dot" id="bell-dot" style="${n ? '' : 'display:none'}">${n}</span></button></div>
    <button class="loc" data-a="filters">${ic('pin', 18)} ${esc(S.profile.city)}, ${radiusLabel(S.profile.radius)}</button>
  </header>
  <div class="deck-wrap">
    <div class="deck-meta"><span id="deck-count"></span>
      <span class="row" style="gap:14px"><button data-a="refresh" class="row" style="color:#fff;gap:4px" aria-label="רענון">${ic('refresh', 18)}</button><button data-a="filters" class="row" style="color:#fff;gap:4px">${ic('filter', 18)} סינון</button></span></div>
    <section class="deck" id="deck" aria-label="כרטיסי צמחים"></section>
    <div class="actions" id="deck-actions">
      <button class="act undo" data-a="undo" aria-label="ביטול ההחלקה האחרונה" ${lastSwipe ? '' : 'disabled'}>${ic('undo', 20)}</button>
      <button class="act pass" data-a="decide" data-d="pass" aria-label="לא בשבילי">${ic('x', 30)}</button>
      <button class="act like" data-a="decide" data-d="like" aria-label="מעוניין">${ic('heart', 34)}</button>
      <button class="act super" data-a="decide" data-d="super" aria-label="סופר מעוניין">${ic('star', 28)}</button>
      <button class="act save" data-a="decide" data-d="save" aria-label="שמירה לאחר כך">${ic('bookmark', 20)}</button>
    </div>
  </div>
  ${nearWish.length ? `<h2 class="section-t">מרשימת המשאלות שלך</h2><div class="strip">${nearWish.map(miniCard).join('')}</div>` : ''}
  ${people.length ? `<h2 class="section-t">אנשים לידך</h2><div class="strip">${people.map(u => `<div class="person">${avatar(u)}${esc(u.name)}<div class="small muted">${fmtKm(dist(u))}</div></div>`).join('')}</div>` : ''}
  <div style="height:20px"></div>`;
  renderDeck();
  hydrate(nearWish.slice(0, 8));
};
function miniCard(p) {
  return `<button class="mini" data-a="open" data-to="plant/${p.id}"><div class="mv">${visual(p)}</div><div class="mt">${esc(pName(p))}<div class="ms">${esc(p.ownerName)}, ${fmtKm(dist(p))}</div></div></button>`;
}
function wantsChips(u, open) {
  const mineCats = myAvail().map(p => p.catId);
  const w = u.wishlist || [];
  return w.map(c => `<span class="chip ${mineCats.includes(c) ? 'have' : 'want'}">${mineCats.includes(c) ? ic('check', 14) : ''}${esc(catById(c).he)}</span>`).join('') +
    (open ? '<span class="chip open">פתוח/ה להצעות</span>' : '') + (!w.length && !open ? '<span class="chip">אפשר להציע</span>' : '');
}
function cardHTML(p, i) {
  const t = matchType(p), u = owner(p);
  return `<article class="card" data-id="${p.id}" style="z-index:${10 - i};--i:${i}">
    <div class="card-visual">${visual(p)}<span class="badge b-${t}">${TYPE_LABEL[t]}</span>
      <span class="stamp s-like">מעוניין</span><span class="stamp s-pass">לא בשבילי</span><span class="stamp s-super">סופר!</span></div>
    <div class="card-info">
      <div class="row sb"><h2>${esc(pName(p))}</h2><button class="icon-btn" data-a="open" data-to="plant/${p.id}" aria-label="פרטים נוספים">${ic('eye')}</button></div>
      <p class="sci">${esc(catById(p.catId).sci)}</p>
      <div class="chips"><span class="chip">${OFFER[p.offer]}${p.qty > 1 ? ' ×' + p.qty : ''}</span><span class="chip">${ic('pin', 14)}${fmtKm(dist(p))}</span><span class="chip">${esc(u.name)} ${rating(u)}</span></div>
      <p class="wants-l">רוצה בתמורה</p><div class="chips">${wantsChips(u, p.open)}</div>
    </div></article>`;
}
function renderDeck() {
  const deck = $('#deck'); if (!deck) return;
  const list = feed();
  $('#deck-count').textContent = list.length ? `${list.length} צמחים באזור` : '';
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
  hydrate(top);
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
  const p = S.pool.find(x => x.id === card.dataset.id); if (!p) return;
  const out = { like: 'translate(130%,-4%) rotate(22deg)', pass: 'translate(-130%,-4%) rotate(-22deg)', super: 'translate(0,-130%)', save: 'translate(0,40%) scale(.6)' }[a];
  card.classList.add('leaving'); card.style.transform = out;
  if (navigator.vibrate) navigator.vibrate(12);
  S.priv.swipes[p.id] = a;
  if (a === 'save' && !S.priv.saved.includes(p.id)) { S.priv.saved.push(p.id); toast('נשמר. תמצאו אותו בפרופיל, תחת "שמורים".'); }
  lastSwipe = (a === 'pass' || a === 'save') ? { id: p.id, a } : null;
  savePriv();
  setTimeout(() => { renderDeck(); if (a === 'like' || a === 'super') afterLike(p, a === 'super'); }, 260);
}
async function afterLike(p, sup) {
  const me = uid();
  const u = await getUser(p.ownerId);
  setDoc(doc(db, 'likes', me + '_' + p.id), { from: me, to: p.ownerId, plantId: p.id, super: !!sup, t: Date.now() }).catch(errLog);
  let mine = theyWantMine(u).map(x => x.id);
  let mutual = false;
  try {
    const q = await getDocs(query(collection(db, 'likes'), where('from', '==', p.ownerId), where('to', '==', me)));
    const liked = q.docs.map(d => d.data().plantId).filter(id => myAvail().some(x => x.id === id));
    if (liked.length) { mutual = true; mine = [liked[0]]; }
  } catch (e) { errLog(e); }
  if ((mine.length && iWant(p)) || mutual) {
    try {
      const m = await createMatch({ other: u, mineIds: [mine[0]], theirIds: [p.id], theirPlants: [p], type: 'perfect' });
      showMatch(m);
    } catch (e) { errLog(e); toast('לא הצלחנו ליצור את ההתאמה. נסו שוב.'); }
  } else openRequestSheet(p, u, sup);
}

// ---------- הצעת החלפה ----------
function openRequestSheet(p, u, sup) {
  if (S.outgoing.some(r => r.target === p.id && r.status === 'pending')) { toast(`כבר שלחתם הצעה על הצמח הזה. מחכים לתשובה מ${u.name}.`); return; }
  if (!myAvail().length) {
    sheet(`<h3>עוד אין לך צמחים להציע</h3><p class="muted">כדי לשלוח הצעת החלפה ל${esc(u.name)}, הוסיפו קודם צמח אחד לפחות.</p><button class="btn hot" data-a="open" data-to="add">הוספת צמח</button><button class="btn ghost" data-a="closeSheet">לא עכשיו</button>`);
    return;
  }
  const wanted = theyWantMine(u).map(x => x.id);
  const wl = (u.wishlist || []).map(w => esc(catById(w).he)).join(', ');
  sheet(`<h3>${sup ? 'סופר מעוניין! ⭐' : 'שמרנו שאתם מעוניינים'}</h3>
  <p class="muted">אין כאן התאמה אוטומטית, אבל אפשר לשלוח ל${esc(u.name)} הצעת החלפה.${wl ? ` ברשימת המשאלות: ${wl}.` : ''}${p.open ? ' פתוח/ה גם להצעות אחרות.' : ''}</p>
  <p class="label">מה להציע בתמורה ל${esc(pName(p))}?</p>
  <div class="pick">${myAvail().map(x => `<label class="pick-item"><input type="checkbox" name="offer" value="${x.id}" ${wanted.includes(x.id) ? 'checked' : ''}><span class="thumb">${visual(x)}</span><span>${esc(pName(x))} <span class="small muted">(${OFFER[x.offer]}${x.qty > 1 ? ' ×' + x.qty : ''})</span>${wanted.includes(x.id) ? `<em>${esc(u.name)} מחפש/ת את זה</em>` : ''}</span></label>`).join('')}</div>
  <div class="err" id="req-err"></div>
  <button class="btn hot" data-a="sendRequest" data-id="${p.id}">${ic('swap')} שליחת הצעת החלפה</button>
  <button class="btn ghost" data-a="closeSheet">לא עכשיו</button>`);
}
async function sendRequest(el) {
  const p = S.pool.find(x => x.id === el.dataset.id); if (!p) return;
  const u = await getUser(p.ownerId);
  const ids = $$('#sheet input[name=offer]:checked').map(i => i.value);
  if (!ids.length) { $('#req-err').textContent = 'בחרו לפחות צמח אחד להציע.'; return; }
  const snap = {};
  ids.forEach(id => { const x = S.myPlants.find(y => y.id === id); if (x) snap[id] = { catId: x.catId, thumb: x.thumb || null, offer: x.offer, qty: x.qty || 1 }; });
  busy(el, true, 'שולחים…');
  try {
    await addDoc(collection(db, 'requests'), {
      from: uid(), to: p.ownerId, fromInfo: pubInfo(S.profile), toInfo: pubInfo(u),
      target: p.id, targetSnap: { catId: p.catId, thumb: p.thumb || null, offer: p.offer, qty: p.qty || 1 },
      offer: ids, offerSnap: snap, status: 'pending', seen: false, t: Date.now()
    });
    closeSheet(); toast(`ההצעה נשלחה ל${u.name}. נעדכן אתכם כשתגיע תשובה.`);
  } catch (e) { errLog(e); busy(el, false); $('#req-err').textContent = 'השליחה לא הצליחה. נסו שוב.'; }
}
async function acceptReq(rid, toChat, el) {
  const r = S.incoming.find(x => x.id === rid); if (!r) return;
  const target = S.myPlants.find(p => p.id === r.target);
  if (!target || !target.available) {
    toast('הצמח הזה כבר לא זמין אצלך, אז ההצעה נדחתה.');
    return updateDoc(doc(db, 'requests', rid), { status: 'declined' }).catch(errLog);
  }
  busy(el, true);
  try {
    const u = await getUser(r.from);
    const theirPlants = r.offer.map(id => ({ id, ...(r.offerSnap[id] || {}) }));
    const m = await createMatch({ other: u, mineIds: [r.target], theirIds: r.offer, theirPlants, type: 'request', status: toChat ? 'discussing' : 'agreed' });
    await updateDoc(doc(db, 'requests', rid), { status: 'accepted', matchId: m.id });
    if (toChat) go('chat/' + m.id); else showMatch(m);
  } catch (e) { errLog(e); busy(el, false); toast('לא הצלחנו לאשר. נסו שוב.'); }
}

// ---------- יצירת התאמה ----------
async function createMatch(o) {
  const me = uid(), u = o.other;
  const id = [me, u.id].sort().join('_') + '_' + [...o.mineIds, ...o.theirIds].sort().join('_');
  const ref = doc(db, 'matches', id);
  const ex = await getDoc(ref);
  if (ex.exists() && ex.data().status !== 'cancelled') return { id, ...ex.data() };
  const snap = {};
  o.mineIds.forEach(pid => { const x = S.myPlants.find(p => p.id === pid); if (x) snap[pid] = { catId: x.catId, thumb: x.thumb || null, offer: x.offer, qty: x.qty || 1, owner: me }; });
  o.theirIds.forEach(pid => { const x = o.theirPlants.find(p => p.id === pid); if (x) snap[pid] = { catId: x.catId, thumb: x.thumb || null, offer: x.offer || 'full', qty: x.qty || 1, owner: u.id }; });
  const now = Date.now();
  const data = {
    users: [me, u.id], info: { [me]: pubInfo(S.profile), [u.id]: pubInfo(u) },
    give: { [me]: o.mineIds, [u.id]: o.theirIds }, plants: snap, type: o.type, status: o.status || 'discussing',
    createdBy: me, createdAt: now, lastAt: now, lastMsg: 'התאמה חדשה!', lastFrom: me,
    unread: { [me]: 0, [u.id]: 1 }, meeting: null, rated: []
  };
  await setDoc(ref, data);
  await addDoc(collection(db, 'matches', id, 'messages'), { from: me, sys: true, text: '🌿 יש התאמה! מומלץ לתאם מפגש במקום ציבורי.', t: now });
  return { id, ...data };
}
const snapOf = (m, pid) => ({ id: pid, ...((m.plants || {})[pid] || {}) });
function showMatch(m) {
  const me = uid(), o = otherId(m);
  const mp = snapOf(m, (m.give[me] || [])[0]), tp = snapOf(m, (m.give[o] || [])[0]);
  $('#overlay').innerHTML = `<div class="match" role="dialog" aria-label="יש התאמה">
    <div class="burst">${burstLeaves(18)}</div>
    <div class="pair"><div class="bubble from-r">${visual(mp)}</div><div class="heart">${ic('heart', 28)}</div><div class="bubble from-l">${visual(tp)}</div></div>
    <h1>יש התאמה!</h1>
    <p>הצמחים שלכם מצאו אחד את השני.</p>
    <div class="swapline">ה${esc(pName(mp))} שלך ⇄ ה${esc(pName(tp))} של ${esc(otherInfo(m).name)}</div>
    <div class="btns"><button class="btn sun" data-a="matchChat" data-id="${m.id}">${ic('chat')} בואו נתחיל להחליף</button><button class="btn light" data-a="closeOverlay">אחר כך</button></div>
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
    <div class="facts"><div class="fact"><b>${OFFER[p.offer]}</b><span>מה מוצע</span></div><div class="fact"><b>${COND[p.condition] || ''}</b><span>מצב</span></div><div class="fact"><b>${p.qty || 1}</b><span>כמות</span></div></div>
    <div class="owner">${avatar(u)}<div style="flex:1"><b>${esc(u.name)}</b><div class="small muted">${esc(u.city || p.city || '')}${mine ? '' : ', ' + fmtKm(dist(p)) + ' ממך'}</div></div><div style="text-align:center"><b style="font-family:var(--font-d)">${rating(u)}</b><div class="small muted">${u.swaps || 0} החלפות</div></div></div>
    ${mine ? '' : `<p class="label">${esc(u.name)} רוצה בתמורה</p><div class="chips">${wantsChips(u, p.open)}</div>`}
    <p class="label">מסירה</p><div class="chips"><span class="chip">${DELIV[p.delivery] || ''}</span><span class="chip">${ic('shield', 14)} מפגש במקום ציבורי</span></div>
    <div style="margin-top:22px">
    ${mine ? `<button class="btn ghost" data-a="myPlantSheet" data-id="${p.id}">ניהול הצמח</button>`
      : m ? `<button class="btn primary" data-a="open" data-to="chat/${m.id}">${ic('chat')} מעבר לצ'אט</button>`
        : `<button class="btn hot" data-a="likeDetail" data-id="${p.id}">${ic('heart')} מעוניין</button>
           <button class="btn ghost" data-a="toggleSave" data-id="${p.id}">${ic('bookmark')} ${saved ? 'הסרה מהשמורים' : 'שמירה לאחר כך'}</button>`}
    </div>
  </div>`;
  hydrate([p]);
};

// =====================================================
// מפה
// =====================================================
VIEWS.map = function () {
  const near = S.pool.filter(p => dist(p) <= S.profile.radius && !isBlocked(p.ownerId)).sort((a, b) => dist(a) - dist(b));
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
  mapObj = L.map('map').setView([S.profile.lat, S.profile.lng], zoom);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 17, attribution: '© OpenStreetMap' }).addTo(mapObj);
  L.circle([S.profile.lat, S.profile.lng], { radius: 350, color: '#FF2E7E', fillColor: '#FF2E7E', fillOpacity: .5, weight: 3 }).addTo(mapObj).bindPopup('<b>אתם כאן (בערך)</b>');
  if (r < 500) L.circle([S.profile.lat, S.profile.lng], { radius: r * 1000, color: '#073B2A', weight: 1, fill: false, dashArray: '6 6' }).addTo(mapObj);
  const by = {};
  near.forEach(p => { (by[p.ownerId] = by[p.ownerId] || []).push(p); });
  Object.values(by).forEach(ps => {
    const u = owner(ps[0]);
    L.circle([jitter(u.id, ps[0].lat, 'a'), jitter(u.id, ps[0].lng, 'b')], { radius: 450, color: u.color || '#19A55B', fillColor: u.color || '#19A55B', fillOpacity: .45, weight: 2 }).addTo(mapObj)
      .bindPopup(`<b>${esc(u.name)}</b>, ${fmtKm(dist(ps[0]))}<br>${ps.map(p => `<a href="#plant/${p.id}">${esc(pName(p))}</a>`).join('<br>')}`);
  });
}

// =====================================================
// הוספת צמח
// =====================================================
let draft = null;
const newDraft = () => ({ step: 'photo', img: null, catId: null, guesses: [], offer: 'cutting', condition: 'young', qty: 1, delivery: 'pickup', open: true, wants: [] });
VIEWS.add = function () {
  if (!draft) draft = newDraft();
  const d = draft;
  let html = `<div class="ph"><h1>הוספת צמח</h1></div><div class="pad" style="padding-top:4px">`;
  if (d.step === 'photo') {
    html += `<label class="drop" for="cam"><div class="big">${ic('camera', 44)}</div><h2>צלמו את הצמח</h2><span>תמונה טובה מביאה יותר התאמות</span></label>
    <input type="file" id="cam" accept="image/*" capture="environment" class="sr" data-change="photo">
    <label class="btn ghost" for="gal" style="margin-top:12px">${ic('image')} בחירה מהגלריה</label>
    <input type="file" id="gal" accept="image/*" class="sr" data-change="photo">
    <button class="btn ghost" data-a="skipPhoto">בלי תמונה, בחירה מהרשימה</button>`;
  } else {
    const c = d.catId ? catById(d.catId) : null;
    html += d.img ? `<div class="scan" style="height:240px"><img src="${d.img}" alt="התמונה שלך"><label class="lbl" for="gal2" style="cursor:pointer">${icInline('image', 14)} החלפת תמונה</label></div><input type="file" id="gal2" accept="image/*" class="sr" data-change="photo">` : '';
    html += `<p class="label">איזה צמח זה?</p>
    <input class="field" id="plant-name" list="catalog" placeholder="התחילו להקליד, למשל: מונסטרה" value="${esc(c ? c.he : '')}" data-change="plantName" autocomplete="off">
    <datalist id="catalog">${CATALOG.map(x => `<option value="${esc(x.he)}">${esc(x.sci)}</option>`).join('')}</datalist>
    ${c ? `<p class="sci" style="margin-top:6px">${esc(c.sci)}</p>` : ''}
    <div class="err" id="add-err"></div>
    <p class="label">מה אתם מציעים?</p><div class="chips" style="gap:8px">${Object.entries(OFFER).map(([k, v]) => `<button class="sel ${d.offer === k ? 'on' : ''}" data-a="draftSet" data-k="offer" data-v="${k}">${v}</button>`).join('')}</div>
    <p class="label">מצב הצמח</p><div class="chips" style="gap:8px">${Object.entries(COND).map(([k, v]) => `<button class="sel ${d.condition === k ? 'on' : ''}" data-a="draftSet" data-k="condition" data-v="${k}">${v}</button>`).join('')}</div>
    <p class="label">כמות</p><div class="stepper"><button data-a="qty" data-v="1" aria-label="יותר">+</button><b id="qty">${d.qty}</b><button data-a="qty" data-v="-1" aria-label="פחות">−</button></div>
    <p class="label">מסירה</p><div class="chips" style="gap:8px">${Object.entries(DELIV).map(([k, v]) => `<button class="sel ${d.delivery === k ? 'on' : ''}" data-a="draftSet" data-k="delivery" data-v="${k}">${v}</button>`).join('')}</div>
    <label class="toggle"><span><b>💚 פתוח/ה להצעות</b><br><span class="small muted">אפשר לקבל הצעות גם על צמחים שלא ברשימת המשאלות שלכם.</span></span><input type="checkbox" id="open" ${d.open ? 'checked' : ''} data-change="open"></label>
    <p class="label">מה הייתם רוצים לקבל בתמורה?</p>
    <div class="row"><input class="field" id="want-in" list="catalog" placeholder="למשל: פילודנדרון" autocomplete="off"><button class="btn sun sm" data-a="addWant">הוספה</button></div>
    <div class="err" id="want-err"></div>
    <div class="chips">${d.wants.map(w => `<span class="chip want">${esc(catById(w).he)} <button data-a="rmWant" data-id="${w}" aria-label="הסרה">×</button></span>`).join('')}</div>
    <p class="small muted" style="margin-top:6px">הצמחים האלה יתווספו לרשימת המשאלות שלכם.</p>
    <div style="margin-top:22px"><button class="btn hot" data-a="savePlant">${ic('check')} פרסום הצמח</button><button class="btn ghost" data-a="cancelAdd">ביטול</button></div>`;
  }
  $('#view').innerHTML = html + '</div>';
};
function keepName() {
  const inp = $('#plant-name'); if (!inp || !draft) return;
  const c = catByName(inp.value); if (c) draft.catId = c.id;
  const o = $('#open'); if (o) draft.open = o.checked;
}
async function savePlant(el) {
  keepName();
  if (!draft.catId) { $('#add-err').textContent = 'בחרו את שם הצמח מהרשימה שנפתחת כשמקלידים.'; $('#plant-name').focus(); return; }
  busy(el, true, 'מפרסמים…');
  try {
    const ref = doc(collection(db, 'plants'));
    const thumb = draft.img ? await shrinkDataUrl(draft.img, 260, .62) : null;
    const pr = S.profile;
    const data = {
      ownerId: uid(), ownerName: pr.name, ownerColor: pr.color || '#19A55B', ownerPhoto: pr.photo || null, city: pr.city, lat: pr.lat, lng: pr.lng,
      catId: draft.catId, offer: draft.offer, condition: draft.condition, qty: draft.qty, delivery: draft.delivery,
      open: $('#open').checked, available: true, hasPhoto: !!draft.img, thumb, t: Date.now()
    };
    const b = writeBatch(db);
    b.set(ref, data);
    if (draft.img) b.set(doc(db, 'photos', ref.id), { ownerId: uid(), img: draft.img });
    const newWants = draft.wants.filter(w => !(pr.wishlist || []).includes(w));
    if (newWants.length) b.update(doc(db, 'users', uid()), { wishlist: arrayUnion(...newWants) });
    await b.commit();
    if (draft.img) S.photos[ref.id] = draft.img;
    if (newWants.length) pr.wishlist = [...(pr.wishlist || []), ...newWants];
    const seekers = Object.values(S.users).filter(u => (u.wishlist || []).includes(data.catId) && dist(u) <= pr.radius).length;
    const name = pName(data);
    draft = null;
    go('discover');
    setTimeout(() => toast(seekers ? `פורסם! ${seekers === 1 ? 'מישהו באזור מחפש' : seekers + ' אנשים באזור מחפשים'} ${name} 🔥` : `פורסם! ה${name} שלך מחכה להתאמה.`), 300);
  } catch (e) { errLog(e); busy(el, false); $('#add-err').textContent = 'הפרסום לא הצליח. בדקו את החיבור ונסו שוב.'; }
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
    return `<div class="req"><div class="row"><div class="duo"><span class="t">${visual(first[0])}</span><span class="t">${visual(target)}</span></div>
      <div class="li-main"><b>${esc(r.fromInfo.name)}</b> רוצה להציע לך <b>${first.map(x => esc(pName(x))).join(' + ')}</b> בתמורה ל<b>${esc(pName(target))}</b> שלך.<div class="small muted">${esc(r.fromInfo.city || '')}, ${ago(r.t)}</div></div></div>
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
  return `<button class="li" data-a="open" data-to="chat/${m.id}"><div class="duo"><span class="t">${visual(mp)}</span><span class="t">${visual(tp)}</span></div>
  <div class="li-main"><div class="li-t">${esc(pName(mp))} ⇄ ${esc(pName(tp))}</div><div class="li-s">${esc(info.name)}: ${esc(m.lastMsg || '')}</div></div>
  <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px"><span class="pill st-${m.status}">${STATUS[m.status]}</span>${n ? `<span class="unread">${n}</span>` : `<span class="small muted">${ago(m.lastAt)}</span>`}</div></button>`;
}

// =====================================================
// צ'אט
// =====================================================
VIEWS.chat = function (id) {
  const m = S.matches.find(x => x.id === id);
  if (!m) { $('#view').innerHTML = `<div class="empty"><h3>השיחה לא נמצאה</h3><button class="btn hot sm" data-a="open" data-to="matches" style="margin:12px auto 0">להתאמות</button></div>`; return; }
  const info = otherInfo(m), done = ['swapped', 'cancelled'].includes(m.status);
  $('#view').innerHTML = `<div class="chat">
    <header class="chat-h"><button class="icon-btn" data-a="open" data-to="matches" aria-label="חזרה">${ic('back')}</button>${avatar(info)}
      <div style="flex:1;min-width:0"><b>${esc(info.name)}</b><div class="small muted">${esc(info.city || '')}</div></div>
      <button class="pill st-${m.status}" id="chat-status" data-a="statusSheet" data-id="${m.id}">${STATUS[m.status]} ▾</button>
      <button class="icon-btn" data-a="chatMenu" data-id="${m.id}" aria-label="עוד אפשרויות">${ic('dots')}</button></header>
    <div class="swapbar" id="swapbar"></div>
    <div class="msgs" id="msgs"><div class="loading" style="min-height:120px"><span class="spin"></span></div></div>
    ${done ? (m.status === 'swapped' && !(m.rated || []).includes(uid()) ? `<div class="quick"><button class="sel on" data-a="rate" data-id="${m.id}">⭐ דירוג ההחלפה</button></div>` : '') : `<div class="quick">${QUICK.map(q => `<button class="sel" data-a="quick" data-id="${m.id}" data-t="${esc(q)}">${esc(q)}</button>`).join('')}<button class="sel" data-a="meetSheet" data-id="${m.id}">${icInline('pin', 14)} קביעת מפגש</button></div>`}
    <div class="composer">
      <label class="icon-btn" for="chat-img" aria-label="שליחת תמונה">${ic('image')}</label><input type="file" id="chat-img" accept="image/*" class="sr" data-change="chatImg" data-id="${m.id}">
      <input class="field" id="chat-in" placeholder="כתבו הודעה" autocomplete="off" maxlength="1000" data-enter="send" data-id="${m.id}">
      <button class="send" data-a="send" data-id="${m.id}" aria-label="שליחה">${ic('send')}</button></div>
  </div>`;
  renderSwapbar(m);
  S.msgs = [];
  chatUnsub = onSnapshot(query(collection(db, 'matches', id, 'messages'), orderBy('t')), s => {
    S.msgs = s.docs.map(d => ({ id: d.id, ...d.data() }));
    renderMsgs(m);
    const cur = S.matches.find(x => x.id === id);
    if (cur && (cur.unread || {})[uid()]) updateDoc(doc(db, 'matches', id), { [`unread.${uid()}`]: 0 }).catch(errLog);
  }, e => { errLog(e); const b = $('#msgs'); if (b) b.innerHTML = '<div class="msg sys">לא הצלחנו לטעון את ההודעות.</div>'; });
};
function renderSwapbar(m) {
  const me = uid(), o = otherId(m);
  const mine = (m.give[me] || []).map(pid => snapOf(m, pid)), theirs = (m.give[o] || []).map(pid => snapOf(m, pid));
  const el = $('#swapbar'); if (!el) return;
  el.innerHTML = `<div class="row sb"><div class="row">${mine.map(x => `<span class="thumb">${visual(x)}</span>`).join('')}<b>${mine.map(x => esc(pName(x))).join(' + ')}</b></div><span aria-label="בתמורה ל">⇄</span><div class="row"><b>${theirs.map(x => esc(pName(x))).join(' + ')}</b>${theirs.map(x => `<span class="thumb">${visual(x)}</span>`).join('')}</div></div>
  ${m.meeting ? `<div class="small" style="margin-top:8px">${icInline('calendar', 14)} ${esc(m.meeting.place)}, ${esc(fmtWhen(m.meeting.when))}</div>` : ''}`;
}
function updateChatMeta() {
  const id = curRoute()[1]; const m = S.matches.find(x => x.id === id); if (!m) return;
  const st = $('#chat-status');
  if (st && !st.classList.contains('st-' + m.status)) { VIEWS.chat(id); return; }
  renderSwapbar(m);
}
function renderMsgs(m) {
  const box = $('#msgs'); if (!box) return;
  const me = uid();
  const nearBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 80;
  box.innerHTML = S.msgs.map(x => x.sys ? `<div class="msg sys">${esc(x.text)}</div>` :
    `<div class="msg ${x.from === me ? 'me' : 'them'}">${x.img ? `<img src="${x.img}" alt="תמונה">` : esc(x.text)}<time>${new Date(x.t).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}</time></div>`).join('') || '<div class="msg sys">תגידו שלום 👋</div>';
  if (nearBottom || box.dataset.first !== '1') { box.scrollTop = box.scrollHeight; box.dataset.first = '1'; }
}
async function sendMsg(mid, text, img, sys) {
  const m = S.matches.find(x => x.id === mid); if (!m) return;
  if (!text && !img) return;
  const me = uid(), o = otherId(m), now = Date.now();
  try {
    await addDoc(collection(db, 'matches', mid, 'messages'), { from: me, text: text || '', img: img || null, sys: !!sys, t: now });
    await updateDoc(doc(db, 'matches', mid), { lastMsg: img ? '📷 תמונה' : text, lastAt: now, lastFrom: me, [`unread.${o}`]: increment(1) });
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
      ((m.give || {})[uid()] || []).forEach(pid => updateDoc(doc(db, 'plants', pid), { available: false }).catch(errLog));
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
  const history = S.matches.filter(m => m.status === 'swapped');
  const badges = [['🌱', 'מאמץ מוקדם', true], ['🌿', 'החלפה ראשונה', (u.swaps || 0) >= 1], ['🏆', 'חובב צמחים מקומי', (u.swaps || 0) >= 5], ['🔥', '10 החלפות מוצלחות', (u.swaps || 0) >= 10]];
  $('#view').innerHTML = `
  <header class="prof"><button class="icon-btn" data-a="settings" aria-label="הגדרות">${ic('settings')}</button>
    ${avatar(u)}<h1>${esc(u.name)}</h1><div>${icInline('pin')} ${esc(u.city)}</div></header>
  <div class="stats"><div class="stat"><b>${u.swaps || 0}</b><span>החלפות</span></div><div class="stat"><b>${u.rehomed || 0}</b><span>צמחים שמצאו בית</span></div><div class="stat"><b>${u.ratingCount ? Number(u.ratingAvg).toFixed(1) : '–'}</b><span>${u.ratingCount ? `דירוג (${u.ratingCount})` : 'עוד אין דירוג'}</span></div></div>
  <h2 class="section-t">הצמחים שלי</h2>
  ${S.myPlants.length ? `<div class="grid">${S.myPlants.map(p => `<button class="mini ${p.available ? '' : 'off'}" data-a="myPlantSheet" data-id="${p.id}"><div class="mv">${visual(p)}</div><div class="mt">${esc(pName(p))}<div class="ms">${OFFER[p.offer]}${p.qty > 1 ? ' ×' + p.qty : ''}${p.available ? '' : ', לא זמין'}</div></div></button>`).join('')}</div>`
      : `<div class="empty"><p>עוד לא הוספתם צמחים.</p><button class="btn hot sm" data-a="open" data-to="add" style="margin:auto">הוספת צמח</button></div>`}
  <h2 class="section-t">רשימת המשאלות</h2>
  <div class="addwish"><input class="field" id="wish-in" list="catalog2" placeholder="איזה צמח אתם מחפשים?" autocomplete="off"><datalist id="catalog2">${CATALOG.map(x => `<option value="${esc(x.he)}">`).join('')}</datalist><button class="btn sun sm" data-a="addWish">הוספה</button></div>
  <div class="err" id="wish-err" style="padding:0 18px"></div>
  <div class="wishchips chips">${(u.wishlist || []).map(w => `<span class="chip want">${esc(catById(w).he)} <button data-a="rmWish" data-id="${w}" aria-label="הסרה">×</button></span>`).join('') || '<span class="muted small">הוסיפו צמחים, ונתריע כשמישהו באזור מציע אותם.</span>'}</div>
  ${saved.length ? `<h2 class="section-t">שמורים</h2><div class="strip">${saved.map(miniCard).join('')}</div>` : ''}
  <h2 class="section-t">היסטוריית החלפות</h2>
  ${history.length ? `<div class="list">${history.map(matchRow).join('')}</div>` : '<p class="muted small" style="padding:0 18px">החלפות שתשלימו יופיעו כאן.</p>'}
  <div id="reviews"></div>
  <h2 class="section-t">הישגים</h2>
  <div class="badges">${badges.map(([i, l, on]) => `<div class="bdg ${on ? '' : 'locked'}"><i>${i}</i>${l}</div>`).join('')}</div>
  <div class="pad"><button class="btn ghost" data-a="invite">${ic('share')} הזמנת חברים ל-${APP_NAME}</button></div>
  <div style="height:16px"></div>`;
  loadReviews();
};
async function loadReviews() {
  try {
    const s = await getDocs(query(collection(db, 'reviews'), where('to', '==', uid())));
    const rs = s.docs.map(d => d.data()).sort((a, b) => b.t - a.t);
    const count = rs.length, avg = count ? rs.reduce((a, r) => a + (r.all || 0), 0) / count : 0;
    if (S.profile.ratingCount !== count || Math.abs((S.profile.ratingAvg || 0) - avg) > .01) {
      S.profile.ratingCount = count; S.profile.ratingAvg = avg;
      updateDoc(doc(db, 'users', uid()), { ratingCount: count, ratingAvg: avg }).catch(errLog);
    }
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
  ${deferredInstall ? `<button class="btn sun" data-a="install">${ic('download')} התקנת האפליקציה בטלפון</button>` : ''}
  <button class="btn ghost" data-a="signOut">${ic('logout')} התנתקות</button>
  <p class="small center" style="margin-top:16px"><a href="privacy.html">מדיניות פרטיות</a></p>
  <button class="btn ghost danger" data-a="deleteAccount">${ic('trash')} מחיקת החשבון</button>`);
}
function myPlantSheet(id) {
  const p = S.myPlants.find(x => x.id === id); if (!p) return;
  sheet(`<div class="row" style="margin-bottom:10px"><span class="thumb" style="width:64px;height:64px">${visual(p)}</span><div><h3 style="margin:0">${esc(pName(p))}</h3><div class="small muted">${OFFER[p.offer]}, ${COND[p.condition]}, כמות ${p.qty}</div></div></div>
  <label class="toggle"><span><b>זמין להחלפה</b><br><span class="small muted">כשזה כבוי, הצמח לא מופיע לאחרים.</span></span><input type="checkbox" data-change="avail" data-id="${p.id}" ${p.available ? 'checked' : ''}></label>
  <label class="toggle"><span><b>פתוח/ה להצעות</b></span><input type="checkbox" data-change="popen" data-id="${p.id}" ${p.open ? 'checked' : ''}></label>
  <button class="btn ghost danger" data-a="delPlant" data-id="${p.id}" style="margin-top:14px">${ic('trash')} מחיקת הצמח</button>`);
}
function notifsSheet() {
  const list = notifList();
  sheet(`<h3>התראות</h3>${list.length ? list.map((n, i) => `<button class="notif ${n.unread ? 'unread' : ''}" data-a="notifGo" data-to="${n.link}"><div>${esc(n.text)}<time>${ago(n.t)}</time></div></button>`).join('') : '<p class="muted">אין התראות כרגע. כשמישהו יציע צמח מרשימת המשאלות שלכם, נודיע כאן.</p>'}`);
  S.priv.alertsSeenAt = Date.now(); savePriv();
  setTimeout(refreshBadges, 50);
}
function filtersSheet() {
  const f = filters, u = S.profile;
  const grp = (k, obj) => `<div class="chips" style="gap:8px"><button class="sel ${f[k] === 'all' ? 'on' : ''}" data-a="setFilter" data-k="${k}" data-v="all">הכול</button>${Object.entries(obj).map(([kk, v]) => `<button class="sel ${f[k] === kk ? 'on' : ''}" data-a="setFilter" data-k="${k}" data-v="${kk}">${v}</button>`).join('')}</div>`;
  sheet(`<h3>מה לחפש?</h3>
  <p class="label">מרחק מ${esc(u.city)}</p><div class="chips" style="gap:8px">${RADII.map(r => `<button class="sel ${r === u.radius ? 'on' : ''}" data-a="filterRadius" data-r="${r}">${radiusLabel(r)}</button>`).join('')}</div>
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
  <p class="label">מתי?</p><input type="datetime-local" class="field" id="meet-when" value="${iso}">
  <div class="err" id="meet-err"></div>
  <button class="btn hot" data-a="saveMeet" data-id="${mid}" style="margin-top:14px">${ic('calendar')} שליחת הצעת מפגש</button>`);
}
function chatMenu(mid) {
  const m = S.matches.find(x => x.id === mid); if (!m) return;
  const n = otherInfo(m).name;
  sheet(`<h3>${esc(n)}</h3>
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
// פעולות (לחיצות)
// =====================================================
const A = {
  // התחברות והרשמה
  signIn: el => signIn(el),
  signOut: async () => { closeSheet(); unsubAll(); await signOut(auth).catch(errLog); },
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
  closeOverlay: () => $('#overlay').classList.remove('open'),
  invite: async () => {
    const data = { title: APP_NAME, text: 'בואו להחליף איתי צמחים ב-LeafLoop 🌿', url: location.origin + location.pathname };
    try { if (navigator.share) await navigator.share(data); else { await navigator.clipboard.writeText(data.url); toast('הקישור הועתק. שלחו אותו לחברים!'); } } catch (e) { }
  },

  // גילוי
  decide: el => decide(el.dataset.d),
  undo: () => {
    if (!lastSwipe) return;
    delete S.priv.swipes[lastSwipe.id];
    if (lastSwipe.a === 'save') S.priv.saved = S.priv.saved.filter(x => x !== lastSwipe.id);
    lastSwipe = null; savePriv(); renderDeck();
  },
  refresh: async el => { busy(el, true, ''); try { await loadPool(true); } catch (e) { errLog(e); toast('הרענון לא הצליח.'); } VIEWS.discover(); },
  resetPasses: () => { Object.keys(S.priv.swipes).forEach(k => { if (S.priv.swipes[k] === 'pass') delete S.priv.swipes[k]; }); savePriv(); renderDeck(); },
  filters: filtersSheet,
  setFilter: el => { filters[el.dataset.k] = el.dataset.v; saveFilters(); filtersSheet(); },
  filterRadius: el => { S.profile.radius = +el.dataset.r; filtersSheet(); },
  applyFilters: () => { closeSheet(); updateDoc(doc(db, 'users', uid()), { radius: S.profile.radius }).catch(errLog); route(); },
  notifs: notifsSheet,
  notifGo: el => { closeSheet(); if (el.dataset.to) go(el.dataset.to); },
  likeDetail: async el => { const p = S.pool.find(x => x.id === el.dataset.id); if (!p) return; S.priv.swipes[p.id] = 'like'; savePriv(); busy(el, true); await afterLike(p, false); busy(el, false); },
  toggleSave: el => { const id = el.dataset.id; S.priv.saved = S.priv.saved.includes(id) ? S.priv.saved.filter(x => x !== id) : [...S.priv.saved, id]; savePriv(); VIEWS.plant(id); toast(S.priv.saved.includes(id) ? 'נשמר לאחר כך' : 'הוסר מהשמורים'); },
  sendRequest: el => sendRequest(el),
  matchChat: el => { $('#overlay').classList.remove('open'); go('chat/' + el.dataset.id); },

  // הוספה
  skipPhoto: () => { draft.step = 'details'; VIEWS.add(); },
  draftSet: el => { keepName(); draft[el.dataset.k] = el.dataset.v; VIEWS.add(); },
  qty: el => { draft.qty = Math.max(1, Math.min(99, draft.qty + +el.dataset.v)); $('#qty').textContent = draft.qty; },
  addWant: () => {
    const c = catByName($('#want-in').value);
    if (!c) { $('#want-err').textContent = 'בחרו צמח מהרשימה שנפתחת כשמקלידים.'; return; }
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
      await addDoc(collection(db, 'reviews'), { matchId: m.id, from: uid(), fromName: S.profile.name, to: otherId(m), ...rateVals, text: $('#rev-txt').value.trim(), t: Date.now() });
      await updateDoc(doc(db, 'matches', m.id), { rated: arrayUnion(uid()) });
      closeSheet(); toast('תודה! הדירוג נשמר.');
    } catch (e) { errLog(e); busy(el, false); $('#rate-err').textContent = 'השליחה לא הצליחה. נסו שוב.'; }
  },
  chatMenu: el => chatMenu(el.dataset.id),
  reportSheet: el => reportSheet(el.dataset.id),
  sendReport: async el => {
    const m = S.matches.find(x => x.id === el.dataset.id);
    busy(el, true, 'שולחים…');
    try {
      await addDoc(collection(db, 'reports'), { from: uid(), about: otherId(m), matchId: m.id, reason: ($('#sheet input[name=reason]:checked') || {}).value || '', text: $('#rep-txt').value.trim(), t: Date.now() });
      closeSheet(); toast('תודה. הדיווח התקבל ונבדוק אותו.');
    } catch (e) { errLog(e); busy(el, false); toast('השליחה לא הצליחה. נסו שוב.'); }
  },
  block: async el => {
    const m = S.matches.find(x => x.id === el.dataset.id); const n = otherInfo(m).name;
    if (!confirm(`לחסום את ${n}? לא תראו יותר את הצמחים וההודעות שלו/ה, וההחלפה ביניכם תבוטל.`)) return;
    S.priv.blocked = [...new Set([...(S.priv.blocked || []), otherId(m)])]; savePriv();
    if (!['swapped', 'cancelled'].includes(m.status)) updateDoc(doc(db, 'matches', m.id), { status: 'cancelled' }).catch(errLog);
    closeSheet(); toast(`${n} נחסם/ה`); go('matches');
  },

  // פרופיל
  settings: settingsSheet,
  install: async () => { if (!deferredInstall) return; deferredInstall.prompt(); await deferredInstall.userChoice.catch(() => { }); deferredInstall = null; closeSheet(); },
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
      await b.commit();
      Object.assign(S.profile, patch);
      closeSheet(); VIEWS.profile(); toast('ההגדרות נשמרו');
    } catch (e) { errLog(e); busy(el, false); $('#set-err').textContent = 'השמירה לא הצליחה. נסו שוב.'; }
  },
  deleteAccount: async el => {
    if (!confirm('למחוק את החשבון לצמיתות? הצמחים, רשימת המשאלות וההצעות שלכם יימחקו. אי אפשר לבטל את זה.')) return;
    busy(el, true, 'מוחקים…');
    const me = uid();
    try {
      await reauthenticateWithPopup(auth.currentUser, new GoogleAuthProvider());
      const b = writeBatch(db);
      S.myPlants.forEach(p => { b.delete(doc(db, 'plants', p.id)); if (p.hasPhoto) b.delete(doc(db, 'photos', p.id)); });
      const lk = await getDocs(query(collection(db, 'likes'), where('from', '==', me)));
      lk.docs.forEach(d => b.delete(d.ref));
      S.outgoing.forEach(r => b.delete(doc(db, 'requests', r.id)));
      S.matches.forEach(m => b.update(doc(db, 'matches', m.id), { [`info.${me}`]: { name: 'משתמש/ת שמחק/ה חשבון', color: '#999999', photo: null, city: '' }, status: m.status === 'swapped' ? 'swapped' : 'cancelled' }));
      b.delete(doc(db, 'users', me, 'private', 'state'));
      b.delete(doc(db, 'users', me));
      unsubAll();
      await b.commit();
      await deleteUser(auth.currentUser);
      closeSheet(); toast('החשבון נמחק. תודה שהייתם איתנו 🌿');
    } catch (e) {
      errLog(e); busy(el, false);
      if (!['auth/popup-closed-by-user', 'auth/cancelled-popup-request'].includes(e.code)) toast('המחיקה לא הושלמה. נסו שוב.');
    }
  },
  addWish: async () => {
    const c = catByName($('#wish-in').value);
    if (!c) { $('#wish-err').textContent = 'בחרו צמח מהרשימה שנפתחת כשמקלידים.'; return; }
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
      draft.step = 'details'; VIEWS.add();
    } catch (err) { toast('לא הצלחנו לקרוא את התמונה. נסו תמונה אחרת.'); }
  }
  if (k === 'plantName') { const c = catByName(el.value); if (c) { draft.catId = c.id; $('#add-err').textContent = ''; } }
  if (k === 'open') draft.open = el.checked;
  if (k === 'chatImg' && el.files[0]) { try { sendMsg(el.dataset.id, '', await compress(el.files[0], 680, .7)); } catch (err) { toast('לא הצלחנו לשלוח את התמונה.'); } }
  if (k === 'avail') updateDoc(doc(db, 'plants', el.dataset.id), { available: el.checked }).catch(e2 => { errLog(e2); toast('העדכון לא הצליח.'); });
  if (k === 'popen') updateDoc(doc(db, 'plants', el.dataset.id), { open: el.checked }).catch(errLog);
});
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.target.dataset && e.target.dataset.enter === 'send') { e.preventDefault(); A.send(e.target); }
  if (e.key === 'Escape') { closeSheet(); $('#overlay').classList.remove('open'); }
  if (S.booted && curRoute()[0] === 'discover') {
    if (document.activeElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;
    if (sheetOpen() || $('#overlay').classList.contains('open')) return;
    if (e.key === 'ArrowRight') decide('like');
    if (e.key === 'ArrowLeft') decide('pass');
    if (e.key === 'ArrowUp') decide('super');
  }
});
document.addEventListener('input', e => { const er = e.target.closest('.pad, .ob, #sheet'); if (er) $$('.err', er).forEach(x => { x.textContent = ''; }); });
window.addEventListener('hashchange', route);
window.addEventListener('online', () => toast('חזרתם לאינטרנט 🌿'));
window.addEventListener('offline', () => toast('אין חיבור לאינטרנט. השינויים יישמרו כשתתחברו.'));

// ---------- הפעלה ----------
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(errLog);
if (!cfgOk) route();
else {
  route();
  getRedirectResult(auth).catch(e => { if (e.code === 'auth/unauthorized-domain') toast('הכתובת של האתר עוד לא אושרה ב-Firebase (README, שלב 3).'); });
  onAuthStateChanged(auth, async user => {
    unsubAll();
    S.authKnown = true; S.me = user; S.booted = false; S.profile = null;
    if (!user) { S.matches = []; S.myPlants = []; S.pool = []; S.incoming = []; S.outgoing = []; route(); return; }
    renderLoading();
    try {
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (!snap.exists()) { ob = null; route(); return; }
      S.profile = { id: user.uid, ...snap.data() };
      await startSession();
      route();
    } catch (e) {
      errLog(e);
      $('#view').innerHTML = `<div class="empty" style="padding-top:30vh"><h3>לא הצלחנו להתחבר לשרת</h3><p>בדקו את החיבור לאינטרנט ונסו שוב.</p><button class="btn hot sm" onclick="location.reload()" style="margin:auto">ניסיון חוזר</button></div>`;
    }
  });
}
