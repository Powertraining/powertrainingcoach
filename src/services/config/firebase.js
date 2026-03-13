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

const getEnv = (key, fallback) => {
  if (typeof process !== "undefined" && process.env?.[key]) {
    return process.env[key];
  }

  const expoPublicKey = `EXPO_PUBLIC_${key}`;
  if (typeof process !== "undefined" && process.env?.[expoPublicKey]) {
    return process.env[expoPublicKey];
  }

  return fallback;
};

// Firebase JS SDK uses this config on Android, iOS, and web.
// The native google-services files remain useful for native builds and EAS.
const firebaseConfig = {
  apiKey: getEnv("FIREBASE_API_KEY", "AIzaSyB45vz0PNa6GiZN34TROf9B-M_eUvM4G2U"),
  authDomain: getEnv(
    "FIREBASE_AUTH_DOMAIN",
    "power-training-coach.firebaseapp.com"
  ),
  projectId: getEnv("FIREBASE_PROJECT_ID", "power-training-coach"),
  storageBucket: getEnv(
    "FIREBASE_STORAGE_BUCKET",
    "power-training-coach.firebasestorage.app"
  ),
  messagingSenderId: getEnv("FIREBASE_MESSAGING_SENDER_ID", "410162189255"),
  appId: getEnv(
    "FIREBASE_APP_ID",
    "1:410162189255:web:023105817d8ceddbbcffe2"
  ),
  measurementId: getEnv("FIREBASE_MEASUREMENT_ID", "G-MMN29XQ5C5"),
};

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
  dbInstance = initializeFirestore(app, {
    experimentalAutoDetectLongPolling: true,
    useFetchStreams: false,
  });
} catch (error) {
  dbInstance = getFirestore(app);
}

export const auth = authInstance;
export const db = dbInstance;
export const storage = getStorage(app);
