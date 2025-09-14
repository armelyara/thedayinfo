'use server';

import { updateArticleComments, type Comment, getPublishedArticles } from '@/lib/data';
import { suggestRelatedContent, type SuggestRelatedContentInput } from '@/ai/flows/related-content-suggestions';
import { revalidatePath } from 'next/cache';

export async function postCommentAction(slug: string, comments: Comment[]): Promise<Comment[]> {
    const success = await updateArticleComments(slug, comments);
    if (success) {
        revalidatePath(`/article/${slug}`);
        return comments;
    }
    // In case of failure, return the original comments array to avoid UI flicker
    // A real app might want to handle this failure more explicitly
    return comments; 
}


export async function getRelatedContentAction(input: SuggestRelatedContentInput): Promise<{title: string, slug: string | null}[]> {
    try {
        const [publishedArticles, suggestionResult] = await Promise.all([
            getPublishedArticles(),
            suggestRelatedContent(input)
        ]);
        
        if (suggestionResult.suggestedArticles) {
            return suggestionResult.suggestedArticles.map(title => {
                const article = publishedArticles.find(a => a.title.toLowerCase() === title.toLowerCase());
                return {
                    title,
                    slug: article ? article.slug : null
                };
            }).filter(s => s.slug); // Filter out suggestions that don't have a slug
        }
    } catch (error) {
        console.error("Failed to fetch related content in server action:", error);
    }
    return [];
}
