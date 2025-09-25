
'use server';

import { deleteArticle, updateArticle } from '@/lib/data-admin';
import { updateArticleComments } from '@/lib/data-client';
import type { Comment } from '@/lib/data-types';
import { revalidatePath } from 'next/cache';

export async function deleteArticleAction(slug: string) {
  const result = await deleteArticle(slug);
  
  if (result) {
    revalidatePath('/admin');
    revalidatePath('/');
    return { success: true };
  } else {
    return { success: false, error: 'Article non trouvé' };
  }
}

export async function postCommentAdminAction(slug: string, comments: Comment[]) {
    return await updateArticleComments(slug, comments);
}
