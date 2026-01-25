import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";
import { getStorage, FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Fonction d'initialisation immédiate pour éviter les variables "let" flottantes
function initServices() {
  const isConfigValid = !!firebaseConfig.projectId;

  if (!isConfigValid) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[Firebase] ⚠️ Configuration manquante. Vérifiez .env.local');
    }
    return { app: undefined, db: undefined, auth: undefined, storage: undefined };
  }

  try {
    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const auth = getAuth(app);
    const storage = getStorage(app);

    console.log('[Firebase] ✅ Services initialisés avec succès.');
    return { app, db, auth, storage };
  } catch (error) {
    console.error('[Firebase] ❌ Erreur critique:', error);
    return { app: undefined, db: undefined, auth: undefined, storage: undefined };
  }
}

// Initialisation immédiate (garantit que les exports sont prêts)
const { app, db, auth, storage } = initServices();

// Export asynchrone pour compatibilité si nécessaire
export async function initializeFirebaseClient() {
  return app;
}

export { app, db, auth, storage };