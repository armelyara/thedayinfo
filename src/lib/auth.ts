
'use server';
import admin from 'firebase-admin';

export async function initializeFirebaseAdmin() {
    if (!admin.apps.length) {
        try {
            // This will use the GOOGLE_APPLICATION_CREDENTIALS environment variable
            // or the default service account when running on Google Cloud.
            admin.initializeApp({
                credential: admin.credential.applicationDefault(),
            });
        } catch (error) {
            console.error('Firebase admin initialization error', error);
            // We should not proceed if the admin SDK fails to initialize.
            throw new Error('Firebase Admin SDK failed to initialize.');
        }
    }
}

export async function verifySession(session: string) {
    await initializeFirebaseAdmin();
    if (!admin.apps.length) return null;
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
    if (!admin.apps.length) throw new Error("Firebase Admin SDK is not initialized.");
    return admin.auth().createSessionCookie(idToken, options);
}
