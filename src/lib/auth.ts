'use server';
import admin from 'firebase-admin';

// Garde une trace de l'initialisation pour éviter de le faire plusieurs fois.
let adminInitialized = false;

export async function initializeFirebaseAdmin() {
  if (adminInitialized) {
    return;
  }

  // Initialise le SDK Admin sans passer de credentials.
  // Il utilisera automatiquement les "Application Default Credentials" 
  // fournies par l'environnement d'hébergement.
  if (admin.apps.length === 0) {
    admin.initializeApp();
    console.log('Firebase admin initialized with Application Default Credentials.');
  }
  
  adminInitialized = true;
}

export async function verifySession(session: string) {
    await initializeFirebaseAdmin();
    try {
        const decodedClaims = await admin.auth().verifySessionCookie(session, true);
        return decodedClaims;
    } catch (error) {
        // Le cookie de session est invalide.
        return null;
    }
}

export async function createSessionCookie(idToken: string, options: { expiresIn: number }) {
    await initializeFirebaseAdmin();
    return admin.auth().createSessionCookie(idToken, options);
}
