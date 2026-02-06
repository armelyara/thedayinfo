'use server';

import { z } from 'zod';
import { saveDraftAction as saveDraft, saveArticleAction as saveArticle, getDraft as getDraftFromDb } from '@/lib/data-admin';
import { revalidatePath } from 'next/cache';
import type { Article, Draft } from '@/lib/data-types';

// Le schéma Zod reste inchangé car il n'est utilisé que pour la validation interne ici
const formSchema = z.object({
  title: z.string(),
  author: z.string(),
  category: z.string(),
  content: z.string(),
  image: z.object({
    src: z.string().url().or(z.string().startsWith('data:image')),
    alt: z.string(),
  }),
  scheduledFor: z.string().optional(),
});

/**
 * Sauvegarde un brouillon et s'assure que 'scheduledFor' est une chaîne de caractères.
 */
export async function saveDraftActionServer(draftData: Partial<Draft>) {
  try {
    const dataToSave = { ...draftData };

    // Si scheduledFor est un objet Date, on le convertit en string.
    if (dataToSave.scheduledFor && dataToSave.scheduledFor instanceof Date) {
      dataToSave.scheduledFor = dataToSave.scheduledFor.toISOString();
    }

    const savedDraft = await saveDraft(dataToSave as Partial<Draft>);
    revalidatePath('/admin/drafts');
    return savedDraft;
  } catch (error) {
    console.error('Error saving draft:', error);
    throw new Error('Erreur lors de la sauvegarde du brouillon');
  }
}

/**
 * Sauvegarde, programme ou publie un article.
 * S'assure également que 'scheduledFor' est une chaîne de caractères.
 */
export async function saveArticleAction(articleData: {
  id?: string;
  title: string;
  author: string;
  category: string;
  content: string;
  image: { src: string; alt: string };
  scheduledFor?: string | Date | null; // Accepte Date, string ou null
  actionType: 'draft' | 'publish' | 'schedule';
}): Promise<Article | Draft> {
  try {
    const dataToSave = { ...articleData };

    // Si scheduledFor est un objet Date, on le convertit en string.
    if (dataToSave.scheduledFor && dataToSave.scheduledFor instanceof Date) {
      dataToSave.scheduledFor = dataToSave.scheduledFor.toISOString();
    }

    // Le type `any` est utilisé car la fonction `saveArticle` sous-jacente attend une chaîne.
    const result = await saveArticle(dataToSave as any);

    // Revalidation des chemins
    revalidatePath('/');
    revalidatePath('/admin');
    revalidatePath('/admin/drafts');
    if (articleData.actionType === 'publish' && 'slug' in result) {
      revalidatePath(`/article/${result.slug}`);
    }

    return result;
  } catch (error) {
    console.error('Error saving article:', error);
    throw new Error("Erreur lors de la sauvegarde de l'article");
  }
}

/**
 * Récupère un brouillon par son ID.
 */
export async function getDraft(id: string): Promise<Draft | null> {
  try {
    return await getDraftFromDb(id);
  } catch (error) {
    console.error('Error fetching draft:', error);
    return null;
  }
}