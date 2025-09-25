
'use server';

import { updateArticleComments } from '@/lib/data-client';
import { suggestRelatedContent, type SuggestRelatedContentInput } from '@/ai/flows/related-content-suggestions';
import { revalidatePath } from 'next/cache';
import { summarizeArticleFlow, type SummarizeArticleInput, type SummarizeArticleOutput } from '@/ai/flows/article-summarization';
import type { Comment } from '@/lib/data-types';

export async function postCommentAction(slug: string, comments: Comment[]): Promise<Comment[]> {
    const success = await updateArticleComments(slug, comments);
    if (success) {
        revalidatePath(`/article/${slug}`);
        return comments;
    }
    // In case of failure, return original comments to avoid UI inconsistency
    // (though the optimistic update on client-side might need reverting)
    return comments;
}

export async function getRelatedContentAction(input: SuggestRelatedContentInput): Promise<{title: string, slug: string | null}[]> {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/articles`);
        if (!response.ok) {
            throw new Error('Failed to fetch articles for related content');
        }
        
        const publishedArticles = await response.json();
        
        // Ensure we don't get an error object
        if (!Array.isArray(publishedArticles)) {
            console.error("Received non-array from /api/articles:", publishedArticles);
            return [];
        }

        const suggestionResult = await suggestRelatedContent(input);
                
        if (suggestionResult.suggestedArticles) {
            return suggestionResult.suggestedArticles.map(title => {
                const article = publishedArticles.find((a: any) => a.title.toLowerCase() === title.toLowerCase());
                return {
                    title,
                    slug: article ? article.slug : null
                };
            }).filter(s => s.slug);
        }
    } catch (error) {
        console.error("Failed to fetch related content in server action:", error);
    }
    return [];
}

export async function summarizeArticleAction(input: SummarizeArticleInput): Promise<SummarizeArticleOutput> {
    return summarizeArticleFlow(input);
}
