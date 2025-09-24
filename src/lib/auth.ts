'use server';
import admin from 'firebase-admin';

// Garde une trace de l'initialisation pour éviter de le faire plusieurs fois.
let adminInitialized = false;

export async function initializeFirebaseAdmin() {
  if (adminInitialized) {
    return;
  }

  console.log('Initialisation Firebase Admin...');
  console.log('Variables disponibles:', {
    projectId: !!process.env.FIREBASE_PROJECT_ID,
    clientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: !!process.env.FIREBASE_PRIVATE_KEY
  });

  if (admin.apps.length === 0) {
    // Utiliser les credentials explicites pour Firebase Studio
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error(`Firebase Admin credentials manquantes:
        PROJECT_ID: ${!!projectId}
        CLIENT_EMAIL: ${!!clientEmail} 
        PRIVATE_KEY: ${!!privateKey}
      `);
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      projectId,
    });
    
    console.log('Firebase admin initialized with explicit credentials.');
  }
  
  adminInitialized = true;
}

export async function verifySession(session: string) {
    await initializeFirebaseAdmin();
    try {
        const decodedClaims = await admin.auth().verifySessionCookie(session, true);
        return decodedClaims;
    } catch (error) {
        return null;
    }
}

export async function createSessionCookie(idToken: string, options: { expiresIn: number }) {
    await initializeFirebaseAdmin();
    return admin.auth().createSessionCookie(idToken, options);
}
