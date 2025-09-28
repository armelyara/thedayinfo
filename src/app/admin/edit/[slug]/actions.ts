
'use server';

import { z } from 'zod';
import { saveArticleAction as saveArticleAdmin, getDraft as getDraftAdmin, getArticleBySlug as getArticleAdmin } from '@/lib/data-admin';
import { revalidatePath } from 'next/cache';
import type { Article, Draft } from '@/lib/data-types';

const formSchema = z.object({
  title: z.string().min(1, 'Le titre est requis.'),
  author: z.string().min(1, "L'auteur est requis."),
  category: z.string().min(1, 'La catégorie est requise.'),
  content: z.string().min(1, 'Le contenu est requis.'),
  image: z.object({
    src: z.string().url().or(z.string().startsWith('data:image')),
    alt: z.string(),
  }),
  scheduledFor: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

export async function updateItemAction(
    idOrSlug: string, 
    values: FormValues,
    actionType: 'draft' | 'publish' | 'schedule',
    isDraft: boolean
): Promise<Article | Draft> {
  const validatedFields = formSchema.safeParse(values);

  if (!validatedFields.success) {
    console.error('Validation failed:', validatedFields.error);
    throw new Error('Champs de formulaire invalides');
  }

  const { scheduledFor, ...rest } = validatedFields.data;
  
  const articleData = {
      ...rest,
      id: isDraft ? idOrSlug : undefined, // L'ID n'est pertinent que pour les brouillons/articles
      slug: isDraft ? undefined : idOrSlug, // Le slug n'est pertinent que pour les articles publiés
      scheduledFor: scheduledFor ? scheduledFor : undefined,
      actionType,
  };

  const result = await saveArticleAdmin(articleData);

  // Revalidate paths
  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath('/admin/drafts');
  if ('slug' in result && result.status === 'published') {
      revalidatePath(`/article/${result.slug}`);
  }
  revalidatePath(`/category/${validatedFields.data.category.toLowerCase().replace(' & ', '-').replace(/\s+/g, '-')}`);

  return result;
}

export async function getArticleAction(slug: string): Promise<Article | null> {
    return getArticleAdmin(slug);
}

export async function getDraftAction(id: string): Promise<Draft | null> {
    return getDraftAdmin(id);
}

    