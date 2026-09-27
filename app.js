'use strict';
// ===== LeafMatch – לוגיקת האפליקציה =====
// הנתונים נשמרים בדפדפן של המשתמש (localStorage).

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Math.random().toString(36).slice(2, 10);
const KEY = 'leafmatch_v1';

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
  settings: 'M10.3 4.3c.4-1.8 3-1.8 3.4 0a1.7 1.7 0 0 0 2.6 1.1c1.5-.9 3.3.8 2.4 2.4a1.7 1.7 0 0 0 1 2.5c1.8.5 1.8 3 0 3.5a1.7 1.7 0 0 0-1 2.6c.9 1.5-.9 3.3-2.4 2.4a1.7 1.7 0 0 0-2.6 1c-.4 1.8-3 1.8-3.4 0a1.7 1.7 0 0 0-2.6-1c-1.5.9-3.3-.9-2.4-2.4a1.7 1.7 0 0 0-1-2.6c-1.8-.4-1.8-3 0-3.4a1.7 1.7 0 0 0 1-2.6c-.9-1.5.9-3.3 2.4-2.4a1.7 1.7 0 0 0 2.6-1.1M9 12a3 3 0 1 0 6 0a3 3 0 0 0-6 0'
};
const ic = (n, s = 22) => `<svg class="ic" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${ICONS[n]}"/></svg>`;

// ---------- מילונים ----------
const OFFER = { full: 'צמח שלם', cutting: 'ייחור', seedling: 'שתיל', seeds: 'זרעים' };
const COND = { young: 'צעיר', mature: 'בוגר', large: 'גדול' };
const DELIV = { pickup: 'איסוף', shipping: 'משלוח', both: 'איסוף או משלוח' };
const CATS = { house: 'צמחי בית', outdoor: 'צמחי חוץ', succulent: 'סוקולנטים', cactus: 'קקטוסים', tree: 'עצים', herb: 'תבלינים' };
const STATUS = { discussing: 'מדברים', agreed: 'סגרנו', meeting: 'נקבע מפגש', swapped: 'הוחלף', cancelled: 'בוטל' };
const RADII = [2, 5, 10, 25, 50, 100, 500];
const AV_COLORS = ['#FF2E7E', '#FFB21C', '#0FB5B2', '#FF6A3D', '#B44CFF', '#19A55B'];
const QUICK = ['מתאים לך להחליף?', 'איפה נוח לך להיפגש?', 'אני יכול/ה היום', 'מתאים מחר?', 'אפשר תמונה נוספת של הצמח?'];

// ---------- מצב ושמירה ----------
let st = load();
function load() { try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; } }
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(st)); }
  catch (e) { toast('אין מספיק מקום בזיכרון. מחקו כמה תמונות ונסו שוב.'); }
}

// ---------- עזרי נתונים ----------
const catById = id => CATALOG.find(c => c.id === id) || { id, he: id, sci: '', cat: 'house', art: 'leafy' };
const userById = id => DEMO_USERS.find(u => u.id === id);
const ALL = DEMO_USERS.flatMap(u => u.plants.map(p => ({ ...p, owner: u })));
const plantById = id => ALL.find(p => p.id === id);
const myPlant = id => st.myPlants.find(p => p.id === id);
const pName = p => (p ? catById(p.catId).he : '');
const catByName = n => { const q = String(n || '').trim().toLowerCase(); return CATALOG.find(c => c.he.toLowerCase() === q || c.sci.toLowerCase() === q); };

