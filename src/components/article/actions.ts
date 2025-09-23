'use server';

import { updateArticleComments } from '@/lib/data';
import { suggestRelatedContent, type SuggestRelatedContentInput } from '@/ai/flows/related-content-suggestions';
import { revalidatePath } from 'next/cache';
import { summarizeArticleFlow, type SummarizeArticleInput, type SummarizeArticleOutput } from '@/ai/flows/article-summarization';

// Type local pour éviter l'import de @/lib/data dans les composants clients
type Comment = {
  id: number;
  author: string;
  text: string;
  avatar: string;
};

export async function postCommentAction(slug: string, comments: Comment[]): Promise<Comment[]> {
    const success = await updateArticleComments(slug, comments);
    if (success) {
        revalidatePath(`/article/${slug}`);
        return comments;
    }
    return comments;
}

export async function getRelatedContentAction(input: SuggestRelatedContentInput): Promise<{title: string, slug: string | null}[]> {
    try {
        // Utiliser l'API route au lieu d'import direct
        const response = await fetch('/api/articles');
        if (!response.ok) {
            throw new Error('Failed to fetch articles');
        }
        
        const publishedArticles = await response.json();
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
