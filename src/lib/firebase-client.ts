// src/lib/firebase-client.ts
import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

let app;
let db;
let auth;

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

// Export a getter for the services that ensures initialization
function getDb() {
  if (!db) throw new Error("Firestore is not initialized. Call initializeFirebaseClient first.");
  return db;
}

function getAuthInstance() {
  if (!auth) throw new Error("Auth is not initialized. Call initializeFirebaseClient first.");
  return auth;
}

function getClientApp() {
    if (!app) throw new Error("Firebase App is not initialized. Call initializeFirebaseClient first.");
    return app;
}


// We will not export db and auth directly anymore.
// Instead, we export the app instance and a function to get the services.
export { 
  getClientApp as app,
  getDb as db,
  getAuthInstance as auth
};
