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

// Cette fonction n'est plus utilisée directement, saveArticleAction la remplace
export async function createArticle(values: z.infer<typeof formSchema>): Promise<Article | Draft> {
  const validatedFields = formSchema.safeParse(values);

  if (!validatedFields.success) {
    console.error('Validation failed:', validatedFields.error);
    throw new Error('Champs de formulaire invalides');
  }

  const { scheduledFor, ...rest } = validatedFields.data;

  const actionType = scheduledFor ? 'schedule' : 'publish';

  const newArticle = await saveArticle({
    ...rest,
    scheduledFor: scheduledFor,
    actionType
  });

  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath('/admin/drafts');
  
  if (actionType === 'publish' && 'slug' in newArticle) {
    revalidatePath(`/article/${newArticle.slug}`);
  }
  
  if (rest.category) {
      revalidatePath(`/category/${rest.category.toLowerCase().replace(' & ', '-').replace(/\s+/g, '-')}`);
  }

  return newArticle;
}

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
