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
  setPersistence,
} from "./firebaseSdk";

const runtimeEnv = typeof process !== "undefined" ? process.env ?? {} : {};

const getEnv = (expoPublicValue, runtimeKey, fallback) =>
  expoPublicValue || runtimeEnv[runtimeKey] || fallback;

function normalizeFirestoreDatabaseId(value) {
  const normalizedValue = String(value ?? "").trim();

  if (!normalizedValue || normalizedValue === "default") {
    return "(default)";
  }

  return normalizedValue;
}

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

const firestoreDatabaseId = normalizeFirestoreDatabaseId(getEnv(
  process.env.EXPO_PUBLIC_FIRESTORE_DATABASE_ID,
  "FIRESTORE_DATABASE_ID",
  "(default)"
));

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const reactNativeAuthPersistence = getReactNativePersistence(AsyncStorage);

let authInstance;
let dbInstance;
let authPersistenceReadyPromise;

try {
  authInstance = initializeAuth(app, {
    persistence: reactNativeAuthPersistence,
  });
} catch (error) {
  console.warn(
    "Firebase Auth was already initialized before React Native persistence could be attached. Reusing the existing auth instance:",
    error
  );
  authInstance = getAuth(app);
}

authPersistenceReadyPromise = setPersistence(
  authInstance,
  reactNativeAuthPersistence
)
  .then(() => {
    console.log("[firebase] Firebase Auth persistence configured");
  })
  .catch((error) => {
    console.warn("[firebase] Failed to configure Firebase Auth persistence:", error);
  });

try {
  dbInstance =
    firestoreDatabaseId === "(default)" ?
      initializeFirestore(app, {}) :
      initializeFirestore(app, {}, firestoreDatabaseId);
} catch (error) {
  dbInstance =
    firestoreDatabaseId === "(default)" ?
      getFirestore(app) :
      getFirestore(app, firestoreDatabaseId);
}

export const auth = authInstance;
export const authPersistenceReady = authPersistenceReadyPromise;
export const db = dbInstance;
export const storage = getStorage(app);
export const FIRESTORE_DATABASE_ID = firestoreDatabaseId;
