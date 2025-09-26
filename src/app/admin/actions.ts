'use server';

import { deleteArticle, updateArticle, updateArticleComments } from '@/lib/data-admin';
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
    const result = await updateArticleComments(slug, comments);
    
    if (result) {
        // Revalider les pages pour afficher les nouveaux commentaires
        revalidatePath(`/article/${slug}`);
        revalidatePath('/');
    }
    
    return result;
}