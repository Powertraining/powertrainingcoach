// Import the functions you need from the SDKs you need

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use

// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration

const firebaseConfig = {
  apiKey: "AIzaSyCCUUW_GS8Qx_0_kSOcmgjsFx-ao0HXqPQ",

  authDomain: "powertrainingcoach.firebaseapp.com",

  projectId: "powertrainingcoach",

  storageBucket: "powertrainingcoach.firebasestorage.app",

  messagingSenderId: "751284866254",

  appId: "1:751284866254:web:bbfd9662871005cc98d49f",
};

// Initialize Firebase

const app = initializeApp(firebaseConfig);

// Initialize Firebase Services

export const auth = getAuth(app);
export const db = getFirestore(app);
