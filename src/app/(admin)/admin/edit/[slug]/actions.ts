
'use server';

import { z } from 'zod';
import { saveArticleAction as saveArticleAdmin, getDraft as getDraftAdmin, getArticleBySlug as getArticleAdmin } from '@/lib/data-admin';
import { revalidatePath } from 'next/cache';
import { DraftSchema } from '@/lib/validation-schemas';
import type { Article, Draft } from '@/lib/data-types';

type FormValues = z.infer<typeof DraftSchema>;

export async function updateItemAction(
  idOrSlug: string,
  values: FormValues,
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
      scheduledFor: values.scheduledFor ?? undefined,
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

