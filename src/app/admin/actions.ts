
'use server';

import { deleteArticle as deleteArticleData } from '@/lib/data';
import { revalidatePath } from 'next/cache';

export async function deleteArticleAction(slug: string) {
  const result = deleteArticleData(slug);
  
  if (result) {
    revalidatePath('/admin');
    revalidatePath('/');
    return { success: true };
  } else {
    return { success: false, error: 'Article non trouvé' };
  }
}
