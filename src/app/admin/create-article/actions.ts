'use server';

import { z } from 'zod';
import { addArticle, saveDraft, saveArticle } from '@/lib/data-admin';
import { revalidatePath } from 'next/cache';
import type { Article, Draft } from '@/lib/data-types';

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

export async function createArticle(values: z.infer<typeof formSchema>): Promise<Article> {
  const validatedFields = formSchema.safeParse(values);

  if (!validatedFields.success) {
    console.error('Validation failed:', validatedFields.error);
    throw new Error('Champs de formulaire invalides');
  }

  const { scheduledFor, ...rest } = validatedFields.data;

  const newArticle = await addArticle({
    ...rest,
    scheduledFor: scheduledFor,
  });

  // Revalidate paths to show the new article immediately
  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath('/article/[slug]', 'page');
  revalidatePath(`/category/${validatedFields.data.category.toLowerCase().replace(' & ', '-').replace(/\s+/g, '-')}`);

  return newArticle;
}

// Nouvelle fonction pour sauvegarder un brouillon
export async function saveDraftAction(draftData: Partial<Draft>) {
  try {
    const savedDraft = await saveDraft(draftData);
    return savedDraft;
  } catch (error) {
    console.error('Error saving draft:', error);
    throw new Error('Erreur lors de la sauvegarde du brouillon');
  }
}

// Nouvelle fonction pour sauvegarder un article avec différents statuts
export async function saveArticleAction(articleData: {
  title: string;
  author: string;
  category: string;
  content: string;
  image: { src: string; alt: string };
  scheduledFor?: string;
  actionType: 'draft' | 'publish' | 'schedule';
}) {
  try {
    let savedArticle: Article;
    
    if (articleData.actionType === 'draft') {
      // Sauvegarder comme brouillon
      savedArticle = await saveArticle({
        ...articleData,
        forceStatus: 'draft'
      });
    } else if (articleData.actionType === 'schedule') {
      // Programmer la publication
      savedArticle = await saveArticle({
        ...articleData,
        forceStatus: 'scheduled'
      });
    } else {
      // Publier immédiatement
      savedArticle = await saveArticle({
        ...articleData,
        forceStatus: 'published'
      });
    }
    
    // Revalidate les paths
    revalidatePath('/');
    revalidatePath('/admin');
    revalidatePath('/article/[slug]', 'page');
    
    return savedArticle;
  } catch (error) {
    console.error('Error saving article:', error);
    throw new Error('Erreur lors de la sauvegarde de l\'article');
  }
}