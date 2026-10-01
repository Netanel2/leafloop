// חיבור ל-Firebase (גרסה קבועה כדי שלא ישתנה פתאום)
export { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
export {
  getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult,
  onAuthStateChanged, signOut, deleteUser, reauthenticateWithPopup
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
export {
  getFirestore, doc, getDoc, setDoc, updateDoc, deleteDoc, addDoc, collection, query, where,
  getDocs, onSnapshot, orderBy, limit, increment, arrayUnion, arrayRemove, writeBatch
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
