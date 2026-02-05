import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";
import { getStorage, FirebaseStorage } from "firebase/storage";

// Get Firebase config from either local env vars or Firebase App Hosting
let firebaseConfig: any;

if (typeof window === 'undefined' && process.env.FIREBASE_WEBAPP_CONFIG) {
  // Server-side on Firebase App Hosting
  try {
    firebaseConfig = JSON.parse(process.env.FIREBASE_WEBAPP_CONFIG);
    console.log('Using Firebase App Hosting webapp config');
  } catch (error) {
    console.error('Failed to parse FIREBASE_WEBAPP_CONFIG:', error);
    firebaseConfig = {};
  }
} else {
  // Client-side or local development
  firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
}

// CORRECTION : Ajout des types explicites pour éviter l'erreur "implicitly has an 'any' type"
let app: FirebaseApp | undefined;
let db: Firestore | undefined;
let auth: Auth | undefined;
let storage: FirebaseStorage | undefined;

const isValidConfig = firebaseConfig.apiKey && firebaseConfig.projectId;

// MODIFICATION MAJEURE : On a retiré "isBrowser" de la condition
// Next.js a besoin de Firebase sur le serveur pour le SSR
if (isValidConfig) {
  try {
    // Singleton : On réutilise l'app si elle existe déjà
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    storage = getStorage(app);
  } catch (e) {
    console.error('Erreur initialisation Firebase:', e);
  }
} else {
  // Warning seulement en dev pour ne pas polluer les logs de build
  if (process.env.NODE_ENV !== 'production' && !process.env.IS_BUILD) {
    console.warn('⚠️ Config Firebase manquante ou incomplète');
    console.warn('Config reçue:', {
      hasApiKey: !!firebaseConfig.apiKey,
      hasProjectId: !!firebaseConfig.projectId
    });
  }
}

export async function initializeFirebaseClient() {
  return app;
}

export { app, db, auth, storage };