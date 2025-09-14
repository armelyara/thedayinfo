
'use server';
import admin from 'firebase-admin';
import serviceAccount from './firebase-service-account.json';

export async function initializeFirebaseAdmin() {
    if (!admin.apps.length) {
        try {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });
            console.log('Firebase admin initialized with service account file.');
        } catch (error: any) {
            console.error('Firebase admin initialization error', error.message);
            // This is a critical error, so we throw it.
            throw new Error('Firebase Admin SDK failed to initialize: ' + error.message);
        }
    }
}

export async function verifySession(session: string) {
    await initializeFirebaseAdmin();
    try {
        const decodedClaims = await admin.auth().verifySessionCookie(session, true);
        return decodedClaims;
    } catch (error) {
        // Session cookie is invalid.
        return null;
    }
}

export async function createSessionCookie(idToken: string, options: { expiresIn: number }) {
    await initializeFirebaseAdmin();
    return admin.auth().createSessionCookie(idToken, options);
}
