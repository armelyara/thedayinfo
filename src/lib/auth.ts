
'use server';
import admin, { AppOptions } from 'firebase-admin';

// Garde une trace de l'initialisation pour éviter de le faire plusieurs fois.
let adminInitialized = false;

/**
 * Initialise Firebase Admin SDK.
 * Utilise AppOptions pour une initialisation plus robuste sur App Hosting.
 */
export async function initializeFirebaseAdmin() {
  if (adminInitialized) {
    return;
  }
  
  if (admin.apps.length > 0) {
    adminInitialized = true;
    return;
  }

  console.log('Initialisation Firebase Admin...');

  try {
    // La méthode recommandée pour App Hosting.
    // Les credentials sont automatiquement fournis par l'environnement.
    admin.initializeApp(process.env as AppOptions);
    console.log('Firebase admin initialisé avec les credentials de l\'environnement.');
    
  } catch (error) {
    console.error('Échec de l\'initialisation par défaut, tentative avec les variables explicites...');
    
    // Fallback aux variables manuelles si la méthode par défaut échoue
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!projectId || !clientEmail || !privateKey) {
      console.error(`Firebase Admin credentials manquantes:
        PROJECT_ID: ${!!projectId}
        CLIENT_EMAIL: ${!!clientEmail} 
        PRIVATE_KEY: ${!!privateKey}
      `);
      throw new Error('Firebase Admin credentials manquantes.');
    }
    
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      projectId,
    });
    console.log('Firebase admin initialisé avec les variables d\'environnement explicites.');
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
