// src/app/admin/create-article/actions.ts
'use server';

import { z } from 'zod';
import { addArticle } from '@/lib/data';
import { revalidatePath } from 'next/cache';
import type { Article } from '@/lib/data'; // CORRIGÉ - Import pour le type de retour

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
