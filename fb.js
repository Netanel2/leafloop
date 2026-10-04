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
// התראות פוש נטענות רק כשצריך
export const loadMessaging = () => import(BASE + 'firebase-messaging.js');
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
