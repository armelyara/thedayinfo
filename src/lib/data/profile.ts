'use server';

import { Timestamp as AdminTimestamp } from 'firebase-admin/firestore';
import type { Profile } from '../data-types';
import { getDb } from './db';

/**
 * Get site profile configuration
 */
export async function getProfile(): Promise<Profile | null> {
  try {
    const db = await getDb();
    const docRef = db.collection('site-config').doc('profile');
    const doc = await docRef.get();

    if (!doc.exists) {
      return null;
    }

    const data = doc.data()!;
    return data as Profile;
  } catch (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
}

/**
 * Update site profile configuration
 */
export async function updateProfile(data: Partial<Profile>): Promise<Profile> {
  const db = await getDb();
  const docRef = db.collection('site-config').doc('profile');
  await docRef.set(data, { merge: true });
  const updatedDoc = await docRef.get();
  return updatedDoc.data() as Profile;
}
