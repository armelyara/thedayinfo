'use server';

import { 
    saveDraft, 
    getDrafts, 
    getDraft, 
    deleteDraft, 
    saveArticle,
    publishFromDraft,
    getArticleVersions,
    publishScheduledArticle
} from '@/lib/data-admin';
import type { Draft, Article, ArticleVersion } from '@/lib/data-types';
import { revalidatePath } from 'next/cache';

// Sauvegarder un brouillon externe (collection drafts)
export async function saveDraftAction(draftData: Partial<Draft>): Promise<Draft> {
    const savedDraft = await saveDraft(draftData);
    revalidatePath('/admin/drafts');
    return savedDraft;
}

// Sauvegarder un article (dans collection articles)
export async function saveArticleAction(articleData: {
    title: string,
    author: string,
    category: string,
    content: string,
    image: { src: string, alt: string },
    scheduledFor?: string,
    originalSlug?: string,
    actionType: 'draft' | 'publish' | 'schedule'
}): Promise<Article> {
    const forceStatus = articleData.actionType === 'draft' ? 'draft' as const
                      : articleData.actionType === 'publish' ? 'published' as const  
                      : 'scheduled' as const;
    
    const savedArticle = await saveArticle({
        ...articleData,
        forceStatus
    });
    
    revalidatePath('/');
    revalidatePath('/admin');
    revalidatePath('/admin/drafts');
    revalidatePath(`/article/${savedArticle.slug}`);
    
    return savedArticle;
}

// Publier depuis un brouillon externe
export async function publishDraftAction(autoSaveId: string, publicationType: 'publish' | 'schedule' | 'draft' = 'publish'): Promise<Article> {
    const publishedArticle = await publishFromDraft(autoSaveId, publicationType);
    
    revalidatePath('/');
    revalidatePath('/admin');
    revalidatePath('/admin/drafts');
    revalidatePath(`/article/${publishedArticle.slug}`);
    
    return publishedArticle;
}

// Actions existantes
export async function getDraftsAction(): Promise<Draft[]> {
    return await getDrafts();
}

export async function getDraftAction(autoSaveId: string): Promise<Draft | null> {
    return await getDraft(autoSaveId);
}

export async function deleteDraftAction(autoSaveId: string): Promise<boolean> {
    const result = await deleteDraft(autoSaveId);
    if (result) {
        revalidatePath('/admin/drafts');
    }
    return result;
}

// Nouvelles actions pour versioning
export async function getArticleVersionsAction(articleSlug: string): Promise<ArticleVersion[]> {
    return await getArticleVersions(articleSlug);
}

// Action pour publier articles programmés (pour cron job)
export async function publishScheduledArticleAction(slug: string): Promise<Article> {
    const publishedArticle = await publishScheduledArticle(slug);
    
    revalidatePath('/');
    revalidatePath(`/article/${publishedArticle.slug}`);
    
    return publishedArticle;
}