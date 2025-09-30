// src/lib/rate-limit-firestore.ts
'use server';

import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { initializeFirebaseAdmin } from './auth';

/**
 * Vérifie si une requête dépasse la limite de taux (avec Firestore)
 * @param identifier Identifiant unique (ex: "login:192.168.1.1")
 * @param limit Nombre maximum de requêtes autorisées
 * @param windowMs Fenêtre de temps en millisecondes
 * @returns Object avec { allowed: boolean, retryAfter: number }
 */
export async function checkRateLimitFirestore(
  identifier: string,
  limit: number,
  windowMs: number
): Promise<{ allowed: boolean; retryAfter: number }> {
  try {
    await initializeFirebaseAdmin();
    const db = getFirestore();
    const rateLimitRef = db.collection('rateLimits').doc(identifier);
    
    const now = Timestamp.now();

    // Transaction pour garantir la cohérence
    const result = await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(rateLimitRef);
      const data = doc.data();

      // Si pas de données ou fenêtre expirée
      if (!data || data.resetTime.toMillis() < Date.now()) {
        // Créer une nouvelle entrée
        transaction.set(rateLimitRef, {
          count: 1,
          resetTime: Timestamp.fromMillis(Date.now() + windowMs),
          lastAttempt: now,
          createdAt: now
        });
        return { allowed: true, retryAfter: 0 };
      }

      // Si la limite est atteinte
      if (data.count >= limit) {
        const retryAfter = Math.ceil((data.resetTime.toMillis() - Date.now()) / 1000);
        
        // Enregistrer la tentative bloquée
        transaction.update(rateLimitRef, {
          lastAttempt: now,
          blockedAttempts: (data.blockedAttempts || 0) + 1
        });
        
        return { allowed: false, retryAfter };
      }

      // Incrémenter le compteur
      transaction.update(rateLimitRef, {
        count: data.count + 1,
        lastAttempt: now
      });

      return { allowed: true, retryAfter: 0 };
    });

    return result;

  } catch (error) {
    console.error('Erreur rate limiting Firestore:', error);
    // En cas d'erreur, on autorise par défaut pour ne pas bloquer le service
    return { allowed: true, retryAfter: 0 };
  }
}

/**
 * Réinitialise le rate limit pour un identifiant
 */
export async function resetRateLimitFirestore(identifier: string): Promise<void> {
  try {
    await initializeFirebaseAdmin();
    const db = getFirestore();
    await db.collection('rateLimits').doc(identifier).delete();
  } catch (error) {
    console.error('Erreur reset rate limit:', error);
  }
}

/**
 * Obtient les statistiques de rate limiting pour un identifiant
 */
export async function getRateLimitStats(identifier: string): Promise<any> {
  try {
    await initializeFirebaseAdmin();
    const db = getFirestore();
    const doc = await db.collection('rateLimits').doc(identifier).get();
    
    if (!doc.exists) {
      return null;
    }
    
    const data = doc.data()!;
    return {
      count: data.count,
      resetTime: data.resetTime.toDate().toISOString(),
      lastAttempt: data.lastAttempt.toDate().toISOString(),
      blockedAttempts: data.blockedAttempts || 0
    };
  } catch (error) {
    console.error('Erreur stats rate limit:', error);
    return null;
  }
}

/**
 * Bannir une IP manuellement
 */
export async function banIdentifier(
  identifier: string,
  durationMs: number = 24 * 60 * 60 * 1000 // 24h par défaut
): Promise<void> {
  try {
    await initializeFirebaseAdmin();
    const db = getFirestore();
    
    await db.collection('rateLimits').doc(identifier).set({
      count: 999999,
      resetTime: Timestamp.fromMillis(Date.now() + durationMs),
      lastAttempt: Timestamp.now(),
      banned: true,
      bannedAt: Timestamp.now()
    });
    
    console.log(`✅ ${identifier} banni pour ${durationMs / 1000 / 60} minutes`);
  } catch (error) {
    console.error('Erreur bannissement:', error);
  }
}