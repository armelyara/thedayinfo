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
    console.log('Firebase Admin already initialized');
    return;
  }

  console.log('Initialisation Firebase Admin...');
  console.log('Environment check:', {
    hasFirebaseConfig: !!process.env.FIREBASE_CONFIG,
    hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
    hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
    hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
    nodeEnv: process.env.NODE_ENV,
  });

  try {
    // On Firebase App Hosting, credentials are automatically provided
    // via FIREBASE_CONFIG environment variable
    if (process.env.FIREBASE_CONFIG) {
      console.log('Using Firebase App Hosting automatic credentials');

      try {
        // Parse FIREBASE_CONFIG to get project info
        const firebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG);
        console.log('Parsed FIREBASE_CONFIG, projectId:', firebaseConfig.projectId);

        // Initialize with the project ID from FIREBASE_CONFIG
        // Firebase App Hosting provides automatic credentials via Application Default Credentials (ADC)
        admin.initializeApp({
          projectId: firebaseConfig.projectId,
        });

        console.log('✅ Firebase Admin initialized successfully with FIREBASE_CONFIG');
      } catch (parseError: any) {
        console.error('Failed to parse FIREBASE_CONFIG:', parseError);
        throw new Error('Invalid FIREBASE_CONFIG format');
      }
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
      console.log('✅ Firebase admin initialisé avec les variables d\'environnement explicites.');
    }
  } catch (error: any) {
    console.error('❌ Échec de l\'initialisation Firebase Admin:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    throw error;
  }

  adminInitialized = true;
}

export async function verifySession(session: string) {
  try {
    await initializeFirebaseAdmin();
  } catch (error) {
    console.error('Failed to initialize Firebase Admin in verifySession:', error);
    return null;
  }

  // If in build, return null to avoid errors
  if (process.env.IS_BUILD) {
    return null;
  }

  try {
    const decodedClaims = await admin.auth().verifySessionCookie(session, true);
    return decodedClaims;
  } catch (error: any) {
    console.error('Session verification failed:', {
      error: error.message,
      code: error.code,
      hasFirebaseConfig: !!process.env.FIREBASE_CONFIG,
      hasFirebaseWebappConfig: !!process.env.FIREBASE_WEBAPP_CONFIG,
    });
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
