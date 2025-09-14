
'use server';

import { deleteArticle as deleteArticleData, updateArticleComments, type Comment, getAdminArticles } from '@/lib/data';
import { revalidatePath } from 'next/cache';

export async function deleteArticleAction(slug: string) {
  const result = await deleteArticleData(slug);
  
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

export async function getAdminArticlesAction() {
    return getAdminArticles();
}
