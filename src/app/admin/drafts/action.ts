'use server';

import { 
    saveDraftAction as saveDraft, 
    getDrafts as getDraftsFromDb, 
    getDraft as getDraftFromDb, 
    deleteDraft as deleteDraftFromDb, 
    saveArticleAction as saveArticle,
    publishScheduledArticle as publishScheduled // Importation directe de la logique DB
} from '@/lib/data-admin';
import type { Draft, Article } from '@/lib/data-types';
import { revalidatePath } from 'next/cache';

// Sauvegarder un brouillon
export async function saveDraftAction(draftData: Partial<Draft>): Promise<Draft> {
    const savedDraft = await saveDraft(draftData);
    revalidatePath('/admin/drafts');
    return savedDraft;
}

// Action principale pour sauvegarder (publier, programmer, brouillon)
export async function saveArticleAction(articleData: {
    id?: string;
    title: string;
    author: string;
    category: string;
    content: string;
    image: { src: string; alt: string };
    scheduledFor?: string;
    actionType: 'draft' | 'publish' | 'schedule';
}): Promise<Article | Draft> {
    const savedItem = await saveArticle(articleData);
    
    revalidatePath('/');
    revalidatePath('/admin');
    revalidatePath('/admin/drafts');
    if ('slug' in savedItem) {
        revalidatePath(`/article/${savedItem.slug}`);
    }
    
    return savedItem;
}

// Récupérer tous les brouillons
export async function getDraftsAction(): Promise<Draft[]> {
    return await getDraftsFromDb();
}

// Récupérer un brouillon par ID
export async function getDraftAction(id: string): Promise<Draft | null> {
    return await getDraftFromDb(id);
}

// Supprimer un brouillon
export async function deleteDraftAction(id: string): Promise<boolean> {
    const result = await deleteDraftFromDb(id);
    if (result) {
        revalidatePath('/admin/drafts');
    }
    return result;
}

export async function publishScheduledArticleAction(draftId: string): Promise<Article> {
    const draft = await getDraftFromDb(draftId);
    if (!draft) throw new Error("Brouillon introuvable");
    const publishedArticle = await publishScheduled(draft);
    
    revalidatePath('/');
    revalidatePath('/admin');
    revalidatePath('/admin/drafts');
    revalidatePath(`/article/${publishedArticle.slug}`);
    
    return publishedArticle;
}

export async function publishDraftNow(draftId: string) {
  try {
    console.log("[Action] Publication immédiate demandée pour :", draftId);
    await publishScheduledArticleAction(draftId);
    return { success: true, message: "Article publié avec succès !" };
  } catch (error) {
    console.error("[Action] Erreur publication :", error);
    return { success: false, message: (error as Error).message || "Erreur lors de la publication." };
  }
}