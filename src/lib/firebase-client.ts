
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Only initialize Firebase in browser environment and when config is valid
let app: any;
let db: any;
let auth: any;
let storage: any;

// Check if we're in browser and have valid config
const isValidConfig = firebaseConfig.apiKey && firebaseConfig.projectId;
const isBrowser = typeof window !== 'undefined';

if (isBrowser && isValidConfig) {
  try {
    app = getApp();
  } catch (e) {
    app = initializeApp(firebaseConfig);
  }

  db = getFirestore(app);
  auth = getAuth(app);
  storage = getStorage(app);
} else {
  // During build or when config is missing, export undefined
  // This prevents initialization errors during Next.js build
  console.warn('Firebase client not initialized - missing config or not in browser');
}

// Asynchrone pour être cohérent, même si elle ne fait rien
export async function initializeFirebaseClient() {
  return app;
}

export { app, db, auth, storage };
