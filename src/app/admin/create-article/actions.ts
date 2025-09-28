'use server';

import { z } from 'zod';
import { saveDraftAction as saveDraft, saveArticleAction as saveArticle } from '@/lib/data-admin';
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

export async function saveDraftActionServer(draftData: Partial<Draft>) {
  try {
    const savedDraft = await saveDraft(draftData);
    revalidatePath('/admin/drafts');
    return savedDraft;
  } catch (error) {
    console.error('Error saving draft:', error);
    throw new Error('Erreur lors de la sauvegarde du brouillon');
  }
}

export async function saveArticleAction(articleData: {
  id?: string;
  title: string;
  author: string;
  category: string;
  content: string;
  image: { src: string; alt: string };
  scheduledFor?: string;
  actionType: 'draft' | 'publish' | 'schedule';
}): Promise<Article | Draft> {
  try {
    const result = await saveArticle(articleData);
    
    // Revalidate paths
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
