
'use server';

import { z } from 'zod';
import { updateArticle, getArticleBySlug } from '@/lib/data';
import { revalidatePath } from 'next/cache';
import type { Article } from '@/lib/data';

const formSchema = z.object({
  title: z.string(),
  author: z.string(),
  category: z.string(),
  content: z.string(),
  scheduledFor: z.string().optional().nullable(),
});

export async function updateArticleAction(slug: string, values: z.infer<typeof formSchema>): Promise<Article> {
  const validatedFields = formSchema.safeParse(values);

  if (!validatedFields.success) {
    console.error('Validation failed:', validatedFields.error);
    throw new Error('Champs de formulaire invalides');
  }

  const { scheduledFor, ...rest } = validatedFields.data;
  
  const updatedArticle = await updateArticle(slug, {
    ...rest,
    scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
  });

  // Revalidate paths to show the changes immediately
  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath(`/article/${updatedArticle.slug}`);
  revalidatePath(`/category/${validatedFields.data.category.toLowerCase().replace(' & ', '-').replace(/\s+/g, '-')}`);

  return updatedArticle;
}

export async function getArticleAction(slug: string): Promise<Article | null> {
    return getArticleBySlug(slug);
}

    