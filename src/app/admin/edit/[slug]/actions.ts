
'use server';

import { z } from 'zod';
import { updateArticle } from '@/lib/data';
import { revalidatePath } from 'next/cache';

const formSchema = z.object({
  title: z.string(),
  author: z.string(),
  category: z.string(),
  content: z.string(),
  scheduledFor: z.string().optional(),
});

export async function updateArticleAction(slug: string, values: z.infer<typeof formSchema>) {
  const validatedFields = formSchema.safeParse(values);

  if (!validatedFields.success) {
    throw new Error('Champs de formulaire invalides');
  }

  const updatedArticle = updateArticle(slug, validatedFields.data);

  if (!updatedArticle) {
    throw new Error('Article non trouvé');
  }

  // Revalidate paths to show the changes immediately
  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath('/article/[slug]', 'page');
  revalidatePath(`/category/${validatedFields.data.category.toLowerCase().replace(' & ', '-').replace(/\s+/g, '-')}`);

  return updatedArticle;
}
