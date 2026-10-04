// חיבור ל-Firebase.
// קודם טוענים דרך הכתובת של האתר (/fb/), כדי שחוסמי פרסומות או סינון של חברת הסלולר לא יחסמו.
// אם זה לא עובד, טוענים ישירות מ-Google.
const VER = '10.12.2';
const NAMES = ['firebase-app.js', 'firebase-auth.js', 'firebase-firestore.js'];
async function loadAll(base) { return Promise.all(NAMES.map(n => import(base + n))); }
let mods, BASE = '/fb/';
try { mods = await loadAll(BASE); }
catch (e) {
  console.warn('[LeafLoop] /fb/ failed, trying gstatic', e);
  BASE = `https://www.gstatic.com/firebasejs/${VER}/`;
  mods = await loadAll(BASE);
}
// התראות פוש נטענות רק כשצריך.
// אם הטעינה דרך האתר נכשלת, טוענים ישירות מ-Google עם "מופע" נפרד של Firebase רק להתראות.
export async function loadMessaging(config) {
  try { return { M: await import(BASE + 'firebase-messaging.js'), app: null }; }
  catch (e) {
    console.warn('[LeafLoop] messaging via ' + BASE + ' failed, using gstatic', e);
    const G = `https://www.gstatic.com/firebasejs/${VER}/`;
    const [A2, M] = await Promise.all([import(G + 'firebase-app.js'), import(G + 'firebase-messaging.js')]);
    const app = A2.getApps().find(a => a.name === 'push') || A2.initializeApp(config, 'push');
    return { M, app };
  }
}
const [A, U, F] = mods;
export const { initializeApp } = A;
export const {
  getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult,
  onAuthStateChanged, signOut, deleteUser, reauthenticateWithPopup
} = U;
export const {
  getFirestore, doc, getDoc, setDoc, updateDoc, deleteDoc, addDoc, collection, query, where,
  getDocs, onSnapshot, orderBy, limit, increment, arrayUnion, arrayRemove, writeBatch, getCountFromServer
} = F;
