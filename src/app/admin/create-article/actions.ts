
'use server';

import { z } from 'zod';
import { addArticle } from '@/lib/data';
import { revalidatePath } from 'next/cache';

const formSchema = z.object({
  title: z.string(),
  author: z.string(),
  category: z.string(),
  content: z.string(),
  scheduledFor: z.date().optional(),
});

export async function createArticle(values: z.infer<typeof formSchema>) {
  const validatedFields = formSchema.safeParse(values);

  if (!validatedFields.success) {
    throw new Error('Invalid form data');
  }

  const newArticle = await addArticle(validatedFields.data);

  // Revalidate paths to show the new article immediately
  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath('/article/[slug]', 'page');
  revalidatePath(`/category/${validatedFields.data.category.toLowerCase().replace(' & ', '-').replace(/\s+/g, '-')}`);


  return newArticle;
}
