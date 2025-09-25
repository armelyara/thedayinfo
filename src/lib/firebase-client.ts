// src/lib/firebase-client.ts
import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

let app: ReturnType<typeof getApp> | undefined;
let db: ReturnType<typeof getFirestore> | undefined;
let auth: ReturnType<typeof getAuth> | undefined;

// Helper function to fetch config
async function getFirebaseConfig(): Promise<FirebaseOptions | null> {
  try {
    // This will work on the client-side
    const res = await fetch('/api/firebase-config');
    if (!res.ok) {
      console.error("Failed to fetch Firebase config:", res.status, await res.text());
      return null;
    }
    return res.json();
  } catch (error) {
    console.error("Error fetching Firebase config:", error);
    return null;
  }
}

// Asynchronously initialize Firebase
// This function will be called before any Firebase service is used.
export async function initializeFirebaseClient() {
  if (getApps().length) {
    app = getApp();
  } else {
    const firebaseConfig = await getFirebaseConfig();
    if (firebaseConfig) {
      app = initializeApp(firebaseConfig);
    } else {
      console.error("Firebase initialization failed: No config received.");
      // Handle the error appropriately in your app
      // Maybe show an error message to the user
      return;
    }
  }
  
  db = getFirestore(app);
  auth = getAuth(app);
}

// We will not export db and auth directly anymore.
// Instead, we export them as they are, but their initialization is now async.
export { app, db, auth };
