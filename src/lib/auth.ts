
import 'server-only';
import admin from 'firebase-admin';

async function initializeFirebaseAdmin() {
    if (!admin.apps.length) {
        try {
            admin.initializeApp({
                credential: admin.credential.applicationDefault(),
            });
        } catch (error) {
            console.error('Firebase admin initialization error', error);
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
