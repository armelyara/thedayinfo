'use server';

import { Timestamp as AdminTimestamp } from 'firebase-admin/firestore';
import type { Subscriber } from '../data-types';
import { getDb } from './db';

/**
 * Get subscriber by email address
 */
export async function getSubscriberByEmail(email: string): Promise<Subscriber | null> {
  const db = await getDb();
  const q = db.collection('subscribers').where('email', '==', email.toLowerCase());
  const snapshot = await q.get();

  if (snapshot.empty) {
    return null;
  }

  const data = snapshot.docs[0].data();
  return {
    email: data.email,
    name: data.name || '',
    subscribedAt: data.subscribedAt.toDate().toISOString(),
    status: data.status || 'active',
    unsubscribeToken: data.unsubscribeToken,
    preferences: data.preferences,
  };
}

/**
 * Add a new subscriber
 */
export async function addSubscriber(
  email: string,
  name?: string,
  preferences?: any
): Promise<Subscriber> {
  const db = await getDb();
  const subscribersCollection = db.collection('subscribers');

  const querySnapshot = await subscribersCollection
    .where('email', '==', email.toLowerCase())
    .limit(1)
    .get();

  if (!querySnapshot.empty) {
    throw new Error('Cette adresse email est déjà abonnée.');
  }

  const docRef = subscribersCollection.doc(); // Let Firestore generate ID

  // Generate unique token for unsubscribe
  const crypto = require('crypto');
  const unsubscribeToken = crypto.randomBytes(32).toString('hex');

  const subscriberData = {
    email: email.toLowerCase(),
    name: name || '',
    subscribedAt: AdminTimestamp.now(),
    status: 'active' as const,
    unsubscribeToken: unsubscribeToken,
    preferences: preferences || {},
  };

  await docRef.set(subscriberData);

  return {
    ...subscriberData,
    subscribedAt: subscriberData.subscribedAt.toDate().toISOString(),
  };
}

/**
 * Get all subscribers (for admin)
 */
export async function getSubscribers(): Promise<Subscriber[]> {
  try {
    const db = await getDb();
    const subscribersCollection = db.collection('subscribers');
    const snapshot = await subscribersCollection.orderBy('subscribedAt', 'desc').get();
    console.log(`[subscribers] Found ${snapshot.size} total subscribers.`);

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        email: data.email,
        name: data.name || '',
        subscribedAt: data.subscribedAt.toDate().toISOString(),
        status: data.status || 'active',
        preferences: data.preferences,
      };
    });
  } catch (e) {
    console.error('[subscribers] Failed to fetch subscribers.', e);
    throw e;
  }
}

/**
 * Get all active subscribers (for newsletters/cron)
 */
export async function getAllSubscribers(): Promise<Subscriber[]> {
  try {
    const db = await getDb();
    const subscribersCollection = db.collection('subscribers');
    const q = subscribersCollection.where('status', '==', 'active');

    const snapshot = await q.get();

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        email: data.email,
        name: data.name || '',
        subscribedAt: data.subscribedAt.toDate().toISOString(),
        status: data.status,
        unsubscribeToken: data.unsubscribeToken || doc.id,
        preferences: data.preferences,
      } as Subscriber;
    });
  } catch (error) {
    console.error('Error fetching active subscribers (getAllSubscribers):', error);
    return [];
  }
}

/**
 * Delete a subscriber by email
 */
export async function deleteSubscriber(email: string): Promise<boolean> {
  const db = await getDb();
  const q = db.collection('subscribers').where('email', '==', email.toLowerCase());
  const snapshot = await q.get();

  if (snapshot.empty) {
    console.warn(`Subscriber with email ${email} not found for deletion.`);
    return false;
  }

  try {
    const docRef = snapshot.docs[0].ref;
    await docRef.delete();
    return true;
  } catch (error) {
    console.error('Error deleting subscriber:', error);
    return false;
  }
}

/**
 * Update subscriber status
 */
export async function updateSubscriberStatus(
  email: string,
  status: 'active' | 'inactive' | 'unsubscribed'
): Promise<boolean> {
  const db = await getDb();
  const q = db.collection('subscribers').where('email', '==', email.toLowerCase());
  const snapshot = await q.get();

  if (snapshot.empty) {
    console.warn(`Subscriber with email ${email} not found for status update.`);
    return false;
  }

  try {
    const docRef = snapshot.docs[0].ref;
    await docRef.update({ status });
    return true;
  } catch (error) {
    console.error('Error updating subscriber status:', error);
    return false;
  }
}