function km(a, b) {
  const R = 6371, t = x => x * Math.PI / 180;
  const dLat = t(b.lat - a.lat), dLng = t(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(t(a.lat)) * Math.cos(t(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
const dist = u => km(st.user, u);
const fmtKm = d => (d < 10 ? d.toFixed(1) : Math.round(d)) + ' ק״מ';
const radiusLabel = r => (r >= 500 ? 'כל הארץ' : r + ' ק״מ');
const initials = n => (String(n || '?').trim()[0] || '?');
function ago(t) {
  const m = Math.round((Date.now() - t) / 60000);
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

function visual(p) {
  if (p && p.img) return `<div class="photo"><img src="${p.img}" alt="${esc(pName(p))}"></div>`;
  const id = p ? (p.id || p.catId) : 'x';
  return `<div class="art" style="background:${colorFor(id)}">${plantArt(catById(p && p.catId).art, id)}</div>`;
}
const avatar = (name, color, cls = 'av') => `<div class="${cls}" style="background:${color}">${esc(initials(name))}</div>`;

// ---------- לוגיקת התאמה ----------
const theyWantMine = u => st.myPlants.filter(p => p.available && u.wish.includes(p.catId));
const iWant = p => st.wishlist.includes(p.catId);
function matchType(p) {
  const mine = theyWantMine(p.owner).length > 0;
  if (mine && iWant(p)) return 'perfect';
  if (iWant(p)) return 'wishlist';
  if (mine || p.owner.open) return 'good';
  return 'nearby';
}
const TYPE_LABEL = { perfect: 'התאמה מושלמת', wishlist: 'מהרשימה שלך', good: 'התאמה אפשרית', nearby: 'קרוב אליך' };
function score(p) {
  const t = matchType(p);
  let s = { perfect: 100, wishlist: 60, good: 35, nearby: 0 }[t];
  s += (p.owner.rating - 4) * 10 + Math.min(p.owner.swaps, 30) / 3;
  s -= dist(p.owner) * 1.2;
  return s;
}
function inMatch(plantId) { return st.matches.some(m => m.theirs === plantId && m.status !== 'cancelled'); }
function feed() {
  const f = st.filters;
  return ALL.filter(p =>
    !st.swipes[p.id] && !inMatch(p.id) &&
    dist(p.owner) <= st.user.radius &&
    (f.cat === 'all' || catById(p.catId).cat === f.cat) &&
    (f.offer === 'all' || p.offer === f.offer) &&
    (f.delivery === 'all' || p.delivery === f.delivery || p.delivery === 'both')
  ).sort((a, b) => score(b) - score(a));
}

// ---------- הודעות קופצות והתראות ----------
let toastT;
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 3200);
}
function notify(text, link, silent) {
  st.notifs.unshift({ id: uid(), text, link: link || '', t: Date.now(), read: false });
  st.notifs = st.notifs.slice(0, 50);
  save();
  if (!silent) toast(text);
  refreshBadges();
}
function checkAlerts(silent) {
  let n = 0;
  ALL.forEach(p => {
    if (iWant(p) && dist(p.owner) <= st.user.radius && !st.alerted.includes(p.id)) {
      st.alerted.push(p.id);
      notify(`🌿 הצמח שלך כאן! מישהו במרחק ${fmtKm(dist(p.owner))} מציע ${pName(p)}.`, '#plant/' + p.id, true);
      n++;
    }
  });
  if (n && !silent) toast(n === 1 ? 'צמח מרשימת המשאלות שלך הופיע באזור!' : `${n} צמחים מרשימת המשאלות שלך הופיעו באזור!`);
  save();
}

// ---------- מסך תחתון (Sheet) ----------
function sheet(html) {
  $('#sheet').innerHTML = html;
  $('#sheet-wrap').classList.add('open');
  setTimeout(() => $('#sheet').focus({ preventScroll: true }), 250);
}
function closeSheet() { $('#sheet-wrap').classList.remove('open'); }

// ---------- ניווט ----------
let mapObj = null;
function go(h) { if (location.hash === '#' + h) route(); else location.hash = h; }
function route() {
  closeSheet();
  if (mapObj) { mapObj.remove(); mapObj = null; }
  if (!st || !st.user) return renderOnboarding();
  const [r, arg] = (location.hash.slice(1) || 'discover').split('/');
  const views = { discover: renderDiscover, map: renderMap, add: renderAdd, matches: renderMatches, profile: renderProfile, chat: renderChat, plant: renderPlant };
  (views[r] || renderDiscover)(arg);
  const full = r === 'chat';
  $('#app').classList.toggle('no-tabs', full);
  $('#tabbar').style.display = full ? 'none' : '';
  renderTabs(r);
  window.scrollTo(0, 0);
}
function renderTabs(active) {
  const unread = st.matches.reduce((s, m) => s + (m.unread || 0), 0) + st.incoming.length;
  const T = [['discover', 'cards', 'גילוי'], ['map', 'map', 'מפה'], ['add', 'plus', 'הוספה'], ['matches', 'heart', 'התאמות'], ['profile', 'user', 'פרופיל']];
  $('#tabbar').innerHTML = T.map(([k, i, l]) => k === 'add'
    ? `<a href="#add" aria-label="הוספת צמח" class="${active === k ? 'on' : ''}"><span class="add">${ic('plus', 28)}</span></a>`
    : `<a href="#${k}" class="${active === k || (active === 'plant' && k === 'discover') ? 'on' : ''}">${ic(i, 24)}${l}${k === 'matches' && unread ? `<span class="dot">${unread}</span>` : ''}</a>`).join('');
}
function refreshBadges() {
  if (!st || !st.user) return;
  const r = (location.hash.slice(1) || 'discover').split('/')[0];
  renderTabs(r);
  const b = $('#bell-dot'); const n = st.notifs.filter(x => !x.read).length;
  if (b) { b.textContent = n; b.style.display = n ? '' : 'none'; }
}

// =====================================================
// Onboarding
// =====================================================
let ob = { step: 1, name: '', color: AV_COLORS[0], city: '', lat: null, lng: null, radius: 10, demo: true };
function renderOnboarding() {
  $('#tabbar').style.display = 'none'; $('#app').classList.add('no-tabs');
  const steps = `<div class="steps">${[1, 2, 3].map(i => `<i class="${i <= ob.step ? 'on' : ''}"></i>`).join('')}</div>`;
  let body = '';
  if (ob.step === 1) {
    body = `<div class="ob-hero"><div class="wordmark">Leaf<span>Match</span></div><p>הצמחים שלך מחפשים אחד את השני.</p></div>${steps}
    <h2>איך קוראים לך?</h2><p class="muted">השם יוצג לאנשים שתחליף איתם.</p>
    <input class="field" id="ob-name" placeholder="למשל: נתנאל" value="${esc(ob.name)}" maxlength="24" autocomplete="given-name">
    <div class="err" id="ob-err"></div>
    <p class="label">צבע לפרופיל</p><div class="colors">${AV_COLORS.map(c => `<button data-a="obColor" data-c="${c}" class="${c === ob.color ? 'on' : ''}" style="background:${c}" aria-label="צבע"></button>`).join('')}</div>
    <div class="ob-foot"><button class="btn hot" data-a="obNext">המשך</button></div>`;
  } else if (ob.step === 2) {
    body = `${steps}<h2>איפה הצמחים שלך?</h2><p class="muted">כדי להראות לך אנשים קרובים.</p>
    <button class="btn sun" data-a="obGeo">${ic('pin')} שימוש במיקום שלי</button>
    <p class="label">או בחירת עיר</p>
    <select class="field" id="ob-city"><option value="">בחרו עיר</option>${CITIES.map(c => `<option ${c.n === ob.city ? 'selected' : ''}>${c.n}</option>`).join('')}</select>
    <div class="err" id="ob-err"></div>
    <div class="note">${ic('shield', 20)}<span>לעולם לא נציג את הכתובת שלך. אחרים רואים רק עיר ומרחק משוער, למשל "כפר סבא, 2.4 ק״מ ממך".</span></div>
    <div class="ob-foot"><button class="btn hot" data-a="obNext">המשך</button><button class="btn ghost" data-a="obBack">חזרה</button></div>`;
  } else {
    body = `${steps}<h2>כמה רחוק לחפש?</h2><p class="muted">אפשר לשנות את זה בכל רגע.</p>
    <div class="chips" style="gap:8px">${RADII.map(r => `<button class="sel ${r === ob.radius ? 'on' : ''}" data-a="obRadius" data-r="${r}">${radiusLabel(r)}</button>`).join('')}</div>
    <label class="toggle"><span><b>להוסיף צמחים לדוגמה</b><br><span class="small muted">מונסטרה, ייחורי פוטוס ואלוורה, כדי שתוכלו לנסות מיד. אפשר למחוק אחר כך.</span></span><input type="checkbox" id="ob-demo" ${ob.demo ? 'checked' : ''}></label>
    <div class="ob-foot"><button class="btn hot" data-a="obFinish">יאללה, מתחילים</button><button class="btn ghost" data-a="obBack">חזרה</button></div>`;
  }
  $('#view').innerHTML = `<div class="ob">${body}</div>`;
}
function finishOnboarding() {
  st = {
    v: 1,
    user: { name: ob.name, color: ob.color, city: ob.city, lat: ob.lat, lng: ob.lng, radius: ob.radius, swaps: 0, rehomed: 0, joined: Date.now() },
    myPlants: [], wishlist: [], swipes: {}, saved: [], matches: [], incoming: [], outgoing: [], notifs: [], alerted: [], reviews: [],
    filters: { cat: 'all', offer: 'all', delivery: 'all' }
  };
  if (ob.demo) {
    const mk = (catId, offer, condition, qty) => ({ id: 'm_' + uid(), catId, offer, condition, qty, delivery: 'pickup', open: true, available: true, img: null, t: Date.now() });
    st.myPlants = [mk('monstera', 'full', 'mature', 1), mk('pothos', 'cutting', 'young', 3), mk('aloe', 'seedling', 'young', 1)];
    st.wishlist = ['monstera_albo', 'philodendron', 'string_pearls'];
    st.incoming = [{ id: uid(), uid: 'noa', theirs: 'p_noa_1', mine: [st.myPlants[1].id], t: Date.now() - 3600e3 }];
    st.notifs.push({ id: uid(), text: 'נועה רוצה להציע לך קלתאה בתמורה לפוטוס שלך.', link: '#matches', t: Date.now() - 3600e3, read: false });
  }
  save();
  checkAlerts(true);
  location.hash = 'discover';
  route();
  setTimeout(() => toast(`ברוכים הבאים, ${st.user.name}! החליקו ימינה על צמח שמעניין אתכם.`), 400);
}

// =====================================================
// Discover (Swipe)
// =====================================================
function renderDiscover() {
  const nearWish = ALL.filter(p => iWant(p) && dist(p.owner) <= st.user.radius).sort((a, b) => dist(a.owner) - dist(b.owner));
  const people = DEMO_USERS.filter(u => dist(u) <= st.user.radius).sort((a, b) => dist(a) - dist(b));
  const unreadN = st.notifs.filter(n => !n.read).length;
  $('#view').innerHTML = `
  <header class="hero">
    <div class="row sb"><h1>${greeting()},<br>${esc(st.user.name)}</h1>
    <button class="icon-btn" data-a="notifs" aria-label="התראות">${ic('bell', 24)}<span class="dot" id="bell-dot" style="${unreadN ? '' : 'display:none'}">${unreadN}</span></button></div>
    <button class="loc" data-a="filters">${ic('pin', 18)} ${esc(st.user.city)}, ${radiusLabel(st.user.radius)}</button>
  </header>
  <div class="deck-wrap">
    <div class="deck-meta"><span id="deck-count"></span><button data-a="filters" class="row" style="color:#fff;gap:4px">${ic('filter', 18)} סינון</button></div>
    <section class="deck" id="deck" aria-label="כרטיסי צמחים"></section>
    <div class="actions" id="deck-actions">
      <button class="act pass" data-a="decide" data-d="pass" aria-label="לא בשבילי">${ic('x', 30)}</button>
      <button class="act save" data-a="decide" data-d="save" aria-label="שמירה לאחר כך">${ic('bookmark', 22)}</button>
      <button class="act like" data-a="decide" data-d="like" aria-label="מעוניין">${ic('heart', 36)}</button>
      <button class="act super" data-a="decide" data-d="super" aria-label="סופר מעוניין">${ic('star', 28)}</button>
    </div>
  </div>
  ${nearWish.length ? `<h2 class="section-t">מרשימת המשאלות שלך</h2><div class="strip">${nearWish.map(miniCard).join('')}</div>` : ''}
  ${people.length ? `<h2 class="section-t">אנשים לידך</h2><div class="strip">${people.map(u => `<div class="person">${avatar(u.name, u.color)}${esc(u.name)}<div class="small muted">${fmtKm(dist(u))}</div></div>`).join('')}</div>` : ''}
  <div style="height:20px"></div>`;
  renderDeck();
}
function miniCard(p) {
  return `<button class="mini" data-a="open" data-to="plant/${p.id}"><div class="mv">${visual(p)}</div><div class="mt">${esc(pName(p))}<div class="ms">${esc(p.owner.name)}, ${fmtKm(dist(p.owner))}</div></div></button>`;
}
function wantsChips(u) {
  const mineCats = st.myPlants.filter(p => p.available).map(p => p.catId);
  return u.wish.map(w => `<span class="chip ${mineCats.includes(w) ? 'have' : 'want'}">${mineCats.includes(w) ? ic('check', 14) : ''}${esc(catById(w).he)}</span>`).join('') + (u.open ? '<span class="chip open">פתוח/ה להצעות</span>' : '');
}
function cardHTML(p, i) {
  const t = matchType(p);
  return `<article class="card" data-id="${p.id}" style="z-index:${10 - i};--i:${i}">
    <div class="card-visual">${visual(p)}<span class="badge b-${t}">${TYPE_LABEL[t]}</span>
      <span class="stamp s-like">מעוניין</span><span class="stamp s-pass">לא בשבילי</span><span class="stamp s-super">סופר!</span></div>
    <div class="card-info">
      <div class="row sb"><h2>${esc(pName(p))}</h2><button class="icon-btn" data-a="open" data-to="plant/${p.id}" aria-label="פרטים נוספים">${ic('eye')}</button></div>
      <p class="sci">${esc(catById(p.catId).sci)}</p>
      <div class="chips"><span class="chip">${OFFER[p.offer]}${p.qty > 1 ? ' ×' + p.qty : ''}</span><span class="chip">${ic('pin', 14)}${fmtKm(dist(p.owner))}</span><span class="chip">${esc(p.owner.name)} ★${p.owner.rating}</span></div>
      <p class="wants-l">רוצה בתמורה</p><div class="chips">${wantsChips(p.owner)}</div>
    </div></article>`;
}
function renderDeck() {
  const deck = $('#deck'); if (!deck) return;
  const list = feed();
  $('#deck-count').textContent = list.length ? `${list.length} צמחים באזור` : '';
  $('#deck-actions').style.visibility = list.length ? '' : 'hidden';
  if (!list.length) {
    deck.innerHTML = `<div class="card" style="--i:0;position:absolute"><div class="empty" style="margin:auto">
      <h3>עברתם על כל הצמחים באזור</h3><p>הגדילו את רדיוס החיפוש או חזרו לצמחים שדילגתם עליהם.</p>
      <button class="btn sun" data-a="filters">הגדלת הרדיוס</button><button class="btn ghost" data-a="resetPasses">הצגה מחדש של צמחים שדילגתי עליהם</button></div></div>`;
    return;
  }
  deck.innerHTML = list.slice(0, 3).map(cardHTML).reverse().join('');
  bindDrag();
}
function bindDrag() {
  const card = $$('#deck .card').pop(); if (!card) return;
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
  const p = plantById(card.dataset.id);
  const out = { like: 'translate(130%,-4%) rotate(22deg)', pass: 'translate(-130%,-4%) rotate(-22deg)', super: 'translate(0,-130%)', save: 'translate(0,40%) scale(.6)' }[a];
  card.classList.add('leaving'); card.style.transform = out;
  st.swipes[p.id] = a;
  if (a === 'save' && !st.saved.includes(p.id)) { st.saved.push(p.id); toast('נשמר. תמצאו אותו בפרופיל, תחת "שמורים".'); }
  save();
  setTimeout(() => { renderDeck(); if (a === 'like' || a === 'super') afterLike(p, a === 'super'); }, 260);
}
function afterLike(p, sup) {
  const mine = theyWantMine(p.owner);
  if (mine.length && iWant(p)) {
    const m = createMatch(p, [mine[0].id], 'perfect');
    showMatch(m);
  } else {
    openRequestSheet(p, sup);
  }
}

// ---------- הצעת החלפה ----------
function openRequestSheet(p, sup) {
  if (!st.myPlants.some(x => x.available)) {
    sheet(`<h3>עוד אין לך צמחים להציע</h3><p class="muted">כדי לשלוח הצעת החלפה ל${esc(p.owner.name)}, הוסיפו קודם צמח אחד לפחות.</p><button class="btn hot" data-a="open" data-to="add">הוספת צמח</button><button class="btn ghost" data-a="closeSheet">לא עכשיו</button>`);
    return;
  }
  const wanted = theyWantMine(p.owner).map(x => x.id);
  sheet(`<h3>${sup ? 'סופר מעוניין! ⭐' : 'שמרנו שאתם מעוניינים'}</h3>
  <p class="muted">אין כאן התאמה אוטומטית, אבל אפשר לשלוח ל${esc(p.owner.name)} הצעת החלפה. ברשימת המשאלות: ${p.owner.wish.map(w => esc(catById(w).he)).join(', ')}${p.owner.open ? '. פתוח/ה גם להצעות אחרות.' : '.'}</p>
  <p class="label">מה להציע בתמורה ל${esc(pName(p))}?</p>
  <div class="pick">${st.myPlants.filter(x => x.available).map(x => `<label class="pick-item"><input type="checkbox" name="offer" value="${x.id}" ${wanted.includes(x.id) ? 'checked' : ''}><span class="thumb">${visual(x)}</span><span>${esc(pName(x))} <span class="small muted">(${OFFER[x.offer]}${x.qty > 1 ? ' ×' + x.qty : ''})</span>${wanted.includes(x.id) ? `<em>${esc(p.owner.name)} מחפש/ת את זה</em>` : ''}</span></label>`).join('')}</div>
  <div class="err" id="req-err"></div>
  <button class="btn hot" data-a="sendRequest" data-id="${p.id}">${ic('swap')} שליחת הצעת החלפה</button>
  <button class="btn ghost" data-a="closeSheet">לא עכשיו</button>`);
}
function sendRequest(pid) {
  const p = plantById(pid);
  const ids = $$('#sheet input[name=offer]:checked').map(i => i.value);
  if (!ids.length) { $('#req-err').textContent = 'בחרו לפחות צמח אחד להציע.'; return; }
  st.outgoing.push({ id: uid(), plantId: pid, mine: ids, t: Date.now() });
  save(); closeSheet();
  toast(`ההצעה נשלחה ל${p.owner.name}. נעדכן אתכם כשתגיע תשובה.`);
  setTimeout(resolveOutgoing, 4500);
}
function resolveOutgoing() {
  const now = Date.now();
  st.outgoing = st.outgoing.filter(o => {
    if (now - o.t < 4000) return true;
    const p = plantById(o.plantId); const u = p.owner;
    const wants = o.mine.some(id => { const x = myPlant(id); return x && u.wish.includes(x.catId); });
    if (wants || u.open) {
      const m = createMatch(p, o.mine, 'request');
      notify(`🌱 ${u.name} אישר/ה את הצעת ההחלפה שלך! אפשר להתחיל לדבר.`, '#chat/' + m.id);
    } else {
      notify(`${u.name} מעדיף/ה לוותר הפעם. אפשר לנסות להציע צמח אחר.`, '#plant/' + p.id);
    }
    return false;
  });
  save();
}

// ---------- יצירת התאמה ----------
function createMatch(p, myIds, type) {
  let m = st.matches.find(x => x.theirs === p.id && x.status !== 'cancelled');
  if (m) return m;
  m = { id: uid(), uid: p.owner.id, theirs: p.id, mine: myIds, type, status: 'discussing', archived: false, msgs: [], unread: 0, rated: false, t: Date.now(), meeting: null };
  st.matches.unshift(m);
  save();
  const mp = myPlant(myIds[0]);
  setTimeout(() => botSay(m.id, `היי! ראיתי את ה${pName(mp)} שלך 🌿 מתאים לך להחליף ב${pName(p)} שלי?`), 2500);
  return m;
}
function botSay(mid, text) {
  const m = st.matches.find(x => x.id === mid); if (!m) return;
  m.msgs.push({ from: 'them', text, t: Date.now() });
  const viewing = location.hash === '#chat/' + mid;
  if (!viewing) { m.unread = (m.unread || 0) + 1; notify(`💬 הודעה חדשה מ${userById(m.uid).name}`, '#chat/' + mid, true); toast(`💬 ${userById(m.uid).name}: ${text}`); }
  save();
  if (viewing) renderMsgs(m);
  refreshBadges();
}

// ---------- מסך "יש התאמה" ----------
function showMatch(m) {
  const p = plantById(m.theirs), mp = myPlant(m.mine[0]);
  $('#overlay').innerHTML = `<div class="match" role="dialog" aria-label="יש התאמה">
    <div class="burst">${burstLeaves(18)}</div>
    <div class="pair"><div class="bubble from-r">${visual(mp)}</div><div class="heart">${ic('heart', 28)}</div><div class="bubble from-l">${visual(p)}</div></div>
    <h1>יש התאמה!</h1>
    <p>הצמחים שלכם מצאו אחד את השני.</p>
    <div class="swapline">ה${esc(pName(mp))} שלך ⇄ ה${esc(pName(p))} של ${esc(p.owner.name)}</div>
    <div class="btns"><button class="btn sun" data-a="matchChat" data-id="${m.id}">${ic('chat')} בואו נתחיל להחליף</button><button class="btn light" data-a="closeOverlay">אחר כך</button></div>
  </div>`;
  $('#overlay').classList.add('open');
  if (navigator.vibrate) navigator.vibrate([30, 40, 30]);
}

// =====================================================
// Plant detail
// =====================================================
function renderPlant(id) {
  const p = plantById(id);
  if (!p) return go('discover');
  const u = p.owner, t = matchType(p), saved = st.saved.includes(p.id), m = st.matches.find(x => x.theirs === p.id && x.status !== 'cancelled');
  $('#view').innerHTML = `
  <div class="detail-v">${visual(p)}<button class="icon-btn back" data-a="back" aria-label="חזרה">${ic('back')}</button><span class="badge b-${t}" style="top:auto;bottom:18px">${TYPE_LABEL[t]}</span></div>
  <div class="pad">
    <h1 style="font-size:32px;font-weight:900">${esc(pName(p))}</h1><p class="sci" style="font-size:15px">${esc(catById(p.catId).sci)}</p>
    <div class="facts"><div class="fact"><b>${OFFER[p.offer]}</b><span>מה מוצע</span></div><div class="fact"><b>${COND[p.condition]}</b><span>מצב</span></div><div class="fact"><b>${p.qty}</b><span>כמות</span></div></div>
    <div class="owner">${avatar(u.name, u.color)}<div style="flex:1"><b>${esc(u.name)}</b><div class="small muted">${esc(u.city)}, ${fmtKm(dist(u))} ממך</div></div><div style="text-align:center"><b style="font-family:var(--font-d)">★ ${u.rating}</b><div class="small muted">${u.swaps} החלפות</div></div></div>
    <p class="label">${esc(u.name)} רוצה בתמורה</p><div class="chips">${wantsChips(u)}</div>
    <p class="label">מסירה</p><div class="chips"><span class="chip">${DELIV[p.delivery]}</span><span class="chip">${ic('shield', 14)} מפגש במקום ציבורי</span></div>
    <div style="margin-top:22px">
    ${m ? `<button class="btn primary" data-a="open" data-to="chat/${m.id}">${ic('chat')} מעבר לצ'אט</button>`
      : `<button class="btn hot" data-a="likeDetail" data-id="${p.id}">${ic('heart')} מעוניין</button>`}
    <button class="btn ghost" data-a="toggleSave" data-id="${p.id}">${ic('bookmark')} ${saved ? 'הסרה מהשמורים' : 'שמירה לאחר כך'}</button>
    </div>
  </div>`;
}

// =====================================================
// Map
// =====================================================
function renderMap() {
  const near = ALL.filter(p => dist(p.owner) <= st.user.radius).sort((a, b) => dist(a.owner) - dist(b.owner));
  $('#view').innerHTML = `<div class="ph"><h1>צמחים באזור</h1></div>
  <p class="muted small" style="margin:-4px 18px 12px">${ic('shield', 14)} המיקומים משוערים בכוונה, כדי לשמור על הפרטיות של כולם.</p>
  <div id="map"></div>
  <h2 class="section-t">הקרובים ביותר</h2>
  <div class="list">${near.length ? near.map(p => `<button class="li" data-a="open" data-to="plant/${p.id}"><span class="thumb">${visual(p)}</span><div class="li-main"><div class="li-t">${esc(pName(p))}</div><div class="li-s">${esc(p.owner.name)}, ${OFFER[p.offer]}</div></div><b class="small">${fmtKm(dist(p.owner))}</b></button>`).join('') : `<div class="empty">אין צמחים ברדיוס הזה. <button class="btn sun sm" data-a="filters" style="margin:10px auto 0">הגדלת הרדיוס</button></div>`}</div>
  <div style="height:20px"></div>`;
  initMap(near);
}
function initMap(near, tries = 0) {
  if (!window.L) {
    if (tries < 20) return setTimeout(() => initMap(near, tries + 1), 250);
    $('#map').innerHTML = '<div class="empty" style="color:#fff">המפה לא נטענה. בדקו את החיבור לאינטרנט.</div>'; return;
  }
  if (!$('#map')) return;
  const zoom = st.user.radius <= 5 ? 13 : st.user.radius <= 10 ? 12 : st.user.radius <= 25 ? 11 : st.user.radius <= 50 ? 10 : 8;
  mapObj = L.map('map', { zoomControl: true, attributionControl: true }).setView([st.user.lat, st.user.lng], zoom);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '© OpenStreetMap' }).addTo(mapObj);
  L.circle([st.user.lat, st.user.lng], { radius: 350, color: '#FF2E7E', fillColor: '#FF2E7E', fillOpacity: .5, weight: 3 }).addTo(mapObj).bindPopup('<b>אתם כאן (בערך)</b>');
  L.circle([st.user.lat, st.user.lng], { radius: Math.min(st.user.radius, 100) * 1000, color: '#073B2A', weight: 1, fill: false, dashArray: '6 6' }).addTo(mapObj);
  const byOwner = {};
  near.forEach(p => { (byOwner[p.owner.id] = byOwner[p.owner.id] || []).push(p); });
  Object.values(byOwner).forEach(ps => {
    const u = ps[0].owner;
    L.circle([u.lat, u.lng], { radius: 400, color: u.color, fillColor: u.color, fillOpacity: .45, weight: 2 }).addTo(mapObj)
      .bindPopup(`<b>${esc(u.name)}</b>, ${fmtKm(dist(u))}<br>${ps.map(p => `<a href="#plant/${p.id}">${esc(pName(p))}</a>`).join('<br>')}`);
  });
}

// =====================================================
// Add plant
// =====================================================
let draft = null;
function newDraft() { return { step: 'photo', img: null, catId: null, guesses: [], offer: 'cutting', condition: 'young', qty: 1, delivery: 'pickup', open: true, wants: [] }; }
function renderAdd() {
  if (!draft) draft = newDraft();
  const d = draft;
  let html = `<div class="ph"><h1>הוספת צמח</h1></div><div class="pad" style="padding-top:4px">`;
  if (d.step === 'photo') {
    html += `<label class="drop" for="cam"><div class="big">${ic('camera', 44)}</div><h2>צלמו את הצמח</h2><span>נזהה אותו בשבילכם</span></label>
    <input type="file" id="cam" accept="image/*" capture="environment" class="sr" data-change="photo">
    <label class="btn ghost" for="gal" style="margin-top:12px">${ic('image')} בחירה מהגלריה</label>
    <input type="file" id="gal" accept="image/*" class="sr" data-change="photo">
    <button class="btn ghost" data-a="skipPhoto">בלי תמונה, בחירה מהרשימה</button>`;
  } else if (d.step === 'scan') {
    html += `<div class="scan"><img src="${d.img}" alt=""><div class="line"></div><span class="lbl">מזהים את הצמח…</span></div>`;
  } else {
    const c = d.catId ? catById(d.catId) : null;
    html += (d.img ? `<div class="scan" style="height:220px"><img src="${d.img}" alt="התמונה שלך"></div>` : '');
    if (d.guesses.length) {
      html += `<div class="guess"><div class="small muted">אנחנו חושבים שזה</div>
      <h2>${esc(c ? c.he : '')}</h2><p class="sci" style="text-align:right">${esc(c ? c.sci : '')}</p>
      <span class="conf">${d.guesses[0].conf}% ביטחון</span>
      <p class="small muted" style="margin:10px 0 6px">לא נכון? אולי זה:</p>
      <div class="chips">${d.guesses.slice(1).map(g => `<button class="sel" data-a="pickGuess" data-id="${g.id}">${esc(catById(g.id).he)}</button>`).join('')}</div>
      <p class="small muted" style="margin-top:10px">זיהוי הדגמה. זיהוי AI אמיתי יחובר בשלב הבא.</p></div>`;
    }
    html += `<p class="label">שם הצמח</p>
    <input class="field" id="plant-name" list="catalog" placeholder="חפשו, למשל: מונסטרה" value="${esc(c ? c.he : '')}" data-change="plantName">
    <datalist id="catalog">${CATALOG.map(x => `<option value="${esc(x.he)}">${esc(x.sci)}</option>`).join('')}</datalist>
    <div class="err" id="add-err"></div>
    <p class="label">מה אתם מציעים?</p><div class="chips" style="gap:8px">${Object.entries(OFFER).map(([k, v]) => `<button class="sel ${d.offer === k ? 'on' : ''}" data-a="draftSet" data-k="offer" data-v="${k}">${v}</button>`).join('')}</div>
    <p class="label">מצב הצמח</p><div class="chips" style="gap:8px">${Object.entries(COND).map(([k, v]) => `<button class="sel ${d.condition === k ? 'on' : ''}" data-a="draftSet" data-k="condition" data-v="${k}">${v}</button>`).join('')}</div>
    <p class="label">כמות</p><div class="stepper"><button data-a="qty" data-v="-1" aria-label="פחות">−</button><b id="qty">${d.qty}</b><button data-a="qty" data-v="1" aria-label="יותר">+</button></div>
    <p class="label">מסירה</p><div class="chips" style="gap:8px">${Object.entries(DELIV).map(([k, v]) => `<button class="sel ${d.delivery === k ? 'on' : ''}" data-a="draftSet" data-k="delivery" data-v="${k}">${v}</button>`).join('')}</div>
    <label class="toggle"><span><b>💚 פתוח/ה להצעות</b><br><span class="small muted">אפשר לקבל הצעות גם על צמחים שלא ברשימת המשאלות שלכם.</span></span><input type="checkbox" id="open" ${d.open ? 'checked' : ''} data-change="open"></label>
    <p class="label">מה הייתם רוצים לקבל בתמורה?</p>
    <div class="row"><input class="field" id="want-in" list="catalog" placeholder="למשל: פילודנדרון"><button class="btn sun sm" data-a="addWant">הוספה</button></div>
    <div class="err" id="want-err"></div>
    <div class="chips">${d.wants.map(w => `<span class="chip want">${esc(catById(w).he)} <button data-a="rmWant" data-id="${w}" aria-label="הסרה">×</button></span>`).join('')}</div>
    <div style="margin-top:24px"><button class="btn hot" data-a="savePlant">${ic('check')} פרסום הצמח</button><button class="btn ghost" data-a="cancelAdd">ביטול</button></div>`;
  }
  $('#view').innerHTML = html + '</div>';
}
function compress(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 720, s = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        res(c.toDataURL('image/jpeg', .72));
      };
      img.onerror = rej; img.src = r.result;
    };
    r.onerror = rej; r.readAsDataURL(file);
  });
}
// זיהוי הדגמה: בוחר הצעות מהקטלוג. כאן יתחבר שירות זיהוי אמיתי (למשל Pl@ntNet) בהמשך.
function demoIdentify(seed) {
  const h = hashStr(seed.slice(-400));
  const picks = [];
  for (let i = 0; picks.length < 4; i++) { const c = CATALOG[(h + i * 7) % CATALOG.length]; if (!picks.includes(c.id)) picks.push(c.id); }
  return picks.map((id, i) => ({ id, conf: [94, 71, 58, 40][i] - (h % 5) }));
}

// =====================================================
// Matches
// =====================================================
let matchTab = 'active';
function renderMatches() {
  const lists = {
    active: st.matches.filter(m => !m.archived && !['swapped', 'cancelled'].includes(m.status)),
    completed: st.matches.filter(m => m.status === 'swapped'),
    archived: st.matches.filter(m => m.archived || m.status === 'cancelled')
  };
  const L2 = lists[matchTab];
  const reqs = st.incoming.map(r => {
    const u = userById(r.uid), p = plantById(r.theirs), mp = myPlant(r.mine[0]);
    return `<div class="req"><div class="row"><div class="duo"><span class="t">${visual(p)}</span><span class="t">${visual(mp)}</span></div>
      <div class="li-main"><b>${esc(u.name)}</b> רוצה להציע לך <b>${esc(pName(p))}</b> בתמורה ל<b>${esc(pName(mp))}</b> שלך.<div class="small muted">${fmtKm(dist(u))}, ${ago(r.t)}</div></div></div>
      <div class="req-btns"><button class="btn primary sm" style="flex:1" data-a="reqAccept" data-id="${r.id}">אישור</button><button class="btn ghost sm" style="flex:1" data-a="reqChat" data-id="${r.id}">צ'אט</button><button class="btn ghost sm" style="flex:1" data-a="reqDecline" data-id="${r.id}">דחייה</button></div></div>`;
  }).join('');
  $('#view').innerHTML = `<div class="ph"><h1>התאמות</h1></div>
  ${reqs ? `<h2 class="section-t" style="margin-top:6px">הצעות שקיבלת</h2>${reqs}` : ''}
  <div class="tabs">${[['active', 'פעילות'], ['completed', 'הושלמו'], ['archived', 'בארכיון']].map(([k, l]) => `<button class="sel ${matchTab === k ? 'on' : ''}" data-a="matchTab" data-k="${k}">${l} (${lists[k].length})</button>`).join('')}</div>
  ${L2.length ? `<div class="list">${L2.map(matchRow).join('')}</div>` : `<div class="empty"><h3>${matchTab === 'active' ? 'עוד אין התאמות פעילות' : matchTab === 'completed' ? 'עוד לא השלמתם החלפה' : 'הארכיון ריק'}</h3><p>${matchTab === 'active' ? 'החליקו ימינה על צמחים שמעניינים אתכם, וכשיש התאמה היא תופיע כאן.' : 'החלפות שהסתיימו יישמרו כאן.'}</p>${matchTab === 'active' ? '<button class="btn hot sm" data-a="open" data-to="discover" style="margin:auto">לגילוי צמחים</button>' : ''}</div>`}
  <div style="height:20px"></div>`;
}
function matchRow(m) {
  const u = userById(m.uid), p = plantById(m.theirs), mp = myPlant(m.mine[0]);
  const last = m.msgs[m.msgs.length - 1];
  return `<button class="li" data-a="open" data-to="chat/${m.id}"><div class="duo"><span class="t">${visual(mp)}</span><span class="t">${visual(p)}</span></div>
  <div class="li-main"><div class="li-t">${esc(pName(mp))} ⇄ ${esc(pName(p))}</div><div class="li-s">${esc(u.name)}: ${esc(last ? (last.img ? '📷 תמונה' : last.text) : 'התאמה חדשה! תגידו שלום')}</div></div>
  <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px"><span class="pill st-${m.status}">${STATUS[m.status]}</span>${m.unread ? `<span class="unread">${m.unread}</span>` : ''}</div></button>`;
}

