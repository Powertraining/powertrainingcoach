import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getApp,
  getApps,
  getAuth,
  getFirestore,
  getReactNativePersistence,
  getStorage,
  initializeApp,
  initializeAuth,
  initializeFirestore,
} from "./firebaseSdk.js";

const runtimeEnv = typeof process !== "undefined" ? process.env ?? {} : {};

const getEnv = (expoPublicValue, runtimeKey, fallback) =>
  expoPublicValue || runtimeEnv[runtimeKey] || fallback;

// Firebase JS SDK uses this config on Android, iOS, and web.
// These values must come from the Firebase Web app config because this project
// uses the Firebase JavaScript SDK, not the native RN Firebase SDK.
const firebaseConfig = {
  apiKey: getEnv(
    process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    "FIREBASE_API_KEY",
    "AIzaSyB45vz0PNa6GiZN34TROf9B-M_eUvM4G2U"
  ),
  authDomain: getEnv(
    process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    "FIREBASE_AUTH_DOMAIN",
    "power-training-coach.firebaseapp.com"
  ),
  projectId: getEnv(
    process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    "FIREBASE_PROJECT_ID",
    "power-training-coach"
  ),
  storageBucket: getEnv(
    process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    "FIREBASE_STORAGE_BUCKET",
    "power-training-coach.firebasestorage.app"
  ),
  messagingSenderId: getEnv(
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    "FIREBASE_MESSAGING_SENDER_ID",
    "410162189255"
  ),
  appId: getEnv(
    process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    "FIREBASE_APP_ID",
    "1:410162189255:web:023105817d8ceddbbcffe2"
  ),
  measurementId: getEnv(
    process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
    "FIREBASE_MEASUREMENT_ID",
    "G-MMN29XQ5C5"
  ),
};

const firestoreDatabaseId = getEnv(
  process.env.EXPO_PUBLIC_FIRESTORE_DATABASE_ID,
  "FIRESTORE_DATABASE_ID",
  "default"
);

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

let authInstance;
let dbInstance;

try {
  authInstance = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (error) {
  authInstance = getAuth(app);
}

try {
  dbInstance = initializeFirestore(app, {}, firestoreDatabaseId);
} catch (error) {
  dbInstance = getFirestore(app, firestoreDatabaseId);
}

export const auth = authInstance;
export const db = dbInstance;
export const storage = getStorage(app);
export const FIRESTORE_DATABASE_ID = firestoreDatabaseId;
