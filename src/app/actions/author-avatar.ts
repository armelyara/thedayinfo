// src/app/actions/author-avatar.ts
'use server';

import { getProfile } from '@/lib/data-client';

/**
 * Récupère l'URL de l'avatar de l'auteur depuis le profil
 * @returns L'URL de l'avatar ou null si non trouvé
 */
export async function getAuthorAvatarUrl(): Promise<string | null> {
  try {
    const profile = await getProfile();
    return profile?.imageUrl || null;
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'avatar:', error);
    return null;
  }
}