
'use server';
import admin from 'firebase-admin';
import { promises as fs } from 'fs';
import path from 'path';

// Define a type for the service account for better type safety
interface ServiceAccount {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
  universe_domain: string;
}

// Cached service account to avoid reading the file every time
let serviceAccount: ServiceAccount | null = null;
let adminInitialized = false;

async function getServiceAccount(): Promise<ServiceAccount> {
    if (serviceAccount) {
        return serviceAccount;
    }

    // Construct the path to the service account file
    const filePath = path.join(process.cwd(), 'src', 'lib', 'firebase-service-account.json');
    
    try {
        const fileContents = await fs.readFile(filePath, 'utf8');
        const parsedServiceAccount = JSON.parse(fileContents);
        
        // Very basic validation to ensure the file isn't empty or malformed
        if (!parsedServiceAccount.project_id || !parsedServiceAccount.private_key) {
             throw new Error('Service account file is missing required fields.');
        }

        serviceAccount = parsedServiceAccount;
        return serviceAccount as ServiceAccount;

    } catch (error) {
        console.error('Failed to read or parse service account file:', error);
        throw new Error('Could not load Firebase service account credentials. Make sure the file exists and is valid JSON.');
    }
}


export async function initializeFirebaseAdmin() {
    if (!adminInitialized && !admin.apps.length) {
        try {
            const cert = await getServiceAccount();
            admin.initializeApp({
                credential: admin.credential.cert(cert),
            });
            console.log('Firebase admin initialized with service account file.');
            adminInitialized = true;
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
