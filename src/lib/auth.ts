
'use server';
import admin from 'firebase-admin';
import { config } from 'dotenv';

config();

const firebasePrivateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

export async function initializeFirebaseAdmin() {
    if (!admin.apps.length) {
        try {
            if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && firebasePrivateKey) {
                admin.initializeApp({
                    credential: admin.credential.cert({
                        projectId: process.env.FIREBASE_PROJECT_ID,
                        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                        privateKey: firebasePrivateKey,
                    }),
                });
                console.log('Firebase admin initialized with service account.');
            } else {
                console.warn('Service account environment variables not found, trying application default credentials.');
                admin.initializeApp({
                    credential: admin.credential.applicationDefault(),
                });
                console.log('Firebase admin initialized with application default credentials.');
            }
        } catch (error: any) {
            console.error('Firebase admin initialization error', error.message);
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
