'use server';

import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';
import { initializeFirebaseAdmin } from '../auth';

/**
 * Get Firestore database instance
 *
 * Initializes Firebase Admin SDK if not already initialized.
 * During build time (IS_BUILD=true), throws an error to prevent
 * unnecessary Firebase connections.
 *
 * @returns Firestore database instance
 * @throws Error if called during build time
 */
export async function getDb() {
  // During build, Firebase Admin is not initialized - throw error to be caught by callers
  if (process.env.IS_BUILD) {
    throw new Error('Firebase Admin is not available during build time');
  }
  await initializeFirebaseAdmin();
  return getAdminFirestore();
}
