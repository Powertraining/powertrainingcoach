// Import the functions you need from the SDKs you need

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

// TODO: Add SDKs for Firebase products that you want to use

// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration

const firebaseConfig = {

  apiKey: "AIzaSyB45vz0PNa6GiZN34TROf9B-M_eUvM4G2U",

  authDomain: "power-training-coach.firebaseapp.com",

  projectId: "power-training-coach",

  storageBucket: "power-training-coach.firebasestorage.app",

  messagingSenderId: "410162189255",

  appId: "1:410162189255:web:023105817d8ceddbbcffe2",

  measurementId: "G-MMN29XQ5C5"

};


// Initialize Firebase

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firebase Services

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
