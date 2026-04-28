import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Demo fallbacks keep the academic project runnable without local env values.
const readEnv = (name: string, fallback: string) => {
  const value = process.env[name];
  if (!value) return fallback;
  return value;
};

const firebaseConfig = {
  apiKey: readEnv(
    "NEXT_PUBLIC_FIREBASE_API_KEY",
    "AIzaSyAQ7FIs5ih64zyX3dXXbzabYEgH27F7SUk"
  ),
  authDomain: readEnv(
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
    "student-attendance-83c95.firebaseapp.com"
  ),
  projectId: readEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID", "student-attendance-83c95"),
  storageBucket: readEnv(
    "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
    "student-attendance-83c95.firebasestorage.app"
  ),
  messagingSenderId: readEnv(
    "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
    "358311393536"
  ),
  appId: readEnv(
    "NEXT_PUBLIC_FIREBASE_APP_ID",
    "1:358311393536:web:30b2368fc9609c62b39be5"
  ),
  measurementId: readEnv("NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID", "G-TDGEKSY9W7"),
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
