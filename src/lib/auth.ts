'use server';
import admin, { AppOptions } from 'firebase-admin';

let adminInitialized = false;

export async function initializeFirebaseAdmin() {
  if (adminInitialized) {
    return;
  }

  // Do not initialize during build
  if (process.env.IS_BUILD) {
    console.log('Skipping Firebase Admin initialization during build');
    return;
  }

  if (admin.apps.length > 0) {
    adminInitialized = true;
    return;
  }

  console.log('Initialisation Firebase Admin...');

  try {
    // On Firebase App Hosting, credentials are automatically provided
    // via FIREBASE_CONFIG environment variable
    if (process.env.FIREBASE_CONFIG) {
      console.log('Using Firebase App Hosting automatic credentials');
      admin.initializeApp();
    } else {
      // For local development, use explicit credentials
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
  } catch (error) {
    console.error('Échec de l\'initialisation Firebase Admin:', error);
    throw error;
  }

  adminInitialized = true;
}

export async function verifySession(session: string) {
  await initializeFirebaseAdmin();
  // If in build, return null to avoid errors
  if (process.env.IS_BUILD) {
    return null;
  }
  try {
    const decodedClaims = await admin.auth().verifySessionCookie(session, true);
    return decodedClaims;
  } catch (error) {
    return null;
  }
}

export async function createSessionCookie(idToken: string, options: { expiresIn: number }) {
  await initializeFirebaseAdmin();
  // If in build, return an empty string to avoid errors
  if (process.env.IS_BUILD) {
    return '';
  }
  return admin.auth().createSessionCookie(idToken, options);
}
