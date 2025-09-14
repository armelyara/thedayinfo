
'use server';

import { updateArticleComments, type Comment } from '@/lib/data';

export async function postCommentAction(slug: string, comments: Comment[]): Promise<Comment[]> {
    const success = await updateArticleComments(slug, comments);
    if (success) {
        return comments;
    }
    // In case of failure, you might want to handle it differently,
    // maybe by returning the old comments or throwing an error.
    // For now, we optimistically return the new comments array.
    // A more robust solution would involve re-fetching.
    return comments; 
}
