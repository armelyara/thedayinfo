
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
  values: any,
  actionType: 'draft' | 'publish' | 'schedule',
  isDraft: boolean,
  originalArticleSlug?: string
) {
  try {
    // If the article is published, we keep its existing slug
    let slugPourModification: string | undefined;

    if (!isDraft) {
      slugPourModification = idOrSlug;
    } else if (originalArticleSlug) {
      slugPourModification = originalArticleSlug;
    }

    const result = await saveArticleAdmin({
      ...values,
      actionType: actionType,
      id: isDraft ? idOrSlug : undefined,
      slug: slugPourModification,
    });

    revalidatePath('/admin/articles');
    revalidatePath('/admin/drafts');

    if (actionType === 'publish' && 'slug' in result) {
      revalidatePath(`/article/${result.slug}`);
    }

    return result;
  } catch (error) {
    console.error('Erreur mise à jour:', error);
    throw new Error('Erreur lors de la mise à jour');
  }
}

export async function getArticleAction(slug: string): Promise<Article | null> {
  return getArticleAdmin(slug);
}

export async function getDraftAction(id: string): Promise<Draft | null> {
  return getDraftAdmin(id);
}

