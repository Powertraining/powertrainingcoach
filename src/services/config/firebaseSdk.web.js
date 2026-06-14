export { getApp, getApps, initializeApp } from "firebase/app";
import { browserLocalPersistence as firebaseBrowserLocalPersistence } from "@firebase/auth";
export {
  GoogleAuthProvider,
  browserLocalPersistence,
  getAuth,
  initializeAuth,
  onAuthStateChanged,
  reload,
  sendEmailVerification,
  sendPasswordResetEmail,
  setPersistence,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  updateProfile,
  createUserWithEmailAndPassword,
} from "@firebase/auth";
export {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  increment,
  initializeFirestore,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore/lite";
export { getFunctions, httpsCallable } from "firebase/functions";
export { getDownloadURL, getStorage, listAll, ref, uploadBytes } from "firebase/storage";

export function getReactNativePersistence() {
  return firebaseBrowserLocalPersistence;
}
