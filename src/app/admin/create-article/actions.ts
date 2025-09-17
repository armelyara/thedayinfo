'use server';

import { z } from 'zod';
import { addArticle } from '@/lib/data';
import { revalidatePath } from 'next/cache';

const formSchema = z.object({
  title: z.string(),
  author: z.string(),
  category: z.string(),
  content: z.string(),
  scheduledFor: z.string().optional(),
});

export async function createArticle(values: z.infer<typeof formSchema>) {
  const validatedFields = formSchema.safeParse(values);

  if (!validatedFields.success) {
    throw new Error('Invalid form data');
  }

  const { scheduledFor, ...rest } = validatedFields.data;

  const newArticle = await addArticle({
    ...rest,
    scheduledFor: scheduledFor, // CORRIGÉ - Passer directement la string, pas new Date()
  });

  // Revalidate paths to show the new article immediately
  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath('/article/[slug]', 'page');
  revalidatePath(`/category/${validatedFields.data.category.toLowerCase().replace(' & ', '-').replace(/\s+/g, '-')}`);

  return newArticle;
}