// =====================================================
// Chat
// =====================================================
function renderChat(id) {
  const m = st.matches.find(x => x.id === id);
  if (!m) return go('matches');
  m.unread = 0; save();
  const u = userById(m.uid), p = plantById(m.theirs);
  const mine = m.mine.map(myPlant).filter(Boolean);
  $('#view').innerHTML = `<div class="chat">
    <header class="chat-h"><button class="icon-btn" data-a="open" data-to="matches" aria-label="חזרה">${ic('back')}</button>${avatar(u.name, u.color)}
      <div style="flex:1"><b>${esc(u.name)}</b><div class="small muted">${esc(u.city)}, ${fmtKm(dist(u))} · ★${u.rating}</div></div>
      <button class="pill st-${m.status}" data-a="statusSheet" data-id="${m.id}">${STATUS[m.status]} ▾</button></header>
    <div class="swapbar"><div class="row sb"><div class="row">${mine.map(x => `<span class="thumb">${visual(x)}</span>`).join('')}<b>${mine.map(x => esc(pName(x))).join(' + ')}</b></div><span>⇄</span><div class="row"><b>${esc(pName(p))}</b><span class="thumb">${visual(p)}</span></div></div>
      ${m.meeting ? `<div class="small" style="margin-top:8px">${ic('calendar', 14)} ${esc(m.meeting.place)}, ${esc(fmtWhen(m.meeting.when))}</div>` : ''}</div>
    <div class="msgs" id="msgs"></div>
    ${['swapped', 'cancelled'].includes(m.status) ? '' : `<div class="quick">${QUICK.map(q => `<button class="sel" data-a="quick" data-id="${m.id}" data-t="${esc(q)}">${esc(q)}</button>`).join('')}<button class="sel" data-a="meetSheet" data-id="${m.id}">${ic('pin', 14)} קביעת מפגש</button></div>`}
    <div class="composer">
      <label class="icon-btn" for="chat-img" aria-label="שליחת תמונה">${ic('image')}</label><input type="file" id="chat-img" accept="image/*" class="sr" data-change="chatImg" data-id="${m.id}">
      <input class="field" id="chat-in" placeholder="כתבו הודעה" autocomplete="off" data-enter="send" data-id="${m.id}">
      <button class="send" data-a="send" data-id="${m.id}" aria-label="שליחה">${ic('send')}</button></div>
  </div>`;
  renderMsgs(m);
  refreshBadges();
}
function renderMsgs(m) {
  const box = $('#msgs'); if (!box) return;
  const u = userById(m.uid);
  box.innerHTML = `<div class="msg sys">🌿 זו התאמה עם ${esc(u.name)}. מומלץ להיפגש במקום ציבורי.</div>` +
    m.msgs.map(x => x.from === 'sys' ? `<div class="msg sys">${esc(x.text)}</div>` :
      `<div class="msg ${x.from}">${x.img ? `<img src="${x.img}" alt="תמונה">` : esc(x.text)}<time>${new Date(x.t).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}</time></div>`).join('');
  box.scrollTop = box.scrollHeight;
}
function sendMsg(mid, text, img) {
  const m = st.matches.find(x => x.id === mid); if (!m) return;
  if (!text && !img) return;
  m.msgs.push({ from: 'me', text: text || '', img: img || null, t: Date.now() });
  save(); renderMsgs(m);
  const n = m.msgs.filter(x => x.from === 'me').length;
  setTimeout(() => botSay(mid, BOT_REPLIES[(n + hashStr(mid)) % BOT_REPLIES.length]), 1600 + Math.random() * 1200);
}
function sysMsg(m, text) { m.msgs.push({ from: 'sys', text, t: Date.now() }); }
function fmtWhen(v) { try { return new Date(v).toLocaleString('he-IL', { weekday: 'long', day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch (e) { return v; } }
function setStatus(mid, s) {
  const m = st.matches.find(x => x.id === mid); if (!m) return;
  if (m.status === s) return closeSheet();
  const prev = m.status;
  m.status = s;
  sysMsg(m, `הסטטוס עודכן: ${STATUS[s]}`);
  if (s === 'swapped' && prev !== 'swapped') {
    m.completedAt = Date.now();
    st.user.swaps++; st.user.rehomed += m.mine.length;
    m.mine.forEach(id => { const x = myPlant(id); if (x) x.available = false; });
  }
  if (s === 'cancelled') m.archived = true;
  save(); closeSheet(); renderChat(mid);
  if (s === 'swapped' && !m.rated) setTimeout(() => rateSheet(mid), 350);
}
function rateSheet(mid) {
  const m = st.matches.find(x => x.id === mid); const u = userById(m.uid);
  const crit = [['comm', 'תקשורת'], ['cond', 'מצב הצמח'], ['rel', 'אמינות'], ['all', 'כללי']];
  sheet(`<h3>איך הייתה ההחלפה?</h3><p class="muted">הדירוג שלך עוזר לבנות אמון בקהילה.</p>
  ${crit.map(([k, l]) => `<div class="rate-row"><b>${l}</b><div class="stars" data-k="${k}">${[1, 2, 3, 4, 5].map(i => `<button data-a="star" data-k="${k}" data-v="${i}" aria-label="${i} כוכבים">★</button>`).join('')}</div></div>`).join('')}
  <textarea class="field" id="rev-txt" rows="3" placeholder="משהו שתרצו לספר על ההחלפה עם ${esc(u.name)}? (לא חובה)"></textarea>
  <div class="err" id="rate-err"></div>
  <button class="btn hot" data-a="submitRate" data-id="${mid}">שליחת דירוג</button><button class="btn ghost" data-a="closeSheet">אחר כך</button>`);
}
let rateVals = {};

// =====================================================
// Profile
// =====================================================
function renderProfile() {
  const u = st.user;
  const saved = st.saved.map(plantById).filter(Boolean);
  const history = st.matches.filter(m => m.status === 'swapped');
  const avg = st.reviews.length ? (st.reviews.reduce((s, r) => s + r.all, 0) / st.reviews.length).toFixed(1) : '–';
  const badges = [
    ['🌱', 'מאמץ מוקדם', true],
    ['🌿', 'החלפה ראשונה', u.swaps >= 1],
    ['🏆', 'חובב צמחים מקומי', u.swaps >= 5],
    ['🔥', '10 החלפות מוצלחות', u.swaps >= 10]
  ];
  $('#view').innerHTML = `
  <header class="prof"><button class="icon-btn" data-a="settings" aria-label="הגדרות">${ic('settings')}</button>
    ${avatar(u.name, 'var(--jungle)')}<h1>${esc(u.name)}</h1><div>${ic('pin', 16).replace('class="ic"', 'class="ic" style="display:inline;vertical-align:-3px"')} ${esc(u.city)}</div></header>
  <div class="stats"><div class="stat"><b>${u.swaps}</b><span>החלפות</span></div><div class="stat"><b>${u.rehomed}</b><span>צמחים שמצאו בית</span></div><div class="stat"><b>${avg}</b><span>דירוג שנתתי</span></div></div>
  <h2 class="section-t">הצמחים שלי</h2>
  ${st.myPlants.length ? `<div class="grid">${st.myPlants.map(p => `<button class="mini ${p.available ? '' : 'off'}" data-a="myPlantSheet" data-id="${p.id}"><div class="mv">${visual(p)}</div><div class="mt">${esc(pName(p))}<div class="ms">${OFFER[p.offer]}${p.qty > 1 ? ' ×' + p.qty : ''}${p.available ? '' : ', לא זמין'}</div></div></button>`).join('')}</div>`
    : `<div class="empty"><p>עוד לא הוספתם צמחים.</p><button class="btn hot sm" data-a="open" data-to="add" style="margin:auto">הוספת צמח</button></div>`}
  <h2 class="section-t">רשימת המשאלות</h2>
  <div class="addwish"><input class="field" id="wish-in" list="catalog2" placeholder="איזה צמח אתם מחפשים?"><datalist id="catalog2">${CATALOG.map(x => `<option value="${esc(x.he)}">`).join('')}</datalist><button class="btn sun sm" data-a="addWish">הוספה</button></div>
  <div class="err" id="wish-err" style="padding:0 18px"></div>
  <div class="wishchips chips">${st.wishlist.map(w => `<span class="chip want">${esc(catById(w).he)} <button data-a="rmWish" data-id="${w}" aria-label="הסרה">×</button></span>`).join('') || '<span class="muted small">הוסיפו צמחים ונתריע כשמישהו באזור מציע אותם.</span>'}</div>
  ${saved.length ? `<h2 class="section-t">שמורים</h2><div class="strip">${saved.map(miniCard).join('')}</div>` : ''}
  <h2 class="section-t">היסטוריית החלפות</h2>
  ${history.length ? `<div class="list">${history.map(matchRow).join('')}</div>` : '<p class="muted small" style="padding:0 18px">החלפות שתשלימו יופיעו כאן.</p>'}
  <h2 class="section-t">הישגים</h2>
  <div class="badges">${badges.map(([i, l, on]) => `<div class="bdg ${on ? '' : 'locked'}"><i>${i}</i>${l}</div>`).join('')}</div>
  <div style="height:28px"></div>`;
}
function settingsSheet() {
  const u = st.user;
  sheet(`<h3>הגדרות</h3>
  <p class="label">שם</p><input class="field" id="set-name" value="${esc(u.name)}" maxlength="24">
  <p class="label">עיר</p><select class="field" id="set-city">${CITIES.map(c => `<option ${c.n === u.city ? 'selected' : ''}>${c.n}</option>`).join('')}</select>
  <p class="label">רדיוס חיפוש</p><div class="chips" style="gap:8px">${RADII.map(r => `<button class="sel ${r === u.radius ? 'on' : ''}" data-a="setRadius" data-r="${r}">${radiusLabel(r)}</button>`).join('')}</div>
  <div class="err" id="set-err"></div>
  <button class="btn primary" data-a="saveSettings" style="margin-top:14px">שמירה</button>
  <button class="btn ghost" data-a="resetAll" style="color:#B3122F">מחיקת כל הנתונים והתחלה מחדש</button>`);
}
function myPlantSheet(id) {
  const p = myPlant(id);
  sheet(`<div class="row" style="margin-bottom:10px"><span class="thumb" style="width:64px;height:64px">${visual(p)}</span><div><h3 style="margin:0">${esc(pName(p))}</h3><div class="small muted">${OFFER[p.offer]}, ${COND[p.condition]}, כמות ${p.qty}</div></div></div>
  <label class="toggle"><span><b>זמין להחלפה</b><br><span class="small muted">כשזה כבוי, הצמח לא יופיע לאחרים.</span></span><input type="checkbox" data-change="avail" data-id="${p.id}" ${p.available ? 'checked' : ''}></label>
  <label class="toggle"><span><b>פתוח/ה להצעות</b></span><input type="checkbox" data-change="popen" data-id="${p.id}" ${p.open ? 'checked' : ''}></label>
  <button class="btn ghost" data-a="delPlant" data-id="${p.id}" style="margin-top:14px;color:#B3122F">${ic('trash')} מחיקת הצמח</button>`);
}
function notifsSheet() {
  const list = st.notifs;
  sheet(`<h3>התראות</h3>${list.length ? list.map(n => `<button class="notif ${n.read ? '' : 'unread'}" data-a="notifGo" data-id="${n.id}"><div>${esc(n.text)}<time>${ago(n.t)}</time></div></button>`).join('') : '<p class="muted">אין התראות חדשות.</p>'}`);
  list.forEach(n => n.read = true); save();
  setTimeout(refreshBadges, 50);
}
function filtersSheet() {
  const f = st.filters, u = st.user;
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
  sheet(`<h3>קביעת מפגש</h3><p class="muted">${ic('shield', 16).replace('class="ic"', 'class="ic" style="display:inline;vertical-align:-3px"')} מומלץ להיפגש במקום ציבורי ומואר.</p>
  <p class="label">איפה?</p><div class="pick">${SAFE_SPOTS.map((s, i) => `<label class="pick-item"><input type="radio" name="spot" value="${esc(s + ', ' + st.user.city)}" ${i === 0 ? 'checked' : ''}><span>${esc(s)}, ${esc(st.user.city)}</span></label>`).join('')}</div>
  <p class="label">מתי?</p><input type="datetime-local" class="field" id="meet-when" value="${iso}">
  <div class="err" id="meet-err"></div>
  <button class="btn hot" data-a="saveMeet" data-id="${mid}" style="margin-top:14px">${ic('calendar')} שליחת הצעת מפגש</button>`);
}

// =====================================================
// פעולות (לחיצות)
// =====================================================
const A = {
  // onboarding
  obColor: el => { ob.color = el.dataset.c; ob.name = $('#ob-name').value; renderOnboarding(); },
  obBack: () => { ob.step--; renderOnboarding(); },
  obRadius: el => { ob.radius = +el.dataset.r; ob.demo = $('#ob-demo').checked; renderOnboarding(); },
  obGeo: el => {
    if (!navigator.geolocation) { $('#ob-err').textContent = 'הדפדפן לא תומך באיתור מיקום. בחרו עיר מהרשימה.'; return; }
    el.textContent = 'מאתרים…';
    navigator.geolocation.getCurrentPosition(pos => {
      const here = { lat: +pos.coords.latitude.toFixed(2), lng: +pos.coords.longitude.toFixed(2) };
      const near = CITIES.slice().sort((a, b) => km(here, a) - km(here, b))[0];
      ob.lat = here.lat; ob.lng = here.lng; ob.city = near.n;
      renderOnboarding(); toast(`מצאנו: ${near.n}`);
    }, () => { el.innerHTML = `${ic('pin')} שימוש במיקום שלי`; $('#ob-err').textContent = 'לא הצלחנו לאתר מיקום. בחרו עיר מהרשימה.'; }, { timeout: 10000 });
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
  obFinish: () => { ob.demo = $('#ob-demo').checked; finishOnboarding(); },

  // כללי
  open: el => { closeSheet(); $('#overlay').classList.remove('open'); go(el.dataset.to); },
  back: () => { if (history.length > 1) history.back(); else go('discover'); },
  closeSheet,
  closeOverlay: () => $('#overlay').classList.remove('open'),

  // גילוי
  decide: el => decide(el.dataset.d),
  resetPasses: () => { Object.keys(st.swipes).forEach(k => { if (st.swipes[k] === 'pass') delete st.swipes[k]; }); save(); renderDeck(); },
  filters: filtersSheet,
  setFilter: el => { st.filters[el.dataset.k] = el.dataset.v; save(); filtersSheet(); },
  filterRadius: el => { st.user.radius = +el.dataset.r; save(); filtersSheet(); },
  applyFilters: () => { closeSheet(); checkAlerts(); route(); },
  notifs: notifsSheet,
  notifGo: el => { const n = st.notifs.find(x => x.id === el.dataset.id); closeSheet(); if (n && n.link) go(n.link.slice(1)); },
  likeDetail: el => { const p = plantById(el.dataset.id); st.swipes[p.id] = 'like'; save(); afterLike(p, false); },
  toggleSave: el => { const id = el.dataset.id; st.saved = st.saved.includes(id) ? st.saved.filter(x => x !== id) : [...st.saved, id]; save(); renderPlant(id); toast(st.saved.includes(id) ? 'נשמר לאחר כך' : 'הוסר מהשמורים'); },
  sendRequest: el => sendRequest(el.dataset.id),
  matchChat: el => { $('#overlay').classList.remove('open'); go('chat/' + el.dataset.id); },

  // הוספה
  skipPhoto: () => { draft.step = 'details'; renderAdd(); },
  pickGuess: el => { draft.catId = el.dataset.id; const g = draft.guesses; const i = g.findIndex(x => x.id === el.dataset.id); if (i > 0) { const t = g[0].conf; g[0].conf = g[i].conf; g[i].conf = t; [g[0], g[i]] = [g[i], g[0]]; } renderAdd(); },
  draftSet: el => { draft[el.dataset.k] = el.dataset.v; keepName(); renderAdd(); },
  qty: el => { draft.qty = Math.max(1, Math.min(99, draft.qty + +el.dataset.v)); $('#qty').textContent = draft.qty; },
  addWant: () => {
    const c = catByName($('#want-in').value);
    if (!c) { $('#want-err').textContent = 'בחרו צמח מהרשימה שנפתחת.'; return; }
    if (!draft.wants.includes(c.id)) draft.wants.push(c.id);
    keepName(); renderAdd();
  },
  rmWant: el => { draft.wants = draft.wants.filter(w => w !== el.dataset.id); keepName(); renderAdd(); },
  cancelAdd: () => { draft = null; go('discover'); },
  savePlant: () => {
    keepName();
    if (!draft.catId) { $('#add-err').textContent = 'בחרו את שם הצמח מהרשימה שנפתחת כשמקלידים.'; $('#plant-name').focus(); return; }
    const p = { id: 'm_' + uid(), catId: draft.catId, offer: draft.offer, condition: draft.condition, qty: draft.qty, delivery: draft.delivery, open: $('#open').checked, available: true, img: draft.img, t: Date.now() };
    st.myPlants.unshift(p);
    draft.wants.forEach(w => { if (!st.wishlist.includes(w)) st.wishlist.push(w); });
    save();
    const seekers = DEMO_USERS.filter(u => u.wish.includes(p.catId) && dist(u) <= st.user.radius).length;
    draft = null;
    checkAlerts(true);
    go('discover');
    setTimeout(() => toast(seekers ? `פורסם! ${seekers === 1 ? 'אדם אחד באזור מחפש' : seekers + ' אנשים באזור מחפשים'} ${pName(p)} 🔥` : `פורסם! ה${pName(p)} שלך מחכה להתאמה.`), 300);
  },

  // התאמות
  matchTab: el => { matchTab = el.dataset.k; renderMatches(); },
  reqAccept: el => acceptReq(el.dataset.id, true),
  reqChat: el => acceptReq(el.dataset.id, false),
  reqDecline: el => { st.incoming = st.incoming.filter(r => r.id !== el.dataset.id); save(); renderMatches(); refreshBadges(); toast('ההצעה נדחתה'); },

  // צ'אט
  send: el => { const inp = $('#chat-in'); const t = inp.value.trim(); if (!t) return; inp.value = ''; sendMsg(el.dataset.id, t); inp.focus(); },
  quick: el => sendMsg(el.dataset.id, el.dataset.t),
  statusSheet: el => {
    const m = st.matches.find(x => x.id === el.dataset.id);
    sheet(`<h3>איפה ההחלפה עומדת?</h3><div class="pick">${Object.entries(STATUS).map(([k, v]) => `<button class="pick-item" data-a="setStatus" data-id="${m.id}" data-s="${k}" style="${m.status === k ? 'border-color:var(--leaf)' : ''}"><span class="pill st-${k}">${v}</span><span class="small muted">${{ discussing: 'עדיין מדברים', agreed: 'סגרנו על החלפה', meeting: 'נקבע זמן ומקום', swapped: 'ההחלפה בוצעה', cancelled: 'ההחלפה בוטלה' }[k]}</span></button>`).join('')}</div>`);
  },
  setStatus: el => setStatus(el.dataset.id, el.dataset.s),
  meetSheet: el => meetSheet(el.dataset.id),
  saveMeet: el => {
    const place = ($('#sheet input[name=spot]:checked') || {}).value, when = $('#meet-when').value;
    if (!when) { $('#meet-err').textContent = 'בחרו תאריך ושעה.'; return; }
    const m = st.matches.find(x => x.id === el.dataset.id);
    m.meeting = { place, when };
    if (['discussing', 'agreed'].includes(m.status)) m.status = 'meeting';
    sysMsg(m, `📍 הצעת מפגש: ${place}, ${fmtWhen(when)}`);
    save(); closeSheet(); renderChat(m.id);
    setTimeout(() => botSay(m.id, 'מעולה, סגור! נתראה שם 🌿'), 1800);
  },
  star: el => {
    rateVals[el.dataset.k] = +el.dataset.v;
    $$(`#sheet .stars[data-k="${el.dataset.k}"] button`).forEach(b => b.classList.toggle('on', +b.dataset.v <= +el.dataset.v));
  },
  submitRate: el => {
    const keys = ['comm', 'cond', 'rel', 'all'];
    if (keys.some(k => !rateVals[k])) { $('#rate-err').textContent = 'דרגו את כל ארבעת הקטגוריות.'; return; }
    const m = st.matches.find(x => x.id === el.dataset.id);
    st.reviews.push({ matchId: m.id, uid: m.uid, ...rateVals, text: $('#rev-txt').value.trim(), t: Date.now() });
    m.rated = true; rateVals = {}; save(); closeSheet(); toast('תודה! הדירוג נשמר.');
  },

  // פרופיל
  settings: settingsSheet,
  setRadius: el => { $$('#sheet [data-a=setRadius]').forEach(b => b.classList.toggle('on', b === el)); },
  saveSettings: () => {
    const name = $('#set-name').value.trim();
    if (!name) { $('#set-err').textContent = 'השם לא יכול להיות ריק.'; return; }
    const c = CITIES.find(x => x.n === $('#set-city').value);
    const r = $('#sheet [data-a=setRadius].on');
    st.user.name = name;
    if (c && c.n !== st.user.city) { st.user.city = c.n; st.user.lat = c.lat; st.user.lng = c.lng; }
    if (r) st.user.radius = +r.dataset.r;
    save(); closeSheet(); checkAlerts(); renderProfile(); toast('ההגדרות נשמרו');
  },
  resetAll: () => {
    if (!confirm('למחוק את כל הנתונים באפליקציה (צמחים, התאמות והודעות)? אי אפשר לבטל את זה.')) return;
    localStorage.removeItem(KEY); location.hash = ''; location.reload();
  },
  addWish: () => {
    const c = catByName($('#wish-in').value);
    if (!c) { $('#wish-err').textContent = 'בחרו צמח מהרשימה שנפתחת כשמקלידים.'; return; }
    if (!st.wishlist.includes(c.id)) st.wishlist.push(c.id);
    save(); renderProfile(); checkAlerts();
  },
  rmWish: el => { st.wishlist = st.wishlist.filter(w => w !== el.dataset.id); save(); renderProfile(); },
  myPlantSheet: el => myPlantSheet(el.dataset.id),
  delPlant: el => {
    const p = myPlant(el.dataset.id);
    if (!confirm(`למחוק את ה${pName(p)} מהרשימה שלך?`)) return;
    st.myPlants = st.myPlants.filter(x => x.id !== p.id); save(); closeSheet(); renderProfile(); toast('הצמח נמחק');
  }
};
function keepName() {
  const inp = $('#plant-name'); if (!inp) return;
  const c = catByName(inp.value); if (c) draft.catId = c.id;
  const o = $('#open'); if (o) draft.open = o.checked;
}
function acceptReq(rid, accepted) {
  const r = st.incoming.find(x => x.id === rid); if (!r) return;
  st.incoming = st.incoming.filter(x => x.id !== rid);
  const p = plantById(r.theirs);
  const m = { id: uid(), uid: r.uid, theirs: r.theirs, mine: r.mine, type: 'request', status: accepted ? 'agreed' : 'discussing', archived: false, msgs: [{ from: 'them', text: `היי! אשמח להחליף את ה${pName(p)} שלי ב${pName(myPlant(r.mine[0]))} שלך 🌿`, t: r.t }], unread: 0, rated: false, t: Date.now(), meeting: null };
  if (accepted) m.msgs.push({ from: 'sys', text: 'אישרתם את ההצעה. עכשיו נשאר לתאם מפגש.', t: Date.now() });
  st.matches.unshift(m); save();
  if (accepted) showMatch(m); else go('chat/' + m.id);
}

// ---------- מאזיני אירועים ----------
document.addEventListener('click', e => {
  const el = e.target.closest('[data-a]'); if (!el) return;
  const fn = A[el.dataset.a]; if (!fn) return;
  e.preventDefault(); fn(el, e);
});
document.addEventListener('change', async e => {
  const el = e.target, k = el.dataset && el.dataset.change; if (!k) return;
  if (k === 'photo' && el.files[0]) {
    try {
      draft.img = await compress(el.files[0]);
      draft.step = 'scan'; renderAdd();
      setTimeout(() => { draft.guesses = demoIdentify(draft.img); draft.catId = draft.guesses[0].id; draft.step = 'details'; renderAdd(); }, 1800);
    } catch (err) { toast('לא הצלחנו לקרוא את התמונה. נסו תמונה אחרת.'); }
  }
  if (k === 'plantName') { const c = catByName(el.value); if (c) { draft.catId = c.id; $('#add-err').textContent = ''; } }
  if (k === 'open') draft.open = el.checked;
  if (k === 'chatImg' && el.files[0]) { try { sendMsg(el.dataset.id, '', await compress(el.files[0])); } catch (err) { toast('לא הצלחנו לשלוח את התמונה.'); } }
  if (k === 'avail') { const p = myPlant(el.dataset.id); p.available = el.checked; save(); renderProfile(); }
  if (k === 'popen') { const p = myPlant(el.dataset.id); p.open = el.checked; save(); }
});
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.target.dataset && e.target.dataset.enter === 'send') { e.preventDefault(); A.send(e.target); }
  if (e.key === 'Escape') { closeSheet(); $('#overlay').classList.remove('open'); }
  if (location.hash.startsWith('#discover') || location.hash === '') {
    if (document.activeElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;
    if ($('#sheet-wrap').classList.contains('open')) return;
    if (e.key === 'ArrowRight') decide('like');
    if (e.key === 'ArrowLeft') decide('pass');
    if (e.key === 'ArrowUp') decide('super');
  }
});
document.addEventListener('input', e => { if (e.target.id && $('#' + e.target.id + '-err')) $('#' + e.target.id + '-err').textContent = ''; });
window.addEventListener('hashchange', route);

// ---------- הפעלה ----------
if (st && st.user) { resolveOutgoing(); }
route();
